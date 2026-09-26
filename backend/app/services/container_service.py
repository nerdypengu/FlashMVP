"""
BL-PLAY-04 — Container Telemetry & SSE Log Streamer Service
bob-skill-code-engine: Wraps Docker Engine API to expose per-container
CPU/RAM stats and real-time stdout/stderr log streams.
"""
import asyncio
import os
import random
from datetime import datetime, timezone

DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() == "true"

_docker_client = None


def _get_docker():
    global _docker_client
    if _docker_client is None:
        import docker  # type: ignore
        _docker_client = docker.from_env()
    return _docker_client


MOCK_LOG_LINES = [
    "[IBM Bob] 🚀 Starting container fleet deployment...",
    "[IBM Bob] ✓ IBM Cloud DB schema provisioned in 0.18s",
    "[IBM Bob] ✓ IBM Secrets vault keys injected",
    "[IBM Bob] 🔨 Building Docker image flashmvp/react-fastapi-frontend...",
    "[IBM Bob] ✓ Image built successfully (4.2s)",
    "[IBM Bob] 🌐 Container frontend started on port 3001",
    "[IBM Bob] 🔗 Container backend started on port 8001",
    "[IBM Bob] ✓ Cloudflare tunnel established: https://app-8f92a.trycloudflare.com",
    "[INFO] uvicorn: Started server process",
    "[INFO] uvicorn: Waiting for application startup",
    "[INFO] uvicorn: Application startup complete.",
    "[INFO] GET / HTTP/1.1 200 OK",
]


async def get_container_stats(project_id: str, container_id: str) -> dict:
    """
    Return CPU% and Memory MB for a container.
    DEMO_MODE=true  → randomised mock data, no Docker connection.
    DEMO_MODE=false → queries docker container.stats(stream=False).
    """
    if DEMO_MODE:
        return {
            "container_id": container_id,
            "cpu_percent": round(random.uniform(5.0, 35.0), 1),
            "memory_mb": round(random.uniform(80.0, 256.0), 1),
            "status": "RUNNING",
        }

    try:
        client = _get_docker()
        container = client.containers.get(f"{project_id}_{container_id}")
        raw = container.stats(stream=False)
        cpu_delta = (
            raw["cpu_stats"]["cpu_usage"]["total_usage"]
            - raw["precpu_stats"]["cpu_usage"]["total_usage"]
        )
        system_delta = (
            raw["cpu_stats"]["system_cpu_usage"]
            - raw["precpu_stats"]["system_cpu_usage"]
        )
        cpu_pct = (cpu_delta / system_delta * 100.0) if system_delta > 0 else 0.0
        mem_mb = raw["memory_stats"]["usage"] / (1024 * 1024)
        return {
            "container_id": container_id,
            "cpu_percent": round(cpu_pct, 1),
            "memory_mb": round(mem_mb, 1),
            "status": container.status.upper(),
        }
    except Exception as exc:
        return {
            "container_id": container_id,
            "cpu_percent": 0.0,
            "memory_mb": 0.0,
            "status": "UNKNOWN",
        }


async def stream_container_logs(project_id: str, container_id: str):
    """
    Async generator that yields SSE-formatted log lines.
    DEMO_MODE=true  → streams MOCK_LOG_LINES with 400ms delay.
    DEMO_MODE=false → streams real Docker container stdout/stderr.
    """
    if DEMO_MODE:
        for line in MOCK_LOG_LINES:
            ts = datetime.now(timezone.utc).isoformat()
            yield f"data: {ts}  {line}\n\n"
            await asyncio.sleep(0.4)
        return

    try:
        client = _get_docker()
        container = client.containers.get(f"{project_id}_{container_id}")
        for log_line in container.logs(stream=True, follow=True, timestamps=True):
            yield f"data: {log_line.decode('utf-8', errors='replace').strip()}\n\n"
            await asyncio.sleep(0)
    except Exception as exc:
        yield f"data: [ERROR] Could not stream logs: {exc}\n\n"
