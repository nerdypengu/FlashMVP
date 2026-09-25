# BL-PLAY-04 — IBM Bob `bob-skill-code-engine`: Container Telemetry & SSE Log Streamer API
> **Assigned To:** ☁️ **Person 4** — IBM Cloud Infra & Skill Pack Orchestrator  
> **Feature:** Container Playground & Observability | **Layer:** Backend  
> **IBM Bob 2.0 Skill:** `bob-skill-code-engine` → IBM Cloud Code Engine / Docker Engine API  
> **File:** `server/app/api/containers.py`

---

## 🎯 What This Does

Once the container fleet is running, this skill provides **real-time observability** into the IBM Code Engine / Docker containers by exposing two endpoints:

1. **SSE Log Streamer** (`GET /api/v1/projects/{id}/containers/{cid}/logs`) — streams `stdout`/`stderr` from a running container as a Server-Sent Events (SSE) feed, aggregating logs across the IBM-hosted fleet into a single terminal view.
2. **Telemetry Stats Poller** (`GET /api/v1/projects/{id}/containers/{cid}/stats`) — polls `container.stats(stream=False)` via the Docker Engine API every 3 seconds, returning CPU % and Memory MB consumed by each container in the fleet.

Both endpoints feed the frontend [`LogViewer`](client/src/components/playground/LogViewer.jsx) and [`TelemetryCharts`](client/src/components/telemetry/TelemetryCharts.jsx) components (BL-PLAY-04 UI, Person 2).

In `DEMO_MODE`, streams simulated SSE log lines and returns synthetic telemetry data — no Docker connection required.

---

## 🗂️ Files to Create / Edit

| File | Action | Purpose |
| :--- | :--- | :--- |
| `server/app/api/containers.py` | **CREATE** | SSE log stream + stats poll endpoints |
| `server/app/schemas/container.py` | **CREATE** | Pydantic models for stats and log events |
| `server/app/services/container_service.py` | **CREATE** | Docker Engine API wrapper (stats + log stream) |

---

## 💻 Pydantic Data Contract

```python
# server/app/schemas/container.py
from pydantic import BaseModel
from typing import Optional

class ContainerStats(BaseModel):
    container_id: str       # "proj_8f92a_frontend"
    cpu_percent: float      # 12.4
    memory_mb: float        # 128.6
    status: str             # "RUNNING" | "STOPPED" | "CRASHED"

class LogEvent(BaseModel):
    container_id: str
    timestamp: str          # ISO 8601
    stream: str             # "stdout" | "stderr"
    message: str            # log line text
```

---

## 💻 Skill Implementation (DEMO_MODE aware)

```python
# server/app/services/container_service.py
import docker, os, asyncio, random
from datetime import datetime, timezone

DEMO_MODE = os.getenv("DEMO_MODE", "true") == "true"
docker_client = docker.from_env() if not DEMO_MODE else None

# --- Telemetry Stats ---
async def get_container_stats(project_id: str, container_id: str) -> dict:
    if DEMO_MODE:
        return {
            "container_id": container_id,
            "cpu_percent": round(random.uniform(5.0, 35.0), 1),
            "memory_mb": round(random.uniform(80.0, 256.0), 1),
            "status": "RUNNING"
        }
    container = docker_client.containers.get(f"{project_id}_{container_id}")
    raw = container.stats(stream=False)
    cpu_delta = raw["cpu_stats"]["cpu_usage"]["total_usage"] - raw["precpu_stats"]["cpu_usage"]["total_usage"]
    system_delta = raw["cpu_stats"]["system_cpu_usage"] - raw["precpu_stats"]["system_cpu_usage"]
    cpu_pct = (cpu_delta / system_delta) * 100.0 if system_delta > 0 else 0.0
    mem_mb = raw["memory_stats"]["usage"] / (1024 * 1024)
    return {
        "container_id": container_id,
        "cpu_percent": round(cpu_pct, 1),
        "memory_mb": round(mem_mb, 1),
        "status": container.status.upper()
    }

# --- SSE Log Generator ---
MOCK_LOG_LINES = [
    "[IBM Bob] 🚀 Starting container fleet deployment...",
    "[IBM Bob] ✓ IBM Cloud DB schema app_proj_8f92a provisioned (0.18s)",
    "[IBM Bob] ✓ IBM Secrets vault keys injected",
    "[IBM Bob] 🔨 Building Docker image flashmvp/react-fastapi-frontend...",
    "[IBM Bob] ✓ Image built successfully",
    "[IBM Bob] 🌐 Container frontend started on port 3001",
    "[IBM Bob] ✓ Cloudflare tunnel established: https://app-8f92a.trycloudflare.com",
    "[INFO] uvicorn: Application startup complete.",
]

async def stream_container_logs(project_id: str, container_id: str):
    if DEMO_MODE:
        for line in MOCK_LOG_LINES:
            ts = datetime.now(timezone.utc).isoformat()
            yield f"data: {ts} {line}\n\n"
            await asyncio.sleep(0.4)
        return
    container = docker_client.containers.get(f"{project_id}_{container_id}")
    for log_line in container.logs(stream=True, follow=True, timestamps=True):
        yield f"data: {log_line.decode('utf-8', errors='replace').strip()}\n\n"
        await asyncio.sleep(0)
```

```python
# server/app/api/containers.py
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from app.services.container_service import get_container_stats, stream_container_logs
from app.schemas.container import ContainerStats

router = APIRouter(prefix="/api/v1/projects/{project_id}/containers/{container_id}")

@router.get("/stats", response_model=ContainerStats)
async def container_stats(project_id: str, container_id: str):
    return await get_container_stats(project_id, container_id)

@router.get("/logs")
async def container_logs(project_id: str, container_id: str):
    return StreamingResponse(
        stream_container_logs(project_id, container_id),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
```

---

## 📝 Implementation Tasks

1. Create `server/app/schemas/container.py` with `ContainerStats` and `LogEvent` models.
2. Create `server/app/services/container_service.py` with `get_container_stats()` and `stream_container_logs()` (DEMO_MODE guards as above).
3. Create `server/app/api/containers.py` with both routes.
4. Register router in `server/app/main.py`.
5. DEMO_MODE mock logs must include IBM Bob subagent progress messages (see `MOCK_LOG_LINES` above) so the demo conveys the real IBM pipeline even without containers running.

---

## 🧪 Testing & Verification

1. Start server: `uvicorn app.main:app --reload --port 8000`
2. **Stats endpoint:** `GET /api/v1/projects/proj_8f92a/containers/frontend/stats`  
   ✅ Returns `{ cpu_percent, memory_mb, status: "RUNNING" }`.  
   ✅ DEMO_MODE: returns randomized values, no Docker connection.
3. **Log SSE endpoint:** `curl -N http://localhost:8000/api/v1/projects/proj_8f92a/containers/frontend/logs`  
   ✅ DEMO_MODE: streams IBM Bob mock log lines with ~400ms delay between each.  
   ✅ Live mode: real Docker container `stdout`/`stderr` lines stream continuously.
4. ✅ `Content-Type: text/event-stream` header present on log endpoint response.
