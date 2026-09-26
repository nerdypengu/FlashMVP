"""
Projects API Routes
POST /api/v1/projects/{project_id}/deploy — trigger a deploy run

BL-SDD-03 enforcement: deploy is refused with 409 if the spec is not APPROVED.
BL-QA-03 integration:  creates a RunRecord on start, updates it on completion.
"""
import asyncio
import os
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.schemas.project import ProjectCreateRequest, ProjectCreateResponse
from app.schemas.run import QAStepResult
from app.services import run_store, spec_generator

DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() == "true"

router = APIRouter(prefix="/api/v1/projects", tags=["Projects"])


class DeployRequest(BaseModel):
    feature_id: str   # The approved spec that authorises this deploy


class DeployResponse(BaseModel):
    project_id: str
    run_id: str
    run_number: int
    status: str
    deployment_url: str | None = None
    message: str


@router.post("/create", response_model=ProjectCreateResponse, status_code=201)
async def create_project(body: ProjectCreateRequest) -> ProjectCreateResponse:
    """
    BL-INF-01: Provision an isolated PostgreSQL schema for a new project.
    Calls bob-skill-cloud-db to execute CREATE SCHEMA app_{project_id} in < 200ms.
    """
    from app.bob import skill_cloud_db
    result = await skill_cloud_db.provision_schema(body.project_id)
    return ProjectCreateResponse(
        project_id=body.project_id,
        schema_name=result["schema_name"],
        execution_time_ms=result["execution_time_ms"],
        connection_url=result["connection_url"],
        status=result["status"],
    )


@router.post("/{project_id}/deploy", response_model=DeployResponse)
async def deploy(project_id: str, body: DeployRequest) -> DeployResponse:
    """
    Trigger a deployment for a project.

    Guards:
    - 409 if the linked spec is not in APPROVED state (BL-SDD-03, edge case E1).

    On success:
    - Creates a RunRecord (status=RUNNING).
    - Simulates QA pipeline steps (DEMO_MODE) or runs real pipeline.
    - Updates the RunRecord with final status and deployment URL.
    """
    # ── BL-SDD-03 lock enforcement ────────────────────────────────────────────
    if not spec_generator.is_approved(body.feature_id):
        raise HTTPException(
            status_code=409,
            detail="Specs must be approved before execution. "
                   "Call POST /api/v1/specs/approve first.",
        )

    # ── Create a RUNNING run record ───────────────────────────────────────────
    record = run_store.create_run(project_id)
    start = datetime.now(timezone.utc)

    if DEMO_MODE:
        # Simulate a passing QA pipeline for demo purposes
        await asyncio.sleep(0)   # yield to event loop (non-blocking)
        qa_steps = [
            QAStepResult(
                step_name="ESLint",
                status="PASSED",
                duration_ms=3200,
                log_output="✓ No linting errors found.",
            ),
            QAStepResult(
                step_name="Pytest",
                status="PASSED",
                duration_ms=9800,
                log_output="========== 24 passed in 9.78s ==========",
            ),
            QAStepResult(
                step_name="IBM Watsonx Security",
                status="PASSED",
                duration_ms=5400,
                log_output="✓ Security audit complete. No vulnerabilities detected.",
            ),
        ]
        deployment_url = f"https://{project_id}.trycloudflare.com"
        final_status = "PASSED"
    else:
        # Real pipeline hook — replace with actual IBM Bob subagent dispatch
        raise NotImplementedError(
            "Real deploy pipeline not yet implemented. Set DEMO_MODE=true."
        )

    elapsed_ms = int(
        (datetime.now(timezone.utc) - start).total_seconds() * 1000
    )

    # ── Update run record to final state ──────────────────────────────────────
    updated = run_store.update_run(
        project_id=project_id,
        run_id=record.run_id,
        status=final_status,
        duration_ms=elapsed_ms,
        qa_steps=qa_steps,
        deployment_url=deployment_url,
    )

    return DeployResponse(
        project_id=project_id,
        run_id=record.run_id,
        run_number=record.run_number,
        status=final_status,
        deployment_url=deployment_url,
        message=f"Deploy complete. App live at {deployment_url}",
    )
