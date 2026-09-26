"""
BL-QA-01 — QA Pipeline API Route
POST /api/v1/projects/{project_id}/qa/run

Triggers the bob-skill-watsonx-qa pipeline (ESLint + Pytest + IBM Watsonx Security Scan).
Creates a RunRecord in run_store so the result is visible in the run history.
Returns deploy_unlocked=true when all steps pass.
"""
from fastapi import APIRouter, HTTPException

from app.bob import skill_watsonx_qa
from app.schemas.qa import QARunRequest, QARunResponse, QAStepResult
from app.schemas.run import QAStepResult as RunQAStepResult
from app.services import run_store

router = APIRouter(prefix="/api/v1/projects", tags=["QA Pipeline"])


@router.post("/{project_id}/qa/run", response_model=QARunResponse)
async def run_qa(project_id: str, body: QARunRequest) -> QARunResponse:
    """
    Trigger the QA pipeline for a project.

    Steps (in order):
      1. ESLint       — frontend source linting
      2. Pytest       — backend test suite
      3. IBM Watsonx  — AI security scan (skipped if lint/test fails)

    Returns a QARunResponse with:
    - Individual step results (status, duration, log output)
    - overall_status: "PASSED" | "FAILED"
    - deploy_unlocked: true only when overall_status == "PASSED"

    A RunRecord is created in the run history store so the result
    is visible via GET /api/v1/projects/{id}/runs.
    """
    # Create a RUNNING record at start
    record = run_store.create_run(project_id)

    # Execute the QA pipeline via IBM Bob skill_watsonx_qa
    raw_steps = await skill_watsonx_qa.execute_qa_pipeline(
        project_id=project_id,
        project_path=".",   # resolved per-project in live mode
    )

    # Map raw dicts to QAStepResult schema
    qa_steps = [QAStepResult(**s) for s in raw_steps]

    # Determine overall status
    failed = any(s.status == "FAILED" for s in qa_steps)
    overall_status = "FAILED" if failed else "PASSED"
    deploy_unlocked = overall_status == "PASSED"

    # Compute total duration
    total_ms = sum(s.duration_ms for s in qa_steps)

    # Update the RunRecord with final results
    run_store.update_run(
        project_id=project_id,
        run_id=record.run_id,
        status=overall_status,
        duration_ms=total_ms,
        qa_steps=[
            RunQAStepResult(
                step_name=s.step_name,
                status=s.status,
                duration_ms=s.duration_ms,
                log_output=s.log_output,
            )
            for s in qa_steps
        ],
        deployment_url=None,
    )

    return QARunResponse(
        run_id=record.run_id,
        project_id=project_id,
        overall_status=overall_status,
        steps=qa_steps,
        deploy_unlocked=deploy_unlocked,
    )
