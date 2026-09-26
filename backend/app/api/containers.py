"""
BL-PLAY-04 — Container Telemetry & SSE Log Streamer API Routes
GET /api/v1/projects/{project_id}/containers/{container_id}/stats — CPU/RAM telemetry
GET /api/v1/projects/{project_id}/containers/{container_id}/logs  — SSE log stream
GET /api/v1/projects/{project_id}/containers                      — list fleet status
"""
from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.schemas.container import ContainerStats
from app.services.container_service import get_container_stats, stream_container_logs

router = APIRouter(
    prefix="/api/v1/projects/{project_id}/containers",
    tags=["Container Observability"],
)


@router.get("", response_model=list)
async def list_containers(project_id: str) -> list:
    """
    List all containers in the project fleet with status badges.
    Returns mock fleet in DEMO_MODE; queries Docker in live mode.
    """
    from app.bob.skill_code_engine import get_fleet
    fleet = get_fleet(project_id)
    if not fleet:
        # Return default demo fleet if project hasn't deployed yet
        fleet = [
            {"name": "frontend", "status": "RUNNING", "port": 3001,
             "url": f"https://app-{project_id}.trycloudflare.com"},
            {"name": "backend",  "status": "RUNNING", "port": 8001,
             "url": f"https://api-{project_id}.trycloudflare.com"},
        ]
    return fleet


@router.get("/{container_id}/stats", response_model=ContainerStats)
async def container_stats(project_id: str, container_id: str) -> ContainerStats:
    """Return real-time CPU% and RAM for a specific container."""
    result = await get_container_stats(project_id, container_id)
    return ContainerStats(**result)


@router.get("/{container_id}/logs")
async def container_logs(project_id: str, container_id: str):
    """
    Stream container stdout/stderr as Server-Sent Events (SSE).
    In DEMO_MODE streams IBM Bob mock log lines with 400ms delay.
    """
    return StreamingResponse(
        stream_container_logs(project_id, container_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
