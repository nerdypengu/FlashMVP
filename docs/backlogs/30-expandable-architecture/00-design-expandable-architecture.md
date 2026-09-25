# Expandable Architecture — Design Specification

| Header | Details |
| :--- | :--- |
| **Author** | FlashMVP Architecture Team |
| **Status** | Approved for Implementation |
| **Implements** | PRD §2.3 (FR3: Expandable Full-Stack Architecture) |
| **Implemented by** | `BL-ARC-01` (Template Generator Engine, BE) · `BL-ARC-02` (Manifest Parser, BE) · `BL-ARC-03` (Multi-Container Network Runner, BE) |

---

## 1. Feature Overview & Purpose

The Expandable Architecture feature enables users to scaffold production-ready full-stack applications (`React + FastAPI`, `Next.js + Go`) with clean separation of concerns, connecting to an isolated database schema and driven by a lightweight repository manifest (`flashmvp.json`).

---

## 2. Manifest Schema (`flashmvp.json`)

Every generated repository contains a `flashmvp.json` manifest defining container services, build dockerfiles, ports, and QA pipeline steps:

```json
{
  "name": "my-saas-app",
  "template": "react-fastapi",
  "database": {
    "schema": "app_my_saas_8f92a"
  },
  "services": [
    { "name": "frontend", "dockerfile": "Dockerfile.frontend", "port": 3000 },
    { "name": "backend", "dockerfile": "Dockerfile.backend", "port": 8000 }
  ],
  "qa_pipeline": [
    { "id": "lint", "name": "ESLint Check", "command": "npm run lint" },
    { "id": "test", "name": "Pytest Suite", "command": "pytest" },
    { "id": "security", "name": "Secret Scanner", "command": "python scan_secrets.py" }
  ]
}
```

---

## 3. Multi-Container Docker Network Architecture

```mermaid
flowchart TD
    subgraph Isolated_Docker_Bridge_Network ["Isolated Docker Network: net_{project_id}"]
        FrontendContainer["🌐 Frontend Container\nName: frontend_{id}\nHost Port: 3001 | Container Port: 3000"]
        BackendContainer["⚙️ Backend Container\nName: backend_{id}\nHost Port: 8001 | Container Port: 8000"]
    end

    subgraph Datastore ["Database Layer"]
        SupabaseDB[(Supabase PostgreSQL\nSchema: app_{project_id})]
    end

    FrontendContainer -->|Internal Network: http://backend:8000| BackendContainer
    BackendContainer -->|Async Pool| SupabaseDB
```

---

## 4. Execution Flow

1. **Scaffolding:** `BL-ARC-01` copies starter template files (`react-fastapi`) and initializes local Git repo.
2. **Parsing:** `BL-ARC-02` reads `flashmvp.json` manifest.
3. **Container Fleet Launch:** `BL-ARC-03` creates isolated Docker bridge network `net_{project_id}`, builds images, and launches `frontend` and `backend` containers with injected environment variables.

---

## 5. API Surface & Endpoints

| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/projects/scaffold` | BE | Scaffolds starter template and initializes Git repo. |
| `POST` | `/api/v1/projects/{id}/manifest` | BE | Parses and validates `flashmvp.json`. |
| `POST` | `/api/v1/projects/{id}/fleet` | BE | Provisions Docker bridge network & launches container fleet. |

---

## 6. Edge Cases & Verification Criteria

| # | Edge Case | Expected Behavior |
| :--- | :--- | :--- |
| **E1** | Port collision on host (port 3001 occupied) | Dynamically assigns next available port (e.g. 3002). |
| **E2** | Missing `Dockerfile` in repository | Generates default fallback Dockerfile based on template type. |
| **E3** | Container crash on startup | Captures exit code, updates status to `CRASHED`, and streams stderr log trace. |

---

## 7. Acceptance Criteria for Implementing Items

* **BL-ARC-01 (Backend):** Template generator scaffolds valid React + FastAPI codebase with Git repository setup.
* **BL-ARC-02 (Backend):** Manifest parser validates `flashmvp.json` schemas and extracts service declarations.
* **BL-ARC-03 (Backend):** Docker service creates bridge network `net_{id}` and launches multi-container fleet returning dynamic host ports.
