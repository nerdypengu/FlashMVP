# Backlog Item: BL-HUB-01 - Central Application Catalog UI
> **Feature:** xAppHub Management Portal | **Layer:** Frontend (`client/src/components/portal/AppCatalog.jsx`)

---

## 🎯 Task Objective
Build the **AppCatalog** component rendering a grid of published application cards with live status badges, search filters, and launch buttons.

---

## 🛠️ File Locations & Component Specs
* **React Component:** `client/src/components/portal/AppCatalog.jsx`

---

## 📝 Implementation Tasks
1. Render responsive grid of published application cards.
2. Add search bar and status dropdown filter (`All`, `Active`, `Deprecated`).
3. Add quick launch button opening target Cloudflare tunnel URL in new tab.

---

## 🧪 How to Test (Frontend)
1. Open xAppHub Portal in React app -> verify application catalog cards render.
2. Type query in search bar -> verify cards filter dynamically.
