# FlashMVP Backend — Full Unit Test Suite
# Covers all API routes and service layer edge cases.
#
# Run with:
#   cd backend
#   .venv/Scripts/pytest tests/ -v
#
# All tests run against the real FastAPI app via httpx AsyncClient + ASGITransport.
# DEMO_MODE is forced true — no real DB / Docker / Supabase connections are made.

import os

# Force DEMO_MODE before any app module is imported
os.environ["DEMO_MODE"] = "true"

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

import main  # noqa: E402 — must be after os.environ patch


# ── Shared async client fixture ───────────────────────────────────────────────

@pytest_asyncio.fixture
async def client():
    """Async HTTP client wired directly to the FastAPI app (no real network)."""
    async with AsyncClient(
        transport=ASGITransport(app=main.app),
        base_url="http://test",
    ) as c:
        yield c


# =============================================================================
# ROOT
# =============================================================================

class TestRoot:
    async def test_root_ok(self, client):
        r = await client.get("/")
        assert r.status_code == 200

    async def test_root_status_field(self, client):
        r = await client.get("/")
        assert r.json()["status"] == "ok"

    async def test_root_powered_by_ibm(self, client):
        r = await client.get("/")
        assert "IBM Bob 2.0" in r.json()["powered_by"]


# =============================================================================
# BL-SDD-01 — Spec Generation
# =============================================================================

class TestSpecGenerate:
    async def test_generate_returns_201(self, client):
        r = await client.post("/api/v1/specs/generate", json={
            "prompt": "E-commerce store with Stripe",
            "template": "react-fastapi",
        })
        assert r.status_code == 201

    async def test_generate_returns_required_fields(self, client):
        r = await client.post("/api/v1/specs/generate", json={
            "prompt": "Todo app",
            "template": "react-fastapi",
        })
        body = r.json()
        for field in ["feature_id", "status", "requirements", "design", "tasks", "ibm_bindings"]:
            assert field in body, f"Missing field: {field}"

    async def test_generate_status_is_awaiting_approval(self, client):
        r = await client.post("/api/v1/specs/generate", json={
            "prompt": "Blog platform",
            "template": "nextjs-go",
        })
        assert r.json()["status"] == "AWAITING_APPROVAL"

    async def test_generate_tasks_is_list(self, client):
        r = await client.post("/api/v1/specs/generate", json={
            "prompt": "Task manager",
            "template": "react-fastapi",
        })
        assert isinstance(r.json()["tasks"], list)

    async def test_generate_missing_prompt_returns_422(self, client):
        r = await client.post("/api/v1/specs/generate", json={
            "template": "react-fastapi",
        })
        assert r.status_code == 422

    async def test_generate_missing_template_returns_422(self, client):
        r = await client.post("/api/v1/specs/generate", json={
            "prompt": "Some app",
        })
        assert r.status_code == 422

    async def test_generate_empty_body_returns_422(self, client):
        r = await client.post("/api/v1/specs/generate", json={})
        assert r.status_code == 422

    async def test_generate_each_call_gets_unique_feature_id(self, client):
        r1 = await client.post("/api/v1/specs/generate", json={
            "prompt": "App A", "template": "react-fastapi",
        })
        r2 = await client.post("/api/v1/specs/generate", json={
            "prompt": "App B", "template": "react-fastapi",
        })
        assert r1.json()["feature_id"] != r2.json()["feature_id"]


# =============================================================================
# BL-SDD-01 — Spec Retrieval
# =============================================================================

class TestSpecGet:
    async def test_get_existing_spec(self, client):
        gen = await client.post("/api/v1/specs/generate", json={
            "prompt": "CRM tool", "template": "react-fastapi",
        })
        fid = gen.json()["feature_id"]
        r = await client.get(f"/api/v1/specs/{fid}")
        assert r.status_code == 200
        assert r.json()["feature_id"] == fid

    async def test_get_nonexistent_spec_returns_404(self, client):
        r = await client.get("/api/v1/specs/feat_doesnotexist")
        assert r.status_code == 404


# =============================================================================
# BL-SDD-03 — Spec Approval
# =============================================================================

class TestSpecApprove:
    async def _create_spec(self, client) -> str:
        r = await client.post("/api/v1/specs/generate", json={
            "prompt": "Analytics dashboard", "template": "react-fastapi",
        })
        return r.json()["feature_id"]

    async def test_approve_transitions_to_approved(self, client):
        fid = await self._create_spec(client)
        r = await client.post("/api/v1/specs/approve", json={"feature_id": fid})
        assert r.status_code == 200
        assert r.json()["status"] == "APPROVED"

    async def test_approve_locked_is_true(self, client):
        fid = await self._create_spec(client)
        r = await client.post("/api/v1/specs/approve", json={"feature_id": fid})
        assert r.json()["locked"] is True

    async def test_approve_unknown_feature_id_returns_404(self, client):
        r = await client.post("/api/v1/specs/approve", json={"feature_id": "feat_ghost"})
        assert r.status_code == 404

    async def test_approve_is_idempotent(self, client):
        """E4 — re-approving an already-approved spec returns same result."""
        fid = await self._create_spec(client)
        await client.post("/api/v1/specs/approve", json={"feature_id": fid})
        r2 = await client.post("/api/v1/specs/approve", json={"feature_id": fid})
        assert r2.status_code == 200
        assert r2.json()["status"] == "APPROVED"

    async def test_approve_persists_in_get(self, client):
        fid = await self._create_spec(client)
        await client.post("/api/v1/specs/approve", json={"feature_id": fid})
        r = await client.get(f"/api/v1/specs/{fid}")
        assert r.json()["status"] == "APPROVED"


# =============================================================================
# BL-SDD-03 — Spec Revision
# =============================================================================

class TestSpecRevise:
    async def _create_spec(self, client) -> str:
        r = await client.post("/api/v1/specs/generate", json={
            "prompt": "HR portal", "template": "nextjs-go",
        })
        return r.json()["feature_id"]

    async def test_revise_returns_changes_requested(self, client):
        fid = await self._create_spec(client)
        r = await client.post("/api/v1/specs/revise", json={
            "feature_id": fid,
            "feedback": "Use MongoDB instead of PostgreSQL",
            "sections": ["requirements"],
        })
        assert r.status_code == 200
        assert r.json()["status"] == "CHANGES_REQUESTED"

    async def test_revise_empty_feedback_returns_400(self, client):
        fid = await self._create_spec(client)
        r = await client.post("/api/v1/specs/revise", json={
            "feature_id": fid, "feedback": "", "sections": ["all"],
        })
        assert r.status_code == 400

    async def test_revise_whitespace_only_feedback_returns_400(self, client):
        fid = await self._create_spec(client)
        r = await client.post("/api/v1/specs/revise", json={
            "feature_id": fid, "feedback": "   ", "sections": ["all"],
        })
        assert r.status_code == 400

    async def test_revise_unknown_feature_id_returns_404(self, client):
        r = await client.post("/api/v1/specs/revise", json={
            "feature_id": "feat_nobody",
            "feedback": "Add dark mode",
            "sections": ["design"],
        })
        assert r.status_code == 404

    async def test_revise_all_sections(self, client):
        fid = await self._create_spec(client)
        r = await client.post("/api/v1/specs/revise", json={
            "feature_id": fid, "feedback": "Rewrite everything", "sections": ["all"],
        })
        assert r.status_code == 200


# =============================================================================
# BL-INF-01 — Project Create
# =============================================================================

class TestProjectCreate:
    async def test_create_returns_201(self, client):
        r = await client.post("/api/v1/projects/create", json={
            "project_id": "proj_test01", "template": "react-fastapi",
        })
        assert r.status_code == 201

    async def test_create_correct_schema_name(self, client):
        r = await client.post("/api/v1/projects/create", json={
            "project_id": "proj_abc", "template": "react-fastapi",
        })
        assert r.json()["schema_name"] == "app_proj_abc"

    async def test_create_status_success(self, client):
        r = await client.post("/api/v1/projects/create", json={
            "project_id": "proj_stat", "template": "react-fastapi",
        })
        assert r.json()["status"] == "SUCCESS"

    async def test_create_execution_time_under_200ms_in_demo(self, client):
        r = await client.post("/api/v1/projects/create", json={
            "project_id": "proj_speed", "template": "react-fastapi",
        })
        assert r.json()["execution_time_ms"] <= 200

    async def test_create_connection_url_is_masked(self, client):
        r = await client.post("/api/v1/projects/create", json={
            "project_id": "proj_mask", "template": "react-fastapi",
        })
        assert "****" in r.json()["connection_url"]

    async def test_create_missing_project_id_returns_422(self, client):
        r = await client.post("/api/v1/projects/create", json={
            "template": "react-fastapi",
        })
        assert r.status_code == 422

    async def test_create_missing_template_returns_422(self, client):
        r = await client.post("/api/v1/projects/create", json={
            "project_id": "proj_notemp",
        })
        assert r.status_code == 422


# =============================================================================
# BL-INF-02 — Secrets Vault
# =============================================================================

class TestSecretsVault:
    _PID = "proj_secrets_test"

    async def test_store_secret_returns_201(self, client):
        r = await client.post(f"/api/v1/projects/{self._PID}/secrets", json={
            "key": "OPENAI_KEY", "value": "sk-test-123", "scope": "BACKEND",
        })
        assert r.status_code == 201

    async def test_store_secret_value_is_masked(self, client):
        r = await client.post(f"/api/v1/projects/{self._PID}/secrets", json={
            "key": "STRIPE_KEY", "value": "sk-live-supersecret", "scope": "ALL",
        })
        assert "sk-live-supersecret" not in r.json()["masked_value"]
        assert "****" in r.json()["masked_value"]

    async def test_store_secret_status_is_stored(self, client):
        r = await client.post(f"/api/v1/projects/{self._PID}/secrets", json={
            "key": "JWT_SECRET", "value": "mysecret", "scope": "BACKEND",
        })
        assert r.json()["status"] == "STORED"

    async def test_list_secrets_does_not_expose_raw_values(self, client):
        await client.post(f"/api/v1/projects/{self._PID}/secrets", json={
            "key": "SUPER_SECRET", "value": "plaintext-password", "scope": "ALL",
        })
        r = await client.get(f"/api/v1/projects/{self._PID}/secrets")
        assert r.status_code == 200
        assert "plaintext-password" not in str(r.json())

    async def test_list_secrets_returns_list(self, client):
        r = await client.get(f"/api/v1/projects/{self._PID}/secrets")
        assert isinstance(r.json(), list)

    async def test_delete_existing_secret(self, client):
        pid = "proj_delete_test"
        await client.post(f"/api/v1/projects/{pid}/secrets", json={
            "key": "TO_DELETE", "value": "bye", "scope": "ALL",
        })
        r = await client.delete(f"/api/v1/projects/{pid}/secrets/TO_DELETE")
        assert r.status_code == 200
        assert r.json()["deleted"] is True

    async def test_delete_nonexistent_secret_returns_404(self, client):
        r = await client.delete(f"/api/v1/projects/{self._PID}/secrets/GHOST_KEY")
        assert r.status_code == 404

    async def test_invalid_scope_returns_422(self, client):
        r = await client.post(f"/api/v1/projects/{self._PID}/secrets", json={
            "key": "BAD_SCOPE", "value": "val", "scope": "INVALID_SCOPE",
        })
        assert r.status_code == 422


# =============================================================================
# BL-ARC-01 — Scaffold
# =============================================================================

class TestScaffold:
    async def test_scaffold_returns_201(self, client):
        r = await client.post("/api/v1/projects/scaffold", json={
            "project_id": "proj_scaffold01",
            "template": "react-fastapi",
            "prompt": "E-commerce store",
        })
        assert r.status_code == 201

    async def test_scaffold_status_success(self, client):
        r = await client.post("/api/v1/projects/scaffold", json={
            "project_id": "proj_scaffold02",
            "template": "nextjs-go",
            "prompt": "Blog",
        })
        assert r.json()["status"] == "SUCCESS"

    async def test_scaffold_git_initialized(self, client):
        r = await client.post("/api/v1/projects/scaffold", json={
            "project_id": "proj_scaffold03",
            "template": "react-fastapi",
            "prompt": "Test",
        })
        assert r.json()["git_initialized"] is True

    async def test_scaffold_ibm_bindings_all_true(self, client):
        r = await client.post("/api/v1/projects/scaffold", json={
            "project_id": "proj_scaffold04",
            "template": "react-fastapi",
            "prompt": "Test",
        })
        bindings = r.json()["ibm_bindings"]
        assert bindings["ibm_code_engine"] is True
        assert bindings["ibm_postgres_db"] is True
        assert bindings["ibm_secrets_manager"] is True
        assert bindings["ibm_watsonx_qa"] is True

    async def test_scaffold_path_contains_project_id(self, client):
        r = await client.post("/api/v1/projects/scaffold", json={
            "project_id": "proj_path_check",
            "template": "react-fastapi",
            "prompt": "Path test",
        })
        assert "proj_path_check" in r.json()["scaffolded_path"]

    async def test_scaffold_missing_project_id_returns_422(self, client):
        r = await client.post("/api/v1/projects/scaffold", json={
            "template": "react-fastapi", "prompt": "Missing id",
        })
        assert r.status_code == 422


# =============================================================================
# BL-ARC-02 — Manifest Parse
# =============================================================================

class TestManifestParse:
    async def test_parse_returns_200(self, client):
        r = await client.post("/api/v1/projects/proj_manifest01/parse-manifest")
        assert r.status_code == 200

    async def test_parse_returns_valid_status(self, client):
        r = await client.post("/api/v1/projects/proj_manifest02/parse-manifest")
        assert r.json()["status"] == "VALID"

    async def test_parse_returns_services(self, client):
        r = await client.post("/api/v1/projects/proj_manifest03/parse-manifest")
        services = r.json()["services"]
        assert len(services) >= 1
        assert all("name" in s and "port" in s for s in services)

    async def test_parse_returns_qa_pipeline(self, client):
        r = await client.post("/api/v1/projects/proj_manifest04/parse-manifest")
        qa = r.json()["qa_pipeline"]
        assert len(qa) >= 1
        assert all("id" in step and "command" in step for step in qa)

    async def test_parse_project_id_echoed(self, client):
        r = await client.post("/api/v1/projects/proj_manifest05/parse-manifest")
        assert r.json()["project_id"] == "proj_manifest05"


# =============================================================================
# BL-QA-03 — Run History
# =============================================================================

class TestRunHistory:
    async def test_list_runs_returns_200(self, client):
        r = await client.get("/api/v1/projects/proj_8f92a/runs")
        assert r.status_code == 200

    async def test_list_runs_returns_list(self, client):
        r = await client.get("/api/v1/projects/proj_8f92a/runs")
        assert isinstance(r.json(), list)

    async def test_list_runs_seeded_demo_has_five(self, client):
        r = await client.get("/api/v1/projects/proj_8f92a/runs")
        assert len(r.json()) >= 5

    async def test_list_runs_sorted_descending(self, client):
        r = await client.get("/api/v1/projects/proj_8f92a/runs")
        timestamps = [run["triggered_at"] for run in r.json()]
        assert timestamps == sorted(timestamps, reverse=True)

    async def test_list_runs_unknown_project_returns_demo_seed(self, client):
        """DEMO_MODE: unknown project_id falls back to seeded runs."""
        r = await client.get("/api/v1/projects/proj_totally_unknown/runs")
        assert r.status_code == 200
        assert len(r.json()) > 0

    async def test_get_single_run_ok(self, client):
        r = await client.get("/api/v1/projects/proj_8f92a/runs/run-005")
        assert r.status_code == 200
        assert r.json()["run_id"] == "run-005"

    async def test_get_single_run_has_qa_steps(self, client):
        r = await client.get("/api/v1/projects/proj_8f92a/runs/run-005")
        steps = r.json()["qa_steps"]
        assert len(steps) == 3
        assert all("step_name" in s and "status" in s for s in steps)

    async def test_get_nonexistent_run_returns_404(self, client):
        r = await client.get("/api/v1/projects/proj_8f92a/runs/run-999")
        assert r.status_code == 404

    async def test_run_record_has_all_required_fields(self, client):
        r = await client.get("/api/v1/projects/proj_8f92a/runs/run-001")
        body = r.json()
        for field in ["run_id", "project_id", "run_number", "status",
                      "triggered_at", "duration_ms", "qa_steps"]:
            assert field in body, f"Missing field: {field}"

    async def test_seeded_runs_contain_passed_and_failed(self, client):
        r = await client.get("/api/v1/projects/proj_8f92a/runs")
        statuses = {run["status"] for run in r.json()}
        assert "PASSED" in statuses
        assert "FAILED" in statuses


# =============================================================================
# BL-SDD-03 + Deploy Gate
# =============================================================================

class TestDeploy:
    async def _approved_fid(self, client) -> str:
        r = await client.post("/api/v1/specs/generate", json={
            "prompt": "Deploy test app", "template": "react-fastapi",
        })
        fid = r.json()["feature_id"]
        await client.post("/api/v1/specs/approve", json={"feature_id": fid})
        return fid

    async def test_deploy_approved_spec_returns_200(self, client):
        fid = await self._approved_fid(client)
        r = await client.post("/api/v1/projects/proj_deploy01/deploy", json={
            "feature_id": fid,
        })
        assert r.status_code == 200

    async def test_deploy_returns_deployment_url(self, client):
        fid = await self._approved_fid(client)
        r = await client.post("/api/v1/projects/proj_deploy02/deploy", json={
            "feature_id": fid,
        })
        assert "trycloudflare.com" in r.json()["deployment_url"]

    async def test_deploy_creates_run_record(self, client):
        fid = await self._approved_fid(client)
        deploy_r = await client.post("/api/v1/projects/proj_deploy03/deploy", json={
            "feature_id": fid,
        })
        run_id = deploy_r.json()["run_id"]
        r = await client.get(f"/api/v1/projects/proj_deploy03/runs/{run_id}")
        assert r.status_code == 200
        assert r.json()["status"] == "PASSED"

    async def test_deploy_unapproved_spec_returns_409(self, client):
        """E1 — deploy blocked when spec is not APPROVED."""
        r = await client.post("/api/v1/projects/proj_deploy04/deploy", json={
            "feature_id": "feat_not_approved",
        })
        assert r.status_code == 409

    async def test_deploy_awaiting_approval_spec_returns_409(self, client):
        """Spec exists but was never approved."""
        gen = await client.post("/api/v1/specs/generate", json={
            "prompt": "Not approved yet", "template": "react-fastapi",
        })
        fid = gen.json()["feature_id"]
        r = await client.post("/api/v1/projects/proj_deploy05/deploy", json={
            "feature_id": fid,
        })
        assert r.status_code == 409

    async def test_deploy_response_has_all_fields(self, client):
        fid = await self._approved_fid(client)
        r = await client.post("/api/v1/projects/proj_deploy06/deploy", json={
            "feature_id": fid,
        })
        body = r.json()
        for field in ["project_id", "run_id", "run_number",
                      "status", "deployment_url", "message"]:
            assert field in body, f"Missing field: {field}"

    async def test_deploy_status_is_passed_in_demo(self, client):
        fid = await self._approved_fid(client)
        r = await client.post("/api/v1/projects/proj_deploy07/deploy", json={
            "feature_id": fid,
        })
        assert r.json()["status"] == "PASSED"


# =============================================================================
# BL-PLAY-04 — Container Stats
# =============================================================================

class TestContainerStats:
    async def test_stats_returns_200(self, client):
        r = await client.get("/api/v1/projects/proj_8f92a/containers/frontend/stats")
        assert r.status_code == 200

    async def test_stats_has_all_fields(self, client):
        r = await client.get("/api/v1/projects/proj_8f92a/containers/frontend/stats")
        body = r.json()
        for field in ["container_id", "cpu_percent", "memory_mb", "status"]:
            assert field in body

    async def test_stats_cpu_in_valid_range(self, client):
        r = await client.get("/api/v1/projects/proj_8f92a/containers/backend/stats")
        cpu = r.json()["cpu_percent"]
        assert 0.0 <= cpu <= 100.0

    async def test_stats_memory_mb_positive(self, client):
        r = await client.get("/api/v1/projects/proj_8f92a/containers/backend/stats")
        assert r.json()["memory_mb"] > 0

    async def test_stats_status_running_in_demo(self, client):
        r = await client.get("/api/v1/projects/proj_8f92a/containers/frontend/stats")
        assert r.json()["status"] == "RUNNING"


# =============================================================================
# BL-PLAY-04 — Container List
# =============================================================================

class TestContainerList:
    async def test_list_returns_200(self, client):
        r = await client.get("/api/v1/projects/proj_8f92a/containers")
        assert r.status_code == 200

    async def test_list_returns_two_containers(self, client):
        r = await client.get("/api/v1/projects/proj_8f92a/containers")
        assert len(r.json()) == 2

    async def test_containers_have_name_and_status(self, client):
        r = await client.get("/api/v1/projects/proj_8f92a/containers")
        for c in r.json():
            assert "name" in c
            assert "status" in c


# =============================================================================
# BL-HUB-01 — App Catalog
# =============================================================================

class TestAppCatalog:
    async def test_catalog_returns_200(self, client):
        r = await client.get("/api/v1/projects")
        assert r.status_code == 200

    async def test_catalog_returns_three_seeded_apps(self, client):
        r = await client.get("/api/v1/projects")
        assert len(r.json()) == 3

    async def test_catalog_items_have_required_fields(self, client):
        r = await client.get("/api/v1/projects")
        for app in r.json():
            for field in ["project_id", "app_name", "template",
                          "status", "deployed_at", "owner", "ibm_region"]:
                assert field in app, f"Missing field: {field}"

    async def test_catalog_has_running_and_stopped(self, client):
        r = await client.get("/api/v1/projects")
        statuses = {app["status"] for app in r.json()}
        assert "RUNNING" in statuses
        assert "STOPPED" in statuses


# =============================================================================
# BL-HUB-01 — RBAC
# =============================================================================

class TestRBAC:
    async def test_set_developer_role(self, client):
        r = await client.post("/api/v1/hub/access", json={
            "project_id": "proj_8f92a",
            "user_email": "dev@ibm.com",
            "role": "Developer",
        })
        assert r.status_code == 200
        assert r.json()["updated"] is True
        assert r.json()["role"] == "Developer"

    async def test_set_admin_role(self, client):
        r = await client.post("/api/v1/hub/access", json={
            "project_id": "proj_8f92a",
            "user_email": "admin@ibm.com",
            "role": "Super Admin",
        })
        assert r.json()["role"] == "Super Admin"

    async def test_revoke_access(self, client):
        r = await client.post("/api/v1/hub/access", json={
            "project_id": "proj_8f92a",
            "user_email": "fired@ibm.com",
            "role": "Revoked",
        })
        assert r.json()["updated"] is True

    async def test_rbac_missing_role_returns_422(self, client):
        r = await client.post("/api/v1/hub/access", json={
            "project_id": "proj_8f92a",
            "user_email": "someone@ibm.com",
        })
        assert r.status_code == 422

    async def test_rbac_missing_email_returns_422(self, client):
        r = await client.post("/api/v1/hub/access", json={
            "project_id": "proj_8f92a",
            "role": "Viewer",
        })
        assert r.status_code == 422

    async def test_rbac_missing_project_id_returns_422(self, client):
        r = await client.post("/api/v1/hub/access", json={
            "user_email": "dev@ibm.com",
            "role": "Viewer",
        })
        assert r.status_code == 422
