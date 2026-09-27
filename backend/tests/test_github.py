"""Offline contract checks: OAuth, ownership, safe publication and partial failure."""
import json
from urllib.parse import parse_qs, urlsplit

import httpx
import pytest
from cryptography.fernet import Fernet
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.api import github


@pytest.fixture
def client(monkeypatch, tmp_path):
    for key, value in {
        "DEMO_MODE": "true", "GITHUB_CLIENT_ID": "test-client", "GITHUB_CLIENT_SECRET": "test-secret",
        "GITHUB_CALLBACK_URL": "http://localhost/api/v1/github/callback",
        "FRONTEND_URL": "http://localhost:5173", "GITHUB_SESSION_KEY": Fernet.generate_key().decode(),
        "FLASHMVP_GITHUB_DB": str(tmp_path / "github.sqlite3"),
    }.items():
        monkeypatch.setenv(key, value)
    app = FastAPI()
    app.include_router(github.router)
    with TestClient(app, base_url="http://localhost", headers={"Origin": "http://localhost:5173"}) as client:
        yield client


def authorize(client, principal="demo"):
    encrypted = github.settings()[4].encrypt(json.dumps({
        "app_user": principal, "login": "alice", "token": "synthetic-provider-token",
    }).encode()).decode()
    client.cookies.set(github.SESSION_COOKIE, encrypted, domain="localhost.local", path=github.COOKIE_PATH)


def mock_provider(monkeypatch, handler):
    original = httpx.AsyncClient
    monkeypatch.setattr(github.httpx, "AsyncClient", lambda **kwargs: original(
        transport=httpx.MockTransport(handler), **kwargs))


def test_oauth_pkce_cookie_binding_and_callback(client, monkeypatch):
    response = client.post("/api/v1/github/connect", json={"template": "nextjs-go", "return_to": "/dashboard"})
    params = parse_qs(urlsplit(response.json()["url"]).query)
    assert params["code_challenge_method"] == ["S256"]
    assert "HttpOnly" in response.headers["set-cookie"]
    assert params["scope"] == ["repo"]

    def provider(request):
        if request.url.path == "/login/oauth/access_token":
            body = json.loads(request.content)
            assert len(body["code_verifier"]) >= 43
            assert body["client_secret"] == "test-secret"
            return httpx.Response(200, json={"access_token": "synthetic-provider-token"})
        assert request.url.path == "/user"
        return httpx.Response(200, json={"login": "alice"})

    mock_provider(monkeypatch, provider)
    callback = client.get("/api/v1/github/callback", params={"state": params["state"][0], "code": "test-code"},
                          follow_redirects=False)
    assert callback.status_code == 303
    assert callback.headers["location"] == "http://localhost:5173/dashboard?github_template=nextjs-go&github=connected"
    assert "synthetic-provider-token" not in str(callback.headers)
    assert client.get("/api/v1/github/connection").json()["login"] == "alice"
    assert github.STATE_COOKIE not in client.cookies


def test_rejects_cross_origin_and_invalid_state(client):
    assert client.post("/api/v1/github/connect", json={}, headers={"Origin": "https://evil.example"}).status_code == 403
    client.post("/api/v1/github/connect", json={})
    response = client.get("/api/v1/github/callback?state=wrong&code=unused", follow_redirects=False)
    assert "github=error" in response.headers["location"]
    assert "github_error=state_mismatch" in response.headers["location"]
    assert not client.get("/api/v1/github/connection").json()["connected"]


@pytest.mark.parametrize("reason", ["incorrect_client_credentials", "redirect_uri_mismatch", "bad_verification_code", "unverified_user_email", "unknown-secret-value"])
def test_callback_reports_only_safe_provider_error_codes(client, monkeypatch, reason):
    response = client.post("/api/v1/github/connect", json={})
    state = parse_qs(urlsplit(response.json()["url"]).query)["state"][0]
    mock_provider(monkeypatch, lambda request: httpx.Response(200, json={
        "error": reason, "error_description": "private-provider-detail"}))
    result = client.get("/api/v1/github/callback", params={"state": state, "code": "synthetic-code"}, follow_redirects=False)
    expected = reason if reason in github.OAUTH_ERRORS else "token_exchange_failed"
    assert f"github_error={expected}" in result.headers["location"]
    assert "private-provider-detail" not in str(result.headers)
    assert "unknown-secret-value" not in str(result.headers)


def test_callback_missing_cookie_is_distinct_from_denied_consent(client):
    result = client.get("/api/v1/github/callback?state=old&code=old", follow_redirects=False)
    assert "github_error=session_missing" in result.headers["location"]
    response = client.post("/api/v1/github/connect", json={})
    state = parse_qs(urlsplit(response.json()["url"]).query)["state"][0]
    result = client.get("/api/v1/github/callback", params={"state": state, "error": "access_denied"}, follow_redirects=False)
    assert "github_error=access_denied" in result.headers["location"]


def test_expired_and_other_user_sessions_are_rejected(client, monkeypatch):
    authorize(client, principal="someone-else")
    assert client.post("/api/v1/github/repositories", json={"name": "app", "template": "react-fastapi"}).status_code == 401
    cookie = github.settings()[4].encrypt_at_time(json.dumps({"app_user": "demo"}).encode(), current_time=1).decode()
    client.cookies.set(github.SESSION_COOKIE, cookie, domain="localhost.local", path=github.COOKIE_PATH)
    assert not client.get("/api/v1/github/connection").json()["connected"]


@pytest.mark.parametrize("failure", [None, "conflict", "upload"])
def test_publish_uses_actual_branch_and_preserves_partial_repo(client, monkeypatch, failure):
    authorize(client)
    calls = []

    def provider(request):
        calls.append((request.method, request.url.path))
        body = json.loads(request.content) if request.content else {}
        path = request.url.path
        if path == "/user/repos":
            assert body["private"] is True and body["auto_init"] is True
            if failure == "conflict":
                return httpx.Response(422, json={"message": "name exists"})
            return httpx.Response(201, json={"full_name": "alice/app", "html_url": "https://github.com/alice/app",
                                            "default_branch": "custom", "private": True})
        if path.endswith("/ref/heads/custom"):
            return httpx.Response(200, json={"object": {"sha": "base"}})
        if path.endswith("/commits/base"):
            return httpx.Response(200, json={"tree": {"sha": "old-tree"}})
        if path.endswith("/trees"):
            manifest = json.loads(next(entry["content"] for entry in body["tree"] if entry["path"] == "flashmvp.json"))
            assert [step["stage"] for step in manifest["qa_pipeline"]] == ["Unit Tests", "Integration Tests", "E2E Tests"]
            if failure == "upload":
                return httpx.Response(500, json={"message": "provider failure"})
            return httpx.Response(201, json={"sha": "tree"})
        if path.endswith("/commits"):
            assert body["parents"] == ["base"]
            return httpx.Response(201, json={"sha": "starter-commit"})
        assert request.method == "PATCH" and path.endswith("/refs/heads/custom")
        assert body == {"sha": "starter-commit", "force": False}
        return httpx.Response(200, json={})

    mock_provider(monkeypatch, provider)
    response = client.post("/api/v1/github/repositories", json={"name": "app", "template": "react-fastapi"})
    assert response.status_code == {None: 201, "conflict": 409, "upload": 502}[failure]
    if failure == "conflict":
        assert len(calls) == 1
    elif failure == "upload":
        assert response.json()["detail"]["repo_url"] == "https://github.com/alice/app"
        assert not any(method in ("PATCH", "DELETE") for method, _ in calls)
    else:
        assert response.json()["commit_sha"] == "starter-commit"
        assert response.json()["branch"] == "custom"


def test_validation_and_disconnect(client, monkeypatch):
    authorize(client)
    assert client.post("/api/v1/github/repositories", json={"name": "../bad", "template": "react-fastapi"}).status_code == 422
    assert client.post("/api/v1/github/repositories", json={"name": "app", "template": "../bad"}).status_code == 422

    def provider(request):
        assert request.method == "DELETE" and request.url.path == "/applications/test-client/token"
        return httpx.Response(204)

    mock_provider(monkeypatch, provider)
    assert client.delete("/api/v1/github/connection").status_code == 200
    assert not client.get("/api/v1/github/connection").json()["connected"]


def test_unconfigured_and_template_secrets(client, monkeypatch, tmp_path):
    monkeypatch.delenv("GITHUB_CLIENT_SECRET")
    status = client.get("/api/v1/github/connection").json()
    assert not status["configured"] and not status["connected"]
    assert "GITHUB_CLIENT_SECRET" in status["configuration_error"]
    assert "test-secret" not in status["configuration_error"]
    assert client.post("/api/v1/github/connect", json={}).status_code == 503
    root = tmp_path / "react-fastapi"
    root.mkdir()
    (root / "flashmvp.json").write_text('{}', encoding="utf-8")
    (root / ".env").write_text('SYNTHETIC_SECRET=do-not-publish', encoding="utf-8")
    monkeypatch.setattr(github, "TEMPLATES_DIR", str(tmp_path))
    assert [item["path"] for item in github.template_tree("react-fastapi")] == ["flashmvp.json"]


def test_live_connection_is_bound_to_verified_app_user(client, monkeypatch):
    monkeypatch.setenv("DEMO_MODE", "false")
    monkeypatch.setenv("SUPABASE_URL", "https://supabase.example")
    monkeypatch.setenv("SUPABASE_ANON_KEY", "synthetic-anon-key")
    assert client.get("/api/v1/github/connection").status_code == 401
    authorize(client, "user-one")

    def provider(request):
        assert request.url.host == "supabase.example" and request.url.path == "/auth/v1/user"
        token = request.headers["authorization"]
        return httpx.Response(200, json={"id": "user-one" if token == "Bearer first-user" else "user-two"})

    mock_provider(monkeypatch, provider)
    assert client.get("/api/v1/github/connection", headers={"Authorization": "Bearer first-user"}).json()["connected"]
    assert not client.get("/api/v1/github/connection", headers={"Authorization": "Bearer second-user"}).json()["connected"]
    assert client.post("/api/v1/github/repositories", json={"name": "app", "template": "react-fastapi"},
                       headers={"Authorization": "Bearer second-user"}).status_code == 401


def test_saved_connection_restores_without_cookie_and_skips_oauth(client):
    client.app.dependency_overrides[github.app_user] = lambda: "user-one"
    authorize(client, "user-one")
    assert client.get("/api/v1/github/connection").json()["connected"]
    client.cookies.clear()
    assert client.get("/api/v1/github/connection").json()["login"] == "alice"
    assert client.post("/api/v1/github/connect", json={"template": "nextjs-go"}).json()["url"] == "http://localhost:5173/starter?github_template=nextjs-go&github=connected"
    with github.connection_db() as db:
        payload = db.execute("SELECT payload FROM github_connections").fetchone()[0]
    assert "synthetic-provider-token" not in payload
    client.app.dependency_overrides[github.app_user] = lambda: "user-two"
    assert not client.get("/api/v1/github/connection").json()["connected"]


def test_disconnection_prevents_old_cookies_restoring_access(client, monkeypatch):
    client.app.dependency_overrides[github.app_user] = lambda: "user-one"
    authorize(client, "user-one")
    client.get("/api/v1/github/connection")
    mock_provider(monkeypatch, lambda request: httpx.Response(204))
    assert client.delete("/api/v1/github/connection").status_code == 200
    authorize(client, "user-one")  # An old session from another browser must not reconnect the account.
    assert not client.get("/api/v1/github/connection").json()["connected"]


def test_revoked_token_clears_saved_connection(client, monkeypatch):
    client.app.dependency_overrides[github.app_user] = lambda: "user-one"
    authorize(client, "user-one")
    client.get("/api/v1/github/connection")
    mock_provider(monkeypatch, lambda request: httpx.Response(401, json={"message": "revoked"}))
    response = client.post("/api/v1/github/repositories", json={"name": "app", "template": "react-fastapi"})
    assert response.status_code == 401
    assert not client.get("/api/v1/github/connection").json()["connected"]
