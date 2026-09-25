# Integrated Application Infrastructure — Design Specification

| Header | Details |
| :--- | :--- |
| **Author** | FlashMVP Architecture Team |
| **Status** | Approved for Implementation |
| **Implements** | PRD §2.2 (FR2: Database Isolation & Infrastructure) |
| **Implemented by** | `BL-INF-01` (Supabase Schema Provisioner, BE) · `BL-INF-02` (Encrypted Secrets Vault & Env Modal, BE/FE) |

---

## 1. Feature Overview & Purpose

The Integrated Application Infrastructure feature automates the instant provisioning of a isolated PostgreSQL database schema inside a pre-created Supabase project (`< 200ms`) and manages encrypted project environment variables and API keys (`.env`).

This eliminates manual cloud setup and gives developers and AI coding agents an immediately functional, isolated runtime and datastore target.

---

## 2. Supabase Multi-Schema Isolation Strategy

Instead of calling the Supabase Management API to create a full cloud project (which takes 60-120 seconds), FlashMVP uses **PostgreSQL Schema Isolation** within a single pre-provisioned Supabase instance:

```sql
-- Executed asynchronously upon project creation (< 200ms)
CREATE SCHEMA IF NOT EXISTS app_proj_8f92a;

-- Seed project tables within the isolated schema
CREATE TABLE IF NOT EXISTS app_proj_8f92a.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 3. Infrastructure Lifecycle States

```
                 ┌─────────────────┐
                 │  unprovisioned  │  Project created
                 └────────┬────────┘
                          │
                          ▼
                 ┌─────────────────┐
                 │   provisioning  │  Executing SQL CREATE SCHEMA app_xxxx
                 └────────┬────────┘
                          │
             ┌────────────┴────────────┐
             ▼                         ▼
   ┌───────────────────┐     ┌───────────────────┐
   │       ready       │     │     degraded      │  Failed retry trigger
   └───────────────────┘     └───────────────────┘
```

| State | Meaning |
| :--- | :--- |
| `unprovisioned` | Project registered, database creation pending. |
| `provisioning` | Executing async SQL `CREATE SCHEMA app_xxxx`. |
| `ready` | Schema initialized, base tables created, secrets stored. |
| `degraded` | Database error occurred; retry action available in UI. |

---

## 4. Encrypted Secrets Management Vault

Environment keys (`OPENAI_API_KEY`, `STRIPE_SECRET_KEY`, `DATABASE_URL`) are encrypted at rest using envelope encryption.

### Target Scoping Rules:
* `ALL`: Injected into both frontend and backend container runtimes.
* `FRONTEND`: Injected only into frontend container (`VITE_*` / `NEXT_PUBLIC_*`).
* `BACKEND`: Injected only into backend container.

---

## 5. API Surface & RPC Schema

### Endpoints Table:
| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/projects/create` | BE | Provisions isolated Supabase schema `app_{id}` & returns metadata (`< 200ms`). |
| `GET` | `/api/v1/projects/{id}/env` | BE | Returns list of environment variables for container injection. |
| `POST` | `/api/v1/projects/{id}/env` | BE/FE | Saves encrypted environment variables from React Env Modal. |

---

## 6. Edge Cases & Verification Criteria

| # | Edge Case | Expected Behavior |
| :--- | :--- | :--- |
| **E1** | Schema name collision | Generates unique UUID suffix: `app_{name}_{uuid_fragment}`. |
| **E2** | Supabase database connection timeout | Retries up to 3 times with exponential backoff before setting state to `degraded`. |
| **E3** | Special characters in secret keys | Encrypts raw string without breaking shell escaping in Docker `-e` flags. |

---

## 7. Acceptance Criteria for Implementing Items

* **BL-INF-01 (Backend):** `POST /api/v1/projects/create` creates PostgreSQL schema `app_{id}` and returns `{ status: "ready", execution_time_ms: 180 }`.
* **BL-INF-02 (Fullstack):** React Env Modal saves secret key-value pairs to `/api/v1/projects/{id}/env`, displaying password show/hide toggles and scoping indicators.
