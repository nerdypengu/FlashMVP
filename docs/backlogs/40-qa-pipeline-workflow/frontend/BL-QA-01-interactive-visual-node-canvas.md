# Backlog Item: BL-QA-01 - Interactive Visual Node Canvas
> **Feature:** QA Pipeline Workflow | **Layer:** Frontend (`client/src/components/qa/QACanvas.jsx`)

---

## 🎯 Task Objective
Build the **QACanvas** visual node graph rendering QA steps sequentially (`Step 1: ESLint` ➔ `Step 2: Pytest`) with real-time status indicators (`🟢 PASSED`, `🔴 FAILED`, `🟡 RUNNING`).

---

## 🛠️ File Locations & Component Specs
* **React Component:** `client/src/components/qa/QACanvas.jsx`
* **Node Card Component:** `client/src/components/qa/QANodeCard.jsx`

---

## 📝 Implementation Tasks
1. Render step nodes horizontally with connecting arrows.
2. Display status badges and step duration.
3. Allow toggling steps enabled/disabled directly on the node card.

---

## 🧪 How to Test (Frontend)
1. Navigate to `/qa` in React app -> verify sequential nodes render.
