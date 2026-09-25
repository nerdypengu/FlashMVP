"""
BL-QA-03 — Workflow Run History API Routes
GET /api/v1/projects/{project_id}/runs           — list all runs (sorted descending)
GET /api/v1/projects/{project_id}/runs/{run_id}  — single run with full qa_steps detail
"""
from typing import List

from fastapi import APIRouter, HTTPException

from app.schemas.run import RunRecord
from app.services import run_store

router = APIRouter(prefix="/api/v1/projects", tags=["QA Run History"])


@router.get("/{project_id}/runs", response_model=List[RunRecord])
async def list_runs(project_id: str) -> List[RunRecord]:
    """
    Return all workflow runs for a project sorted by triggered_at descending.
    In DEMO_MODE, unknown project IDs fall back to the seeded demo runs.
    """
    return run_store.get_runs(project_id)


@router.get("/{project_id}/runs/{run_id}", response_model=RunRecord)
async def get_run(project_id: str, run_id: str) -> RunRecord:
    """
    Return a single RunRecord with full qa_steps detail.
    """
    record = run_store.get_run(project_id, run_id)
    if record is None:
        raise HTTPException(
            status_code=404,
            detail=f"Run '{run_id}' not found for project '{project_id}'.",
        )
    return record
