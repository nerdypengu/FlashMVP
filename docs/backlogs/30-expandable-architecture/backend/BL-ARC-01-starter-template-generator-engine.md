# BL-ARC-01 — IBM Bob `bob-skill-code-engine`: Starter Template Generator Engine
> **Assigned To:** ☁️ **Person 4** — IBM Cloud Infra & Skill Pack Orchestrator  
> **Feature:** Expandable Architecture | **Layer:** Backend  
> **IBM Bob 2.0 Skill:** `bob-skill-code-engine` → IBM Cloud Code Engine / Docker Engine API  
> **File:** `server/app/services/template_service.py`, `server/app/api/projects.py`

---

## 🎯 What This Does

When a developer selects a starter template (`react-fastapi`, `nextjs-go`), **Bob Subagent Gamma** executes this skill to:

1. Scaffold a full-stack project directory from a pre-built IBM-ready template.
2. Embed a `flashmvp.json` manifest declaring IBM service bindings (`ibm-code-engine`, `ibm-postgres-db`, `ibm-secrets-manager`, `ibm-watsonx-qa`).
3. Initialize a local Git repository inside the scaffolded project path.
4. Return the scaffolded path and manifest contents to the downstream `bob-skill-manifest-parser`.

In `DEMO_MODE`, returns a mock scaffolded structure instantly without touching the filesystem.

---

## 🗂️ Files to Create / Edit

| File | Action | Purpose |
| :--- | :--- | :--- |
| `server/app/services/template_service.py` | **CREATE** | IBM Bob scaffold engine — copies template, injects manifest, inits Git |
| `server/app/api/projects.py` | **EDIT** | Add `POST /api/v1/projects/scaffold` route |
| `server/app/schemas/project.py` | **EDIT** | Add scaffold request/response Pydantic models |
| `server/templates/react-fastapi/` | **CREATE** | Template files: `Dockerfile.frontend`, `Dockerfile.backend`, `.gitignore`, `flashmvp.json` |
| `server/templates/nextjs-go/` | **CREATE** | Template files: `Dockerfile.frontend`, `Dockerfile.backend`, `.gitignore`, `flashmvp.json` |

---

## 💻 Pydantic Data Contract

```python
# server/app/schemas/project.py (additions)
from pydantic import BaseModel
from typing import List

class ScaffoldRequest(BaseModel):
    project_id: str     # "proj_8f92a"
    template: str       # "react-fastapi" | "nextjs-go"
    prompt: str         # "Build an e-commerce store with Stripe"

class IBMBinding(BaseModel):
    ibm_code_engine: bool = True
    ibm_postgres_db: bool = True
    ibm_secrets_manager: bool = True
    ibm_watsonx_qa: bool = True

class ScaffoldResponse(BaseModel):
    project_id: str
    template: str
    scaffolded_path: str      # "/tmp/flashmvp/proj_8f92a"
    ibm_bindings: IBMBinding
    git_initialized: bool
    status: str               # "SUCCESS" | "FAILED"
```

---

## 💻 Skill Implementation (DEMO_MODE aware)

```python
# server/app/services/template_service.py
import os, shutil, subprocess

DEMO_MODE = os.getenv("DEMO_MODE", "true") == "true"
TEMPLATES_DIR = os.path.join(os.path.dirname(__file__), "../../templates")

async def scaffold_project(project_id: str, template: str) -> dict:
    if DEMO_MODE:
        return {
            "project_id": project_id,
            "scaffolded_path": f"/tmp/flashmvp/{project_id}",
            "git_initialized": True,
            "status": "SUCCESS"
        }

    src = os.path.join(TEMPLATES_DIR, template)
    dest = f"/tmp/flashmvp/{project_id}"
    shutil.copytree(src, dest)

    # Init Git repository
    subprocess.run(["git", "init", dest], check=True)

    return {
        "project_id": project_id,
        "scaffolded_path": dest,
        "git_initialized": True,
        "status": "SUCCESS"
    }
```

Each template directory **must** include a `flashmvp.json` declaring IBM tool bindings:
```json
{
  "name": "react-fastapi",
  "ibm_bindings": {
    "ibm_code_engine": true,
    "ibm_postgres_db": true,
    "ibm_secrets_manager": true,
    "ibm_watsonx_qa": true
  },
  "services": [
    { "name": "frontend", "dockerfile": "Dockerfile.frontend", "port": 3000 },
    { "name": "backend",  "dockerfile": "Dockerfile.backend",  "port": 8000 }
  ],
  "qa_pipeline": [
    { "id": "lint",    "name": "ESLint",                   "command": "npm run lint" },
    { "id": "test",    "name": "Pytest",                   "command": "pytest" },
    { "id": "security","name": "IBM Watsonx Security Scan","command": "bob skill watsonx-qa --scan" }
  ]
}
```

---

## 📝 Implementation Tasks

1. Create `server/templates/react-fastapi/` with `Dockerfile.frontend`, `Dockerfile.backend`, `.gitignore`, and `flashmvp.json` (IBM bindings as above).
2. Create `server/templates/nextjs-go/` with equivalent IBM-ready structure.
3. Create `server/app/services/template_service.py` with `scaffold_project()` above.
4. Add `POST /api/v1/projects/scaffold` route in `server/app/api/projects.py` calling `scaffold_project()`.
5. Add `DEMO_MODE` guard: in demo mode, skip all filesystem operations and return mock `ScaffoldResponse`.
6. Register router in `server/app/main.py`.

---

## 🧪 Testing & Verification

1. Start server: `uvicorn app.main:app --reload --port 8000`
2. Execute `POST /api/v1/projects/scaffold`:
   ```json
   { "project_id": "proj_8f92a", "template": "react-fastapi", "prompt": "E-commerce store" }
   ```
3. ✅ DEMO_MODE: instant response with `status: "SUCCESS"`, no filesystem writes.
4. ✅ Live mode: `/tmp/flashmvp/proj_8f92a` directory created with all template files and `.git` folder.
5. ✅ Response contains `ibm_bindings` object with all four IBM services set to `true`.
