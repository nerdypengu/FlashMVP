from pydantic import BaseModel
from typing import List, Optional


class TaskItem(BaseModel):
    id: str
    description: str
    completed: bool = False


class IBMToolBinding(BaseModel):
    code_engine: bool = True       # IBM Cloud Code Engine deployment
    cloud_db: bool = True          # IBM Cloud Databases for PostgreSQL
    secrets_vault: bool = True     # IBM Secrets Manager
    watsonx_qa: bool = True        # IBM Watsonx Security Audit


class SpecGenerateRequest(BaseModel):
    prompt: str                    # e.g. "Build an e-commerce store with Stripe"
    template: str                  # e.g. "react-fastapi" | "nextjs-go"
    feedback: Optional[str] = None # Revision feedback: "Use PostgreSQL not MongoDB"


class ApproveRequest(BaseModel):
    feature_id: str


class ApproveResponse(BaseModel):
    feature_id: str
    status: str    # "APPROVED"
    locked: bool   # True — deployment pipeline now unlocked


class ReviseRequest(BaseModel):
    feature_id: str
    feedback: str          # "Change the DB to MongoDB instead of PostgreSQL"
    sections: List[str]    # ["requirements"] | ["design"] | ["tasks"] | ["all"]


class SpecResponse(BaseModel):
    feature_id: str
    status: str    # DRAFTING | AWAITING_APPROVAL | CHANGES_REQUESTED | APPROVED
    requirements: str
    design: str
    tasks: List[TaskItem]
    ibm_bindings: IBMToolBinding
