"""
BL-PLAY-04 — Container Telemetry & SSE Log Streamer API Routes
GET /api/v1/projects/{project_id}/containers/{container_id}/stats — CPU/RAM telemetry
GET /api/v1/projects/{project_id}/containers/{container_id}/logs  — SSE log stream
GET /api/v1/projects/{project_id}/containers                      — list fleet status
"""
import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse

from app.schemas.container import ContainerStats
from app.services.container_service import get_container_stats, stream_container_logs
from app.services.person2_store import bearer, user_token, get_project, get_services

DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"


async def resolve_container(project_id: str, container_id: str, credentials) -> str:
    if DEMO_MODE:
        return container_id
    token = user_token(credentials)
    services = await get_services(await get_project(project_id, token), token)
    for service in services:
        if service['service_type'] != 'db' and container_id in (service['service_type'], service['container_id']):
            if service['container_id']:
                return service['container_id']
    raise HTTPException(404, "Container not configured for this project.")

router = APIRouter(
    prefix="/api/v1/projects/{project_id}/containers",
    tags=["Container Observability"],
)


@router.get("", response_model=list)
async def list_containers(project_id: str, credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> list:
    """
    List all containers in the project fleet with status badges.
    Returns mock fleet in DEMO_MODE; queries Docker in live mode.
    """
    if not DEMO_MODE:
        token = user_token(credentials)
        services = await get_services(await get_project(project_id, token), token)
        return [service for service in services if service['service_type'] != 'db']
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
async def container_stats(project_id: str, container_id: str, credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> ContainerStats:
    """Return real-time CPU% and RAM for a specific container."""
    resolved = await resolve_container(project_id, container_id, credentials)
    result = await get_container_stats(project_id, resolved)
    if not DEMO_MODE and result['status'] == 'UNKNOWN':
        raise HTTPException(503, "Container statistics are unavailable.")
    return ContainerStats(**result)


@router.get("/{container_id}/logs")
async def container_logs(project_id: str, container_id: str, credentials: HTTPAuthorizationCredentials | None = Depends(bearer)):
    """
    Stream container stdout/stderr as Server-Sent Events (SSE).
    In DEMO_MODE streams IBM Bob mock log lines with 400ms delay.
    """
    resolved = await resolve_container(project_id, container_id, credentials)
    return StreamingResponse(
        stream_container_logs(project_id, resolved),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
