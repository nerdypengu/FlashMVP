# Feature Overview: Integrated Application Infrastructure
> **Directory:** `docs/backlogs/20-application-infrastructure/`

---

## 💡 Purpose & Summary
Automates the instant provisioning of a live PostgreSQL database schema inside Supabase (`< 200ms`) and manages an encrypted environment secrets vault (`.env` keys & API keys).

---

## 📄 Backlog Items Index

| Backlog ID | Title | Role | Scope | File Link |
| :--- | :--- | :--- | :--- | :--- |
| **BL-INF-01** | Supabase Dynamic Schema Provisioner | **BE** | Async PostgreSQL SQL runner executing `CREATE SCHEMA app_xxxx` | 📄 [BL-INF-01](file:///f:/Hackathon/FlashMVP/docs/backlogs/20-application-infrastructure/BL-INF-01-supabase-dynamic-schema-provisioner.md) |
| **BL-INF-02** | Encrypted Secrets Vault & Env Modal | **BE / FE** | Encrypted key-value store `/api/v1/projects/{id}/env` & React modal | 📄 [BL-INF-02](file:///f:/Hackathon/FlashMVP/docs/backlogs/20-application-infrastructure/BL-INF-02-encrypted-secrets-vault-and-env-modal.md) |
