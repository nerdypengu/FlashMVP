# BL-ARC-01 — Starter Template Selector UI
> **Assigned To:** 🎨 **Person 1** — Lead Frontend & SDD UX Architect  
> **Feature:** Expandable Architecture | **Layer:** Frontend  
> **IBM Bob 2.0 Context:** Entry point — developer picks template that contains IBM tool bindings before Bob processes it  
> **File:** `client/src/components/shell/TemplateSelectorPage.jsx`

---

## 🎯 What This Does

This is the **first screen a developer sees** on FlashMVP. They pick a pre-configured starter template that already includes IBM tool bindings in its embedded `flashmvp.json` manifest. Once selected, the template manifest is passed to IBM Bob 2.0's `bob-skill-manifest-parser` to generate the SDD spec.

---

## 🗂️ Files to Create

| File | Purpose |
| :--- | :--- |
| `client/src/components/shell/TemplateSelectorPage.jsx` | Main landing/onboarding page |
| `client/src/components/shell/TemplateCard.jsx` | Individual template card component |
| `client/src/data/templates.js` | Static list of available IBM-bound templates |
| `client/src/components/shell/TemplateSelectorPage.css` | Styles |

---

## 🖥️ UI Layout Specification

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ⚡ FlashMVP — Powered by IBM Bob 2.0                                   │
│  "Deploy your app to IBM Cloud in 1 click — no DevOps required"         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  📦 Select an IBM-Ready Starter Template                                 │
│                                                                          │
│  ┌─────────────────────┐  ┌─────────────────────┐                       │
│  │ ⚛️ React + FastAPI   │  │ 🔷 Next.js + Go      │                       │
│  │ IBM Code Engine     │  │ IBM Code Engine     │                       │
│  │ IBM Cloud DB        │  │ IBM Cloud DB        │                       │
│  │ IBM Secrets Mgr     │  │ IBM Secrets Mgr     │                       │
│  │ Watsonx QA          │  │ Watsonx QA          │                       │
│  │    [Select →]       │  │    [Select →]       │                       │
│  └─────────────────────┘  └─────────────────────┘                       │
│                                                                          │
│  💬 Or describe your project: [___________________________] [→ Start]    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📝 Implementation Tasks

1. **Create `templates.js`:**
   ```js
   export const templates = [
     {
       id: "react-fastapi",
       name: "React + FastAPI",
       icon: "⚛️",
       description: "Full-stack web app with Python backend",
       ibm_bindings: ["IBM Code Engine", "IBM Cloud DB", "IBM Secrets Manager", "Watsonx QA"],
     },
     {
       id: "nextjs-go",
       name: "Next.js + Go",
       icon: "🔷",
       description: "SSR frontend with high-performance Go API",
       ibm_bindings: ["IBM Code Engine", "IBM Cloud DB", "IBM Secrets Manager", "Watsonx QA"],
     },
   ];
   ```

2. **Create `TemplateCard.jsx`:** Renders template icon, name, description, IBM binding badges, and "Select →" button.

3. **Create `TemplateSelectorPage.jsx`:**
   - Grid of `TemplateCard` components.
   - Free-text prompt input for custom descriptions.
   - On select → navigates to SDD Review screen passing `{ templateId, prompt }`.

4. **IBM Banner:** Prominent `⚡ Powered by IBM Bob 2.0` header banner with animated gradient.

---

## 🧪 Testing & Verification

1. ✅ Landing page shows template cards with IBM binding badges.
2. ✅ Clicking a template card navigates to SDD review screen.
3. ✅ Prompt text field accepts input and triggers spec generation.
4. ✅ IBM Bob 2.0 animated banner visible in header.
