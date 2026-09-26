from pydantic import BaseModel
from typing import List, Optional


class QARunRequest(BaseModel):
    steps: Optional[List[str]] = None  # None = run all steps from flashmvp.json


class QAStepResult(BaseModel):
    step_id: str      # "lint" | "test" | "security"
    step_name: str    # "ESLint" | "Pytest" | "IBM Watsonx Security Scan"
    status: str       # "PASSED" | "FAILED" | "SKIPPED"
    duration_ms: int
    log_output: str   # Captured stdout/stderr


class QARunResponse(BaseModel):
    run_id: str
    project_id: str
    overall_status: str    # "PASSED" | "FAILED" | "RUNNING"
    steps: List[QAStepResult]
    deploy_unlocked: bool  # True only when overall_status == "PASSED"
