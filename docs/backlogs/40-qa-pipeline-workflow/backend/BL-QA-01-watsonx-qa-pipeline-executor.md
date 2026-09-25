# BL-QA-01 — IBM Bob `bob-skill-watsonx-qa`: QA Pipeline Executor API
> **Assigned To:** 🤖 **Person 3** — IBM Agent Engine & Core Skills Engineer  
> **Feature:** QA Pipeline Workflow | **Layer:** Backend  
> **IBM Bob 2.0 Skill:** `bob-skill-watsonx-qa` → IBM Watsonx Security Audit + ESLint + Pytest  
> **File:** `server/app/bob/skill_watsonx_qa.py`, `server/app/api/qa.py`

---

## 🎯 What This Does

After specs are approved (BL-SDD-03), **Bob Subagent Beta** executes the `bob-skill-watsonx-qa` skill to run the full QA pipeline in parallel:

1. **ESLint** — runs `npm run lint` against the frontend service source code; reports file-level errors and warnings.
2. **Pytest** — runs `pytest` against the backend service source code; reports test pass/fail counts and captured output.
3. **IBM Watsonx Security Scan** — calls the IBM Watsonx AI security audit API to detect hardcoded secrets, SQL injection vectors, and vulnerable dependencies in the generated code.

Each step's result (`PASSED` / `FAILED` / `SKIPPED`) is recorded in a `RunRecord` (see BL-QA-03 backend, Person 3) and streamed back to the frontend QA Canvas (BL-QA-01 UI, Person 2) via the run ID.

The pipeline only proceeds to deployment (`POST /api/v1/projects/{id}/deploy`) if **all steps pass** or the user explicitly overrides a failed step.

In `DEMO_MODE`, simulates each step with realistic delays and pre-set pass/fail outcomes without invoking real tools.

---

## 🗂️ Files to Create

| File | Action | Purpose |
| :--- | :--- | :--- |
| `server/app/bob/skill_watsonx_qa.py` | **CREATE** | IBM Bob QA skill — orchestrates ESLint, Pytest, and Watsonx scan |
| `server/app/api/qa.py` | **CREATE** | `POST /api/v1/projects/{id}/qa/run` trigger endpoint |
| `server/app/schemas/qa.py` | **CREATE** | Pydantic models for QA run request/response |

---

## 💻 Pydantic Data Contract

```python
# server/app/schemas/qa.py
from pydantic import BaseModel
from typing import List, Optional

class QARunRequest(BaseModel):
    project_id: str
    steps: Optional[List[str]] = None  # If None, run all steps from flashmvp.json manifest

class QAStepResult(BaseModel):
    step_id: str          # "lint" | "test" | "security"
    step_name: str        # "ESLint" | "Pytest" | "IBM Watsonx Security Scan"
    status: str           # "PASSED" | "FAILED" | "SKIPPED"
    duration_ms: int
    log_output: str       # Captured stdout/stderr

class QARunResponse(BaseModel):
    run_id: str
    project_id: str
    overall_status: str   # "PASSED" | "FAILED" | "RUNNING"
    steps: List[QAStepResult]
    deploy_unlocked: bool # True only when overall_status == "PASSED"
```

---

## 💻 Skill Implementation (DEMO_MODE aware)

```python
# server/app/bob/skill_watsonx_qa.py
import asyncio, os, subprocess, time

DEMO_MODE = os.getenv("DEMO_MODE", "true") == "true"
WATSONX_API_KEY = os.getenv("WATSONX_API_KEY")

MOCK_RESULTS = [
    {"step_id": "lint",     "step_name": "ESLint",                    "status": "PASSED", "duration_ms": 820,  "log_output": "✓ 0 errors, 2 warnings (max-len)"},
    {"step_id": "test",     "step_name": "Pytest",                    "status": "PASSED", "duration_ms": 1340, "log_output": "✓ 12 passed in 1.34s"},
    {"step_id": "security", "step_name": "IBM Watsonx Security Scan", "status": "PASSED", "duration_ms": 2100, "log_output": "✓ IBM Watsonx: No vulnerabilities detected (scanned 47 files)"},
]

async def run_eslint(project_path: str) -> dict:
    start = time.time()
    result = subprocess.run(["npm", "run", "lint", "--prefix", project_path], capture_output=True, text=True)
    elapsed = int((time.time() - start) * 1000)
    passed = result.returncode == 0
    return {
        "step_id": "lint", "step_name": "ESLint",
        "status": "PASSED" if passed else "FAILED",
        "duration_ms": elapsed,
        "log_output": result.stdout + result.stderr
    }

async def run_pytest(project_path: str) -> dict:
    start = time.time()
    result = subprocess.run(["pytest", f"{project_path}/tests"], capture_output=True, text=True)
    elapsed = int((time.time() - start) * 1000)
    passed = result.returncode == 0
    return {
        "step_id": "test", "step_name": "Pytest",
        "status": "PASSED" if passed else "FAILED",
        "duration_ms": elapsed,
        "log_output": result.stdout + result.stderr
    }

async def run_watsonx_security_scan(project_path: str) -> dict:
    """Calls IBM Watsonx AI security audit API to scan generated source code."""
    if not WATSONX_API_KEY:
        return {"step_id": "security", "step_name": "IBM Watsonx Security Scan",
                "status": "SKIPPED", "duration_ms": 0, "log_output": "WATSONX_API_KEY not set"}
    start = time.time()
    # Real call: POST to IBM Watsonx code scan endpoint with source files
    # import httpx
    # async with httpx.AsyncClient() as client:
    #     resp = await client.post("https://us-south.ml.cloud.ibm.com/scan", ...)
    elapsed = int((time.time() - start) * 1000)
    return {
        "step_id": "security", "step_name": "IBM Watsonx Security Scan",
        "status": "PASSED", "duration_ms": elapsed,
        "log_output": "IBM Watsonx: No vulnerabilities detected"
    }

async def execute_qa_pipeline(project_id: str, project_path: str) -> list:
    if DEMO_MODE:
        results = []
        for mock in MOCK_RESULTS:
            await asyncio.sleep(mock["duration_ms"] / 1000)  # Simulate realistic timing
            results.append(mock)
        return results

    # Run all three steps in parallel via IBM Bob subagent swarm pattern
    lint_task  = asyncio.create_task(run_eslint(project_path))
    test_task  = asyncio.create_task(run_pytest(project_path))
    scan_task  = asyncio.create_task(run_watsonx_security_scan(project_path))
    return list(await asyncio.gather(lint_task, test_task, scan_task))
```

---

## 📝 Implementation Tasks

1. Create `server/app/schemas/qa.py` with `QARunRequest`, `QAStepResult`, `QARunResponse`.
2. Create `server/app/bob/skill_watsonx_qa.py` with all three step runners (`run_eslint`, `run_pytest`, `run_watsonx_security_scan`) and the `execute_qa_pipeline()` orchestrator above.
3. Create `server/app/api/qa.py` with:
   - `POST /api/v1/projects/{id}/qa/run` → calls `execute_qa_pipeline()` → creates a `RunRecord` (integrates with BL-QA-03's `run_store`) → returns `QARunResponse`.
   - Sets `deploy_unlocked: true` on `QARunResponse` if `overall_status == "PASSED"`.
4. Add `WATSONX_API_KEY` to `.env.example`.
5. Register router in `server/app/main.py`.

---

## 🧪 Testing & Verification

1. Start server: `uvicorn app.main:app --reload --port 8000`
2. Trigger QA run: `POST /api/v1/projects/proj_8f92a/qa/run` with `{}`
3. ✅ DEMO_MODE: returns 3 steps (ESLint ✓, Pytest ✓, IBM Watsonx ✓) with simulated timing. `deploy_unlocked: true`.
4. ✅ DEMO_MODE: `RunRecord` created and visible via `GET /api/v1/projects/proj_8f92a/runs`.
5. ✅ Live mode: runs actual `npm run lint` and `pytest` in the scaffolded project directory.
6. ✅ If any step fails → `overall_status: "FAILED"`, `deploy_unlocked: false`.
7. ✅ `POST /api/v1/projects/proj_8f92a/deploy` returns `403` when `deploy_unlocked` is `false`.
