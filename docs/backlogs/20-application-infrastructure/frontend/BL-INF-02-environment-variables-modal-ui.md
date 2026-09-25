# BL-INF-02 — Environment Variables Modal UI
> **Assigned To:** 🎨 **Person 1** — Lead Frontend & SDD UX Architect  
> **Feature:** Application Infrastructure | **Layer:** Frontend  
> **IBM Bob 2.0 Context:** UI for managing IBM Secrets Manager vault keys before IBM Code Engine deployment  
> **File:** `client/src/components/infra/SecretsModal.jsx`

---

## 🎯 What This Does

Before deploying to IBM Cloud Code Engine, developers may need to inject sensitive environment variables (API keys, IBM credentials) into their containers. This modal provides a clean UI to add, view (masked), and delete secrets — all of which are sent to `bob-skill-secrets-vault` on the backend.

---

## 🗂️ Files to Create

| File | Purpose |
| :--- | :--- |
| `client/src/components/infra/SecretsModal.jsx` | Main modal component |
| `client/src/components/infra/SecretRow.jsx` | Individual secret row with masked value |
| `client/src/components/infra/SecretsModal.css` | Styling |

---

## 🖥️ UI Layout Specification

```
┌─────────────────────────────────────────────────────────┐
│  🔐 IBM Secrets Manager — Environment Variables         │
│                                                         │
│  KEY NAME              SCOPE      VALUE       ACTION    │
│  OPENAI_API_KEY        BACKEND    sk-***      [🗑 Del]  │
│  STRIPE_KEY            FRONTEND   pk-***      [🗑 Del]  │
│  IBM_DB_PASSWORD       ALL        ***         [🗑 Del]  │
│                                                         │
│  + Add New Secret                                       │
│  Key: [______________] Scope: [ALL▼] Value: [________]  │
│                                          [💾 Save Key]  │
│                                                         │
│  [✕ Close]                    [✅ Confirm & Lock Vault] │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 Implementation Tasks

1. Create `SecretsModal.jsx`:
   - Opens as a dark glassmorphism overlay modal.
   - Lists existing secrets via `GET /api/v1/projects/{id}/secrets`.
   - "Add New Secret" row: Key input, Scope dropdown (`ALL` / `FRONTEND` / `BACKEND`), Value input, Save button.
   - Calls `POST /api/v1/projects/{id}/secrets` on save.
   - "Delete" icon calls `DELETE /api/v1/projects/{id}/secrets/{key}`.
   - "Confirm & Lock Vault" button closes modal and marks secrets as synced.

2. **DEMO_MODE:** When `isDemoMode=true`, list pre-filled mock secrets (`OPENAI_API_KEY`, `IBM_DB_PASSWORD`) without any API call.

---

## 🧪 Testing & Verification

1. ✅ Modal opens and lists existing secrets with masked values.
2. ✅ Adding a new key and saving shows it in the list immediately.
3. ✅ Deleting a key removes it from the list.
4. ✅ In `VITE_DEMO_MODE=true` → mock secrets displayed, no API calls.
