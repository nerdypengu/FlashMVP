from pydantic import BaseModel


class ProjectCreateRequest(BaseModel):
    project_id: str    # "proj_8f92a"
    template: str      # "react-fastapi"


class ProjectCreateResponse(BaseModel):
    project_id: str
    schema_name: str        # "app_proj_8f92a"
    execution_time_ms: int  # e.g. 180
    connection_url: str     # masked postgres://...
    status: str             # "SUCCESS" | "FAILED"


class ScaffoldRequest(BaseModel):
    project_id: str
    template: str           # "react-fastapi" | "nextjs-go"
    prompt: str


class IBMBinding(BaseModel):
    ibm_code_engine: bool = True
    ibm_postgres_db: bool = True
    ibm_secrets_manager: bool = True
    ibm_watsonx_qa: bool = True


class ScaffoldResponse(BaseModel):
    project_id: str
    template: str
    scaffolded_path: str     # "/tmp/flashmvp/proj_8f92a"
    ibm_bindings: IBMBinding
    git_initialized: bool
    status: str              # "SUCCESS" | "FAILED"
