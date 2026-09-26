# Knowledge Item 0001: IBM Cloud & Watsonx Integration Patterns

- **Topic:** Middleware Integration & Skill Pack Patterns
- **Target Systems:** IBM Cloud Code Engine, IBM Databases for PostgreSQL, IBM Cloud Secrets Manager, Watsonx Orchestrate

---

## Overview

This Knowledge Item captures domain expertise and architectural patterns for integrating IBM Bob 2.0 Agent Mode skills into IBM Cloud environments.

## Core Patterns

### 1. Skill Execution Model

Each skill in `.bob/skills/` is represented by a `SKILL.md` document containing:
- YAML frontmatter with `name` and `description`.
- Tool/Executable commands recognized by IBM Bob 2.0 Agent Swarms.
- Boundaries, safety constraints, and required env variables.

### 2. IBM Code Engine Deployment Pipeline

- Containers are built and pushed to IBM Cloud Container Registry (`icr.io`).
- Deployment is managed via `bob-skill-code-engine` using non-blocking asynchronous CLI invocations.
- Health checks and logs are streamed over Server-Sent Events (SSE).

### 3. Watsonx QA Validation Pattern

- QA test workflows are defined in `.watsonx-qa.yml`.
- Nodes represent configuration steps, API execution, and assertion steps.
- Visual status indicators map directly to step execution telemetry.
