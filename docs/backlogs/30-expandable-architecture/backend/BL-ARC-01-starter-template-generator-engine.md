# Backlog Item: BL-ARC-01 - Starter Template Generator Engine
> **Feature:** Expandable Architecture | **Layer:** Backend (`server/app/services/template_service.py`)

---

## 🎯 Task Objective
Build the template generator service that initializes project scaffolding (`React + FastAPI`, `Next.js + Go`) and local Git repository structure.

---

## 🛠️ File Locations & Component Specs
* **Generator Service:** `server/app/services/template_service.py`
* **Templates Directory:** `server/templates/`

---

## 📝 Implementation Tasks
1. Create starter template zip/directory scaffolds in `server/templates/react-fastapi/`.
2. Include `.gitignore`, standard directory layout, and baseline Dockerfiles (`Dockerfile.frontend`, `Dockerfile.backend`).
3. Build generator method `scaffold_project(template_name, project_path)` initializing local Git repository.

---

## 🧪 How to Test (Backend)
1. Run python test script calling `scaffold_project("react-fastapi", "/tmp/test_proj")`.
2. Verify output directory contains scaffolded files and `.git` directory.
