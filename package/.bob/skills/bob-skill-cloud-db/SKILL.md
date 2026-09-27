---
name: bob-skill-cloud-db
description: Autonomous IBM Cloud Databases for PostgreSQL schema provisioning and migration skill for IBM Bob 2.0 Agent Mode.
---

# IBM Bob 2.0 Skill: IBM Cloud DB PostgreSQL Schema Provisioner

## Overview

Enables **IBM Bob 2.0 Agent Mode** to provision isolated PostgreSQL multi-tenant database schemas, execute DDL schema migrations, and manage SSL database connection strings on **IBM Cloud Databases for PostgreSQL**.

## Target IBM Infrastructure

* **Service**: IBM Cloud Databases for PostgreSQL
* **SSL Requirement**: Mandatory TLS/SSL (`sslmode=require`)
* **Schema Pattern**: `app_{project_id}` (Isolated tenant schema)

## When to Use

- Initializing a new PostgreSQL database schema for a project.
- Executing SQL migrations generated during Spec-Driven Development (SDD).
- Configuring pool size and connection string secrets.

## Executable Skill Commands

```bash
# Provision isolated PostgreSQL tenant schema
bob run skill:bob-skill-cloud-db --action=provision --project-id=proj_8f92a

# Execute SQL DDL migration files
bob run skill:bob-skill-cloud-db --action=migrate --schema=app_8f92a --file=docs/schema.sql
```

## Boundaries & Safety Rules

- **Always** execute migrations inside isolated tenant schemas (`CREATE SCHEMA IF NOT EXISTS app_<id>`).
- **Never** drop production database tables without explicit user sign-off.
- **Always** store connection strings inside IBM Secrets Manager via `bob-skill-secrets-vault`.
