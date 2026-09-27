"""Run: uv run python -m unittest tests.test_person2_reads"""
import os
import unittest
from unittest.mock import patch

import httpx
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.services import person2_store
from app.api import runs, containers


class Person2Reads(unittest.IsolatedAsyncioTestCase):
    async def test_missing_token_cannot_read_live_runs_or_container(self):
        with patch.object(runs.run_store, "DEMO_MODE", False):
            with self.assertRaises(HTTPException) as error:
                await runs.list_runs("project", None)
            self.assertEqual(error.exception.status_code, 401)
        with patch.object(containers, "DEMO_MODE", False):
            with self.assertRaises(HTTPException) as error:
                await containers.container_stats("project", "frontend", None)
            self.assertEqual(error.exception.status_code, 401)

    async def test_live_runs_are_read_through_user_rls(self):
        calls = []

        async def respond(client, url, **kwargs):
            calls.append((url, kwargs))
            rows = [{"id": "project-uuid", "project_id": "proj-real", "app_name": "Real", "db_schema": "app_real"}]
            if url.endswith("/run_history"):
                rows = [{"run_id": "run-real", "run_number": 1, "status": "PASSED",
                         "duration_ms": None, "qa_steps": None, "triggered_at": "2026-09-26T00:00:00Z", "deployment_url": None}]
            return httpx.Response(200, json=rows)

        with patch.dict(os.environ, {"SUPABASE_URL": "https://example.invalid", "SUPABASE_ANON_KEY": "synthetic-public-key"}), \
             patch.object(runs.run_store, "DEMO_MODE", False), \
             patch.object(httpx.AsyncClient, "get", respond):
            records = await runs.list_runs("proj-real", HTTPAuthorizationCredentials(scheme="Bearer", credentials="user-test-jwt"))
        self.assertEqual([row.run_id for row in records], ["run-real"])
        self.assertEqual(records[0].duration_ms, 0)
        self.assertEqual(records[0].qa_steps, [])
        self.assertEqual(calls[1][1]["params"]["project_id"], "eq.project-uuid")
        for _, kwargs in calls:
            self.assertEqual(kwargs["headers"]["Accept-Profile"], "flashmvp")
            self.assertEqual(kwargs["headers"]["Authorization"], "Bearer user-test-jwt")

    async def test_inaccessible_project_never_falls_back_to_demo(self):
        async def empty(client, url, **kwargs):
            return httpx.Response(200, json=[])
        with patch.dict(os.environ, {"SUPABASE_URL": "https://example.invalid", "SUPABASE_ANON_KEY": "synthetic-public-key"}), \
             patch.object(httpx.AsyncClient, "get", empty):
            with self.assertRaises(HTTPException) as error:
                await person2_store.get_project("proj-hidden", "user-test-jwt")
        self.assertEqual(error.exception.status_code, 404)

    async def test_supabase_rejection_is_preserved(self):
        async def denied(client, url, **kwargs):
            return httpx.Response(401, json={"message": "invalid token"})
        with patch.dict(os.environ, {"SUPABASE_URL": "https://example.invalid", "SUPABASE_ANON_KEY": "synthetic-public-key"}), \
             patch.object(httpx.AsyncClient, "get", denied):
            with self.assertRaises(HTTPException) as error:
                await person2_store.read_rows("projects", "expired-token", {})
        self.assertEqual(error.exception.status_code, 401)


if __name__ == "__main__":
    unittest.main()
