# Architecture Decision Record (ADR) 0002: Dual-Mode Execution Strategy (Real Engine vs. 24/7 Interactive Demo Mode)

| Metadata | Details |
| :--- | :--- |
| **Status** | Accepted |
| **Date** | 2026-09-25 |
| **Authors** | FlashMVP Architecture Team |
| **Deciders** | Platform Core Team |
| **Relates To** | ADR 0001, PRD §2.4, Backlog `50-container-playground-observability` |

---

## 1. Context & Problem Statement

To guarantee 100% uptime for anonymous judges visiting `https://flashmvp.vercel.app` 24 hours a day without keeping physical laptop hardware powered on continuously or risking cloud quota limits, FlashMVP requires a fallback execution mode.

During live pitch video recording, real Docker container builds, real Supabase schema creation (`< 200ms`), and real Cloudflare tunnels must execute for empirical verification. However, for 24/7 static web hosting, a simulated interactive demo mode eliminates all backend infrastructure dependencies.

---

## 2. Decision: Dual-Mode Architecture (`DEMO_MODE`)

FlashMVP implements an environment-controlled execution mode:

```python
# Environment variable: DEMO_MODE = true | false
```

### Mode 1: Real Engine Mode (`DEMO_MODE=false`)
* **Usage:** Video recording, live presentation pitch, empirical feature verification.
* **Backend:** FastAPI + Docker Engine API (`docker-py`) + Supabase PostgreSQL + `cloudflared` tunnels.
* **Execution:** Real multi-container fleets built and launched on host port `3001` and `8001`.

### Mode 2: Interactive Demo Mode (`DEMO_MODE=true`)
* **Usage:** 24/7 static hosting on Vercel for anonymous judge click-throughs.
* **Backend:** Pure frontend mock state / lightweight static API fallback.
* **Execution:**
  * **Build Terminal:** Streams realistic real-time build logs via simulated SSE poller.
  * **QA Canvas:** Animates step-by-step checkmark progress (`[✓] ESLint` ➔ `[✓] Pytest`).
  * **Playground Preview:** Loads pre-warmed interactive app preview iframe.
  * **Telemetry Charts:** Renders realistic live CPU % and RAM MB telemetry curves using Recharts.

---

## 3. Benefits & Tradeoffs

| Feature | Real Engine Mode (`DEMO_MODE=false`) | Interactive Demo Mode (`DEMO_MODE=true`) |
| :--- | :--- | :--- |
| **Primary Use Case** | Video Pitch & Live Demos | 24/7 Anonymous Judge Testing |
| **Hardware Required** | Local Laptop or GCP VPS | **None (100% Vercel hosted)** |
| **Execution Reality** | 100% Real Containers & Database | Ultra-fast Simulated Interactive UI |
| **Risk of Server Outage** | Low (Requires server/laptop) | **0% Zero Risk** |
| **Response Latency** | ~2-4s container build | **Sub-second (Instant)** |

---

## 4. Implementation Steps

1. **Frontend (`client/src/config.js`):** Export `isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'`.
2. **Mock Fallback Layer (`client/src/mocks/`):** Provide realistic mock datasets for `sddMock.json`, `containerMock.json`, and `qaMock.json`.
3. **Deployment Pipeline:**
   * Production Vercel deploy: Set `VITE_DEMO_MODE=true`.
   * Video Recording / Dev environment: Set `VITE_DEMO_MODE=false`.
