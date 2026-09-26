# System Architecture & Technical Design

## 1. Overview

This document details the multi-container fleet topology, IBM Cloud integration, and subagent task delegation for this application.

---

## 2. IBM Bob Subagent Swarm Topology

```mermaid
graph TD
    User[Developer / User] -->|Prompts / Commits| Bob[IBM Bob 2.0 Agent Mode]
    Bob -->|Reads Specs & Manifest| Docs[docs/ & flashmvp.json]
    Bob -->|Skill: bob-skill-cloud-db| DB[IBM Cloud DB PostgreSQL]
    Bob -->|Skill: bob-skill-watsonx-qa| QA[Watsonx Security & Test Inspector]
    Bob -->|Skill: bob-skill-secrets-vault| Vault[IBM Secrets Manager]
    Bob -->|Skill: bob-skill-code-engine| CE[IBM Cloud Code Engine Fleet]
```

---

## 3. Technology Stack

* **Frontend**: React 18 + TypeScript + Vite
* **Backend**: FastAPI Python 3.11 + Pydantic + Uvicorn
* **Database**: IBM Cloud Databases for PostgreSQL (Schema `app_<id>`)
* **Deployment**: IBM Cloud Code Engine (Region `us-south`)
