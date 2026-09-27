from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class AppCatalogItem(BaseModel):
    project_id: str           # "proj_8f92a"
    app_name: str             # "E-Commerce Store"
    template: str             # "react-fastapi"
    status: str               # "RUNNING" | "STOPPED" | "CRASHED"
    public_url: Optional[str] # "https://app-8f92a.trycloudflare.com"
    deployed_at: datetime
    owner: str                # "alice@ibm.com"
    ibm_region: str           # "us-south"


class AccessControlRequest(BaseModel):
    project_id: str
    user_email: str
    role: str                 # "Super Admin" | "Developer" | "Viewer" | "Revoked"


class AccessControlResponse(BaseModel):
    project_id: str
    user_email: str
    role: str
    updated: bool
