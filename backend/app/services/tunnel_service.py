"""
BL-PLAY-02 — Cloudflare Quick Tunnel Manager
bob-skill-secrets-vault: Spawns cloudflared subprocess and extracts the
auto-generated public HTTPS URL from stderr.
"""
import asyncio
import os
import re

DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() == "true"

_URL_PATTERN = re.compile(r"https://[a-z0-9\-]+\.trycloudflare\.com")

# In-memory tunnel registry: { project_id: public_url }
_tunnel_registry: dict[str, str] = {}


async def start_cloudflare_tunnel(project_id: str, local_port: int = 3001) -> dict:
    """
    Bob Subagent Delta entry point.
    DEMO_MODE=true  → returns pre-warmed static URL, no subprocess.
    DEMO_MODE=false → spawns cloudflared and parses HTTPS URL from stderr.
    """
    if DEMO_MODE:
        url = f"https://app-{project_id}.trycloudflare.com"
        _tunnel_registry[project_id] = url
        return {
            "project_id": project_id,
            "public_url": url,
            "local_port": local_port,
            "status": "ACTIVE",
            "stored_in_vault": False,
        }

    # Real cloudflared path
    try:
        proc = await asyncio.create_subprocess_exec(
            "cloudflared",
            "tunnel",
            "--url",
            f"http://localhost:{local_port}",
            stderr=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.DEVNULL,
        )
    except FileNotFoundError:
        return {
            "project_id": project_id,
            "public_url": "",
            "local_port": local_port,
            "status": "FAILED",
            "stored_in_vault": False,
        }

    public_url: str | None = None

    # cloudflared emits the tunnel URL in stderr within ~2 seconds
    try:
        async for line in proc.stderr:  # type: ignore[union-attr]
            decoded = line.decode("utf-8", errors="replace")
            match = _URL_PATTERN.search(decoded)
            if match:
                public_url = match.group(0)
                break
    except Exception:
        pass

    if not public_url:
        return {
            "project_id": project_id,
            "public_url": "",
            "local_port": local_port,
            "status": "FAILED",
            "stored_in_vault": False,
        }

    _tunnel_registry[project_id] = public_url
    return {
        "project_id": project_id,
        "public_url": public_url,
        "local_port": local_port,
        "status": "ACTIVE",
        "stored_in_vault": False,  # caller stores in vault separately
    }


def get_tunnel_url(project_id: str) -> str | None:
    """Return the stored tunnel URL for a project, or None."""
    return _tunnel_registry.get(project_id)
