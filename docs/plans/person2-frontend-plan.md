# Person 2 — Frontend Implementation Plan
> **Role:** QA Canvas & Observability Specialist
> **Branch:** `Person2-Dev`
> **Scope:** All frontend-only components for QA Pipeline (BL-QA-01, BL-QA-02, BL-QA-03) and Container Playground & Observability (BL-PLAY-01, BL-PLAY-03, BL-PLAY-04)

---

## Top-Level Overview

The current `frontend/` is a bare Vite + TypeScript scaffold with no React installed. This plan migrates it to a React + Vite application, then implements all six frontend components assigned to Person 2 in DEMO_MODE (pure local state — no backend dependency).

All components use a shared dark glassmorphism design system (IBM Carbon color tokens). Everything runs independently without Person 3 or Person 4's backend being ready.

---

## File Map — What Will Be Created

```
frontend/
├── package.json                              ← MODIFIED: add React + Recharts deps
├── vite.config.ts                            ← CREATED: add React plugin
├── index.html                                ← MODIFIED: update root div id
├── src/
│   ├── main.tsx                              ← REPLACED: React entry point
│   ├── App.tsx                               ← CREATED: root app with tab routing
│   ├── index.css                             ← CREATED: global dark theme tokens
│   ├── mocks/
│   │   ├── qa_mock.json                      ← CREATED: mock QA step + run data
│   │   └── telemetry_mock.json               ← CREATED: mock CPU/RAM data series
│   ├── components/
│   │   ├── qa/
│   │   │   ├── QACanvas.tsx                  ← BL-QA-01 (main canvas wrapper)
│   │   │   ├── QANodeCard.tsx                ← BL-QA-01 (individual step node)
│   │   │   ├── QAConnector.tsx               ← BL-QA-01 (SVG animated arrow)
│   │   │   ├── QACanvas.css                  ← BL-QA-01 (canvas + node styles)
│   │   │   ├── ContextMenu.tsx               ← BL-QA-02 (right-click menu)
│   │   │   ├── AddStepModal.tsx              ← BL-QA-02 (add step form modal)
│   │   │   ├── RunHistoryTable.tsx           ← BL-QA-03 (Vercel-style run list)
│   │   │   └── RunDetailInspector.tsx        ← BL-QA-03 (slide-over drawer)
│   │   ├── playground/
│   │   │   ├── PlaygroundWindow.tsx          ← BL-PLAY-01 (iframe + browser chrome)
│   │   │   ├── ServiceSwitcher.tsx           ← BL-PLAY-03 (3-tab URL switcher)
│   │   │   └── LogViewer.tsx                 ← BL-PLAY-04 (SSE terminal log viewer)
│   │   └── telemetry/
│   │       └── TelemetryCharts.tsx           ← BL-PLAY-04 (Recharts CPU/RAM graphs)
```

---

## Sub-Task 1 — React Setup & Project Foundation

**Status:** `[ ] pending`

### Intent
The current scaffold is plain TypeScript with no React. Before any component can be built, React, the Vite React plugin, and Recharts must be installed and the entry point must be converted to JSX.

### Expected Outcomes
- `npm run dev` starts a React app (root `<App />` renders without errors)
- `npm run build` compiles successfully with TypeScript strict mode
- Recharts is importable

### Todo List
1. Update `frontend/package.json` — add `react`, `react-dom`, `recharts` as dependencies; add `@vitejs/plugin-react`, `@types/react`, `@types/react-dom` as devDependencies; rename scripts to use `tsx`/`jsx` entry
2. Create `frontend/vite.config.ts` — import and register `@vitejs/plugin-react`
3. Update `frontend/index.html` — change `<script src="/src/main.ts">` to `/src/main.tsx`, keep `<div id="app">`
4. Replace `frontend/src/main.ts` → `main.tsx` — mount `<App />` to `#app` with `ReactDOM.createRoot`
5. Create `frontend/src/App.tsx` — render a tab bar with four sections: `QA Pipeline`, `Run History`, `Playground`, `Telemetry`. Use local `useState` to track active tab.
6. Create `frontend/src/index.css` — define CSS custom properties: `--bg-primary`, `--glass-bg`, `--glass-border`, `--ibm-blue`, `--green-pass`, `--red-fail`, `--text-primary`

### Relevant Context
- [`frontend/package.json`](../../../frontend/package.json) — current deps (only vite + typescript)
- [`frontend/src/main.ts`](../../../frontend/src/main.ts) — current entry (plain TS, must be replaced)
- [`frontend/index.html`](../../../frontend/index.html) — script tag must point to `.tsx`

---

## Sub-Task 2 — Mock Data Files

**Status:** `[ ] pending`

### Intent
All components run in DEMO_MODE using local mock JSON. Centralizing mock data avoids duplication and makes it easy to simulate realistic pipeline runs without a backend.

### Expected Outcomes
- `qa_mock.json` contains default 3 QA steps and 5 historical run records
- `telemetry_mock.json` contains 20 time-series data points for CPU % and RAM MB

### Todo List
1. Create `frontend/src/mocks/qa_mock.json` with structure:
   - `steps`: array of `{ id, name, command, durationMs, enabled }` — 3 items: ESLint (800ms), Pytest (1200ms), Watsonx Security (600ms)
   - `runs`: array of 5 run objects matching the audit schema: `{ run_number, branch, status, duration_seconds, timestamp, step_results }`
2. Create `frontend/src/mocks/telemetry_mock.json` with structure:
   - `series`: array of 20 objects `{ time, cpu, ram }` with realistic values (CPU 5–40%, RAM 120–310 MB)

### Relevant Context
- Audit run schema: [`docs/backlogs/40-qa-pipeline-workflow/00-design-qa-pipeline-workflow.md`](../../backlogs/40-qa-pipeline-workflow/00-design-qa-pipeline-workflow.md) §4
- Telemetry endpoint shape: [`docs/backlogs/50-container-playground-observability/00-design-container-playground-observability.md`](../../backlogs/50-container-playground-observability/00-design-container-playground-observability.md) §5

---

## Sub-Task 3 — BL-QA-01: Interactive Visual QA Node Canvas

**Status:** `[ ] pending`

### Intent
Visualise the IBM Bob `bob-skill-watsonx-qa` pipeline as an animated horizontal node graph. Each step transitions through `PENDING → RUNNING → PASSED/FAILED` states. In DEMO_MODE, running the pipeline simulates the transitions using `setTimeout`.

### Expected Outcomes
- Canvas renders 3 default nodes connected by animated SVG arrows
- Clicking "Run QA" animates each node sequentially (PENDING → RUNNING → PASSED)
- Each node shows its name, status badge, and execution duration
- "Add Custom Step" button is visible at the end of the chain
- Summary bar at bottom shows total run result and duration

### Todo List
1. Create `frontend/src/components/qa/QACanvas.css` — styles for canvas wrapper, node card glassmorphism, status badge colors, running pulse animation (`@keyframes pulse-blue`), FAILED shake animation
2. Create `frontend/src/components/qa/QAConnector.tsx` — SVG `<line>` or `<path>` with animated gradient stroke; glows blue when the preceding node is `RUNNING`
3. Create `frontend/src/components/qa/QANodeCard.tsx` — props: `{ id, name, status, durationMs, enabled }`. Renders name, status badge emoji (`🟡/🔵/🟢/🔴`), duration string, and toggle switch
4. Create `frontend/src/components/qa/QACanvas.tsx`:
   - Loads steps from `qa_mock.json` into `useState`
   - `runDemoQA()` async function: loop through enabled steps, set `RUNNING`, `await sleep(durationMs)`, set `PASSED`
   - Renders horizontal row: `QANodeCard` → `QAConnector` → `QANodeCard` → ...
   - "Run QA" button triggers `runDemoQA()`
   - "Add Custom Step" button opens `AddStepModal` (BL-QA-02)
   - Summary bar: shows `Run #N — 🟢 All Passed (Xs total)` after run completes
5. Wire `QACanvas` into `App.tsx` under the `QA Pipeline` tab

### Relevant Context
- Backlog spec: [`docs/backlogs/40-qa-pipeline-workflow/frontend/BL-QA-01-interactive-visual-node-canvas.md`](../../backlogs/40-qa-pipeline-workflow/frontend/BL-QA-01-interactive-visual-node-canvas.md)
- Node lifecycle states defined in design doc §3
- Glassmorphism tokens: `rgba(255,255,255,0.06)` bg, `rgba(255,255,255,0.1)` border

---

## Sub-Task 4 — BL-QA-02: Context Menu & Add Step Modal

**Status:** `[ ] pending`

### Intent
Allow developers to right-click anywhere on the QA canvas or click the "+ Add Custom Step" button to open a context menu, then configure and append a new step node to the pipeline.

### Expected Outcomes
- Right-clicking inside QA canvas renders context menu at cursor coordinates
- Clicking outside the menu closes it
- "Add Custom QA Step" menu item opens the modal
- Submitting the modal appends a new `PENDING` node to the canvas
- DEMO_MODE: purely local state, no API call

### Todo List
1. Create `frontend/src/components/qa/ContextMenu.tsx`:
   - Props: `{ x, y, onAddStep, onRunAll, onClose }`
   - `position: fixed` at `{ top: y, left: x }`
   - Menu items: `➕ Add Custom QA Step`, `▶️ Run All Steps Now`, `🔄 Reset Pipeline`
   - Closes on `Escape` key and on outside click (`useEffect` + `mousedown` listener)
2. Create `frontend/src/components/qa/AddStepModal.tsx`:
   - Dark glassmorphism modal overlay (`position: fixed, inset: 0`)
   - Fields: Step Name (text), Command (text), Timeout (number, seconds)
   - "Cancel" closes modal; "Add to Pipeline" calls `onAdd({ id, name, command, durationMs, enabled: true, status: 'PENDING' })`
3. In `QACanvas.tsx`: add `onContextMenu` handler to canvas wrapper that sets `{ menuX, menuY, menuOpen: true }`; render `<ContextMenu>` and `<AddStepModal>` conditionally

### Relevant Context
- Backlog spec: [`docs/backlogs/40-qa-pipeline-workflow/frontend/BL-QA-02-context-menu-and-custom-step-builder.md`](../../backlogs/40-qa-pipeline-workflow/frontend/BL-QA-02-context-menu-and-custom-step-builder.md)
- Edge case E3: menu only triggers inside canvas bounds (handled by `onContextMenu` being on the canvas element only)

---

## Sub-Task 5 — BL-QA-03: Run History Table & Detail Inspector

**Status:** `[ ] pending`

### Intent
Provide a Vercel / GitHub Actions style audit log of past pipeline runs. Clicking a row opens a slide-over drawer showing archived step pass/fail states and log snapshots.

### Expected Outcomes
- Table renders 5 rows from `qa_mock.json` runs data
- Each row shows: run number, branch, status badge, duration, relative timestamp
- Clicking a row slides open a drawer from the right
- Drawer shows: run metadata + step-by-step result cards with mock log text
- Clicking outside or pressing Escape closes the drawer

### Todo List
1. Create `frontend/src/components/qa/RunHistoryTable.tsx`:
   - Loads runs from `qa_mock.json`
   - Renders `<table>` with columns: `Run`, `Branch`, `Status`, `Duration`, `When`
   - Status column: `🟢 Passed` / `🔴 Failed` badge
   - Row `onClick` → sets `selectedRun` state and opens inspector
2. Create `frontend/src/components/qa/RunDetailInspector.tsx`:
   - Props: `{ run, onClose }`
   - Slide-over drawer from right (`transform: translateX` with CSS transition)
   - Header: `Run #N — Branch: main — Status badge`
   - Body: list of `step_results` cards showing name, status, duration
   - Mock log block: `<pre>` monospace terminal showing placeholder log lines
   - Close button + outside-click closes drawer
3. Wire `RunHistoryTable` into `App.tsx` under the `Run History` tab

### Relevant Context
- Backlog spec: [`docs/backlogs/40-qa-pipeline-workflow/frontend/BL-QA-03-workflow-run-history-and-detail-inspector-ui.md`](../../backlogs/40-qa-pipeline-workflow/frontend/BL-QA-03-workflow-run-history-and-detail-inspector-ui.md)
- Run audit JSON schema: design doc §4

---

## Sub-Task 6 — BL-PLAY-01 & BL-PLAY-03: Playground Window & Service Switcher

**Status:** `[ ] pending`

### Intent
Render an embedded browser preview window with a mock address bar, viewport toggles, and a tab-based service switcher that changes the iframe target URL between the frontend app, backend API docs, and the DB inspector.

### Expected Outcomes
- Browser chrome header renders with a URL input (read-only mock URL), reload icon, and external link icon
- Iframe renders below the header filling the preview area
- Viewport toggle buttons (`Desktop`, `Tablet`, `Mobile 375px`) change iframe container width
- Service switcher tabs correctly update the iframe `src` and URL bar display

### Todo List
1. Create `frontend/src/components/playground/ServiceSwitcher.tsx`:
   - Props: `{ activeService, onSwitch }`
   - Renders 3 tab buttons: `🌐 Frontend App`, `⚙️ Backend API (/docs)`, `🛢️ Supabase DB`
   - Active tab highlighted with IBM blue bottom border
   - Each tab maps to a URL: frontend → `https://app-demo.trycloudflare.com`, backend → `http://localhost:8001/docs`, db → mock schema view URL
2. Create `frontend/src/components/playground/PlaygroundWindow.tsx`:
   - Local state: `activeService`, `viewport` (desktop/tablet/mobile)
   - Viewport widths: desktop = `100%`, tablet = `768px`, mobile = `375px`
   - Renders: `<ServiceSwitcher>` → mock browser header bar (URL display, reload btn) → `<iframe src={currentUrl}>`
   - iframe container uses `width: viewportWidth`, centered in frame
3. Wire `PlaygroundWindow` into `App.tsx` under the `Playground` tab

### Relevant Context
- Backlog specs: [`BL-PLAY-01`](../../backlogs/50-container-playground-observability/frontend/BL-PLAY-01-embedded-iframe-playground-and-viewport-controls.md) and [`BL-PLAY-03`](../../backlogs/50-container-playground-observability/frontend/BL-PLAY-03-multi-service-switcher-toolbar.md)
- Service switcher URL table: design doc §4
- Edge case E3: rapid tab switch must abort previous iframe load — handle with `key={activeService}` on iframe to force remount

---

## Sub-Task 7 — BL-PLAY-04: Telemetry Charts & Log Viewer

**Status:** `[ ] pending`

### Intent
Render live-looking CPU % and RAM MB line charts using Recharts fed from mock data, and a terminal-style log viewer with container selector dropdown and auto-scroll behavior to simulate SSE log streaming.

### Expected Outcomes
- Two Recharts `LineChart` instances render CPU % and RAM MB time-series lines
- Container dropdown has two options: `frontend`, `backend`
- Log viewer shows scrollable mock log lines for the selected container
- Auto-scroll: when new log lines are appended, the terminal scrolls to the bottom
- In DEMO_MODE: `setInterval` appends a new telemetry point and log line every 2 seconds

### Todo List
1. Create `frontend/src/components/telemetry/TelemetryCharts.tsx`:
   - Imports `LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer` from `recharts`
   - Loads initial series from `telemetry_mock.json` into `useState`
   - `useEffect` with `setInterval(2000)` appends a new random point to simulate live data (max 30 points rolling window)
   - Renders two side-by-side `<ResponsiveContainer>` charts: CPU % (blue line) and RAM MB (purple line)
2. Create `frontend/src/components/playground/LogViewer.tsx`:
   - State: `selectedContainer` (`frontend` | `backend`), `logs: string[]`
   - Container dropdown selector at top
   - `useEffect` with `setInterval(1500)` appends a mock log line (different templates for frontend/backend)
   - `useEffect` on `logs` change: `logEndRef.current?.scrollIntoView()` for auto-scroll
   - Renders `<pre>` monospace dark terminal box with green text
   - Reset logs when `selectedContainer` changes
3. Wire both components into `App.tsx` under the `Telemetry` tab, side by side

### Relevant Context
- Backlog spec: [`BL-PLAY-04`](../../backlogs/50-container-playground-observability/frontend/BL-PLAY-04-container-fleet-telemetry-and-log-viewer-ui.md)
- Recharts is installed in Sub-Task 1
- Edge case E2: if container "crashes", log viewer shows `🔴 Container Exited (Code 1)` — simulate with a mock line after 15 seconds

---

## Design System Reference (All Components)

| Token | Value | Usage |
| :--- | :--- | :--- |
| `--glass-bg` | `rgba(255,255,255,0.06)` | Card backgrounds |
| `--glass-border` | `rgba(255,255,255,0.1)` | Card borders |
| `--ibm-blue` | `#0F62FE` | RUNNING glow, active tabs |
| `--green-pass` | `#24a148` | PASSED border/badge |
| `--red-fail` | `#da1e28` | FAILED border/badge |
| `--bg-primary` | `#0a0a0f` | Page background |
| `--text-primary` | `#f4f4f4` | Main text |

---

## Dependency Sequence

```
Sub-Task 1 (React Setup)
    └─► Sub-Task 2 (Mock Data)
            ├─► Sub-Task 3 (QA Canvas)
            │       └─► Sub-Task 4 (Context Menu + Modal)
            │               └─► Sub-Task 5 (Run History)
            └─► Sub-Task 6 (Playground + Switcher)
                    └─► Sub-Task 7 (Telemetry + Logs)
```

Sub-Tasks 3–5 (QA group) and Sub-Tasks 6–7 (Playground group) can be developed in parallel after Sub-Tasks 1 and 2 are done.
