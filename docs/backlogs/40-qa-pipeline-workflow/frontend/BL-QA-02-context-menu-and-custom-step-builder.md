# BL-QA-02 — Context Menu & Custom Step Builder
> **Assigned To:** 📊 **Person 2** — QA Canvas & Observability Specialist  
> **Feature:** QA Pipeline Workflow | **Layer:** Frontend  
> **File:** `client/src/components/qa/ContextMenu.jsx`, `client/src/components/qa/AddStepModal.jsx`

---

## 🎯 What This Does

Allows developers to right-click the QA canvas OR click the `"+ Add Custom Step"` button to open a context menu that lets them add a custom QA step (e.g. `npm run test:e2e`, `python -m pytest --cov`) to the IBM Bob `bob-skill-watsonx-qa` pipeline.

---

## 🗂️ Files to Create

| File | Purpose |
| :--- | :--- |
| `client/src/components/qa/ContextMenu.jsx` | Right-click context menu |
| `client/src/components/qa/AddStepModal.jsx` | Modal to configure custom step |

---

## 🖥️ UI Layout: Context Menu

```
┌────────────────────────────┐
│  ➕ Add Custom QA Step     │
│  ✏️  Edit Selected Step    │
│  🗑️  Remove Selected Step  │
│  ────────────────          │
│  ▶️  Run All Steps Now     │
└────────────────────────────┘
```

## 🖥️ UI Layout: Add Step Modal

```
┌─────────────────────────────────────────────────────────┐
│  ➕ Add Custom QA Step                                   │
│                                                         │
│  Step Name: [____________________________]              │
│  Command:   [npm run test:e2e____________]              │
│  Timeout:   [30] seconds                                │
│                                                         │
│  [Cancel]                            [Add to Pipeline]  │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 Implementation Tasks

1. **`ContextMenu.jsx`:** Positioned with `position: fixed` at mouse cursor. Opens on right-click anywhere on the QA canvas. Closes on outside click.

2. **`AddStepModal.jsx`:** Dark glassmorphism modal with:
   - Step Name input.
   - Shell command input.
   - Timeout input (seconds).
   - On submit → appends new step object to the QA pipeline state.

3. **Wire to `QACanvas.jsx`:** When a new step is added, it immediately appears as a new node at the end of the canvas chain with `PENDING` status.

4. **DEMO_MODE:** Adding a step works purely in local state — no API call needed.

---

## 🧪 Testing & Verification

1. ✅ Right-clicking canvas opens context menu at correct cursor position.
2. ✅ Clicking "Add Custom QA Step" opens the modal.
3. ✅ Filling in name/command and submitting adds a new node to the canvas.
4. ✅ Modal closes and new node is visible with `🟡 PENDING` status.
