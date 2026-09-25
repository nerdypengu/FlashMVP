# Backlog Item: BL-ARC-03 - Multi-Container Docker Network Orchestrator
> **Feature:** Expandable Architecture | **Layer:** Backend (`server/app/services/docker_service.py`)

---

## 🎯 Task Objective
Implement the Docker orchestration service (`docker-py`) that provisions isolated project bridge networks and runs multi-container fleets (`frontend` + `backend`).

---

## 🛠️ File Locations & Component Specs
* **Docker Service:** `server/app/services/docker_service.py`

---

## 📝 Implementation Tasks
1. Initialize Docker Python SDK client (`docker.from_env()`).
2. Build network creator `client.networks.create(f"net_{project_id}")`.
3. Launch container fleet (`frontend` on port 3001, `backend` on port 8001) connected to `net_{project_id}`.
4. Pass dynamic environment variables (`DATABASE_URL`, `API_URL`) into containers at startup.

---

## 🧪 How to Test (Backend)
1. Run test script launching 2 Nginx containers attached to bridge network -> verify containers can ping each other by name.
