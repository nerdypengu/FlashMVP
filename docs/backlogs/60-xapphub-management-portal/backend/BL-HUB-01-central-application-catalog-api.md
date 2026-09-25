# Backlog Item: BL-HUB-01 - Central Application Catalog API
> **Feature:** xAppHub Management Portal | **Layer:** Backend (`server/app/api/hub.py`)

---

## 🎯 Task Objective
Implement the backend endpoints `GET /api/v1/projects` and `POST /api/v1/hub/access` returning published applications and updating RBAC permissions.

---

## 🛠️ File Locations & Component Specs
* **API Route:** `server/app/api/hub.py`
* **Data Schemas:** `server/app/schemas/hub.py`

---

## 📝 Implementation Tasks
1. Build `GET /api/v1/projects` returning published app catalog metadata, status, and Cloudflare URL.
2. Build `POST /api/v1/hub/access` updating user roles (`Admin`, `Developer`, `Viewer`, `Revoked`).

---

## 🧪 How to Test (Backend)
1. Execute `GET /api/v1/projects` via Swagger docs -> verify JSON array of published apps returned.
