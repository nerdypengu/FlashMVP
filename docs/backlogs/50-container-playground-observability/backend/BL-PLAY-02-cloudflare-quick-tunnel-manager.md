# BL-PLAY-02 — IBM Bob `bob-skill-secrets-vault`: Cloudflare Quick Tunnel Manager
> **Assigned To:** ☁️ **Person 4** — IBM Cloud Infra & Skill Pack Orchestrator  
> **Feature:** Container Playground & Observability | **Layer:** Backend  
> **IBM Bob 2.0 Skill:** `bob-skill-secrets-vault` → IBM Secrets Manager + Cloudflare SSL Tunnel  
> **File:** `server/app/services/tunnel_service.py`, `server/app/bob/skill_secrets_vault.py`

---

## 🎯 What This Does

After the container fleet is deployed (BL-ARC-03), **Bob Subagent Delta** executes this tunnel skill to:

1. Spawn a `cloudflared tunnel --url http://localhost:3001` subprocess targeting the running frontend container.
2. Parse the subprocess `stderr` stream to extract the auto-generated public HTTPS URL (`https://xxxx.trycloudflare.com`).
3. Store the public URL in the **IBM Secrets vault** (`bob-skill-secrets-vault`) so it can be injected into other services as `PUBLIC_APP_URL`.
4. Return the public URL to the deployment orchestrator for display in the Playground iframe (BL-PLAY-01) and service switcher (BL-PLAY-03).

This provides a **zero-config, instant SSL-encrypted public endpoint** without purchasing domains, configuring DNS, or managing TLS certificates — the tunnel completes in 1–2 seconds.

In `DEMO_MODE`, returns a pre-warmed static Cloudflare URL without spawning any subprocesses.

---

## 🗂️ Files to Create / Edit

| File | Action | Purpose |
| :--- | :--- | :--- |
| `server/app/services/tunnel_service.py` | **CREATE** | `cloudflared` subprocess runner & URL parser |
| `server/app/bob/skill_secrets_vault.py` | **EDIT** | Add `store_tunnel_url(project_id, url)` to persist public URL in vault |
| `server/app/api/deploy.py` | **EDIT** | Call `start_tunnel()` after container fleet starts, store URL in vault |
| `server/app/schemas/tunnel.py` | **CREATE** | Pydantic models for tunnel response |

---

## 💻 Pydantic Data Contract

```python
# server/app/schemas/tunnel.py
from pydantic import BaseModel

class TunnelResponse(BaseModel):
    project_id: str
    public_url: str       # "https://app-8f92a.trycloudflare.com"
    local_port: int       # 3001
    status: str           # "ACTIVE" | "FAILED"
    stored_in_vault: bool # True once saved to IBM Secrets vault
```

---

## 💻 Skill Implementation (DEMO_MODE aware)

```python
# server/app/services/tunnel_service.py
import asyncio, os, re

DEMO_MODE = os.getenv("DEMO_MODE", "true") == "true"

async def start_cloudflare_tunnel(project_id: str, local_port: int = 3001) -> dict:
    if DEMO_MODE:
        return {
            "project_id": project_id,
            "public_url": f"https://app-{project_id}.trycloudflare.com",
            "local_port": local_port,
            "status": "ACTIVE",
            "stored_in_vault": True
        }

    # Spawn cloudflared subprocess
    proc = await asyncio.create_subprocess_exec(
        "cloudflared", "tunnel", "--url", f"http://localhost:{local_port}",
        stderr=asyncio.subprocess.PIPE
    )

    # Parse stderr for the tunnel URL (appears within 1-2 seconds)
    url_pattern = re.compile(r"https://[a-z0-9\-]+\.trycloudflare\.com")
    public_url = None

    async for line in proc.stderr:
        decoded = line.decode("utf-8", errors="replace")
        match = url_pattern.search(decoded)
        if match:
            public_url = match.group(0)
            break

    if not public_url:
        return {"project_id": project_id, "status": "FAILED", "stored_in_vault": False}

    return {
        "project_id": project_id,
        "public_url": public_url,
        "local_port": local_port,
        "status": "ACTIVE",
        "stored_in_vault": False  # deploy.py will call skill_secrets_vault.store_tunnel_url() next
    }
```

---

## 📝 Implementation Tasks

1. Create `server/app/schemas/tunnel.py` with `TunnelResponse` Pydantic model.
2. Create `server/app/services/tunnel_service.py` with `start_cloudflare_tunnel()` above.
3. In `server/app/bob/skill_secrets_vault.py`, add `store_tunnel_url(project_id, url)` that saves `PUBLIC_APP_URL` to the encrypted vault (scoped to `ALL`).
4. In `server/app/api/deploy.py`, after container fleet starts:
   - Call `tunnel_service.start_cloudflare_tunnel(project_id)`.
   - Call `skill_secrets_vault.store_tunnel_url(project_id, public_url)`.
   - Include `public_url` in the deploy response payload.
5. Add `DEMO_MODE` guard — in demo mode skip subprocess entirely.
6. Ensure `cloudflared` binary is listed in `requirements.txt` notes / setup docs.

---

## 🧪 Testing & Verification

1. Start server: `uvicorn app.main:app --reload --port 8000`
2. In DEMO_MODE, trigger a deploy: expect response to contain `public_url: "https://app-proj_8f92a.trycloudflare.com"` and `stored_in_vault: true`.
3. ✅ DEMO_MODE: no subprocess spawned, instant response.
4. ✅ Live mode: `cloudflared` subprocess spawns → URL extracted from `stderr` within 2s → stored in vault.
5. ✅ Verify stored URL appears in `GET /api/v1/projects/{id}/secrets` masked as `PUBLIC_APP_URL: ***`.
6. Run Python test: `python -c "import asyncio; from app.services.tunnel_service import start_cloudflare_tunnel; print(asyncio.run(start_cloudflare_tunnel('test', 3001)))"` → verify returns HTTPS URL.
