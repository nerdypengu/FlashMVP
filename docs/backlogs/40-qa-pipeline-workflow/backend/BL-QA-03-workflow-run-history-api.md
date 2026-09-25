# Backlog Item: BL-QA-03 - Workflow Run History API
> **Feature:** QA Pipeline Workflow | **Layer:** Backend (`server/app/api/runs.py`)

---

## 🎯 Task Objective
Implement the backend endpoints `GET /api/v1/projects/{id}/runs` and `GET /api/v1/projects/{id}/runs/{run_id}` returning audit logs and log snapshots for past deployment attempts.

---

## 🛠️ File Locations & Component Specs
* **API Route:** `server/app/api/runs.py`
* **Data Schemas:** `server/app/schemas/run.py`

---

## 📝 Implementation Tasks
1. Build `GET /api/v1/projects/{id}/runs` returning historical run array (`run_number`, `commit`, `status`, `duration`, `timestamp`).
2. Build `GET /api/v1/projects/{id}/runs/{run_id}` returning archived log trace and step pass/fail results.

---

## 🧪 How to Test (Backend)
1. Execute `GET /api/v1/projects/proj_1/runs` via Swagger docs -> verify array of past runs returned.
