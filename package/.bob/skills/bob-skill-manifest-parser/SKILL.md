---
name: bob-skill-manifest-parser
description: Autonomous flashmvp.json repository manifest parsing and port routing skill for IBM Bob 2.0 Agent Mode.
---

# IBM Bob 2.0 Skill: Repository Manifest Parser

## Overview

Equips **IBM Bob 2.0 Agent Mode** to read, parse, and validate `flashmvp.json` repository manifests, extracting service definitions, container build targets, HTTP ingress ports, and subagent assignments.

## When to Use

- Initializing a project environment on IBM Cloud.
- Reading container service port mappings (e.g. `frontend: 3000`, `backend: 8000`).
- Validating required IBM Bob skill modules declared in the manifest.

## Executable Skill Commands

```bash
# Parse and validate flashmvp.json repository manifest
bob run skill:bob-skill-manifest-parser --file=flashmvp.json
```

## Boundaries & Safety Rules

- **Always** ensure required service ports do not conflict with existing IBM Code Engine container ingress bounds.
