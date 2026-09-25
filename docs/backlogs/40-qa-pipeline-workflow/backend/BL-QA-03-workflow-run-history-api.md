# BL-QA-03 — Workflow Run History API
> **Assigned To:** 🤖 **Person 3** — IBM Agent Engine & Core Skills Engineer  
> **Feature:** QA Pipeline Workflow | **Layer:** Backend  
> **File:** `server/app/api/runs.py`

---

## 🎯 What This Does

Records every IBM Bob 2.0 deployment and QA run attempt. Returns an audit log of past runs in the style of GitHub Actions / Vercel deployment history, so developers can see:
- `Run #14 — 🟢 Passed (32s ago)` — click to view logs.
- `Run #13 — 🔴 Failed — ESLint: 3 errors` — click to inspect failure.

---

## 🗂️ Files to Create

| File | Purpose |
| :--- | :--- |
| `server/app/api/runs.py` | `GET /api/v1/projects/{id}/runs` and `GET /api/v1/projects/{id}/runs/{run_id}` |
| `server/app/schemas/run.py` | Pydantic models for run history |
| `server/app/services/run_store.py` | In-memory run record store |

---

## 💻 Pydantic Data Contract

```python
# server/app/schemas/run.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class QAStepResult(BaseModel):
    step_name: str         # "ESLint" | "Pytest" | "IBM Watsonx Security"
    status: str            # "PASSED" | "FAILED" | "SKIPPED"
    duration_ms: int
    log_output: str        # Captured stdout/stderr

class RunRecord(BaseModel):
    run_id: str
    project_id: str
    run_number: int
    status: str            # "PASSED" | "FAILED" | "RUNNING"
    triggered_at: datetime
    duration_ms: int
    qa_steps: List[QAStepResult]
    deployment_url: Optional[str] = None   # IBM Code Engine URL if passed
```

---

## 📝 Implementation Tasks

1. Create `server/app/services/run_store.py` — in-memory dict `{project_id: [RunRecord]}`. Seed with 5 mock runs for DEMO_MODE.

2. Create `server/app/api/runs.py`:
   - `GET /api/v1/projects/{id}/runs` → returns list of `RunRecord` sorted by `triggered_at` descending.
   - `GET /api/v1/projects/{id}/runs/{run_id}` → returns single `RunRecord` with full `qa_steps` detail.

3. Hook into `POST /api/v1/projects/{id}/deploy` → create a new `RunRecord` on deploy start, update on completion.

---

## 🧪 Testing & Verification

1. `GET /api/v1/projects/proj_8f92a/runs`
2. ✅ Returns array of past runs with `run_number`, `status`, `triggered_at`.
3. ✅ `GET /api/v1/projects/proj_8f92a/runs/run-001` → returns full step results.
4. ✅ In DEMO_MODE → returns pre-seeded 5 mock runs (mix of PASSED and FAILED).
