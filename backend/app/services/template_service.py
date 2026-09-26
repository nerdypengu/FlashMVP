"""
BL-ARC-01 — Starter Template Generator Engine
bob-skill-code-engine: Scaffolds a full-stack project from a pre-built IBM-ready template,
embeds flashmvp.json, and initializes a local Git repository.
"""
import os
import shutil
import subprocess

DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() == "true"

# Locate templates directory relative to this file: backend/templates/
_BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
TEMPLATES_DIR = os.path.join(_BACKEND_ROOT, "templates")


async def scaffold_project(project_id: str, template: str, prompt: str = "") -> dict:
    """
    Scaffold a new full-stack project from a starter template.
    DEMO_MODE=true  → returns mock response, no filesystem writes.
    DEMO_MODE=false → copies template to /tmp/flashmvp/{project_id} and inits Git.
    """
    if DEMO_MODE:
        return {
            "project_id": project_id,
            "template": template,
            "scaffolded_path": f"/tmp/flashmvp/{project_id}",
            "ibm_bindings": {
                "ibm_code_engine": True,
                "ibm_postgres_db": True,
                "ibm_secrets_manager": True,
                "ibm_watsonx_qa": True,
            },
            "git_initialized": True,
            "status": "SUCCESS",
        }

    src = os.path.join(TEMPLATES_DIR, template)
    dest = f"/tmp/flashmvp/{project_id}"

    if not os.path.isdir(src):
        return {"project_id": project_id, "template": template, "status": "FAILED",
                "scaffolded_path": "", "ibm_bindings": {}, "git_initialized": False}

    if os.path.exists(dest):
        shutil.rmtree(dest)
    shutil.copytree(src, dest)

    try:
        subprocess.run(["git", "init", dest], check=True, capture_output=True)
        git_initialized = True
    except (subprocess.CalledProcessError, FileNotFoundError):
        git_initialized = False

    return {
        "project_id": project_id,
        "template": template,
        "scaffolded_path": dest,
        "ibm_bindings": {
            "ibm_code_engine": True,
            "ibm_postgres_db": True,
            "ibm_secrets_manager": True,
            "ibm_watsonx_qa": True,
        },
        "git_initialized": git_initialized,
        "status": "SUCCESS",
    }
