---
name: bob-skill-code-engine
description: Autonomous IBM Cloud Code Engine serverless container deployment and fleet management skill for IBM Bob 2.0 Agent Mode.
---

# IBM Bob 2.0 Skill: IBM Cloud Code Engine Container Fleet Deployer

## Overview

Equips **IBM Bob 2.0 Agent Mode** with the capability to autonomously compile multi-stage Docker container fleets, push image artifacts, and launch serverless container applications directly on **IBM Cloud Code Engine** without manual web console intervention.

## Target IBM Infrastructure

* **Service**: IBM Cloud Code Engine
* **Region**: `us-south` (Dallas) / `eu-gb` (London)
* **Resource Group**: `Default`
* **Scale Range**: Min `0` (Serverless scale-to-zero) ➔ Max `10` instances

## When to Use

- Deploying a newly scaffolded project from `flashmvp.json` manifest.
- Performing rolling container updates following code edits or PR merges.
- Scaling container replicas and configuring ingress HTTP/HTTPS public routes.

## Executable Skill Commands

```bash
# Compile and deploy multi-container application to IBM Cloud Code Engine
bob run skill:bob-skill-code-engine --action=deploy --manifest=flashmvp.json

# Check Code Engine container fleet status and ingress URL
bob run skill:bob-skill-code-engine --action=status --project-id=proj_8f92a
```

## Boundaries & Safety Rules

- **Always** verify Dockerfile multi-stage builds before pushing image layers.
- **Never** expose unencrypted internal container ports directly to public ingress.
- **Always** map container environment variables via `bob-skill-secrets-vault`.
