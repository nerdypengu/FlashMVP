"""
FlashMVP — JWT Auth Middleware & Dependency
Verifies the Supabase JWT sent in the Authorization: Bearer <token> header.

Two helpers for FastAPI route dependencies:

  get_current_user()    — requires a valid JWT; returns the decoded payload.
                          Raises 401 if missing or invalid.

  get_current_admin()   — calls get_current_user() then checks role == 'admin'.
                          Raises 403 if the user is not an admin.

  optional_user()       — like get_current_user() but returns None instead of
                          raising 401 when no token is present. Use on routes
                          that work for both anonymous and authenticated callers.

In DEMO_MODE=true all checks are bypassed and a mock admin payload is returned
so the API works without any real Supabase credentials.
"""
import os
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() == "true"
SUPABASE_URL: str     = os.getenv("SUPABASE_URL", "")
SUPABASE_ANON_KEY: str = os.getenv("SUPABASE_ANON_KEY", "")

_bearer = HTTPBearer(auto_error=False)

# ── Mock payload returned in DEMO_MODE ───────────────────────────────────────
_DEMO_PAYLOAD = {
    "sub":   "demo-user-id",
    "email": "admin@flashmvp.demo",
    "role":  "admin",
}


async def _decode_supabase_jwt(token: str) -> dict:
    """
    Verify a Supabase-issued JWT.

    Supabase JWTs are signed with HS256 using the project's JWT secret.
    We validate by calling the Supabase Auth /user endpoint with the token —
    this avoids needing to embed the JWT secret in our env and handles
    token expiry / revocation automatically.
    """
    try:
        import httpx  # already in dependencies
    except ImportError:
        raise HTTPException(status_code=500, detail="httpx not installed.")

    if not SUPABASE_URL:
        raise HTTPException(
            status_code=500,
            detail="SUPABASE_URL not configured. Set it in .env or use DEMO_MODE=true.",
        )

    async with httpx.AsyncClient(timeout=5.0) as client:
        resp = await client.get(
            f"{SUPABASE_URL}/auth/v1/user",
            headers={
                "apikey": SUPABASE_ANON_KEY,
                "Authorization": f"Bearer {token}",
            },
        )

    if resp.status_code != 200:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    data = resp.json()
    # Normalise role: read from app_metadata or user_metadata, fallback to 'user'
    role = (
        data.get("app_metadata", {}).get("role")
        or data.get("user_metadata", {}).get("role")
        or "user"
    )
    return {
        "sub":   data.get("id"),
        "email": data.get("email"),
        "role":  role,
    }


# ── FastAPI dependency: require any authenticated user ────────────────────────
async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> dict:
    """
    FastAPI dependency. Extracts and verifies the Bearer token.
    Returns the decoded user payload dict: { sub, email, role }.
    Raises HTTP 401 if the token is missing or invalid.
    """
    if DEMO_MODE:
        return _DEMO_PAYLOAD

    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return await _decode_supabase_jwt(credentials.credentials)


# ── FastAPI dependency: require admin role ────────────────────────────────────
async def get_current_admin(
    user: dict = Depends(get_current_user),
) -> dict:
    """
    FastAPI dependency. Like get_current_user() but additionally asserts
    that the caller has role == 'admin'. Raises HTTP 403 otherwise.
    """
    if user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required.",
        )
    return user


# ── FastAPI dependency: optional auth (no 401 if missing) ────────────────────
async def optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> Optional[dict]:
    """
    FastAPI dependency. Returns the user payload if a valid token is present,
    or None if no Authorization header was sent. Never raises 401.
    Useful for routes that behave differently for authenticated vs anonymous callers.
    """
    if DEMO_MODE:
        return _DEMO_PAYLOAD

    if not credentials:
        return None

    try:
        return await _decode_supabase_jwt(credentials.credentials)
    except HTTPException:
        return None
