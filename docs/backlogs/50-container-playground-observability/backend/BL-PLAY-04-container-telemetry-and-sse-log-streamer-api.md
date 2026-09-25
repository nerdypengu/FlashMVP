# Backlog Item: BL-PLAY-04 - Container Telemetry & SSE Log Streamer API
> **Feature:** Container Playground & Observability | **Layer:** Backend (`server/app/api/containers.py`)

---

## 🎯 Task Objective
Implement the backend endpoints for real-time SSE container log streaming and CPU/RAM telemetry stats polling.

---

## 🛠️ File Locations & Component Specs
* **API Route:** `server/app/api/containers.py`

---

## 📝 Implementation Tasks
1. Build SSE endpoint `GET /api/v1/projects/{id}/containers/{cid}/logs` streaming container `stdout`/`stderr` logs in real time.
2. Build telemetry endpoint `GET /api/v1/projects/{id}/containers/{cid}/stats` querying `container.stats(stream=False)`.

---

## 🧪 How to Test (Backend)
1. Curl SSE endpoint `curl -N http://localhost:8000/api/v1/projects/p1/containers/c1/logs` -> verify live logs stream into terminal.
