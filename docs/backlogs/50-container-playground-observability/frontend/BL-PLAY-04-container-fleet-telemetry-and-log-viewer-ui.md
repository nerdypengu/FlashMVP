# Backlog Item: BL-PLAY-04 - Container Fleet Telemetry & Log Viewer UI
> **Feature:** Container Playground & Observability | **Layer:** Frontend (`client/src/components/telemetry/TelemetryCharts.jsx`)

---

## 🎯 Task Objective
Build the **TelemetryCharts** Recharts component graphing live CPU % and Memory Usage (MB), alongside the terminal **LogViewer** component.

---

## 🛠️ File Locations & Component Specs
* **Telemetry Component:** `client/src/components/telemetry/TelemetryCharts.jsx`
* **Log Viewer Component:** `client/src/components/playground/LogViewer.jsx`

---

## 📝 Implementation Tasks
1. Build Recharts `TelemetryCharts.jsx` graphing CPU % and Memory Usage (MB).
2. Add log container selector dropdown (`[ frontend | backend ]`) and filter search input in `LogViewer.jsx`.
3. Auto-scroll terminal log box on new SSE line.

---

## 🧪 How to Test (Frontend)
1. Verify line charts render CPU and RAM metric lines.
2. Select `backend` in log container dropdown -> verify log window output updates.
