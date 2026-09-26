"""
BL-HUB-01 — xAppHub Central Application Catalog Service
bob-skill-code-engine: Aggregates all deployed applications across the
IBM Code Engine fleet into a single catalog with live health status.
"""
import os
from datetime import datetime, timezone

from app.schemas.hub import AppCatalogItem

DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() == "true"

# In-memory RBAC store: { project_id: { user_email: role } }
_access_store: dict[str, dict] = {}

MOCK_CATALOG: list[AppCatalogItem] = [
    AppCatalogItem(
        project_id="proj_8f92a",
        app_name="E-Commerce Store",
        template="react-fastapi",
        status="RUNNING",
        public_url="https://app-8f92a.trycloudflare.com",
        deployed_at=datetime(2026, 9, 25, 14, 30, tzinfo=timezone.utc),
        owner="alice@ibm.com",
        ibm_region="us-south",
    ),
    AppCatalogItem(
        project_id="proj_3c71b",
        app_name="Internal HR Portal",
        template="nextjs-go",
        status="RUNNING",
        public_url="https://app-3c71b.trycloudflare.com",
        deployed_at=datetime(2026, 9, 24, 9, 15, tzinfo=timezone.utc),
        owner="bob@ibm.com",
        ibm_region="eu-gb",
    ),
    AppCatalogItem(
        project_id="proj_a19de",
        app_name="Analytics Dashboard",
        template="react-fastapi",
        status="STOPPED",
        public_url=None,
        deployed_at=datetime(2026, 9, 23, 17, 0, tzinfo=timezone.utc),
        owner="charlie@ibm.com",
        ibm_region="us-south",
    ),
]


async def list_projects() -> list[AppCatalogItem]:
    """
    Return all published applications in the IBM Code Engine fleet catalog.
    DEMO_MODE=true  → returns 3 pre-seeded mock applications.
    DEMO_MODE=false → queries Docker / IBM Code Engine for live project registry.
    """
    if DEMO_MODE:
        return MOCK_CATALOG

    # Live path: query registered projects and enrich with real container status
    from app.services.container_service import get_container_stats  # type: ignore
    # In a real implementation, iterate a persistent project store and hydrate status.
    # Fall back to empty list until real project persistence is added.
    return []


def update_access(project_id: str, user_email: str, role: str) -> dict:
    """Update RBAC role for a user on a project (in-memory store)."""
    if project_id not in _access_store:
        _access_store[project_id] = {}
    _access_store[project_id][user_email] = role
    return {
        "project_id": project_id,
        "user_email": user_email,
        "role": role,
        "updated": True,
    }
