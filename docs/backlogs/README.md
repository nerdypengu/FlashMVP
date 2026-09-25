# FlashMVP Feature Backlogs & Architecture System
> **Feature-Driven & Layer-Separated Directory System** | Backend (`backend/`) & Frontend (`frontend/`) Subdirectories

Welcome to the **FlashMVP Backlog System**. Tasks are structured by **Feature Domain Directories**, matching modern spec-driven enterprise standards (as exemplified in `docs/example`).

Inside every feature folder, backlog items are cleanly partitioned into **`backend/`** and **`frontend/`** subdirectories:

```
docs/backlogs/
├── 10-specs-driven-development/
│   ├── 00-design-specs-driven-development.md
│   ├── 00-overview.md
│   ├── backend/
│   │   ├── BL-SDD-01-ai-drafting-engine-and-prompt-parser.md
│   │   └── BL-SDD-03-revision-loop-and-approval-locking-api.md
│   └── frontend/
│       ├── BL-SDD-02-three-part-artifact-review-interface.md
│       └── BL-SDD-03-revision-loop-and-approval-locking-ui.md
├── 20-application-infrastructure/
│   ├── 00-design-application-infrastructure.md
│   ├── 00-overview.md
│   ├── backend/
│   │   ├── BL-INF-01-supabase-dynamic-schema-provisioner.md
│   │   └── BL-INF-02-encrypted-secrets-vault-api.md
│   └── frontend/
│       └── BL-INF-02-environment-variables-modal-ui.md
├── 30-expandable-architecture/
│   ├── 00-design-expandable-architecture.md
│   ├── 00-overview.md
│   ├── backend/
│   │   ├── BL-ARC-01-starter-template-generator-engine.md
│   │   ├── BL-ARC-02-flashmvp-json-manifest-parser.md
│   │   └── BL-ARC-03-multi-container-docker-network-orchestrator.md
│   └── frontend/
│       └── BL-ARC-01-starter-template-selector-ui.md
├── 40-qa-pipeline-workflow/
│   ├── 00-design-qa-pipeline-workflow.md
│   ├── 00-overview.md
│   ├── backend/
│   │   └── BL-QA-03-workflow-run-history-api.md
│   └── frontend/
│       ├── BL-QA-01-interactive-visual-node-canvas.md
│       ├── BL-QA-02-context-menu-and-custom-step-builder.md
│       └── BL-QA-03-workflow-run-history-and-detail-inspector-ui.md
├── 50-container-playground-observability/
│   ├── 00-design-container-playground-observability.md
│   ├── 00-overview.md
│   ├── backend/
│   │   ├── BL-PLAY-02-cloudflare-quick-tunnel-manager.md
│   │   └── BL-PLAY-04-container-telemetry-and-sse-log-streamer-api.md
│   └── frontend/
│       ├── BL-PLAY-01-embedded-iframe-playground-and-viewport-controls.md
│       ├── BL-PLAY-03-multi-service-switcher-toolbar.md
│       └── BL-PLAY-04-container-fleet-telemetry-and-log-viewer-ui.md
└── 60-xapphub-management-portal/
    ├── 00-design-xapphub-management-portal.md
    ├── 00-overview.md
    ├── backend/
    │   └── BL-HUB-01-central-application-catalog-api.md
    └── frontend/
        ├── BL-HUB-01-central-application-catalog-ui.md
        └── BL-HUB-02-access-control-and-adoption-analytics-ui.md
```

---

## 👥 How Backend & Frontend Engineers Pick Up Work

* **Backend Engineers (`server/`):** Look inside any feature's `backend/` folder. Every file details API endpoints, Pydantic schemas, Python service locations, and `uvicorn`/Swagger test steps.
* **Frontend Engineers (`client/`):** Look inside any feature's `frontend/` folder. Every file details React component paths, JSX layout specs, state props, and `npm run dev` browser test steps.
