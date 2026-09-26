"""
BL-HUB-01 — xAppHub Central Application Catalog API Routes
GET  /api/v1/projects         — list all published apps in the IBM fleet catalog
POST /api/v1/hub/access       — update RBAC role for a user on a project
"""
from typing import List

from fastapi import APIRouter

from app.schemas.hub import (
    AccessControlRequest,
    AccessControlResponse,
    AppCatalogItem,
)
from app.services.hub_service import list_projects, update_access

router = APIRouter(tags=["xAppHub Management Portal"])


@router.get("/api/v1/projects", response_model=List[AppCatalogItem])
async def get_catalog() -> List[AppCatalogItem]:
    """
    BL-HUB-01: Return the full IBM Code Engine application catalog.
    DEMO_MODE: 3 pre-seeded IBM apps (E-Commerce Store, HR Portal, Analytics Dashboard).
    Live mode: aggregates real deployed projects with live container health status.
    """
    return await list_projects()


@router.post("/api/v1/hub/access", response_model=AccessControlResponse)
async def update_access_control(req: AccessControlRequest) -> AccessControlResponse:
    """
    BL-HUB-01: Update RBAC role for a user on a specific project.
    Roles: Super Admin | Developer | Viewer | Revoked
    """
    result = update_access(req.project_id, req.user_email, req.role)
    return AccessControlResponse(**result)
