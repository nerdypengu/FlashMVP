"""
BL-QA-03 — Workflow Run History API Routes
GET /api/v1/projects/{project_id}/runs           — list all runs (sorted descending)
GET /api/v1/projects/{project_id}/runs/{run_id}  — single run with full qa_steps detail
"""
from typing import List

from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPAuthorizationCredentials
from pydantic import BaseModel
from app.services.person2_store import bearer, user_token, read_rows, get_project

from app.schemas.manifest import QAPipelineStage
from app.schemas.run import QAStepResult, RunRecord
from app.services import qa_pipeline, run_store

router = APIRouter(prefix="/api/v1/projects", tags=["QA Run History"])


class DemoQARunRequest(BaseModel):
    simulate_failure: bool = False


@router.get("/{project_id}/qa-pipeline", response_model=List[QAPipelineStage])
async def project_qa_pipeline(project_id: str, credentials: HTTPAuthorizationCredentials | None = Depends(bearer)):
    if not run_store.DEMO_MODE:
        project_id = (await get_project(project_id, user_token(credentials)))["project_id"]
    return qa_pipeline.get_pipeline(project_id, demo=run_store.DEMO_MODE)


@router.post("/{project_id}/qa/run", response_model=RunRecord)
async def demo_qa_run(project_id: str, body: DemoQARunRequest):
    if not run_store.DEMO_MODE:
        raise HTTPException(501, "Live QA must be run by the Bob project runner.")
    stages = qa_pipeline.get_pipeline(project_id, demo=True)
    files = [(stage.stage, pattern) for stage in stages for pattern in stage.files]
    record = run_store.create_run(project_id)
    failed = False
    results = []
    duration_ms = 0
    for index, (stage, pattern) in enumerate(files):
        status = "SKIPPED" if failed else "FAILED" if body.simulate_failure and index == min(1, len(files) - 1) else "PASSED"
        elapsed = 0 if status == "SKIPPED" else 600
        duration_ms += elapsed
        results.append(QAStepResult(id=f"{stage}:{pattern}", stage=stage, step_name=pattern, status=status,
                                    duration_ms=elapsed, log_output=f"Demo simulation: {status.lower()} (no test command executed)."))
        failed |= status == "FAILED"
    return run_store.update_run(project_id, record.run_id, status="FAILED" if failed else "PASSED",
                                duration_ms=duration_ms, qa_steps=results)


@router.get("/{project_id}/runs", response_model=List[RunRecord])
async def list_runs(project_id: str, credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> List[RunRecord]:
    """
    Return all workflow runs for a project sorted by triggered_at descending.
    In DEMO_MODE, runs are persisted locally in SQLite and isolated per project.
    """
    if run_store.DEMO_MODE:
        return run_store.get_runs(project_id)
    token = user_token(credentials)
    project = await get_project(project_id, token)
    rows = await read_rows("run_history", token, {
        "select": "run_id,run_number,status,duration_ms,qa_steps,triggered_at,deployment_url",
        "project_id": f"eq.{project['id']}", "order": "triggered_at.desc",
    })
    return [RunRecord(**{**row, 'duration_ms': row.get('duration_ms') or 0, 'qa_steps': row.get('qa_steps') or []}, project_id=project['project_id']) for row in rows]


@router.get("/{project_id}/runs/{run_id}", response_model=RunRecord)
async def get_run(project_id: str, run_id: str, credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> RunRecord:
    """
    Return a single RunRecord with full qa_steps detail.
    """
    if run_store.DEMO_MODE:
        record = run_store.get_run(project_id, run_id)
    else:
        token = user_token(credentials)
        project = await get_project(project_id, token)
        rows = await read_rows("run_history", token, {
            "select": "run_id,run_number,status,duration_ms,qa_steps,triggered_at,deployment_url",
            "project_id": f"eq.{project['id']}", "run_id": f"eq.{run_id}", "limit": "1",
        })
        record = RunRecord(**{**rows[0], 'duration_ms': rows[0].get('duration_ms') or 0, 'qa_steps': rows[0].get('qa_steps') or []}, project_id=project['project_id']) if rows else None
    if record is None:
        raise HTTPException(
            status_code=404,
            detail=f"Run '{run_id}' not found for project '{project_id}'.",
        )
    return record
