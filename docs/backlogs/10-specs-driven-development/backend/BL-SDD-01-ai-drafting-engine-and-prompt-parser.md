# BL-SDD-01 — IBM Bob `bob-skill-manifest-parser`: AI Drafting Engine & Prompt Parser
> **Assigned To:** 🤖 **Person 3** — IBM Agent Engine & Core Skills Engineer  
> **Feature:** Specs-Driven Development (SDD) | **Layer:** Backend  
> **IBM Bob 2.0 Skill:** `bob-skill-manifest-parser` → Document Understanding Engine  
> **File:** `server/app/api/specs.py`, `server/app/bob/skill_manifest_parser.py`

---

## 🎯 What This Does

When a developer enters a prompt (`"Build me an e-commerce store with Stripe"`) and picks a template (`react-fastapi`), this skill:

1. **Parses** the natural language prompt using the IBM Bob 2.0 Document Understanding engine.
2. **Reads** the `flashmvp.json` manifest to discover IBM tool bindings (`ibm-code-engine`, `ibm-postgres-db`, `ibm-secrets-manager`, `ibm-watsonx-qa`).
3. **Drafts** a 3-part SDD artifact bundle:
   - **Requirements** — Functional user stories and business rules (Markdown).
   - **Technical Design** — Full-stack architecture, IBM service topology, endpoint specs (Markdown).
   - **Task Breakdown** — Ordered execution steps as structured JSON.
4. Returns the bundle locked as `status: "DRAFT"` until human sign-off.

---

## 🗂️ Files to Create / Edit

| File | Action | Purpose |
| :--- | :--- | :--- |
| `server/app/bob/skill_manifest_parser.py` | **CREATE** | IBM Bob Document Understanding Skill — parses prompts + `flashmvp.json` |
| `server/app/api/specs.py` | **CREATE** | FastAPI routes: `POST /api/v1/specs/generate`, `POST /api/v1/specs/revise` |
| `server/app/schemas/spec.py` | **CREATE** | Pydantic data contracts for request/response |
| `server/app/services/spec_generator.py` | **CREATE** | Mock/AI text formatter for requirements, design, tasks |

---

## 💻 Pydantic Data Contract

```python
# server/app/schemas/spec.py
from pydantic import BaseModel
from typing import List, Optional

class SpecGenerateRequest(BaseModel):
    prompt: str                       # "Build an e-commerce store with Stripe"
    template: str                     # "react-fastapi" | "nextjs-go"
    feedback: Optional[str] = None    # Revision feedback: "Use PostgreSQL not MongoDB"

class TaskItem(BaseModel):
    id: str                           # "task-001"
    description: str                  # "Create Stripe checkout session endpoint"
    completed: bool = False

class IBMToolBinding(BaseModel):
    code_engine: bool = True          # IBM Cloud Code Engine deployment
    cloud_db: bool = True             # IBM Cloud Databases for PostgreSQL
    secrets_vault: bool = True        # IBM Secrets Manager
    watsonx_qa: bool = True           # IBM Watsonx Security Audit

class SpecResponse(BaseModel):
    project_id: str
    status: str                       # DRAFT | CHANGES_REQUESTED | APPROVED
    requirements: str                 # Markdown string
    design: str                       # Markdown string
    tasks: List[TaskItem]
    ibm_bindings: IBMToolBinding
```

---

## 📝 Implementation Tasks

1. **Create `server/app/schemas/spec.py`** — copy in Pydantic models above.
2. **Create `server/app/bob/skill_manifest_parser.py`** — implement `parse_prompt_to_sdd(prompt, template, feedback)` that returns structured SDD text. In DEMO_MODE use a static pre-filled mock response.
3. **Create `server/app/services/spec_generator.py`** — wraps the Bob skill, formats Markdown Requirements, Design, and Tasks JSON list.
4. **Create `server/app/api/specs.py`** with:
   - `POST /api/v1/specs/generate` → calls `spec_generator.generate(request)` → returns `SpecResponse`.
   - `POST /api/v1/specs/revise` → takes `project_id` + `feedback` → re-generates only changed sections.
5. Register the router in `server/app/main.py`.

---

## 🤖 IBM Bob 2.0 Skill Integration Note

In `skill_manifest_parser.py`, the Bob Document Understanding call should:
```python
# DEMO_MODE=false → call real IBM Bob 2.0 API
# DEMO_MODE=true  → return static SDD fixture from server/app/mocks/sdd_mock.json
import os

DEMO_MODE = os.getenv("DEMO_MODE", "true") == "true"

async def parse_prompt_to_sdd(prompt: str, template: str) -> dict:
    if DEMO_MODE:
        return load_mock("sdd_mock.json")
    # Real IBM Bob 2.0 Document Understanding API call here
    return await ibm_bob_client.understand_document(prompt, template)
```

---

## 🧪 Testing & Verification

1. Start server: `uvicorn app.main:app --reload --port 8000`
2. Open Swagger: `http://localhost:8000/docs`
3. Execute `POST /api/v1/specs/generate`:
   ```json
   { "prompt": "E-Commerce Store with Stripe", "template": "react-fastapi" }
   ```
4. ✅ Expect 200 OK with `status: "DRAFT"`, populated `requirements`, `design`, and `tasks` array.
5. ✅ Expect `ibm_bindings` object showing `code_engine: true`, `cloud_db: true`, etc.
