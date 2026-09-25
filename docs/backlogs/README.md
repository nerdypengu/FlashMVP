# FlashMVP Feature Backlogs — IBM Bob 2.0 Environment Skill Pack
> **Platform:** Zero-Learning Developer Middleware Proxy for IBM Cloud Tools  
> **Structure:** Feature-Driven Directories | Backend (`backend/`) & Frontend (`frontend/`) per Feature  
> **Team:** 4 Engineers working in parallel

---

## 👥 4-Person Team Workload & Role Distribution

| 👤 Engineer | Role Title | Domain | Assigned Backlogs |
| :--- | :--- | :--- | :--- |
| 🎨 **Person 1** | Lead Frontend & SDD UX Architect | `client/` — App Shell, IBM Bob Header, SDD 3-Part Reviewer | `BL-SDD-02`, `BL-SDD-03-ui`, `BL-ARC-01-ui` |
| 📊 **Person 2** | QA Canvas & Observability Specialist | `client/` — Visual QA Canvas, Playground, Telemetry | `BL-QA-01`, `BL-QA-02`, `BL-QA-03-ui`, `BL-PLAY-01`, `BL-PLAY-03`, `BL-PLAY-04-ui` |
| 🤖 **Person 3** | IBM Agent Engine & Core Skills Engineer | `server/` — Bob Agent Core, SDD Prompt Engine, Watsonx QA Skill | `BL-SDD-01`, `BL-SDD-03-api`, `BL-QA-03-api` |
| ☁️ **Person 4** | IBM Cloud Infra & Skill Pack Orchestrator | `server/` — bob-skill-cloud-db, bob-skill-code-engine, bob-skill-secrets-vault, DEMO_MODE router | `BL-INF-01`, `BL-INF-02`, `BL-ARC-01-be`, `BL-ARC-02`, `BL-ARC-03`, `BL-PLAY-02`, `BL-PLAY-04-api`, `BL-HUB-01` |

---

## 🛠️ IBM Bob 2.0 Environment Skills (Feature → Skill Mapping)

| Bob 2.0 Skill | IBM Target Service | Feature Backlog |
| :--- | :--- | :--- |
| `bob-skill-manifest-parser` | Document Understanding / SDD | `10-specs-driven-development` |
| `bob-skill-cloud-db` | IBM Cloud Databases for PostgreSQL | `20-application-infrastructure` |
| `bob-skill-secrets-vault` | IBM Secrets Manager | `20-application-infrastructure` |
| `bob-skill-code-engine` | IBM Cloud Code Engine & Docker | `30-expandable-architecture` |
| `bob-skill-watsonx-qa` | IBM Watsonx Security Audit | `40-qa-pipeline-workflow` |
| *(observability built-in)* | SSE Streaming & Recharts Telemetry | `50-container-playground-observability` |

---

## 📂 Full Backlog Directory Map

```
docs/backlogs/
├── README.md                                  ◄ YOU ARE HERE
│
├── 10-specs-driven-development/               🤖 Person 3 (BE) + 🎨 Person 1 (FE)
│   ├── 00-overview.md
│   ├── backend/
│   │   ├── BL-SDD-01-ai-drafting-engine-and-prompt-parser.md       [Person 3]
│   │   └── BL-SDD-03-revision-loop-and-approval-locking-api.md     [Person 3]
│   └── frontend/
│       ├── BL-SDD-02-three-part-artifact-review-interface.md       [Person 1]
│       └── BL-SDD-03-revision-loop-and-approval-locking-ui.md      [Person 1]
│
├── 20-application-infrastructure/             ☁️ Person 4 (BE) + 🎨 Person 1 (FE)
│   ├── 00-overview.md
│   ├── backend/
│   │   ├── BL-INF-01-ibm-cloud-db-schema-provisioner.md            [Person 4]
│   │   └── BL-INF-02-encrypted-secrets-vault-api.md                [Person 4]
│   └── frontend/
│       └── BL-INF-02-environment-variables-modal-ui.md             [Person 1]
│
├── 30-expandable-architecture/                ☁️ Person 4 (BE) + 🎨 Person 1 (FE)
│   ├── 00-overview.md
│   ├── backend/
│   │   ├── BL-ARC-01-starter-template-generator-engine.md          [Person 4]
│   │   ├── BL-ARC-02-flashmvp-json-manifest-parser.md              [Person 4]
│   │   └── BL-ARC-03-multi-container-docker-network-orchestrator.md [Person 4]
│   └── frontend/
│       └── BL-ARC-01-starter-template-selector-ui.md               [Person 1]
│
├── 40-qa-pipeline-workflow/                   🤖 Person 3 (BE) + 📊 Person 2 (FE)
│   ├── 00-overview.md
│   ├── backend/
│   │   └── BL-QA-03-workflow-run-history-api.md                    [Person 3]
│   └── frontend/
│       ├── BL-QA-01-interactive-visual-node-canvas.md              [Person 2]
│       ├── BL-QA-02-context-menu-and-custom-step-builder.md        [Person 2]
│       └── BL-QA-03-workflow-run-history-and-detail-inspector-ui.md [Person 2]
│
├── 50-container-playground-observability/     ☁️ Person 4 (BE) + 📊 Person 2 (FE)
│   ├── 00-overview.md
│   ├── backend/
│   │   ├── BL-PLAY-02-cloudflare-quick-tunnel-manager.md           [Person 4]
│   │   └── BL-PLAY-04-container-telemetry-and-sse-log-streamer-api.md [Person 4]
│   └── frontend/
│       ├── BL-PLAY-01-embedded-iframe-playground-and-viewport-controls.md [Person 2]
│       ├── BL-PLAY-03-multi-service-switcher-toolbar.md            [Person 2]
│       └── BL-PLAY-04-container-fleet-telemetry-and-log-viewer-ui.md [Person 2]
│
└── 60-xapphub-management-portal/             ☁️ Person 4 (BE) + 📊 Person 2 (FE)
    ├── 00-overview.md
    ├── backend/
    │   └── BL-HUB-01-central-application-catalog-api.md           [Person 4]
    └── frontend/
        ├── BL-HUB-01-central-application-catalog-ui.md            [Person 2]
        └── BL-HUB-02-access-control-and-adoption-analytics-ui.md  [Person 2]
```

---

## 🚀 How to Pick Up Work

1. **Find your name** in the 4-Person table above.
2. **Navigate to your assigned backlog file** (e.g. `backend/BL-SDD-01-*.md`).
3. **Read the IBM Bob Skill context** — understand which IBM Cloud service you are automating.
4. **Follow the Implementation Tasks** — file paths, code contracts, and step-by-step tasks are all pre-defined.
5. **Run the Test Guide** at the bottom of each backlog item to verify your work independently.

> **DEMO_MODE Note:** All frontend components must support `VITE_DEMO_MODE=true` — when enabled, use mock JSON data instead of live API calls so the 24/7 Vercel demo never crashes.
