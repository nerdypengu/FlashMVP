# BL-ARC-03 — IBM Bob `bob-skill-code-engine`: Multi-Container Docker & IBM Code Engine Orchestrator
> **Assigned To:** ☁️ **Person 4** — IBM Cloud Infra & Skill Pack Orchestrator  
> **Feature:** Expandable Architecture | **Layer:** Backend  
> **IBM Bob 2.0 Skill:** `bob-skill-code-engine` → IBM Cloud Code Engine / Docker Engine API  
> **File:** `server/app/bob/skill_code_engine.py`, `server/app/api/deploy.py`

---

## 🎯 What This Does

**Bob Subagent Gamma** executes the `bob-skill-code-engine` skill to:

1. Build Docker images for the project's `frontend` and `backend` services.
2. Create an isolated Docker bridge network (`net_{project_id}`).
3. Launch multi-container fleet: `frontend` on port `3001`, `backend` on port `8001`.
4. Inject IBM Cloud DB connection URL and IBM Secrets vault keys as environment variables.
5. (Prod) Push images to IBM Container Registry (`icr.io/flashmvp/*`) and deploy to IBM Cloud Code Engine.

---

## 🗂️ Files to Create

| File | Purpose |
| :--- | :--- |
| `server/app/bob/skill_code_engine.py` | IBM Bob Code Engine Skill — Docker/Code Engine orchestration |
| `server/app/api/deploy.py` | `POST /api/v1/projects/{id}/deploy` route |
| `server/app/schemas/deploy.py` | Pydantic models for deployment |

---

## 💻 Core Skill Implementation (DEMO_MODE aware)

```python
# server/app/bob/skill_code_engine.py
import docker, os

DEMO_MODE = os.getenv("DEMO_MODE", "true") == "true"
client = docker.from_env() if not DEMO_MODE else None

async def deploy_container_fleet(project_id: str, template: str, secrets: dict) -> dict:
    if DEMO_MODE:
        return {
            "containers": [
                {"name": "frontend", "status": "RUNNING", "port": 3001, "url": f"https://app-{project_id}.trycloudflare.com"},
                {"name": "backend",  "status": "RUNNING", "port": 8001, "url": f"https://api-{project_id}.trycloudflare.com"},
            ],
            "network": f"net_{project_id}",
            "execution_time_ms": 3850
        }

    # Real Docker / IBM Code Engine execution:
    network = client.networks.create(f"net_{project_id}", driver="bridge")
    backend = client.containers.run(
        f"flashmvp/{template}-backend:latest",
        name=f"{project_id}_backend",
        network=f"net_{project_id}",
        ports={"8001/tcp": 8001},
        environment=secrets,
        detach=True
    )
    frontend = client.containers.run(
        f"flashmvp/{template}-frontend:latest",
        name=f"{project_id}_frontend",
        network=f"net_{project_id}",
        ports={"3001/tcp": 3001},
        environment={**secrets, "API_URL": f"http://localhost:8001"},
        detach=True
    )
    return {
        "containers": [
            {"name": "frontend", "status": "RUNNING", "port": 3001},
            {"name": "backend",  "status": "RUNNING", "port": 8001},
        ],
        "network": f"net_{project_id}",
    }
```

---

## 📝 Implementation Tasks

1. Create `server/app/bob/skill_code_engine.py` with `deploy_container_fleet()` above.
2. Create `server/app/api/deploy.py` with `POST /api/v1/projects/{id}/deploy`:
   - Validates spec is `APPROVED` (calls specs service).
   - Calls `skill_code_engine.deploy_container_fleet()`.
   - Calls `skill_secrets_vault.get_secrets_for_container()` to inject secrets.
   - Returns container fleet status.
3. Add resource safeguards: max 3 active containers, 10-min idle TTL auto-teardown.

---

## 🧪 Testing & Verification

1. `POST /api/v1/projects/proj_8f92a/deploy`
2. ✅ Returns container fleet with `status: "RUNNING"` for both `frontend` and `backend`.
3. ✅ In DEMO_MODE → instant mock response with `execution_time_ms: 3850`.
4. ✅ In live mode → Docker Desktop shows new containers `proj_8f92a_frontend`, `proj_8f92a_backend`.
