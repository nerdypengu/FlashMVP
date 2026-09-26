"""Read the QA stages produced by Bob in the project's flashmvp.json."""
import json
import os
import re
from pathlib import Path

from fastapi import HTTPException
from pydantic import ValidationError

from app.schemas.manifest import QAPipelineStage


def get_pipeline(project_id: str, demo: bool = False) -> list[QAPipelineStage]:
    if not re.fullmatch(r"[A-Za-z0-9_-]+", project_id):
        raise HTTPException(400, "Invalid project ID.")
    root = Path(__file__).resolve().parents[2]
    path = Path(os.getenv("FLASHMVP_PROJECTS_DIR", "/tmp/flashmvp")) / project_id / "flashmvp.json"
    if demo and not path.is_file():
        path = root / "templates/react-fastapi/flashmvp.json"
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
        stages = [QAPipelineStage.model_validate(item) for item in raw["qa_pipeline"]]
    except FileNotFoundError:
        raise HTTPException(404, "Bob's flashmvp.json is not available for this project.") from None
    except (OSError, ValueError, KeyError, TypeError, ValidationError):
        raise HTTPException(422, "Bob's qa_pipeline must contain stages with file patterns.") from None
    if not stages or len({stage.stage for stage in stages}) != len(stages):
        raise HTTPException(422, "Bob's qa_pipeline needs unique, nonempty stages.")
    return stages
