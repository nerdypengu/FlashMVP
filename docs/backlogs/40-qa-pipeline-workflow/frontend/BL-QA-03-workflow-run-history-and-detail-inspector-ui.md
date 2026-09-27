# Backlog Item: BL-QA-03 - Workflow Run History & Detail Inspector UI
> **Feature:** QA Pipeline Workflow | **Layer:** Frontend (`frontend/src/components/qa/RunHistoryTable.tsx`)

**Frontend demo status:** Implemented. New simulated runs appear in history with step snapshots; log text is demo-only. Backend audit-log integration remains pending (Person 3).

---

## 🎯 Task Objective
Build the **Vercel / GitHub Actions style Run History Table** and the **Run Detail Inspector Drawer** for reviewing past build snapshots and archived logs.

---

## 🛠️ File Locations & Component Specs
* **Table Component:** `frontend/src/components/qa/RunHistoryTable.tsx`
* **Inspector Drawer:** `frontend/src/components/qa/RunDetailInspector.tsx`

---

## 📝 Implementation Tasks
1. Build `RunHistoryTable.jsx` matching Vercel audit run logs (`Run #14 - Main Branch - 🟢 Passed (32s ago)`).
2. Build slide-over `RunDetailInspector.jsx` displaying historical logs and pass/fail step snapshots.

---

## 🧪 How to Test (Frontend)
1. Switch to `Workflow Runs` tab -> verify past runs list renders.
2. Click row `Run #13` -> verify detail drawer opens with archived log text.
