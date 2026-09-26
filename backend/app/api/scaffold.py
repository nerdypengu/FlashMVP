"""
BL-ARC-01 + BL-ARC-02 API Routes
POST /api/v1/projects/scaffold          — scaffold a new project from a starter template
POST /api/v1/projects/{id}/parse-manifest — parse the project's flashmvp.json manifest
"""
from fastapi import APIRouter

from app.schemas.manifest import ParsedManifest
from app.schemas.project import ScaffoldRequest, ScaffoldResponse, IBMBinding
from app.services import manifest_parser, template_service

router = APIRouter(prefix="/api/v1/projects", tags=["Expandable Architecture"])


@router.post("/scaffold", response_model=ScaffoldResponse, status_code=201)
async def scaffold_project(body: ScaffoldRequest) -> ScaffoldResponse:
    """
    BL-ARC-01: Scaffold a full-stack project from a starter IBM-ready template.
    Embeds flashmvp.json, initializes Git repository, returns scaffolded path.
    """
    result = await template_service.scaffold_project(
        project_id=body.project_id,
        template=body.template,
        prompt=body.prompt,
    )
    return ScaffoldResponse(
        project_id=result["project_id"],
        template=result["template"],
        scaffolded_path=result["scaffolded_path"],
        ibm_bindings=IBMBinding(**result["ibm_bindings"]),
        git_initialized=result["git_initialized"],
        status=result["status"],
    )


@router.post("/{project_id}/parse-manifest", response_model=ParsedManifest)
async def parse_project_manifest(project_id: str) -> ParsedManifest:
    """
    BL-ARC-02: Parse the flashmvp.json manifest for a scaffolded project.
    Extracts IBM service bindings, service definitions, and QA pipeline steps.
    Returns VALID manifest or INVALID with error message.
    """
    return manifest_parser.parse_manifest(project_id)
