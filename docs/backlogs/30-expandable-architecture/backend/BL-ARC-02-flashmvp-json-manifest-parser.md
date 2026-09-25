# BL-ARC-02 — IBM Bob `bob-skill-manifest-parser`: `flashmvp.json` Manifest Parser
> **Assigned To:** ☁️ **Person 4** — IBM Cloud Infra & Skill Pack Orchestrator  
> **Feature:** Expandable Architecture | **Layer:** Backend  
> **IBM Bob 2.0 Skill:** `bob-skill-manifest-parser` → Document Understanding Engine (infra binding layer)  
> **File:** `server/app/services/manifest_parser.py`, `server/app/bob/skill_manifest_parser.py`

---

## 🎯 What This Does

After the project is scaffolded (BL-ARC-01), **Bob Subagent Gamma** reads the `flashmvp.json` manifest embedded in the project template to extract:

1. **IBM Service Bindings** — which IBM tools are required (`ibm-code-engine`, `ibm-postgres-db`, `ibm-secrets-manager`, `ibm-watsonx-qa`).
2. **Service Definitions** — container names, Dockerfiles, and port mappings for the container fleet.
3. **QA Pipeline Steps** — ordered list of QA commands that feed directly into the visual QA canvas (BL-QA-01).

The parsed manifest is the **single source of truth** that gates all downstream IBM Bob skills. It is passed to `bob-skill-manifest-parser` (Person 3's SDD engine) to generate the 3-part SDD artifact, and to `bob-skill-code-engine` to configure the deployment fleet.

In `DEMO_MODE`, returns a pre-defined mock manifest response without filesystem access.

---

## 🗂️ Files to Create / Edit

| File | Action | Purpose |
| :--- | :--- | :--- |
| `server/app/services/manifest_parser.py` | **CREATE** | Reads and validates `flashmvp.json`; returns structured `ParsedManifest` |
| `server/app/schemas/manifest.py` | **CREATE** | Pydantic models for the parsed manifest |
| `server/app/api/projects.py` | **EDIT** | Add `POST /api/v1/projects/{id}/parse-manifest` route |

---

## 💻 Pydantic Data Contract

```python
# server/app/schemas/manifest.py
from pydantic import BaseModel
from typing import List

class IBMBindings(BaseModel):
    ibm_code_engine: bool = True
    ibm_postgres_db: bool = True
    ibm_secrets_manager: bool = True
    ibm_watsonx_qa: bool = True

class ServiceDefinition(BaseModel):
    name: str           # "frontend" | "backend"
    dockerfile: str     # "Dockerfile.frontend"
    port: int           # 3000 | 8000

class QAPipelineStep(BaseModel):
    id: str             # "lint" | "test" | "security"
    name: str           # "ESLint" | "Pytest" | "IBM Watsonx Security Scan"
    command: str        # "npm run lint"

class ParsedManifest(BaseModel):
    project_id: str
    app_name: str
    template: str
    ibm_bindings: IBMBindings
    services: List[ServiceDefinition]
    qa_pipeline: List[QAPipelineStep]
    status: str         # "VALID" | "INVALID"
```

---

## 💻 Skill Implementation (DEMO_MODE aware)

```python
# server/app/services/manifest_parser.py
import json, os
from app.schemas.manifest import ParsedManifest, IBMBindings, ServiceDefinition, QAPipelineStep

DEMO_MODE = os.getenv("DEMO_MODE", "true") == "true"

MOCK_MANIFEST = ParsedManifest(
    project_id="proj_8f92a",
    app_name="react-fastapi",
    template="react-fastapi",
    ibm_bindings=IBMBindings(),
    services=[
        ServiceDefinition(name="frontend", dockerfile="Dockerfile.frontend", port=3000),
        ServiceDefinition(name="backend",  dockerfile="Dockerfile.backend",  port=8000),
    ],
    qa_pipeline=[
        QAPipelineStep(id="lint",     name="ESLint",                    command="npm run lint"),
        QAPipelineStep(id="test",     name="Pytest",                    command="pytest"),
        QAPipelineStep(id="security", name="IBM Watsonx Security Scan", command="bob skill watsonx-qa --scan"),
    ],
    status="VALID"
)

def parse_manifest(project_id: str, manifest_path: str) -> ParsedManifest:
    if DEMO_MODE:
        return MOCK_MANIFEST.model_copy(update={"project_id": project_id})

    with open(manifest_path, "r") as f:
        raw = json.load(f)

    return ParsedManifest(
        project_id=project_id,
        app_name=raw["name"],
        template=raw.get("template", "react-fastapi"),
        ibm_bindings=IBMBindings(**raw.get("ibm_bindings", {})),
        services=[ServiceDefinition(**s) for s in raw.get("services", [])],
        qa_pipeline=[QAPipelineStep(**q) for q in raw.get("qa_pipeline", [])],
        status="VALID"
    )
```

---

## 📝 Implementation Tasks

1. Create `server/app/schemas/manifest.py` with all Pydantic models above.
2. Create `server/app/services/manifest_parser.py` with `parse_manifest()` — DEMO_MODE returns `MOCK_MANIFEST`.
3. Add `POST /api/v1/projects/{id}/parse-manifest` route in `server/app/api/projects.py`:
   - Resolves manifest path from scaffolded project directory.
   - Calls `parse_manifest()` and returns the `ParsedManifest`.
4. After parsing, forward `qa_pipeline` steps to the run store so the QA canvas (BL-QA-01) can pre-populate its visual nodes.
5. Register router in `server/app/main.py`.

---

## 🧪 Testing & Verification

1. Start server: `uvicorn app.main:app --reload --port 8000`
2. Execute `POST /api/v1/projects/proj_8f92a/parse-manifest`
3. ✅ DEMO_MODE: returns `MOCK_MANIFEST` with `status: "VALID"` instantly, no filesystem reads.
4. ✅ Live mode: reads `/tmp/flashmvp/proj_8f92a/flashmvp.json` and returns parsed `services`, `qa_pipeline`, and `ibm_bindings`.
5. ✅ Invalid/missing manifest → returns `status: "INVALID"` with descriptive error message.
6. Run pytest: `pytest server/tests/test_manifest_parser.py` with mock `flashmvp.json` fixture → verify object validation passes.
