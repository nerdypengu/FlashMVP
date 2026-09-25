# BL-INF-01 — IBM Bob `bob-skill-cloud-db`: IBM Cloud DB Schema Provisioner
> **Assigned To:** ☁️ **Person 4** — IBM Cloud Infra & Skill Pack Orchestrator  
> **Feature:** Application Infrastructure | **Layer:** Backend  
> **IBM Bob 2.0 Skill:** `bob-skill-cloud-db` → IBM Cloud Databases for PostgreSQL  
> **File:** `server/app/bob/skill_cloud_db.py`, `server/app/api/projects.py`

---

## 🎯 What This Does

When IBM Bob 2.0 approves specs and triggers deployment, **Bob Subagent Alpha** executes the `bob-skill-cloud-db` skill to:

1. Connect to IBM Cloud Databases for PostgreSQL (or Supabase PostgreSQL as dev proxy).
2. Create an **isolated tenant schema** (`CREATE SCHEMA app_{project_id}`) in **< 200ms**.
3. Set up the base users table for the project.
4. Return the connection URL for downstream skills (Code Engine, Secrets Vault).

This ensures **every project gets its own isolated database namespace** without provisioning separate billing instances — critical for multi-tenant architecture.

---

## 🗂️ Files to Create / Edit

| File | Action | Purpose |
| :--- | :--- | :--- |
| `server/app/bob/skill_cloud_db.py` | **CREATE** | IBM Bob DB Provisioner Skill — schema creation logic |
| `server/app/api/projects.py` | **CREATE** | `POST /api/v1/projects/create` route |
| `server/app/schemas/project.py` | **CREATE** | Pydantic models for project creation |

---

## 💻 Pydantic Data Contract

```python
# server/app/schemas/project.py
from pydantic import BaseModel

class ProjectCreateRequest(BaseModel):
    project_id: str          # "proj_8f92a"
    template: str            # "react-fastapi"

class ProjectCreateResponse(BaseModel):
    project_id: str
    schema_name: str         # "app_proj_8f92a"
    execution_time_ms: int   # e.g. 180
    connection_url: str      # masked postgres://...
    status: str              # "SUCCESS" | "FAILED"
```

---

## 💻 Skill Implementation

```python
# server/app/bob/skill_cloud_db.py
import asyncpg, os, time

DEMO_MODE = os.getenv("DEMO_MODE", "true") == "true"
DB_URL = os.getenv("SUPABASE_DB_URL")  # or IBM Cloud DB URL

async def provision_schema(project_id: str) -> dict:
    if DEMO_MODE:
        return {
            "schema_name": f"app_{project_id}",
            "execution_time_ms": 180,
            "status": "SUCCESS"
        }

    schema = f"app_{project_id}"
    start = time.time()

    conn = await asyncpg.connect(DB_URL)
    await conn.execute(f"""
        CREATE SCHEMA IF NOT EXISTS {schema};
        CREATE TABLE IF NOT EXISTS {schema}.users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email TEXT UNIQUE NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    """)
    await conn.close()

    elapsed_ms = int((time.time() - start) * 1000)
    return {
        "schema_name": schema,
        "execution_time_ms": elapsed_ms,
        "status": "SUCCESS"
    }
```

---

## 📝 Implementation Tasks

1. Create `server/app/bob/skill_cloud_db.py` with `provision_schema()` function above.
2. Create `server/app/schemas/project.py` with Pydantic models.
3. Create `server/app/api/projects.py` with `POST /api/v1/projects/create` calling `provision_schema()`.
4. Register router in `server/app/main.py`.
5. Add `SUPABASE_DB_URL` to `.env.example`.

---

## 🧪 Testing & Verification

1. Start: `uvicorn app.main:app --reload --port 8000`
2. Execute `POST /api/v1/projects/create`:
   ```json
   { "project_id": "proj_8f92a", "template": "react-fastapi" }
   ```
3. ✅ Expect 200 OK with `execution_time_ms < 200` and `status: "SUCCESS"`.
4. ✅ Connect to Supabase dashboard → verify schema `app_proj_8f92a` exists.
5. ✅ In DEMO_MODE → returns mock response instantly, no DB connection attempted.
