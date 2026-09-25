# BL-QA-01 — Interactive Visual QA Node Canvas
> **Assigned To:** 📊 **Person 2** — QA Canvas & Observability Specialist  
> **Feature:** QA Pipeline Workflow | **Layer:** Frontend  
> **IBM Bob 2.0 Context:** Visualises IBM Bob `bob-skill-watsonx-qa` running ESLint, Pytest, and IBM Watsonx Security Audit  
> **File:** `client/src/components/qa/QACanvas.jsx`

---

## 🎯 What This Does

Before deployment, IBM Bob 2.0's **Subagent Beta** executes the `bob-skill-watsonx-qa` skill. This component visualises that QA pipeline as an interactive node graph, showing each step executing in real-time with IBM Watsonx audit results.

---

## 🗂️ Files to Create

| File | Purpose |
| :--- | :--- |
| `client/src/components/qa/QACanvas.jsx` | Main canvas wrapper |
| `client/src/components/qa/QANodeCard.jsx` | Individual step node card |
| `client/src/components/qa/QAConnector.jsx` | Animated arrow connecting nodes |
| `client/src/components/qa/QACanvas.css` | Styles for the canvas and nodes |
| `client/src/mocks/qa_mock.json` | DEMO_MODE mock QA run data |

---

## 🖥️ UI Layout Specification

```
┌─────────────────────────────────────────────────────────────────────────┐
│  🤖 IBM Bob Subagent Beta — QA Pipeline (bob-skill-watsonx-qa)           │
│                                                                          │
│  [Step 1: ESLint] ──→ [Step 2: Pytest] ──→ [Step 3: Watsonx Security]   │
│   🟢 PASSED 0.8s         🟢 PASSED 1.2s       🟢 PASSED 0.6s            │
│                                                                          │
│  [+ Add Custom Step]              Run #14 — 🟢 All Passed (2.6s total)   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📝 Implementation Tasks

1. **`QANodeCard.jsx`** — displays:
   - Step name (e.g. `ESLint`, `Pytest`, `IBM Watsonx Security Audit`).
   - Status badge: `🟡 PENDING` → `🔵 RUNNING` (pulsing) → `🟢 PASSED` / `🔴 FAILED`.
   - Execution duration (e.g. `1.2s`).
   - Enabled/disabled toggle switch.

2. **`QAConnector.jsx`** — SVG arrow between nodes, animates with gradient glow when the preceding node is `RUNNING`.

3. **`QACanvas.jsx`** — renders:
   - Horizontal row of `QANodeCard` components connected by `QAConnector` arrows.
   - `"+ Add Custom Step"` button at the end (opens BL-QA-02 context menu).
   - Summary bar at bottom: `Run #14 — 🟢 All Passed (2.6s total)`.

4. **DEMO_MODE animation:**
   ```js
   // Simulate step-by-step execution with timeouts
   const runDemoQA = async () => {
     for (const step of steps) {
       setStatus(step.id, 'RUNNING');
       await sleep(step.durationMs);
       setStatus(step.id, 'PASSED');
     }
   };
   ```

---

## 🎨 Styling Notes

- Node cards: `rgba(255,255,255,0.06)` glassmorphism with `border: 1px solid rgba(255,255,255,0.1)`.
- `RUNNING` state: pulsing blue glow `box-shadow: 0 0 16px #0F62FE`.
- `PASSED` state: green border `#24a148`.
- `FAILED` state: red border `#da1e28` with shake animation.
- Connector arrows: SVG with animated gradient stroke.

---

## 🧪 Testing & Verification

1. ✅ QA canvas renders 3 default nodes: ESLint, Pytest, IBM Watsonx Security.
2. ✅ In DEMO_MODE: nodes animate one-by-one from PENDING → RUNNING → PASSED.
3. ✅ "Add Custom Step" button visible at end of chain.
4. ✅ Summary bar updates after all nodes pass.
