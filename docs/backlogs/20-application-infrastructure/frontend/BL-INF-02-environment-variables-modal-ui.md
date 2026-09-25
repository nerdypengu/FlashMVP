# Backlog Item: BL-INF-02 - Environment Variables Modal UI
> **Feature:** Application Infrastructure | **Layer:** Frontend (`client/src/components/modals/EnvVarsModal.jsx`)

---

## 🎯 Task Objective
Build the **Environment Configuration Modal** in React for adding, editing, and scoping project environment variables and API keys.

---

## 🛠️ File Locations & Component Specs
* **React Modal Component:** `client/src/components/modals/EnvVarsModal.jsx`

---

## 📝 Implementation Tasks
1. Create `EnvVarsModal.jsx` dialog containing a key-value form table (`Key`, `Value` password input with show/hide toggle, `Scope: ALL/Frontend/Backend`).
2. Wire submit action to post to `/api/v1/projects/{id}/env`.
3. Add delete row button and variable filter.

---

## 🧪 How to Test (Frontend)
1. Open Env Modal in React UI -> add `OPENAI_API_KEY` = `sk-123456` -> click Save.
2. Verify show/hide password toggle works and key row updates locally.
