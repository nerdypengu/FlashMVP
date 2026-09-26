"""
FlashMVP — Supabase Client Helper
Provides two pre-configured clients:

  get_admin_client()  — uses the SERVICE KEY.  Bypasses ALL RLS policies.
                        Use only in backend code for privileged operations
                        (schema provisioning, writing run_history, RBAC updates).
                        NEVER expose this client's key to the browser.

  get_user_client(jwt)— uses the ANON KEY + the user's JWT from Supabase Auth.
                        Enforces all RLS policies — users see only what the
                        policies allow based on their role (admin vs user).
                        Use for user-facing API calls on behalf of a logged-in user.

Both clients point at the same Supabase project URL (SUPABASE_URL).
In DEMO_MODE both return None — callers must handle that gracefully.
"""
import os
from typing import Optional

DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() == "true"

_SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
_ANON_KEY: str     = os.getenv("SUPABASE_ANON_KEY", "")
_SERVICE_KEY: str  = os.getenv("SUPABASE_SERVICE_KEY", "")


def get_admin_client():
    """
    Return a Supabase client authenticated with the SERVICE KEY.

    This client bypasses ALL Row-Level Security policies — it can read and write
    any row in any table.  Use it exclusively inside backend server code for:
      - Inserting into flashmvp.projects after schema provisioning
      - Writing/updating flashmvp.run_history records
      - Granting / revoking flashmvp.project_members roles (RBAC)
      - Any operation that must succeed regardless of the caller's user role

    Returns None in DEMO_MODE or if SUPABASE keys are not configured.
    """
    if DEMO_MODE or not _SUPABASE_URL or not _SERVICE_KEY:
        return None

    try:
        from supabase import create_client, Client  # type: ignore
        client: Client = create_client(_SUPABASE_URL, _SERVICE_KEY)
        return client
    except ImportError:
        return None  # supabase-py not installed; caller falls back to httpx


def get_user_client(user_jwt: Optional[str] = None):
    """
    Return a Supabase client authenticated with the ANON KEY (+ optional user JWT).

    When `user_jwt` is provided (the JWT returned by Supabase Auth after login),
    the client acts on behalf of that user and all RLS policies apply:
      - Regular users (role='user') can only see their own projects and run history.
      - Admin users   (role='admin') can see all projects and all run history.

    When `user_jwt` is None, the client acts as an unauthenticated anon visitor —
    RLS will only show rows that have a public SELECT policy (none by default in FlashMVP,
    so this effectively returns nothing for protected tables).

    Returns None in DEMO_MODE or if SUPABASE keys are not configured.
    """
    if DEMO_MODE or not _SUPABASE_URL or not _ANON_KEY:
        return None

    try:
        from supabase import create_client, Client  # type: ignore
        client: Client = create_client(_SUPABASE_URL, _ANON_KEY)
        if user_jwt:
            # Inject the user's JWT so PostgREST evaluates RLS with auth.uid() set.
            client.auth.set_session(user_jwt, "")
        return client
    except ImportError:
        return None
