"""
Spec Generator Service
Wraps the IBM Bob skill_manifest_parser and owns the in-memory spec store.
The store maps  feature_id -> SpecResponse  so the approve/revise routes
(BL-SDD-03) can look up and mutate spec state without a database.
"""
import uuid
from typing import Optional

from app.bob.skill_manifest_parser import parse_prompt_to_sdd
from app.schemas.spec import IBMToolBinding, SpecResponse, TaskItem

# In-memory store: { feature_id: SpecResponse }
_spec_store: dict[str, SpecResponse] = {}


def _make_feature_id() -> str:
    """Generate a short unique feature ID in the style of FlashMVP IDs."""
    return f"feat_{uuid.uuid4().hex[:8]}"


async def generate(prompt: str, template: str) -> SpecResponse:
    """
    Generate a brand-new 3-part SDD artifact bundle.
    Always starts in AWAITING_APPROVAL state.
    """
    feature_id = _make_feature_id()
    raw = await parse_prompt_to_sdd(
        prompt=prompt,
        template=template,
        feature_id=feature_id,
    )
    spec = _from_raw(raw)
    _spec_store[feature_id] = spec
    return spec


async def revise(feature_id: str, feedback: str, sections: list[str]) -> SpecResponse:
    """
    Re-generate only the requested sections of an existing spec.
    - sections: subset of ["requirements", "design", "tasks", "all"]
    Returns updated SpecResponse with status CHANGES_REQUESTED.
    """
    existing = _spec_store.get(feature_id)
    if existing is None:
        raise KeyError(feature_id)

    raw = await parse_prompt_to_sdd(
        # Re-use the original prompt embedded in the requirements heading;
        # for a real implementation pass the original prompt through.
        prompt=feedback,
        template="react-fastapi",
        feature_id=feature_id,
        feedback=feedback,
    )

    patch_all = "all" in sections

    updated = existing.model_copy(
        update={
            "status": "CHANGES_REQUESTED",
            "requirements": raw["requirements"] if patch_all or "requirements" in sections else existing.requirements,
            "design": raw["design"] if patch_all or "design" in sections else existing.design,
            "tasks": [TaskItem(**t) for t in raw["tasks"]] if patch_all or "tasks" in sections else existing.tasks,
        }
    )
    _spec_store[feature_id] = updated
    return updated


def approve(feature_id: str) -> SpecResponse:
    """
    Lock the spec into APPROVED state — idempotent if already approved.
    """
    spec = _spec_store.get(feature_id)
    if spec is None:
        raise KeyError(feature_id)
    if spec.status == "APPROVED":
        return spec  # E4: idempotent re-approve
    updated = spec.model_copy(update={"status": "APPROVED"})
    _spec_store[feature_id] = updated
    return updated


def get(feature_id: str) -> Optional[SpecResponse]:
    """Retrieve a spec by its feature_id, or None if not found."""
    return _spec_store.get(feature_id)


def is_approved(feature_id: str) -> bool:
    """Return True only if the spec exists and is in APPROVED state."""
    spec = _spec_store.get(feature_id)
    return spec is not None and spec.status == "APPROVED"


# ── Internal helpers ──────────────────────────────────────────────────────────

def _from_raw(raw: dict) -> SpecResponse:
    """Convert the raw dict returned by the Bob skill into a SpecResponse."""
    return SpecResponse(
        feature_id=raw["feature_id"],
        status=raw["status"],
        requirements=raw["requirements"],
        design=raw["design"],
        tasks=[TaskItem(**t) for t in raw["tasks"]],
        ibm_bindings=IBMToolBinding(**raw["ibm_bindings"]),
    )
