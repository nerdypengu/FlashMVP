---
name: bob-skill-secrets-vault
description: Zero-trust environment secret & API token vault proxy skill for IBM Bob 2.0 Agent Mode connected to IBM Secrets Manager.
---

# IBM Bob 2.0 Skill: IBM Secrets Manager Vault Proxy

## Overview

Allows **IBM Bob 2.0 Agent Mode** to securely read, encrypt, and inject environment variables (e.g. database credentials, JWT secrets, Stripe API keys) from **IBM Secrets Manager** directly into IBM Code Engine container deployments without committing secrets into code repositories.

## Target IBM Infrastructure

* **Service**: IBM Secrets Manager
* **Encryption**: AES-256 GCM
* **Secret Engine**: Arbitrary Secrets & Key-Value Pairs

## Executable Skill Commands

```bash
# Encrypt and vault project environment secrets
bob run skill:bob-skill-secrets-vault --action=set --key=DATABASE_URL --value=postgres://...

# Inject secrets into container runtime
bob run skill:bob-skill-secrets-vault --action=inject --target=code-engine
```

## Boundaries & Safety Rules

- **Never** write plain-text secrets into `.env` files committed to Git.
- **Always** reference secrets via `secret:name` placeholders in `flashmvp.json`.
