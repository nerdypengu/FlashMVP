# Backlog Item: BL-ARC-02 - flashmvp.json Manifest Parser
> **Feature:** Expandable Architecture | **Layer:** Backend (`server/app/services/manifest_parser.py`)

---

## 🎯 Task Objective
Implement the parser for `flashmvp.json` configuration manifest files present in user project repositories.

---

## 🛠️ File Locations & Component Specs
* **Parser Service:** `server/app/services/manifest_parser.py`

---

## 📝 Implementation Tasks
1. Build JSON parser reading `flashmvp.json` manifest:
   ```json
   {
     "name": "my-app",
     "template": "react-fastapi",
     "database": { "schema": "app_my_app_8f92a" },
     "services": [
       { "name": "frontend", "dockerfile": "Dockerfile.frontend", "port": 3000 },
       { "name": "backend", "dockerfile": "Dockerfile.backend", "port": 8000 }
     ],
     "qa_pipeline": [
       { "id": "lint", "name": "ESLint", "command": "npm run lint" },
       { "id": "test", "name": "Pytest", "command": "pytest" }
     ]
   }
   ```
2. Validate service definitions and QA pipeline step declarations.

---

## 🧪 How to Test (Backend)
1. Run pytest on `manifest_parser.py` with mock `flashmvp.json` -> verify object validation succeeds.
