"""
BL-SDD-01 + BL-SDD-03 API Routes
POST /api/v1/specs/generate  — generate a 3-part SDD artifact bundle
GET  /api/v1/specs/{feature_id} — fetch current spec state
POST /api/v1/specs/approve   — lock spec and transition to APPROVED  (BL-SDD-03)
POST /api/v1/specs/revise    — patch sections and set CHANGES_REQUESTED (BL-SDD-03)
"""
from fastapi import APIRouter, HTTPException

from app.schemas.spec import (
    ApproveRequest,
    ApproveResponse,
    ReviseRequest,
    SpecGenerateRequest,
    SpecResponse,
)
from app.services import spec_generator

router = APIRouter(prefix="/api/v1/specs", tags=["Specs-Driven Development"])


# ── BL-SDD-01: Generate ───────────────────────────────────────────────────────

@router.post("/generate", response_model=SpecResponse, status_code=201)
async def generate_spec(body: SpecGenerateRequest) -> SpecResponse:
    """
    Generate a brand-new 3-part SDD artifact bundle (Requirements, Design, Tasks).
    Returns status AWAITING_APPROVAL.
    """
    spec = await spec_generator.generate(prompt=body.prompt, template=body.template)
    return spec


@router.get("/{feature_id}", response_model=SpecResponse)
async def get_spec(feature_id: str) -> SpecResponse:
    """Fetch the current spec state and version snapshot for a given feature_id."""
    spec = spec_generator.get(feature_id)
    if spec is None:
        raise HTTPException(status_code=404, detail=f"Spec '{feature_id}' not found.")
    return spec


# ── BL-SDD-03: Approve & Revise ──────────────────────────────────────────────

@router.post("/approve", response_model=ApproveResponse)
async def approve_spec(body: ApproveRequest) -> ApproveResponse:
    """
    Lock the spec bundle and transition state to APPROVED.
    This unlocks the deployment pipeline.
    Idempotent — re-approving an already APPROVED spec returns the same result (E4).
    """
    try:
        spec = spec_generator.approve(body.feature_id)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Spec '{body.feature_id}' not found.")
    return ApproveResponse(
        feature_id=spec.feature_id,
        status=spec.status,
        locked=True,
    )


@router.post("/revise", response_model=SpecResponse)
async def revise_spec(body: ReviseRequest) -> SpecResponse:
    """
    Re-generate only the requested sections of an existing spec.
    Returns updated spec with status CHANGES_REQUESTED.
    Rejects empty feedback (E2).
    """
    if not body.feedback or not body.feedback.strip():
        raise HTTPException(status_code=400, detail="Feedback instruction required.")

    try:
        spec = await spec_generator.revise(
            feature_id=body.feature_id,
            feedback=body.feedback,
            sections=body.sections,
        )
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Spec '{body.feature_id}' not found.")
    return spec
