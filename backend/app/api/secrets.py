"""
BL-INF-02 — Encrypted Secrets Vault API Routes
POST   /api/v1/projects/{project_id}/secrets              — store a secret
GET    /api/v1/projects/{project_id}/secrets              — list secrets (masked)
DELETE /api/v1/projects/{project_id}/secrets/{key}        — remove a secret
"""
from typing import List

from fastapi import APIRouter, HTTPException

from app.bob import skill_secrets_vault
from app.schemas.secret import SecretCreateRequest, SecretDeleteResponse, SecretResponse

router = APIRouter(prefix="/api/v1/projects/{project_id}/secrets", tags=["Secrets Vault"])


@router.post("", response_model=SecretResponse, status_code=201)
async def store_secret(project_id: str, body: SecretCreateRequest) -> SecretResponse:
    """
    BL-INF-02: Store an encrypted environment variable in the IBM Secrets vault.
    Returns a masked response — the raw value is never echoed back.
    """
    result = skill_secrets_vault.store_secret(
        project_id=project_id,
        key=body.key,
        value=body.value,
        scope=body.scope,
    )
    return SecretResponse(**result)


@router.get("", response_model=List[SecretResponse])
async def list_secrets(project_id: str) -> List[SecretResponse]:
    """List all secrets for a project (masked values only)."""
    return [SecretResponse(**s) for s in skill_secrets_vault.list_secrets(project_id)]


@router.delete("/{key}", response_model=SecretDeleteResponse)
async def delete_secret(project_id: str, key: str) -> SecretDeleteResponse:
    """Remove a secret from the vault."""
    deleted = skill_secrets_vault.delete_secret(project_id, key)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Secret '{key}' not found for project '{project_id}'.")
    return SecretDeleteResponse(project_id=project_id, key=key, deleted=True)
