"""GitHub OAuth and starter publishing. Provider credentials never reach JavaScript."""
import base64
import hashlib
import json
import os
import secrets
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Literal
from urllib.parse import quote, urlencode, urlsplit

import httpx
from cryptography.fernet import Fernet, InvalidToken
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel, Field

from app.services.person2_store import bearer, user_token
from app.services.template_service import TEMPLATES_DIR

router = APIRouter(prefix="/api/v1/github", tags=["GitHub"])
COOKIE_PATH = "/api/v1/github"
SESSION_COOKIE = "flashmvp_github"
STATE_COOKIE = "flashmvp_github_state"
SESSION_TTL = 365 * 24 * 60 * 60
OAUTH_ERRORS = {"access_denied", "application_suspended", "redirect_uri_mismatch",
                "incorrect_client_credentials", "bad_verification_code", "unverified_user_email"}


def settings():
    names = ("GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "GITHUB_CALLBACK_URL", "GITHUB_SESSION_KEY")
    keys = [os.getenv(key, "").strip() for key in names]
    missing = [name for name, value in zip(names, keys) if not value]
    if missing:
        raise HTTPException(503, "Missing backend settings: " + ", ".join(missing) + ". Restart the backend after configuration.")
    frontend = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    for url in (frontend, keys[2]):
        parsed = urlsplit(url)
        if not parsed.netloc or (parsed.scheme != "https" and not (
            parsed.scheme == "http" and parsed.hostname in ("localhost", "127.0.0.1")
        )):
            raise HTTPException(503, "GitHub URLs require HTTPS outside localhost.")
    try:
        cipher = Fernet(keys[3].encode())
    except (ValueError, TypeError):
        raise HTTPException(503, "GitHub session encryption key is invalid.") from None
    return keys[0], keys[1], keys[2], frontend, cipher


async def app_user(credentials=Depends(bearer)):
    # Demo still requires real GitHub consent; it never invents GitHub credentials.
    if os.getenv("DEMO_MODE", "true").lower() == "true":
        return "demo"
    token = user_token(credentials)
    url, key = os.getenv("SUPABASE_URL", "").rstrip("/"), os.getenv("SUPABASE_ANON_KEY", "")
    if not url or not key:
        raise HTTPException(503, "Supabase is not configured.")
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(f"{url}/auth/v1/user", headers={
                "apikey": key, "Authorization": f"Bearer {token}"})
        if response.status_code != 200:
            raise HTTPException(401, "Sign in to FlashMVP again.")
        return response.json()["id"]
    except (httpx.RequestError, ValueError, KeyError):
        raise HTTPException(503, "Could not verify your FlashMVP account.") from None


def read_cookie(request, name, ttl):
    try:
        return json.loads(settings()[4].decrypt(request.cookies.get(name, "").encode(), ttl=ttl))
    except (InvalidToken, ValueError, TypeError):
        return None


def set_cookie(response, name, data, ttl):
    config = settings()
    response.set_cookie(name, config[4].encrypt(json.dumps(data).encode()).decode(),
                        max_age=ttl, httponly=True, secure=config[2].startswith("https://"),
                        samesite="lax", path=COOKIE_PATH)
    response.headers["Cache-Control"] = "no-store"


def check_origin(request):
    frontend = urlsplit(settings()[3])
    if request.headers.get("origin") != f"{frontend.scheme}://{frontend.netloc}":
        raise HTTPException(403, "Request origin is not allowed.")


@contextmanager
def connection_db():
    path = os.getenv("FLASHMVP_GITHUB_DB", str(Path(__file__).resolve().parents[2] / "github_connections.sqlite3"))
    db = sqlite3.connect(path)
    try:
        with db:
            db.execute("CREATE TABLE IF NOT EXISTS github_connections (app_user TEXT PRIMARY KEY, payload TEXT NOT NULL)")
            db.execute("CREATE TABLE IF NOT EXISTS github_projects (owner TEXT NOT NULL, repo TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY (owner, repo))")
            yield db
    finally:
        db.close()


def save_connection(user, session):
    if user == "demo":
        return  # Demo accounts share an ID; keep their connections isolated in browser cookies.
    payload = settings()[4].encrypt(json.dumps(session).encode()).decode()
    with connection_db() as db:
        db.execute("INSERT INTO github_connections VALUES (?, ?) ON CONFLICT(app_user) DO UPDATE SET payload=excluded.payload",
                   (user, payload))


def delete_connection(user):
    if user != "demo":
        with connection_db() as db:
            # Retain a disconnected marker so old browser cookies cannot restore revoked access.
            db.execute("INSERT INTO github_connections VALUES (?, '') ON CONFLICT(app_user) DO UPDATE SET payload=''", (user,))


def find_session(request, user):
    session = read_cookie(request, SESSION_COOKIE, SESSION_TTL)
    if user != "demo":
        with connection_db() as db:
            row = db.execute("SELECT payload FROM github_connections WHERE app_user=?", (user,)).fetchone()
        if row:
            if not row[0]:
                return None
            try:
                session = json.loads(settings()[4].decrypt(row[0].encode()))
                if session.get("app_user") == user:
                    return session
            except (InvalidToken, ValueError, TypeError):
                delete_connection(user)
            return None
    if session and session.get("app_user") == user:
        save_connection(user, session)  # Migrate an existing connection made before persistent storage.
        return session
    return None


def session_for(request, user):
    session = find_session(request, user)
    if not session:
        raise HTTPException(401, "Connect your GitHub account first.")
    return session


async def github(client, token, method, path, **kwargs):
    try:
        response = await client.request(method, f"https://api.github.com{path}", headers={
            "Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2026-03-10"}, **kwargs)
    except httpx.RequestError:
        raise HTTPException(502, "GitHub could not be reached. Check GitHub before retrying.") from None
    if response.status_code == 401:
        raise HTTPException(401, "GitHub access expired or was revoked. Reconnect your account.")
    if response.status_code == 403:
        raise HTTPException(403, "GitHub denied access or rate limited this request.")
    if response.status_code == 422:
        raise HTTPException(409, "GitHub rejected this request. The repository name may already exist.")
    if not response.is_success:
        raise HTTPException(502, "GitHub could not complete this operation.")
    return response.json() if response.content else {}


class ConnectRequest(BaseModel):
    return_to: Literal["/starter", "/dashboard"] = "/starter"
    template: Literal["react-fastapi", "nextjs-go"] = "react-fastapi"


@router.post("/connect")
async def connect(body: ConnectRequest, request: Request, user=Depends(app_user)):
    check_origin(request)
    client_id, _, callback, _, _ = settings()
    session = find_session(request, user)
    if session:
        response = JSONResponse({"url": settings()[3] + body.return_to + f"?github_template={body.template}&github=connected"})
        set_cookie(response, SESSION_COOKIE, session, SESSION_TTL)
        return response
    state, verifier = secrets.token_urlsafe(32), secrets.token_urlsafe(48)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    response = JSONResponse({"url": "https://github.com/login/oauth/authorize?" + urlencode({
        "client_id": client_id, "redirect_uri": callback, "scope": "repo", "state": state,
        "code_challenge": challenge, "code_challenge_method": "S256"})})
    set_cookie(response, STATE_COOKIE, {"state": state, "verifier": verifier,
               "app_user": user, "return_to": body.return_to, "template": body.template}, 600)
    return response


@router.get("/callback")
async def callback(request: Request, state: str = "", code: str = "", error: str = ""):
    config = settings()
    pending = read_cookie(request, STATE_COOKIE, 600)
    valid = pending and secrets.compare_digest(pending.get("state", ""), state)
    target = pending["return_to"] if valid else "/starter"
    template = pending["template"] if valid else "react-fastapi"
    destination = f"{config[3]}{target}?github_template={template}&github="
    response = RedirectResponse(destination + "error", status_code=303)
    response.delete_cookie(STATE_COOKIE, path=COOKIE_PATH)
    response.headers["Cache-Control"] = "no-store"
    response.headers["Referrer-Policy"] = "no-referrer"

    def failed(reason):
        # Only our fixed diagnostic codes enter the URL, never provider descriptions or credentials.
        response.headers["location"] = destination + "error&github_error=" + reason
        return response

    if not pending:
        return failed("session_missing")
    if not valid:
        return failed("state_mismatch")
    if error:
        return failed(error if error in OAUTH_ERRORS else "authorization_failed")
    if not code:
        return failed("code_missing")
    phase = "token_exchange_failed"
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            exchanged = await client.post("https://github.com/login/oauth/access_token", json={
                "client_id": config[0], "client_secret": config[1], "code": code,
                "redirect_uri": config[2], "code_verifier": pending["verifier"]},
                headers={"Accept": "application/json"})
            payload = exchanged.json()
            provider_error = payload.get("error")
            if provider_error:
                return failed(provider_error if provider_error in OAUTH_ERRORS else "token_exchange_failed")
            exchanged.raise_for_status()
            token = payload["access_token"]
            phase = "profile_failed"
            account = await github(client, token, "GET", "/user")
        session = {"token": token, "login": account["login"], "app_user": pending["app_user"]}
        save_connection(pending["app_user"], session)
        set_cookie(response, SESSION_COOKIE, session, SESSION_TTL)
        response.headers["location"] = destination + "connected"
    except httpx.RequestError:
        return failed("network_error")
    except (httpx.HTTPStatusError, HTTPException, ValueError, KeyError):
        return failed(phase)
    return response


@router.get("/connection")
async def connection(request: Request, user=Depends(app_user)):
    try:
        settings()
    except HTTPException as exc:
        return JSONResponse({"configured": False, "connected": False, "configuration_error": exc.detail},
                            headers={"Cache-Control": "no-store"})
    session = find_session(request, user)
    response = JSONResponse({"configured": True, "connected": bool(session),
                            "login": session["login"] if session else None}, headers={"Cache-Control": "no-store"})
    if session:
        set_cookie(response, SESSION_COOKIE, session, SESSION_TTL)
    return response


@router.delete("/connection")
async def disconnect(request: Request, user=Depends(app_user)):
    check_origin(request)
    session = session_for(request, user)
    config = settings()
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            revoked = await client.request("DELETE", f"https://api.github.com/applications/{config[0]}/token",
                                           auth=(config[0], config[1]), json={"access_token": session["token"]})
        if revoked.status_code not in (204, 404):
            raise HTTPException(502, "Could not revoke GitHub access. Please try disconnecting again.")
    except httpx.RequestError:
        raise HTTPException(502, "Could not reach GitHub to disconnect.") from None
    delete_connection(user)
    response = JSONResponse({"connected": False})
    response.delete_cookie(SESSION_COOKIE, path=COOKIE_PATH)
    response.delete_cookie(STATE_COOKIE, path=COOKIE_PATH)
    return response


class RepositoryRequest(BaseModel):
    name: str = Field(min_length=1, max_length=100, pattern=r"^[A-Za-z0-9][A-Za-z0-9._-]*$")
    description: str = Field(default="", max_length=350)
    private: bool = True
    template: Literal["react-fastapi", "nextjs-go"]


@router.get("/projects")
async def list_starter_projects(request: Request, user=Depends(app_user)):
    owner = user
    if user == "demo":
        session = find_session(request, user)
        if not session:
            return []
        owner = f"demo:{session['login']}"
    with connection_db() as db:
        rows = db.execute("SELECT payload FROM github_projects WHERE owner=? ORDER BY rowid DESC", (owner,)).fetchall()
    return [json.loads(row[0]) for row in rows]


def template_tree(template):
    root = Path(TEMPLATES_DIR) / template
    entries = []
    for file in sorted(root.rglob("*")):
        relative = file.relative_to(root)
        if any(part in (".git", "node_modules", ".venv", "__pycache__") or part.startswith(".env")
               for part in relative.parts):
            continue
        if file.is_symlink() or not file.is_file() or not file.resolve().is_relative_to(root.resolve()):
            continue
        if file.stat().st_size > 1_000_000:
            raise HTTPException(422, "A starter file exceeds the upload size limit.")
        try:
            content = file.read_text(encoding="utf-8")
        except (OSError, UnicodeError):
            raise HTTPException(422, "A starter file could not be read as UTF-8 text.") from None
        entries.append({"path": relative.as_posix(), "mode": "100644", "type": "blob", "content": content})
    if not entries or not any(item["path"] == "flashmvp.json" for item in entries):
        raise HTTPException(422, "The selected starter is unavailable.")
    return entries


@router.post("/repositories", status_code=201)
async def create_repository(body: RepositoryRequest, request: Request, user=Depends(app_user)):
    check_origin(request)
    session = session_for(request, user)
    entries = template_tree(body.template)  # Validate files before creating any remote resources.
    repo_url = f"https://github.com/{session['login']}/{body.name}"
    created = False
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            repo = await github(client, session["token"], "POST", "/user/repos", json={
                "name": body.name, "description": body.description, "private": body.private, "auto_init": True})
            created = True
            repo_url = repo["html_url"]
            prefix = f"/repos/{repo['full_name']}/git"
            branch = quote(repo["default_branch"], safe="")
            ref = await github(client, session["token"], "GET", f"{prefix}/ref/heads/{branch}")
            parent = ref["object"]["sha"]
            base = await github(client, session["token"], "GET", f"{prefix}/commits/{parent}")
            tree = await github(client, session["token"], "POST", f"{prefix}/trees", json={
                "base_tree": base["tree"]["sha"], "tree": entries})
            commit = await github(client, session["token"], "POST", f"{prefix}/commits", json={
                "message": f"Initialize FlashMVP {body.template} starter", "tree": tree["sha"], "parents": [parent]})
            await github(client, session["token"], "PATCH", f"{prefix}/refs/heads/{branch}", json={
                "sha": commit["sha"], "force": False})
    except HTTPException as exc:
        if exc.status_code == 401:
            delete_connection(user)
            response = JSONResponse(status_code=401, content={"detail": exc.detail})
            response.delete_cookie(SESSION_COOKIE, path=COOKIE_PATH)
            return response
        if created or exc.status_code == 502:
            return JSONResponse(status_code=502, content={"detail": {
                "message": "Repository created but starter upload could not be confirmed. Open GitHub to inspect it; existing repositories are never overwritten."
                if created else "Repository creation could not be confirmed. Check GitHub before retrying.",
                "repo_url": repo_url}})
        raise
    published = {"repo_url": repo_url, "full_name": repo["full_name"], "branch": repo["default_branch"],
                 "commit_sha": commit["sha"], "template": body.template, "private": repo["private"],
                 "id": "github-" + repo["full_name"].replace("/", "-"), "name": body.name, "description": body.description}
    owner = user if user != "demo" else f"demo:{session['login']}"
    try:
        with connection_db() as db:
            db.execute("INSERT INTO github_projects VALUES (?, ?, ?) ON CONFLICT(owner, repo) DO UPDATE SET payload=excluded.payload",
                       (owner, repo["full_name"], json.dumps(published)))
    except sqlite3.Error:
        return JSONResponse(status_code=502, content={"detail": {
            "message": "Starter published, but saving the project to your dashboard failed. Inspect the repository before retrying.",
            "repo_url": repo_url}})
    return published
