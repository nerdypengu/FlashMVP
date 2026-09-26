# IBM Bob 2.0 Environment Skill Package & Onboarding Bundle

This folder (`/package`) contains the pre-packaged **IBM Bob 2.0 Environment Skills**, spec-driven documentation structures, and manifest files ready for direct injection into target GitHub repositories.

---

## 📦 Injected Folder Structure

```text
package/
├── .bob/
│   └── skills/
│       ├── bob-skill-code-engine/       # IBM Code Engine container builds & deployment
│       ├── bob-skill-cloud-db/           # IBM PostgreSQL schema migrations
│       ├── bob-skill-secrets-vault/      # IBM Secrets Manager key proxy
│       ├── bob-skill-watsonx-qa/         # Watsonx AI security & test auditor
│       └── bob-skill-manifest-parser/    # flashmvp.json repository manifest parser
├── docs/
│   ├── prd.md                            # Product Requirements Document
│   └── architecture-system-design.md    # System Design & Subagent Topology
├── flashmvp.json                         # Container build & port manifest
└── .watsonx-qa.yml                       # Watsonx QA pipeline configuration
```

---

## ⚡ How It Works

1. **GitHub Injection**: When a user creates a new project in FlashMVP, the platform pushes the contents of `/package` directly into the user's GitHub repository.
2. **IBM Bob 2.0 Onboarding**: IBM Bob 2.0 reads `.bob/skills/` and `flashmvp.json` to gain full infrastructure capabilities.
3. **1-Click Spec-to-Release**: IBM Bob autonomously executes tests, provisions IBM PostgreSQL schemas, and deploys container fleets to IBM Code Engine.
