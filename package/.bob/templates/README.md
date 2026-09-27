# FlashMVP IBM Bob 2.0 Project Templates

Configuration-only template definitions for **IBM Bob 2.0 Agent Mode** application generation.

---

## 🚀 Overview

These template files define project feature sets, environment variables, directory hints, and dependencies for IBM Bob 2.0 subagent swarms:

- `minimal/template.json` — Fast prototyping & microservices setup
- `standard/template.json` — Standard full-stack web application setup
- `enterprise/template.json` — Multi-tenant enterprise app with RBAC, workflow engines, & observability

---

## 🛠️ Template Configurations

### Minimal (`minimal/template.json`)
- Single-container microservice or light React/Node backend.
- Essential database tables & zero-trust secret proxy.
- Best for: Quick prototypes, lightweight APIs.

### Standard (`standard/template.json`)
- Full-stack React + Express/FastAPI application.
- Multi-table PostgreSQL schema, file storage, and Watsonx QA testing.
- Best for: Web apps, internal tools, admin portals.

### Enterprise (`enterprise/template.json`)
- Everything in Standard plus:
- Multi-tenant data isolation, role-based access control (RBAC).
- Audit trail logging, SSE live telemetry, and IBM Cloud Code Engine auto-scaling.
- Best for: Mission-critical SaaS & enterprise platforms.

---

## 🤖 IBM Bob Agent Execution

When generating or initializing a project:
1. Bob reads the targeted `template.json` from `.bob/templates/`.
2. Generates initial SDD documentation in `docs/` using `bob-skill-sdd-docs`.
3. Provisions IBM Cloud resources (Code Engine, PostgreSQL, Secrets Vault).
4. Executes automated QA verification via `bob-skill-watsonx-qa`.
