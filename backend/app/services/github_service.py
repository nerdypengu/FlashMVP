"""Small GitHub App client plus repository QA discovery."""
import base64
import hashlib
import json
import os
import re
import shlex
import time
from pathlib import PurePosixPath
from urllib.parse import quote

import httpx
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from fastapi import HTTPException

API = "https://api.github.com"
IGNORED_PARTS = {".git", "node_modules", ".venv", "venv", "dist", "build", "coverage", "vendor"}
STAGES = ("Static Checks", "Tests", "Security")


def _b64(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode()


def app_jwt() -> str:
    app_id = os.getenv("GITHUB_APP_ID", "")
    private_key = os.getenv("GITHUB_PRIVATE_KEY", "").replace("\\n", "\n")
    if not app_id or not private_key:
        raise HTTPException(503, "GitHub App is not configured.")
    now = int(time.time())
    header = _b64(json.dumps({"alg": "RS256", "typ": "JWT"}, separators=(",", ":")).encode())
    payload = _b64(json.dumps({"iat": now - 60, "exp": now + 540, "iss": app_id}, separators=(",", ":")).encode())
    message = f"{header}.{payload}".encode()
    key = serialization.load_pem_private_key(private_key.encode(), password=None)
    signature = key.sign(message, padding.PKCS1v15(), hashes.SHA256())
    return f"{header}.{payload}.{_b64(signature)}"


async def _request(method: str, path: str, token: str, **kwargs):
    headers = {
        "Authorization": f"Bearer {token}", "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            response = await client.request(method, f"{API}{path}", headers=headers, **kwargs)
    except httpx.RequestError:
        raise HTTPException(503, "Could not reach GitHub.") from None
    if response.status_code == 404:
        raise HTTPException(404, "GitHub repository or installation was not found.")
    if response.status_code in (401, 403):
        raise HTTPException(response.status_code, "GitHub rejected the app installation access.")
    if not response.is_success:
        raise HTTPException(502, f"GitHub returned HTTP {response.status_code}.")
    return response.json() if response.content else {}


async def installation_token(installation_id: int) -> str:
    data = await _request("POST", f"/app/installations/{installation_id}/access_tokens", app_jwt())
    return data["token"]


async def list_repositories(installation_id: int) -> list[dict]:
    token = await installation_token(installation_id)
    data = await _request("GET", "/installation/repositories?per_page=100", token)
    return [{"id": row["id"], "full_name": row["full_name"], "default_branch": row["default_branch"]}
            for row in data.get("repositories", [])]


async def repository(installation_id: int, repository_id: int) -> dict:
    repositories = await list_repositories(installation_id)
    match = next((row for row in repositories if row["id"] == repository_id), None)
    if not match:
        raise HTTPException(404, "Repository is not available to this GitHub App installation.")
    return match


def _job(stage: str, name: str, command: str, path: str, runtime: str) -> dict:
    job_id = hashlib.sha256(f"{stage}:{path}:{command}".encode()).hexdigest()[:16]
    return {"id": job_id, "stage": stage, "name": name, "command": command,
            "file_path": path, "runtime": runtime, "status": "PENDING"}


def jobs_from_tree(paths: list[str], package_json: dict | None = None) -> list[dict]:
    paths = sorted({path for path in paths if not IGNORED_PARTS.intersection(PurePosixPath(path).parts)})
    jobs: list[dict] = []
    package_json = package_json or {}
    scripts = package_json.get("scripts", {}) if isinstance(package_json, dict) else {}
    deps = {**package_json.get("dependencies", {}), **package_json.get("devDependencies", {})} if isinstance(package_json, dict) else {}
    if "lint" in scripts:
        jobs.append(_job("Static Checks", "Node lint", "npm ci --ignore-scripts && npm run lint", "package.json", "node"))
    if "typecheck" in scripts:
        jobs.append(_job("Static Checks", "TypeScript typecheck", "npm ci --ignore-scripts && npm run typecheck", "package.json", "node"))
    if "go.mod" in paths:
        jobs.append(_job("Static Checks", "Go vet", "go vet ./...", "go.mod", "go"))
    if any(path in paths for path in ("pyproject.toml", "requirements.txt", "pytest.ini")):
        jobs.append(_job("Static Checks", "Python compile check", "python -m compileall -q .", "pyproject.toml", "python"))
    node_tests = [path for path in paths if re.search(r"(^|/)([^/]+\.(test|spec)\.(js|jsx|ts|tsx))$", path)]
    for path in node_tests:
        if "vitest" in deps:
            command = f"npm ci --ignore-scripts && npx vitest run {shlex.quote(path)}"
        elif "jest" in deps:
            command = f"npm ci --ignore-scripts && npx jest --runInBand {shlex.quote(path)}"
        else:
            command = f"npm ci --ignore-scripts && npm test -- {shlex.quote(path)}"
        jobs.append(_job("Tests", PurePosixPath(path).name, command, path, "node"))
    for path in paths:
        name = PurePosixPath(path).name
        if path.endswith(".py") and (name.startswith("test_") or name.endswith("_test.py")):
            jobs.append(_job("Tests", name, f"python -m pytest {shlex.quote(path)}", path, "python"))
    go_dirs = sorted({str(PurePosixPath(path).parent) for path in paths if path.endswith("_test.go")})
    for directory in go_dirs:
        target = "./..." if directory == "." else f"./{directory}"
        jobs.append(_job("Tests", f"go test {target}", f"go test {target}", directory, "go"))
    jobs.append(_job("Security", "Repository secret scan", "internal:security", ".", "internal"))
    return jobs


async def _blob_json(full_name: str, sha: str, token: str) -> dict:
    data = await _request("GET", f"/repos/{full_name}/git/blobs/{sha}", token)
    try:
        return json.loads(base64.b64decode(data.get("content", "")).decode())
    except (ValueError, UnicodeDecodeError):
        return {}


async def discover(project: dict, ref: str | None = None) -> dict:
    installation_id = project.get("github_installation_id")
    full_name = project.get("github_full_name")
    if not installation_id or not full_name:
        raise HTTPException(409, "Connect a GitHub repository before using QA.")
    token = await installation_token(int(installation_id))
    branch = ref or project.get("default_branch") or "main"
    commit = await _request("GET", f"/repos/{full_name}/commits/{quote(branch, safe='')}", token)
    tree = await _request("GET", f"/repos/{full_name}/git/trees/{commit['sha']}?recursive=1", token)
    if tree.get("truncated"):
        raise HTTPException(413, "Repository tree is too large for automatic QA discovery.")
    blobs = [row for row in tree.get("tree", []) if row.get("type") == "blob"]
    paths = [row["path"] for row in blobs]
    package = next((row for row in blobs if row["path"] == "package.json"), None)
    package_json = await _blob_json(full_name, package["sha"], token) if package else {}
    jobs = jobs_from_tree(paths, package_json)
    return {"repository": full_name, "branch": branch, "commit_sha": commit["sha"],
            "has_tests": any(job["stage"] == "Tests" for job in jobs), "stages": list(STAGES), "jobs": jobs}


async def create_pull_request(installation_id: int, full_name: str, branch: str, base: str, title: str, body: str) -> dict:
    token = await installation_token(installation_id)
    return await _request("POST", f"/repos/{full_name}/pulls", token, json={
        "title": title, "head": branch, "base": base, "body": body, "draft": True,
    })
