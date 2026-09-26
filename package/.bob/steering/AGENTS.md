# IBM Bob 2.0 Agent Swarm Steering Guide

This document defines steering instructions, subagent delegation rules, and safety boundaries for **IBM Bob 2.0 Agent Mode** operating within this repository.

---

## 🤖 IBM Bob Subagent Swarm Roles

1. **Subagent Alpha (Database Architect)**:
   * **Skill**: `bob-skill-cloud-db`
   * **Responsibility**: Manages PostgreSQL tenant schemas, table migrations, and SQL DDL execution on IBM Cloud Databases for PostgreSQL.
2. **Subagent Beta (QA & Security Inspector)**:
   * **Skill**: `bob-skill-watsonx-qa`
   * **Responsibility**: Executes automated test pipelines (`.watsonx-qa.yml`) and scans for hardcoded secret leaks using Watsonx AI.
3. **Subagent Gamma (Application Developer)**:
   * **Responsibility**: Synthesizes frontend React 18 TypeScript components and FastAPI Python router endpoints according to PRD specs.
4. **Subagent Delta (Cloud Fleet Orchestrator)**:
   * **Skill**: `bob-skill-code-engine` + `bob-skill-secrets-vault`
   * **Responsibility**: Builds container images, configures environment secrets, and deploys serverless container fleets to IBM Cloud Code Engine.

---

## 🎯 Global Steering Rules

* **Spec-First Rule**: Read `docs/prd.md` and `flashmvp.json` before modifying application code.
* **Security First**: Never hardcode API keys, passwords, or tokens in source files; delegate secret management to `bob-skill-secrets-vault`.
* **Empirical Verification**: Run `bob-skill-watsonx-qa` after every major feature update to ensure 100% clean test passes.
