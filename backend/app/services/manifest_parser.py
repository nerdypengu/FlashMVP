"""
BL-ARC-02 — flashmvp.json Manifest Parser
bob-skill-manifest-parser (infra layer): Reads and validates the flashmvp.json
embedded in a scaffolded project template.
Returns a ParsedManifest that gates all downstream IBM Bob skills.
"""
import json
import os

from app.schemas.manifest import (
    IBMBindings,
    ParsedManifest,
    QAPipelineStep,
    ServiceDefinition,
)

DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() == "true"

MOCK_MANIFEST = ParsedManifest(
    project_id="proj_8f92a",
    app_name="react-fastapi",
    template="react-fastapi",
    ibm_bindings=IBMBindings(),
    services=[
        ServiceDefinition(name="frontend", dockerfile="Dockerfile.frontend", port=3000),
        ServiceDefinition(name="backend", dockerfile="Dockerfile.backend", port=8000),
    ],
    qa_pipeline=[
        QAPipelineStep(id="lint", name="ESLint", command="npm run lint"),
        QAPipelineStep(id="test", name="Pytest", command="pytest"),
        QAPipelineStep(
            id="security",
            name="IBM Watsonx Security Scan",
            command="bob skill watsonx-qa --scan",
        ),
    ],
    status="VALID",
)


def parse_manifest(project_id: str, manifest_path: str = "") -> ParsedManifest:
    """
    Parse a flashmvp.json manifest file for a given project.
    DEMO_MODE=true  → returns MOCK_MANIFEST (no filesystem reads).
    DEMO_MODE=false → reads from manifest_path, validates, and returns ParsedManifest.
    """
    if DEMO_MODE:
        return MOCK_MANIFEST.model_copy(update={"project_id": project_id})

    # Live path: resolve default manifest location if not provided
    if not manifest_path:
        manifest_path = f"/tmp/flashmvp/{project_id}/flashmvp.json"

    if not os.path.isfile(manifest_path):
        return ParsedManifest(
            project_id=project_id,
            app_name="unknown",
            template="unknown",
            ibm_bindings=IBMBindings(),
            services=[],
            qa_pipeline=[],
            status="INVALID",
            error=f"flashmvp.json not found at {manifest_path}",
        )

    try:
        with open(manifest_path, "r", encoding="utf-8") as f:
            raw = json.load(f)
    except (json.JSONDecodeError, OSError) as exc:
        return ParsedManifest(
            project_id=project_id,
            app_name="unknown",
            template="unknown",
            ibm_bindings=IBMBindings(),
            services=[],
            qa_pipeline=[],
            status="INVALID",
            error=str(exc),
        )

    return ParsedManifest(
        project_id=project_id,
        app_name=raw.get("name", "unknown"),
        template=raw.get("template", "react-fastapi"),
        ibm_bindings=IBMBindings(**raw.get("ibm_bindings", {})),
        services=[ServiceDefinition(**s) for s in raw.get("services", [])],
        qa_pipeline=[QAPipelineStep(**q) for q in raw.get("qa_pipeline", [])],
        status="VALID",
    )
