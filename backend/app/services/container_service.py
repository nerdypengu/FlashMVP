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
        _docker_client = docker.from_env(timeout=10)
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


def _date(value):
    try:
        date = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return date if date.year > 1 and date.tzinfo else None
    except (ValueError, TypeError, AttributeError):
        return None


def parse_container_stats(container_id: str, attrs: dict, raw: dict) -> dict:
    """Missing counters stay null; CPU follows Docker's one-core = 100% convention."""
    now = datetime.now(timezone.utc)
    state = attrs.get("State", {})
    running = state.get("Status") == "running"
    started = _date(state.get("StartedAt"))
    health = state.get("Health", {})
    checks = health.get("Log", [])
    last = checks[-1] if checks else {}
    start, end = _date(last.get("Start")), _date(last.get("End"))
    cpu, previous = raw.get("cpu_stats", {}), raw.get("precpu_stats", {})
    cpu_percent = None
    try:
        delta = cpu["cpu_usage"]["total_usage"] - previous["cpu_usage"]["total_usage"]
        system = cpu["system_cpu_usage"] - previous["system_cpu_usage"]
        cores = cpu.get("online_cpus") or len(cpu["cpu_usage"].get("percpu_usage", []))
        if system > 0 and delta >= 0 and cores > 0:
            cpu_percent = round(delta / system * cores * 100, 2)
    except KeyError:
        pass
    memory = raw.get("memory_stats", {})
    usage, limit = memory.get("usage"), memory.get("limit")
    networks = raw.get("networks", {})
    return {
        "container_id": container_id,
        "status": state.get("Status", "UNKNOWN").upper(),
        "sampled_at": raw.get("read") if _date(raw.get("read")) else now.isoformat(),
        "cpu_percent": cpu_percent if running else None,
        "memory_mb": round(usage / 1024**2, 2) if running and usage is not None else None,
        "memory_limit_mb": round(limit / 1024**2, 2) if limit else None,
        "memory_percent": round(usage / limit * 100, 2) if running and usage is not None and limit else None,
        "restart_count": attrs.get("RestartCount"),
        "started_at": started.isoformat() if started else None,
        "uptime_seconds": max(0, (now - started).total_seconds()) if running and started else None,
        "exit_code": state.get("ExitCode") if state.get("Status") in ("exited", "dead") else None,
        "oom_killed": state.get("OOMKilled"),
        "health": health.get("Status", "UNKNOWN").upper() if running else "UNKNOWN",
        "health_checked_at": end.isoformat() if running and end else None,
        "health_check_ms": round((end - start).total_seconds() * 1000, 2) if running and start and end and end >= start else None,
        "network_rx_bytes": sum(n["rx_bytes"] for n in networks.values()) if running and networks and all("rx_bytes" in n for n in networks.values()) else None,
        "network_tx_bytes": sum(n["tx_bytes"] for n in networks.values()) if running and networks and all("tx_bytes" in n for n in networks.values()) else None,
    }


def _read_stats(container_id):
    container = _get_docker().containers.get(container_id)
    raw, error = {}, None
    if container.attrs.get("State", {}).get("Status") == "running":
        try:
            raw = container.stats(stream=False)
        except Exception:
            error = "Resource statistics are unavailable."
    result = parse_container_stats(container_id, container.attrs, raw)
    result["stats_error"] = error
    return result


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
            "sampled_at": datetime.now(timezone.utc).isoformat(),
        }

    try:
        return await asyncio.to_thread(_read_stats, container_id)
    except Exception:
        return {
            "container_id": container_id,
            "cpu_percent": None,
            "memory_mb": None,
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

    log_stream = None
    try:
        client = await asyncio.to_thread(_get_docker)
        container = await asyncio.to_thread(client.containers.get, container_id)
        log_stream = await asyncio.to_thread(container.logs, stream=True, follow=True, timestamps=True, tail=200)
        sentinel = object()
        while True:
            log_line = await asyncio.to_thread(next, log_stream, sentinel)
            if log_line is sentinel:
                break
            text = log_line.decode('utf-8', errors='replace').rstrip('\r\n')
            yield ''.join(f"data: {line}\n" for line in text.splitlines()) + '\n'
            await asyncio.sleep(0)
    except Exception:
        yield "data: [STREAM_ERROR] Container logs are unavailable. Reconnect to retry.\n\n"
    finally:
        if log_stream is not None:
            log_stream.close()
