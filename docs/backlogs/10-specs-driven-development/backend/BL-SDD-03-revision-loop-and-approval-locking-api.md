# Backlog Item: BL-SDD-03 - Revision Loop & Approval Locking API
> **Feature:** Specs-Driven Development | **Layer:** Backend (`server/app/api/specs.py`)

---

## 🎯 Task Objective
Implement the backend approval lock endpoint `POST /api/v1/specs/approve` that transitions the project state to `APPROVED` and locks spec modifications.

---

## 🛠️ File Locations & Component Specs
* **API Route:** `server/app/api/specs.py`
* **Data Model:** `server/app/schemas/spec.py`

---

## 📝 Implementation Tasks
1. Build endpoint `POST /api/v1/specs/approve` accepting `feature_id`.
2. Update state in memory/database store to `APPROVED`.
3. Return `{ "status": "APPROVED", "locked": true, "timestamp": "..." }`.

---

## 🧪 How to Test (Backend)
1. Call `POST /api/v1/specs/approve` via Swagger docs (`http://localhost:8000/docs`).
2. Verify response status returns 200 OK and `status: APPROVED`.
