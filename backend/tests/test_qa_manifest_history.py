"""Manifest-backed demo QA runs are recorded per project across SQLite connections."""
import os
import json
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

import pytest
from httpx import ASGITransport, AsyncClient

import main
from app.services import manifest_parser, run_store
from app.api import runs


@pytest.mark.asyncio
async def test_qa_pipeline_and_persistent_project_history():
    with TemporaryDirectory() as directory, patch.dict(os.environ, {"FLASHMVP_DEMO_DB": str(Path(directory) / "runs.sqlite3")}):
        async with AsyncClient(transport=ASGITransport(app=main.app), base_url="http://test") as client:
            pipeline = (await client.get("/api/v1/projects/proj_second/qa-pipeline")).json()
            assert [stage["stage"] for stage in pipeline] == ["Unit Tests", "Integration Tests", "E2E Tests"]
            assert pipeline[0]["files"] == ["backend/tests/test_*.py"]

            response = await client.post("/api/v1/projects/proj_second/qa/run", json={"simulate_failure": True})
            assert response.status_code == 200
            run = response.json()
            assert run["run_number"] == 1
            assert run["status"] == "FAILED"
            assert [step["status"] for step in run["qa_steps"]] == ["PASSED", "FAILED", "SKIPPED"]
            assert run["qa_steps"][0]["id"].startswith("Unit Tests:")

            assert (await client.get("/api/v1/projects/proj_second/runs")).json()[0]["run_id"] == run["run_id"]
            assert not any(row["run_id"] == run["run_id"] for row in
                           (await client.get("/api/v1/projects/proj_8f92a/runs")).json())
            assert (await client.get(f"/api/v1/projects/proj_8f92a/runs/{run['run_id']}")).status_code == 404

        assert run_store.get_run("proj_second", run["run_id"]).status == "FAILED"
        assert run_store.get_runs("proj_second")[0].run_id == run["run_id"]


@pytest.mark.asyncio
async def test_pipeline_reads_bob_generated_file():
    with TemporaryDirectory() as directory, patch.dict(os.environ, {"FLASHMVP_PROJECTS_DIR": directory}):
        project = Path(directory) / "proj_bob"
        project.mkdir()
        (project / "flashmvp.json").write_text(json.dumps({"qa_pipeline": [
            {"stage": "Bob checks", "files": ["backend/tests/test_bob.py"]},
        ]}), encoding="utf-8")
        async with AsyncClient(transport=ASGITransport(app=main.app), base_url="http://test") as client:
            response = await client.get("/api/v1/projects/proj_bob/qa-pipeline")
            assert response.status_code == 200
            assert response.json() == [{"stage": "Bob checks", "files": ["backend/tests/test_bob.py"]}]


@pytest.mark.asyncio
async def test_live_manifest_requires_auth_and_cannot_simulate_runs():
    with patch.object(runs.run_store, "DEMO_MODE", False), patch.object(manifest_parser, "DEMO_MODE", False):
        async with AsyncClient(transport=ASGITransport(app=main.app), base_url="http://test") as client:
            assert (await client.get("/api/v1/projects/proj_hidden/qa-pipeline")).status_code == 401
            assert (await client.post("/api/v1/projects/proj_hidden/parse-manifest")).status_code == 401
            assert (await client.post("/api/v1/projects/proj_hidden/qa/run", json={})).status_code == 501


def test_live_manifest_reads_stage_and_legacy_pipeline(tmp_path, monkeypatch):
    manifest = tmp_path / "flashmvp.json"
    manifest.write_text(json.dumps({
        "name": "example", "template": "react-fastapi", "services": [],
        "qa_pipeline": [
            {"stage": "Unit Tests", "files": ["tests/test_*.py"]},
            {"id": "lint", "name": "ESLint", "command": "npm run lint"},
        ],
    }), encoding="utf-8")
    monkeypatch.setattr(manifest_parser, "DEMO_MODE", False)

    parsed = manifest_parser.parse_manifest("proj_example", str(manifest))

    assert parsed.status == "VALID"
    assert parsed.qa_pipeline[0].stage == "Unit Tests"
    assert parsed.qa_pipeline[1].command == "npm run lint"
