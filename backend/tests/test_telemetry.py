"""Run with python -m unittest tests.test_telemetry."""
import unittest
from unittest.mock import Mock, patch

from app.services import container_service as service
from app.api import containers
from fastapi import HTTPException


class TelemetryTests(unittest.IsolatedAsyncioTestCase):
    def test_multicore_memory_health_and_missing_values(self):
        attrs = {"State": {"Status": "running", "StartedAt": "2026-01-01T00:00:00Z",
            "Health": {"Status": "healthy", "Log": [{"Start": "2026-01-01T00:00:00Z", "End": "2026-01-01T00:00:00.025Z"}]}}, "RestartCount": 2}
        raw = {"cpu_stats": {"cpu_usage": {"total_usage": 150}, "system_cpu_usage": 2000, "online_cpus": 4},
            "precpu_stats": {"cpu_usage": {"total_usage": 100}, "system_cpu_usage": 1900},
            "memory_stats": {"usage": 128 * 1024**2, "limit": 512 * 1024**2},
            "networks": {"eth0": {"rx_bytes": 500, "tx_bytes": 300}, "eth1": {"rx_bytes": 100, "tx_bytes": 50}}}
        stats = service.parse_container_stats("test", attrs, raw)
        self.assertEqual(stats["cpu_percent"], 200)
        self.assertEqual(stats["memory_percent"], 25)
        self.assertEqual(stats["health_check_ms"], 25)
        self.assertEqual(stats["network_rx_bytes"], 600)
        self.assertEqual(stats["restart_count"], 2)
        missing = service.parse_container_stats("test", {"State": {"Status": "running"}}, {})
        for field in ("cpu_percent", "memory_mb", "network_rx_bytes", "health_check_ms", "uptime_seconds"):
            self.assertIsNone(missing[field])
        self.assertEqual(missing["health"], "UNKNOWN")
        stopped = service.parse_container_stats("test", {"State": {"Status": "exited", "ExitCode": 137, "OOMKilled": True}}, raw)
        self.assertIsNone(stopped["cpu_percent"])
        self.assertEqual(stopped["exit_code"], 137)
        self.assertTrue(stopped["oom_killed"])

    async def test_runtime_failure_does_not_become_zero(self):
        with patch.object(service, "DEMO_MODE", False), patch.object(service, "_get_docker", side_effect=RuntimeError("offline")):
            result = await service.get_container_stats("project", "container")
        self.assertIsNone(result["cpu_percent"])
        self.assertEqual(result["status"], "UNKNOWN")

    async def test_multiline_logs_are_valid_sse(self):
        container = Mock()
        chunks = iter([b"2026-01-01T00:00:00Z ERROR: failed\nTraceback line\n"])
        client = Mock()
        client.containers.get.return_value = container
        with patch.object(service, "DEMO_MODE", False), patch.object(service, "_get_docker", return_value=client):
            # Docker's actual stream has a close method.
            class Stream:
                def __iter__(self): return self
                def __next__(self): return next(chunks)
                def close(self): pass
            container.logs.return_value = Stream()
            events = [event async for event in service.stream_container_logs("project", "container")]
        self.assertEqual(events, ["data: 2026-01-01T00:00:00Z ERROR: failed\ndata: Traceback line\n\n"])
        self.assertEqual(container.logs.call_args.kwargs["tail"], 200)

    async def test_unknown_service_cannot_access_arbitrary_container(self):
        from unittest.mock import AsyncMock
        with patch.object(containers, "DEMO_MODE", False), patch.object(containers, "user_token", return_value="jwt"), \
             patch.object(containers, "get_project", new=AsyncMock(return_value={})), \
             patch.object(containers, "get_services", new=AsyncMock(return_value=[{"service_type": "backend", "container_id": "allowed"}])):
            with self.assertRaises(HTTPException) as error:
                await containers.resolve_container("project", "another-project-container", None)
            self.assertEqual(error.exception.status_code, 404)


if __name__ == "__main__":
    unittest.main()
