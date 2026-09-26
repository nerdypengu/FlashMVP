"""Read Person 2 data using the caller's JWT; Supabase enforces project RLS."""
import os
from uuid import UUID

import httpx
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

bearer = HTTPBearer(auto_error=False)


def user_token(credentials: HTTPAuthorizationCredentials | None) -> str:
    if credentials is None:
        raise HTTPException(401, "Authentication required.")
    return credentials.credentials


async def read_rows(table: str, token: str, params: dict) -> list:
    url = os.getenv("SUPABASE_URL", "").rstrip("/")
    key = os.getenv("SUPABASE_ANON_KEY", "")
    if not url or not key:
        raise HTTPException(503, "Supabase is not configured.")
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            response = await client.get(
                f"{url}/rest/v1/{table}", params=params,
                headers={"apikey": key, "Authorization": f"Bearer {token}", "Accept-Profile": "flashmvp"},
            )
    except httpx.RequestError:
        raise HTTPException(503, "Could not reach Supabase.") from None
    if response.status_code in (401, 403):
        raise HTTPException(response.status_code, "Supabase rejected authentication or database access.")
    if not response.is_success:
        raise HTTPException(502, "Supabase query failed. Check the schema, grants and RLS policies.")
    return response.json()


async def get_project(project_id: str, token: str) -> dict:
    try:
        UUID(project_id)
        column = "id"
    except ValueError:
        column = "project_id"
    rows = await read_rows("projects", token, {
        "select": "id,project_id,app_name,db_schema", column: f"eq.{project_id}", "limit": "1",
    })
    if not rows:
        raise HTTPException(404, "Project not found or access denied.")
    return rows[0]


async def get_services(project: dict, token: str) -> list:
    return await read_rows("project_services", token, {
        "select": "service_type,container_id,url,port", "project_id": f"eq.{project['id']}",
    })
