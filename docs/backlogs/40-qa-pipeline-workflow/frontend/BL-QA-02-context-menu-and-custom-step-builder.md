# Backlog Item: BL-QA-02 - Context Menu & Custom Step Builder
> **Feature:** QA Pipeline Workflow | **Layer:** Frontend (`client/src/components/qa/ContextMenu.jsx`)

---

## 🎯 Task Objective
Implement the right-click context menu on the QA canvas and the `AddStepModal` for configuring custom shell command steps.

---

## 🛠️ File Locations & Component Specs
* **Context Menu Component:** `client/src/components/qa/ContextMenu.jsx`
* **Modal Component:** `client/src/components/qa/AddStepModal.jsx`

---

## 📝 Implementation Tasks
1. Attach `onContextMenu` listener to canvas area.
2. Render context menu option `➕ Add Custom QA Step`.
3. Open `AddStepModal` on click accepting `Step Name` and `Shell Command` (e.g. `npm run test:e2e`).
4. Append new step node to pipeline state on submit.

---

## 🧪 How to Test (Frontend)
1. Right-click on QA canvas -> verify context menu opens.
2. Click `Add Custom QA Step` -> enter step details -> verify node appears on canvas.
