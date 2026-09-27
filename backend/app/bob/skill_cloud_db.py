"""
IBM Bob 2.0 Skill: bob-skill-cloud-db
IBM Cloud Databases for PostgreSQL — Dynamic Schema Provisioner

Two keys, two jobs:
  SERVICE KEY  (SUPABASE_SERVICE_KEY) — used here in the backend only.
               Bypasses RLS completely. Safe to use for schema provisioning,
               inserting rows into flashmvp.projects, and writing run_history.

  ANON KEY     (SUPABASE_ANON_KEY) — used by the frontend (and supabase_client.py).
               Goes through RLS policies. Regular users see only their own data;
               admins see everything.
"""
import asyncio
import os
import time

DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() == "true"

# Direct PostgreSQL connection — used for raw DDL (CREATE SCHEMA, CREATE TABLE).
# Must be the port-5432 direct URL, NOT the connection pooler (port 6543).
_DB_URL: str = os.getenv("SUPABASE_DB_URL", "")

# Service role key — passed as Authorization header for Supabase REST / PostgREST calls.
# Never send this key to the browser.
_SERVICE_KEY: str = os.getenv("SUPABASE_SERVICE_KEY", "")
_SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")


async def provision_schema(project_id: str) -> dict:
    """
    Bob Subagent Alpha entry point.

    Creates an isolated per-project namespace inside the shared Supabase instance:
      1. Creates schema  app_{project_id}
      2. Creates table   app_{project_id}.users  (starter user table for the deployed app)
      3. Registers the project in flashmvp.projects  (written via service key → bypasses RLS)

    DEMO_MODE=true  → returns mock response instantly, no DB connection attempted.
    DEMO_MODE=false → uses asyncpg with the service/direct DB URL.
    """
    schema = f"app_{project_id}"

    if DEMO_MODE:
        await asyncio.sleep(0)  # yield to event loop
        return {
            "schema_name": schema,
            "execution_time_ms": 180,
            "status": "SUCCESS",
            "connection_url": f"postgres://masked:****@db.supabase.co:5432/postgres?schema={schema}",
        }

    # ── Live path ─────────────────────────────────────────────────────────────
    if not _DB_URL:
        raise RuntimeError(
            "SUPABASE_DB_URL is not set. Add it to .env or set DEMO_MODE=true."
        )

    try:
        import asyncpg  # type: ignore
    except ImportError:
        raise RuntimeError(
            "asyncpg is not installed. Run: pip install asyncpg  (or set DEMO_MODE=true)."
        )

    start = time.time()

    # Use the service-role DB URL — this connection has superuser-equivalent
    # privileges and is NOT subject to RLS.
    conn = await asyncpg.connect(_DB_URL)
    try:
        await conn.execute(f"""
            -- ── Per-project isolated schema ──────────────────────────────────
            CREATE SCHEMA IF NOT EXISTS {schema};

            -- Starter users table for the deployed application.
            -- The deployed app's backend will write its own user rows here.
            CREATE TABLE IF NOT EXISTS {schema}.users (
                id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                email      TEXT        UNIQUE NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );

            -- Starter app_config table — the deployed app can store key/value config here.
            CREATE TABLE IF NOT EXISTS {schema}.app_config (
                key        TEXT PRIMARY KEY,
                value      TEXT,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        """)
    finally:
        await conn.close()

    elapsed_ms = int((time.time() - start) * 1000)
    return {
        "schema_name": schema,
        "execution_time_ms": elapsed_ms,
        "status": "SUCCESS",
        "connection_url": (
            f"postgres://masked:****@db.supabase.co:5432/postgres?schema={schema}"
        ),
    }


async def register_project_in_catalog(
    project_id: str,
    app_name: str,
    template: str,
    owner_id: str,
    db_schema: str,
    ibm_region: str = "us-south",
) -> bool:
    """
    Insert a row into flashmvp.projects using the service key so the xAppHub
    catalog reflects the newly provisioned project.

    Uses the Supabase REST API (PostgREST) with the service key as the
    Authorization header — this bypasses all RLS policies.

    Returns True on success, False on failure (non-fatal — demo still works).
    """
    if DEMO_MODE or not _SUPABASE_URL or not _SERVICE_KEY:
        return True  # No-op in demo mode or if keys not configured

    try:
        import httpx  # type: ignore
    except ImportError:
        return False  # httpx not installed — skip catalog registration

    url = f"{_SUPABASE_URL}/rest/v1/projects"
    headers = {
        "apikey": _SERVICE_KEY,
        "Authorization": f"Bearer {_SERVICE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }
    payload = {
        "project_id": project_id,
        "app_name": app_name,
        "template": template,
        "status": "PROVISIONING",
        "db_schema": db_schema,
        "owner_id": owner_id,
        "ibm_region": ibm_region,
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            return resp.status_code in (200, 201)
    except Exception:
        return False  # Catalog registration is best-effort; never block a deploy
