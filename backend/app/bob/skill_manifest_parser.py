"""
IBM Bob 2.0 Skill: bob-skill-manifest-parser
Document Understanding Engine — parses developer prompts + flashmvp.json
into a 3-part SDD artifact bundle (Requirements, Design, Tasks).
"""
import json
import os
from pathlib import Path

DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() == "true"

_MOCKS_DIR = Path(__file__).parent.parent / "mocks"


def _load_mock(filename: str) -> dict:
    """Load a JSON fixture from the mocks directory."""
    mock_path = _MOCKS_DIR / filename
    with open(mock_path, "r", encoding="utf-8") as f:
        return json.load(f)


def _build_requirements(prompt: str, template: str, feedback: str | None) -> str:
    """
    Real IBM Bob 2.0 path: generate a Requirements markdown section from
    the developer's natural-language prompt and selected stack template.

    Stub: returns a prompt-aware markdown block so the real API call can
    be dropped in later without touching callers.
    """
    revision_note = f"\n\n> **Revision feedback applied:** {feedback}" if feedback else ""
    return (
        f"# Requirements\n\n"
        f"## Overview\n"
        f"Build the following feature: **{prompt}** using the `{template}` stack template.\n\n"
        f"## Functional Requirements\n"
        f"- FR1: Core feature implementation as described in the prompt.\n"
        f"- FR2: Full-stack integration with IBM Cloud services.\n"
        f"- FR3: Security, authentication, and data validation.\n\n"
        f"## IBM Tool Bindings\n"
        f"- **IBM Cloud Code Engine** — serverless container hosting.\n"
        f"- **IBM Cloud DB (PostgreSQL)** — isolated tenant schema.\n"
        f"- **IBM Secrets Manager** — encrypted API key storage.\n"
        f"- **IBM Watsonx QA** — automated security audit & test runner."
        f"{revision_note}"
    )


def _build_design(prompt: str, template: str, feedback: str | None) -> str:
    """
    Real IBM Bob 2.0 path: generate a Technical Design markdown section.
    Stub: returns a template-aware architecture outline.
    """
    revision_note = f"\n\n> **Revision feedback applied:** {feedback}" if feedback else ""
    return (
        f"# Technical Design\n\n"
        f"## Stack: `{template}`\n\n"
        f"## System Architecture\n"
        f"```\nClient (React + Vite) ──► FastAPI Backend (IBM Code Engine)\n"
        f"                               │\n"
        f"                               ├── IBM Cloud DB (PostgreSQL)\n"
        f"                               └── IBM Secrets Manager\n```\n\n"
        f"## Key Design Decisions\n"
        f"- Feature prompt: \"{prompt}\"\n"
        f"- Isolated database schema per project (`app_{{project_id}}`).\n"
        f"- Secrets injected at runtime — never stored in `.env` files.\n"
        f"- IBM Watsonx security scan runs before every deployment."
        f"{revision_note}"
    )


def _build_tasks(prompt: str, feedback: str | None) -> list[dict]:
    """
    Real IBM Bob 2.0 path: generate ordered execution tasks.
    Stub: returns a generic but usable task list.
    """
    base_tasks = [
        {"id": "task-001", "description": f"Scaffold project structure for: {prompt}", "completed": False},
        {"id": "task-002", "description": "Define database schema and migrations", "completed": False},
        {"id": "task-003", "description": "Implement core backend API endpoints", "completed": False},
        {"id": "task-004", "description": "Integrate IBM Cloud DB (PostgreSQL schema isolation)", "completed": False},
        {"id": "task-005", "description": "Connect IBM Secrets Manager for environment variables", "completed": False},
        {"id": "task-006", "description": "Build frontend React components", "completed": False},
        {"id": "task-007", "description": "Wire frontend to backend API", "completed": False},
        {"id": "task-008", "description": "Write Pytest tests for all API endpoints", "completed": False},
        {"id": "task-009", "description": "Run IBM Watsonx QA audit (ESLint + Pytest + secret scan)", "completed": False},
        {"id": "task-010", "description": "Deploy to IBM Code Engine via FlashMVP one-click deploy", "completed": False},
    ]
    if feedback:
        base_tasks.insert(0, {
            "id": "task-000",
            "description": f"[Revision] Apply feedback: {feedback}",
            "completed": False,
        })
    return base_tasks


async def parse_prompt_to_sdd(
    prompt: str,
    template: str,
    feature_id: str,
    feedback: str | None = None,
) -> dict:
    """
    IBM Bob 2.0 Document Understanding entry point.

    DEMO_MODE=true  → returns the static SDD fixture from mocks/sdd_mock.json
                      (with feature_id swapped in so it matches the caller's state)
    DEMO_MODE=false → calls the real IBM Bob 2.0 Document Understanding API
                      (stub raises NotImplementedError until credentials are wired)
    """
    if DEMO_MODE:
        mock = _load_mock("sdd_mock.json")
        # Override the fixture's feature_id so the spec store key is consistent
        mock["feature_id"] = feature_id
        mock["status"] = "AWAITING_APPROVAL"
        return mock

    # ── Real IBM Bob 2.0 path ─────────────────────────────────────────────
    # Replace the block below with the actual IBM Bob 2.0 API call once
    # credentials and the bob-client package are available:
    #
    #   from bob_client import IBMBobClient
    #   client = IBMBobClient(api_key=os.getenv("IBM_BOB_API_KEY"))
    #   return await client.understand_document(prompt, template, feedback)
    #
    return {
        "feature_id": feature_id,
        "status": "AWAITING_APPROVAL",
        "requirements": _build_requirements(prompt, template, feedback),
        "design": _build_design(prompt, template, feedback),
        "tasks": _build_tasks(prompt, feedback),
        "ibm_bindings": {
            "code_engine": True,
            "cloud_db": True,
            "secrets_vault": True,
            "watsonx_qa": True,
        },
    }
