# BL-HUB-01 — IBM Bob `bob-skill-code-engine`: Central Application Catalog API
> **Assigned To:** ☁️ **Person 4** — IBM Cloud Infra & Skill Pack Orchestrator  
> **Feature:** xAppHub Management Portal | **Layer:** Backend  
> **IBM Bob 2.0 Skill:** `bob-skill-code-engine` → IBM Cloud Code Engine Fleet Registry  
> **File:** `server/app/api/hub.py`, `server/app/schemas/hub.py`

---

## 🎯 What This Does

The **xAppHub** is the single-pane-of-glass administrative portal that aggregates all deployed applications across the IBM Code Engine fleet. This backend skill:

1. **Catalog Endpoint** (`GET /api/v1/projects`) — returns metadata for all published applications including live container health status (queried from IBM Code Engine / Docker), their Cloudflare public URLs, and deployment timestamps.
2. **RBAC Access Control** (`POST /api/v1/hub/access`) — updates user permission roles (`Super Admin`, `Developer`, `Viewer`, `Revoked`) for a given project, enforcing governance over who can launch, redeploy, or view each application.

These endpoints are consumed by the frontend [`AppCatalog`](client/src/components/portal/AppCatalog.jsx) and [`AccessControlGrid`](client/src/components/portal/AccessControlGrid.jsx) components (BL-HUB-01 UI and BL-HUB-02 UI, Person 2).

In `DEMO_MODE`, returns a pre-seeded catalog of 3 mock IBM Code Engine applications without querying Docker.

---

## 🗂️ Files to Create

| File | Action | Purpose |
| :--- | :--- | :--- |
| `server/app/api/hub.py` | **CREATE** | Catalog list + RBAC update endpoints |
| `server/app/schemas/hub.py` | **CREATE** | Pydantic models for catalog items and access control |
| `server/app/services/hub_service.py` | **CREATE** | Aggregates project records with live container status from IBM fleet |

---

## 💻 Pydantic Data Contract

```python
# server/app/schemas/hub.py
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class AppCatalogItem(BaseModel):
    project_id: str                  # "proj_8f92a"
    app_name: str                    # "E-Commerce Store"
    template: str                    # "react-fastapi"
    status: str                      # "RUNNING" | "STOPPED" | "CRASHED"
    public_url: Optional[str]        # "https://app-8f92a.trycloudflare.com"
    deployed_at: datetime
    owner: str                       # "dev@example.com"
    ibm_region: str                  # "us-south" (IBM Code Engine region)

class AccessControlRequest(BaseModel):
    project_id: str
    user_email: str
    role: str                        # "Super Admin" | "Developer" | "Viewer" | "Revoked"

class AccessControlResponse(BaseModel):
    project_id: str
    user_email: str
    role: str
    updated: bool
```

---

## 💻 Skill Implementation (DEMO_MODE aware)

```python
# server/app/services/hub_service.py
import os
from datetime import datetime, timezone
from app.schemas.hub import AppCatalogItem

DEMO_MODE = os.getenv("DEMO_MODE", "true") == "true"

MOCK_CATALOG = [
    AppCatalogItem(
        project_id="proj_8f92a",
        app_name="E-Commerce Store",
        template="react-fastapi",
        status="RUNNING",
        public_url="https://app-8f92a.trycloudflare.com",
        deployed_at=datetime(2026, 9, 25, 14, 30, tzinfo=timezone.utc),
        owner="alice@ibm.com",
        ibm_region="us-south"
    ),
    AppCatalogItem(
        project_id="proj_3c71b",
        app_name="Internal HR Portal",
        template="nextjs-go",
        status="RUNNING",
        public_url="https://app-3c71b.trycloudflare.com",
        deployed_at=datetime(2026, 9, 24, 9, 15, tzinfo=timezone.utc),
        owner="bob@ibm.com",
        ibm_region="eu-gb"
    ),
    AppCatalogItem(
        project_id="proj_a19de",
        app_name="Analytics Dashboard",
        template="react-fastapi",
        status="STOPPED",
        public_url=None,
        deployed_at=datetime(2026, 9, 23, 17, 0, tzinfo=timezone.utc),
        owner="charlie@ibm.com",
        ibm_region="us-south"
    ),
]

async def list_projects() -> list:
    if DEMO_MODE:
        return MOCK_CATALOG
    # Live mode: query project store + enrich with real container status from docker_client / IBM Code Engine API
    from app.services.container_service import get_container_stats
    # ... query registered projects and hydrate status from IBM fleet
    return []
```

```python
# server/app/api/hub.py
from fastapi import APIRouter
from typing import List
from app.schemas.hub import AppCatalogItem, AccessControlRequest, AccessControlResponse
from app.services.hub_service import list_projects

router = APIRouter(prefix="/api/v1")

@router.get("/projects", response_model=List[AppCatalogItem])
async def get_catalog():
    return await list_projects()

@router.post("/hub/access", response_model=AccessControlResponse)
async def update_access(req: AccessControlRequest):
    # Persist role update (in-memory store or DB table)
    return AccessControlResponse(
        project_id=req.project_id,
        user_email=req.user_email,
        role=req.role,
        updated=True
    )
```

---

## 📝 Implementation Tasks

1. Create `server/app/schemas/hub.py` with `AppCatalogItem`, `AccessControlRequest`, `AccessControlResponse`.
2. Create `server/app/services/hub_service.py` with `list_projects()` — DEMO_MODE returns `MOCK_CATALOG` (3 pre-seeded IBM apps).
3. Create `server/app/api/hub.py` with both routes.
4. Live mode: enrich catalog with real container status by calling `container_service.get_container_stats()` for each project.
5. Register router in `server/app/main.py`.

---

## 🧪 Testing & Verification

1. Start server: `uvicorn app.main:app --reload --port 8000`
2. **Catalog:** `GET /api/v1/projects`  
   ✅ DEMO_MODE: returns 3 pre-seeded IBM Code Engine apps with `status`, `public_url`, and `ibm_region`.  
   ✅ Live mode: returns real registered project list with live container health.
3. **RBAC:** `POST /api/v1/hub/access`:
   ```json
   { "project_id": "proj_8f92a", "user_email": "dev@example.com", "role": "Developer" }
   ```
   ✅ Returns `{ updated: true }`.
4. ✅ Open Swagger `http://localhost:8000/docs` → verify both endpoints documented.
