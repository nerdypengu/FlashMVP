# Backlog Item: BL-INF-02 - Encrypted Secrets Vault API
> **Feature:** Application Infrastructure | **Layer:** Backend (`server/app/api/env.py`)

---

## 🎯 Task Objective
Implement the backend encrypted secrets store `GET/POST /api/v1/projects/{id}/env` to manage `.env` keys and API secrets.

---

## 🛠️ File Locations & Component Specs
* **API Route:** `server/app/api/env.py`

---

## 📝 Implementation Tasks
1. Implement endpoint `POST /api/v1/projects/{id}/env`: Saves encrypted key-value pairs (`OPENAI_API_KEY`, `STRIPE_KEY`).
2. Implement `GET /api/v1/projects/{id}/env`: Returns environment dictionary for container runtime injection (`-e KEY=VAL`).

---

## 🧪 How to Test (Backend)
1. Execute `POST /api/v1/projects/proj_1/env` with body `{"key": "FOO", "value": "BAR", "scope": "BACKEND"}` via Swagger docs.
2. Execute `GET /api/v1/projects/proj_1/env` -> verify key-value returned formatted for container injection.
