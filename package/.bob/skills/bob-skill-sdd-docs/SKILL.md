---
name: bob-skill-sdd-docs
description: Autonomous Spec-Driven Development (SDD) documentation structure generation skill for IBM Bob 2.0 Agent Mode.
---

# IBM Bob 2.0 Skill: Spec-Driven Documentation Architect

## Overview

Equips **IBM Bob 2.0 Agent Mode** with the capability to autonomously structure, draft, and maintain high-fidelity Spec-Driven Development (SDD) documentation across `docs/prd.md`, `docs/requirements/`, `docs/architecture-system-design.md`, `docs/backlogs/`, `docs/decisions/`, and `docs/knowledge/`.

## Folder Usages & Document Mapping

| Path | Primary Purpose | Agent Workflow Guidance |
| :--- | :--- | :--- |
| `docs/prd.md` | Product Requirements Document | High-level product vision, key capabilities, target audience, and out-of-scope boundaries. Read first when understanding new project scope. |
| `docs/requirements/` | Functional & Non-Functional Specifications | Granular requirement definitions (FR/NFR matrix). Check when validating feature specifications and system boundaries. |
| `docs/architecture-system-design.md` | System & Technical Design | Architecture diagrams, component interactions, container topologies, and IBM Cloud service bindings. |
| `docs/backlogs/` | Task Execution Backlogs | Itemized task breakdown (`01-feature-backlog.md`). Read to determine current task execution state (`[ ]`, `[-]`, `[x]`). |
| `docs/decisions/` | Architecture Decision Records (ADRs) | Immutable records of architectural choices, trade-offs, and technology stack selections (`0001-architecture-decisions.md`). |
| `docs/knowledge/` | Domain Knowledge Items (KIs) | Reusable domain context, API payload contracts, and integration patterns (`0001-domain-knowledge.md`). |

## When to Use

- **Project Scaffolding:** Initializing full SDD documentation structure for new repositories.
- **Task Execution Tracking:** Updating task statuses in `docs/backlogs/` as features are implemented.
- **Recording ADRs:** Documenting architectural choices and service selections in `docs/decisions/`.
- **Capturing Domain Knowledge:** Saving reusable API patterns or schema definitions in `docs/knowledge/`.

## Executable Skill Commands

```bash
# Scaffold complete SDD documentation suite (PRD, Requirements, Architecture, Backlogs, ADRs, KIs)
bob run skill:bob-skill-sdd-docs --action=scaffold-docs

# Record a new Architecture Decision Record (ADR)
bob run skill:bob-skill-sdd-docs --action=create-adr --title="PostgreSQL Multi-Tenancy Strategy"

# Create a new Domain Knowledge Item (KI)
bob run skill:bob-skill-sdd-docs --action=create-ki --title="IBM Cloud Secrets Manager Integration"
```

## Boundaries & Safety Rules

- **Always** verify requirements in `docs/requirements/` before generating complex application code.
- **Always** mark task items in `docs/backlogs/` as `[x]` upon successful automated QA verification.
- **Never** leave out-of-scope items ambiguous; explicitly document boundaries in `docs/prd.md`.
