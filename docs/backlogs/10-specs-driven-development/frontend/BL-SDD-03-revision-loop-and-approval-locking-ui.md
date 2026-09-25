# Backlog Item: BL-SDD-03 - Revision Loop & Approval Locking UI
> **Feature:** Specs-Driven Development | **Layer:** Frontend (`client/src/components/sdd/`)

---

## 🎯 Task Objective
Implement the UI state handling for revision feedback and the locking mechanism when the user clicks `"Approve Specs"`.

---

## 🛠️ File Locations & Component Specs
* **React Component:** `client/src/components/sdd/SpecReviewer.jsx`

---

## 📝 Implementation Tasks
1. Attach click handler to `Approve Specs` button invoking `/api/v1/specs/approve`.
2. Disable text areas and checkboxes when status is `APPROVED`.
3. Display `🟢 APPROVED & LOCKED` badge and enable `Deploy` pipeline controls.

---

## 🧪 How to Test (Frontend)
1. Click `Approve Specs` -> verify interface locks into read-only mode and displays `APPROVED` status badge.
