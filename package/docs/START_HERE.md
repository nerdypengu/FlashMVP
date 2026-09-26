# Project Onboarding & Navigation Guide for IBM Bob 2.0

Welcome! This repository has been provisioned with the **FlashMVP IBM Bob 2.0 Skill Package**.

---

## 🤖 IBM Bob 2.0 Agent Quickstart

IBM Bob 2.0 Agent Mode uses the pre-built environment skills in `.bob/skills/` to autonomously manage database schemas, security testing, documentation, and container deployment on IBM Cloud.

### Core Documentation Structure & Folder Usages

| File / Directory | Purpose & Agent Usage |
| :--- | :--- |
| [docs/prd.md](file:///f:/Hackathon/FlashMVP/package/docs/prd.md) | **Product Requirements**: Primary goals, target users, and acceptance criteria. |
| [docs/requirements/](file:///f:/Hackathon/FlashMVP/package/docs/requirements/) | **Requirements Specifications**: Detailed functional (FR) and non-functional (NFR) specs. |
| [docs/architecture-system-design.md](file:///f:/Hackathon/FlashMVP/package/docs/architecture-system-design.md) | **System Architecture**: High-level component topology, containers, and data flows. |
| [docs/backlogs/](file:///f:/Hackathon/FlashMVP/package/docs/backlogs/) | **Task Backlogs**: Structured task checklists for agent execution and progress tracking. |
| [docs/decisions/](file:///f:/Hackathon/FlashMVP/package/docs/decisions/) | **Architecture Decisions**: ADR records documenting technical trade-offs and decisions. |
| [docs/knowledge/](file:///f:/Hackathon/FlashMVP/package/docs/knowledge/) | **Domain Knowledge**: Knowledge Items (KIs), API contracts, and integration patterns. |
| [flashmvp.json](file:///f:/Hackathon/FlashMVP/package/flashmvp.json) | Container ports, build targets & IBM skill declarations. |
| [.watsonx-qa.yml](file:///f:/Hackathon/FlashMVP/package/.watsonx-qa.yml) | Automated QA & Security testing pipeline config. |

---

## 🛠️ Loaded Environment Skills (`.bob/skills/`)

- `bob-skill-sdd-docs`: Autonomous Spec-Driven Development (SDD) documentation & structure generator.
- `bob-skill-code-engine`: Container fleet builds & IBM Code Engine deployment.
- `bob-skill-cloud-db`: PostgreSQL schema creation & migration execution.
- `bob-skill-secrets-vault`: IBM Secrets Manager zero-trust key proxying.
- `bob-skill-watsonx-qa`: Automated ESLint, Pytest, and Watsonx AI security leak auditor.
- `bob-skill-manifest-parser`: Parses repository `flashmvp.json`.
