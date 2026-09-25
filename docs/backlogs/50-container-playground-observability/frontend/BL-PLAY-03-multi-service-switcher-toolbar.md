# Backlog Item: BL-PLAY-03 - Multi-Service Switcher Toolbar
> **Feature:** Container Playground & Observability | **Layer:** Frontend (`client/src/components/playground/ServiceSwitcher.jsx`)

---

## 🎯 Task Objective
Build the **ServiceSwitcher** toolbar allowing users to toggle the preview iframe target between `🌐 Frontend App`, `⚙️ Backend API Docs (/docs)`, and `🛢️ Supabase DB`.

---

## 🛠️ File Locations & Component Specs
* **React Component:** `client/src/components/playground/ServiceSwitcher.jsx`

---

## 📝 Implementation Tasks
1. Render tabs above iframe preview.
2. Clicking `⚙️ Backend API Docs` sets iframe target URL to `http://localhost:8001/docs`.
3. Clicking `🛢️ Supabase DB` sets iframe target URL to database schema view.

---

## 🧪 How to Test (Frontend)
1. Click `⚙️ Backend API Docs` tab -> verify iframe URL changes to backend swagger docs URL.
