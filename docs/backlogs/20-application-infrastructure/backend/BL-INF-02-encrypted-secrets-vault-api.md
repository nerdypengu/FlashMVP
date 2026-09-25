# BL-INF-02 — IBM Bob `bob-skill-secrets-vault`: Encrypted Secrets Vault API
> **Assigned To:** ☁️ **Person 4** — IBM Cloud Infra & Skill Pack Orchestrator  
> **Feature:** Application Infrastructure | **Layer:** Backend  
> **IBM Bob 2.0 Skill:** `bob-skill-secrets-vault` → IBM Secrets Manager  
> **File:** `server/app/bob/skill_secrets_vault.py`, `server/app/api/secrets.py`

---

## 🎯 What This Does

The `bob-skill-secrets-vault` skill enables IBM Bob Subagent Delta to:

1. Store developer-provided environment variables (`OPENAI_API_KEY`, `STRIPE_KEY`, `IBM_DB_PASSWORD`) encrypted at rest.
2. Scope secrets to `ALL`, `FRONTEND`, or `BACKEND` containers.
3. Inject secrets at container runtime via `-e KEY=VAL` flags.
4. (Optional) Sync with IBM Secrets Manager for production-grade vault.

---

## 🗂️ Files to Create

| File | Purpose |
| :--- | :--- |
| `server/app/bob/skill_secrets_vault.py` | IBM Secrets Manager Skill — encrypt/store/inject logic |
| `server/app/api/secrets.py` | FastAPI routes for secret CRUD |
| `server/app/schemas/secret.py` | Pydantic models |

---

## 💻 Pydantic Data Contract

```python
# server/app/schemas/secret.py
from pydantic import BaseModel
from typing import Literal

class SecretCreateRequest(BaseModel):
    project_id: str
    key: str                                    # "OPENAI_API_KEY"
    value: str                                  # "sk-..."
    scope: Literal["ALL", "FRONTEND", "BACKEND"] = "ALL"

class SecretResponse(BaseModel):
    project_id: str
    key: str
    scope: str
    masked_value: str                           # "sk-****"
    status: str                                 # "STORED"
```

---

## 📝 Implementation Tasks

1. Create `server/app/bob/skill_secrets_vault.py`:
   - `store_secret(project_id, key, value, scope)` — encrypts with `cryptography.fernet` and stores in memory dict (or IBM Secrets Manager API in prod).
   - `get_secrets_for_container(project_id, scope)` — returns decrypted env dict for container injection.

2. Create `server/app/api/secrets.py`:
   - `POST /api/v1/projects/{project_id}/secrets` → store secret.
   - `GET /api/v1/projects/{project_id}/secrets` → list secrets (masked values only).
   - `DELETE /api/v1/projects/{project_id}/secrets/{key}` → remove secret.

3. Integrate with Docker runner (BL-ARC-03) so secrets are injected as `-e KEY=VAL` at container launch time.

---

## 🧪 Testing & Verification

1. `POST /api/v1/projects/proj_8f92a/secrets`:
   ```json
   { "key": "OPENAI_API_KEY", "value": "sk-test-123", "scope": "BACKEND" }
   ```
2. ✅ Response shows `masked_value: "sk-****"` and `status: "STORED"`.
3. ✅ `GET /api/v1/projects/proj_8f92a/secrets` returns list of keys (no raw values exposed).
