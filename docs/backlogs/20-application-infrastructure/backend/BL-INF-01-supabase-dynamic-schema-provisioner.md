# Backlog Item: BL-INF-01 - Supabase Dynamic Schema Provisioner
> **Feature:** Application Infrastructure | **Layer:** Backend (`server/app/services/supabase_service.py`)

---

## 🎯 Task Objective
Implement the dynamic schema creator service that executes `CREATE SCHEMA IF NOT EXISTS app_{project_id};` in Supabase within 200ms.

---

## 🛠️ File Locations & Component Specs
* **Database Service:** `server/app/services/supabase_service.py`
* **API Route:** `server/app/api/projects.py`

---

## 📝 Implementation Tasks
1. Setup async PostgreSQL connection using `asyncpg` or `psycopg`.
2. Implement schema provisioner function executing:
   ```sql
   CREATE SCHEMA IF NOT EXISTS app_{project_id};
   CREATE TABLE IF NOT EXISTS app_{project_id}.users (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       email TEXT UNIQUE NOT NULL,
       created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```
3. Expose endpoint `POST /api/v1/projects/create` returning `{ status: "SUCCESS", schema: "app_xxx", execution_time_ms: 180 }`.

---

## 🧪 How to Test (Backend)
1. Run FastAPI server: `uvicorn app.main:app --reload`
2. Execute `POST /api/v1/projects/create` via Swagger docs -> verify response timing is `< 200ms`.
