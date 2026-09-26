from typing import List
from pydantic import BaseModel


class IBMBindings(BaseModel):
    ibm_code_engine: bool = True
    ibm_postgres_db: bool = True
    ibm_secrets_manager: bool = True
    ibm_watsonx_qa: bool = True


class ServiceDefinition(BaseModel):
    name: str        # "frontend" | "backend"
    dockerfile: str  # "Dockerfile.frontend"
    port: int        # 3000 | 8000


class QAPipelineStep(BaseModel):
    id: str          # "lint" | "test" | "security"
    name: str        # "ESLint" | "Pytest" | "IBM Watsonx Security Scan"
    command: str     # "npm run lint"


class ParsedManifest(BaseModel):
    project_id: str
    app_name: str
    template: str
    ibm_bindings: IBMBindings
    services: List[ServiceDefinition]
    qa_pipeline: List[QAPipelineStep]
    status: str      # "VALID" | "INVALID"
    error: str = ""  # populated when status == "INVALID"
