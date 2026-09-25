"""
Run Store Service
In-memory store for workflow run history records.
Pre-seeded with 5 realistic mock runs for DEMO_MODE (mix of PASSED and FAILED).
"""
import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

from app.schemas.run import QAStepResult, RunRecord

DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() == "true"

# In-memory store: { project_id: [RunRecord, ...] }
_run_store: dict[str, list[RunRecord]] = {}

# ── Demo seed data ────────────────────────────────────────────────────────────

_now = datetime.now(timezone.utc)

_DEMO_PROJECT_ID = "proj_8f92a"

_SEEDED_RUNS: list[RunRecord] = [
    RunRecord(
        run_id="run-005",
        project_id=_DEMO_PROJECT_ID,
        run_number=5,
        status="PASSED",
        triggered_at=_now - timedelta(seconds=32),
        duration_ms=18400,
        qa_steps=[
            QAStepResult(step_name="ESLint", status="PASSED", duration_ms=3200,
                         log_output="✓ No linting errors found (47 files checked)"),
            QAStepResult(step_name="Pytest", status="PASSED", duration_ms=9800,
                         log_output="========== 24 passed in 9.78s =========="),
            QAStepResult(step_name="IBM Watsonx Security", status="PASSED", duration_ms=5400,
                         log_output="✓ Security audit complete. No secrets or vulnerabilities detected."),
        ],
        deployment_url="https://app-8f92a.trycloudflare.com",
    ),
    RunRecord(
        run_id="run-004",
        project_id=_DEMO_PROJECT_ID,
        run_number=4,
        status="FAILED",
        triggered_at=_now - timedelta(hours=2),
        duration_ms=7100,
        qa_steps=[
            QAStepResult(step_name="ESLint", status="PASSED", duration_ms=3100,
                         log_output="✓ No linting errors found (47 files checked)"),
            QAStepResult(step_name="Pytest", status="FAILED", duration_ms=4000,
                         log_output="FAILED tests/test_checkout.py::test_stripe_webhook - AssertionError: expected status 200, got 422\n========== 1 failed, 23 passed in 3.98s =========="),
            QAStepResult(step_name="IBM Watsonx Security", status="SKIPPED", duration_ms=0,
                         log_output="Step skipped — pipeline halted on Pytest failure."),
        ],
        deployment_url=None,
    ),
    RunRecord(
        run_id="run-003",
        project_id=_DEMO_PROJECT_ID,
        run_number=3,
        status="PASSED",
        triggered_at=_now - timedelta(hours=5),
        duration_ms=21300,
        qa_steps=[
            QAStepResult(step_name="ESLint", status="PASSED", duration_ms=3400,
                         log_output="✓ No linting errors found (45 files checked)"),
            QAStepResult(step_name="Pytest", status="PASSED", duration_ms=12500,
                         log_output="========== 23 passed in 12.45s =========="),
            QAStepResult(step_name="IBM Watsonx Security", status="PASSED", duration_ms=5400,
                         log_output="✓ Security audit complete. No secrets or vulnerabilities detected."),
        ],
        deployment_url="https://app-8f92a.trycloudflare.com",
    ),
    RunRecord(
        run_id="run-002",
        project_id=_DEMO_PROJECT_ID,
        run_number=2,
        status="FAILED",
        triggered_at=_now - timedelta(hours=9),
        duration_ms=4800,
        qa_steps=[
            QAStepResult(step_name="ESLint", status="FAILED", duration_ms=4800,
                         log_output="error  'cartItems' is defined but never used  src/components/CartDrawer.tsx:12:7\nerror  Missing semicolon  src/pages/Checkout.tsx:34:1\n✖ 3 problems (3 errors, 0 warnings)"),
            QAStepResult(step_name="Pytest", status="SKIPPED", duration_ms=0,
                         log_output="Step skipped — pipeline halted on ESLint failure."),
            QAStepResult(step_name="IBM Watsonx Security", status="SKIPPED", duration_ms=0,
                         log_output="Step skipped — pipeline halted on ESLint failure."),
        ],
        deployment_url=None,
    ),
    RunRecord(
        run_id="run-001",
        project_id=_DEMO_PROJECT_ID,
        run_number=1,
        status="PASSED",
        triggered_at=_now - timedelta(days=1),
        duration_ms=25600,
        qa_steps=[
            QAStepResult(step_name="ESLint", status="PASSED", duration_ms=4100,
                         log_output="✓ No linting errors found (40 files checked)"),
            QAStepResult(step_name="Pytest", status="PASSED", duration_ms=15800,
                         log_output="========== 18 passed in 15.72s =========="),
            QAStepResult(step_name="IBM Watsonx Security", status="PASSED", duration_ms=5700,
                         log_output="✓ Security audit complete. No secrets or vulnerabilities detected."),
        ],
        deployment_url="https://app-8f92a.trycloudflare.com",
    ),
]

# Seed the demo project on module load
_run_store[_DEMO_PROJECT_ID] = list(_SEEDED_RUNS)


# ── Public API ────────────────────────────────────────────────────────────────

def get_runs(project_id: str) -> list[RunRecord]:
    """Return all runs for a project sorted by triggered_at descending."""
    if DEMO_MODE and project_id not in _run_store:
        # Any unknown project_id returns the demo seed in DEMO_MODE
        return list(_SEEDED_RUNS)
    runs = _run_store.get(project_id, [])
    return sorted(runs, key=lambda r: r.triggered_at, reverse=True)


def get_run(project_id: str, run_id: str) -> Optional[RunRecord]:
    """Return a single RunRecord by run_id, or None if not found."""
    for run in _run_store.get(project_id, []):
        if run.run_id == run_id:
            return run
    if DEMO_MODE:
        for run in _SEEDED_RUNS:
            if run.run_id == run_id:
                return run
    return None


def create_run(project_id: str) -> RunRecord:
    """
    Create a new RUNNING RunRecord at the start of a deploy.
    Returns the record so the caller can update it on completion.
    """
    existing = _run_store.setdefault(project_id, [])
    next_number = (max((r.run_number for r in existing), default=0) + 1)
    record = RunRecord(
        run_id=f"run-{uuid.uuid4().hex[:6]}",
        project_id=project_id,
        run_number=next_number,
        status="RUNNING",
        triggered_at=datetime.now(timezone.utc),
        duration_ms=0,
        qa_steps=[],
        deployment_url=None,
    )
    existing.append(record)
    return record


def update_run(project_id: str, run_id: str, **kwargs) -> Optional[RunRecord]:
    """
    Patch an existing RunRecord by run_id.
    Accepted kwargs: status, duration_ms, qa_steps, deployment_url.
    """
    runs = _run_store.get(project_id, [])
    for i, run in enumerate(runs):
        if run.run_id == run_id:
            runs[i] = run.model_copy(update=kwargs)
            return runs[i]
    return None
