"""
IBM Bob 2.0 Skill: bob-skill-code-engine
IBM Cloud Code Engine / Docker Engine Orchestrator.
Builds images, creates isolated Docker networks, and launches multi-container fleets.
"""
import asyncio
import os

DEMO_MODE: bool = os.getenv("DEMO_MODE", "true").lower() == "true"

# Lazy Docker client — only initialised when DEMO_MODE=false
_docker_client = None


def _get_docker():
    global _docker_client
    if _docker_client is None:
        import docker  # type: ignore
        _docker_client = docker.from_env()
    return _docker_client


# In-memory project fleet registry: { project_id: [container_info, ...] }
_fleet_registry: dict[str, list] = {}


async def deploy_container_fleet(
    project_id: str,
    template: str,
    secrets: dict | None = None,
) -> dict:
    """
    Bob Subagent Gamma entry point.
    DEMO_MODE=true  → returns instant mock fleet status.
    DEMO_MODE=false → creates Docker network + launches frontend/backend containers.
    """
    secrets = secrets or {}

    if DEMO_MODE:
        await asyncio.sleep(0)  # yield to event loop
        fleet = [
            {
                "name": "frontend",
                "status": "RUNNING",
                "port": 3001,
                "url": f"https://app-{project_id}.trycloudflare.com",
            },
            {
                "name": "backend",
                "status": "RUNNING",
                "port": 8001,
                "url": f"https://api-{project_id}.trycloudflare.com",
            },
        ]
        _fleet_registry[project_id] = fleet
        return {
            "containers": fleet,
            "network": f"net_{project_id}",
            "execution_time_ms": 3850,
            "status": "RUNNING",
        }

    # Real Docker / IBM Code Engine path
    client = _get_docker()
    network_name = f"net_{project_id}"

    # Create isolated bridge network
    try:
        client.networks.get(network_name)
    except Exception:
        client.networks.create(network_name, driver="bridge")

    # Launch backend container
    backend_env = {k: v for k, v in secrets.items() if True}  # ALL + BACKEND scoped
    backend = client.containers.run(
        f"flashmvp/{template}-backend:latest",
        name=f"{project_id}_backend",
        network=network_name,
        ports={"8001/tcp": 8001},
        environment=backend_env,
        detach=True,
        remove=False,
    )

    # Launch frontend container with API_URL pointing to backend
    frontend_env = {**secrets, "API_URL": "http://localhost:8001"}
    frontend = client.containers.run(
        f"flashmvp/{template}-frontend:latest",
        name=f"{project_id}_frontend",
        network=network_name,
        ports={"3001/tcp": 3001},
        environment=frontend_env,
        detach=True,
        remove=False,
    )

    fleet = [
        {"name": "frontend", "status": "RUNNING", "port": 3001},
        {"name": "backend", "status": "RUNNING", "port": 8001},
    ]
    _fleet_registry[project_id] = fleet
    return {
        "containers": fleet,
        "network": network_name,
        "status": "RUNNING",
    }


def get_fleet(project_id: str) -> list:
    """Return the registered container fleet for a project."""
    return _fleet_registry.get(project_id, [])


async def teardown_fleet(project_id: str) -> bool:
    """Stop and remove all containers and the network for a project."""
    if DEMO_MODE:
        _fleet_registry.pop(project_id, None)
        return True

    client = _get_docker()
    for name in [f"{project_id}_frontend", f"{project_id}_backend"]:
        try:
            c = client.containers.get(name)
            c.stop(timeout=5)
            c.remove()
        except Exception:
            pass

    try:
        net = client.networks.get(f"net_{project_id}")
        net.remove()
    except Exception:
        pass

    _fleet_registry.pop(project_id, None)
    return True
