from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class QAStepResult(BaseModel):
    step_name: str      # "ESLint" | "Pytest" | "IBM Watsonx Security"
    status: str         # "PASSED" | "FAILED" | "SKIPPED"
    duration_ms: int
    log_output: str     # Captured stdout/stderr


class RunRecord(BaseModel):
    run_id: str
    project_id: str
    run_number: int
    status: str         # "PASSED" | "FAILED" | "RUNNING"
    triggered_at: datetime
    duration_ms: int
    qa_steps: List[QAStepResult]
    deployment_url: Optional[str] = None   # IBM Code Engine URL if deploy passed
