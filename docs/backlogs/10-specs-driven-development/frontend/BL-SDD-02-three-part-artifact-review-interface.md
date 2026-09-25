# BL-SDD-02 — Three-Part IBM Bob SDD Artifact Review Interface
> **Assigned To:** 🎨 **Person 1** — Lead Frontend & SDD UX Architect  
> **Feature:** Specs-Driven Development (SDD) | **Layer:** Frontend  
> **IBM Bob 2.0 Context:** Displays IBM Bob Document Understanding output for human review & sign-off  
> **File:** `client/src/components/sdd/SpecReviewer.jsx`

---

## 🎯 What This Does

After IBM Bob 2.0 parses the developer's prompt and manifests (`bob-skill-manifest-parser`), the **Spec Reviewer UI** presents the AI-generated 3-part artifact to the developer for review. The developer reads the output, optionally requests revisions, and clicks **"Approve Specs & Deploy to IBM Cloud"** to lock the specs and unlock the deployment pipeline.

This is the **human-in-the-loop gate** of the IBM Bob 2.0 workflow — zero code deploys without explicit human sign-off.

---

## 🗂️ Files to Create

| File | Purpose |
| :--- | :--- |
| `client/src/components/sdd/SpecReviewer.jsx` | Main 3-tab reviewer container |
| `client/src/components/sdd/RequirementsTab.jsx` | Tab 1: Markdown renderer for user stories |
| `client/src/components/sdd/DesignTab.jsx` | Tab 2: Markdown renderer for technical architecture |
| `client/src/components/sdd/TaskBreakdownTab.jsx` | Tab 3: Interactive task checklist with progress bar |
| `client/src/components/sdd/IBMToolBindingsPanel.jsx` | Side panel: IBM tool bindings status (Code Engine, DB, Vault, Watsonx) |
| `client/src/components/sdd/SpecReviewer.css` | Dark glassmorphism styles for the reviewer |

---

## 🖥️ UI Layout Specification

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ⚡ IBM Bob 2.0 — Spec Review Gate                    [Status: DRAFT]   │
├─────────────────────────────────────────────────────────────────────────┤
│  [📝 Requirements]  [🏗️ Technical Design]  [📋 Task Breakdown]          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  < Markdown rendered content for selected tab >                          │
│                                                                          │
├─────────────────────────────────────────────────────────────────────────┤
│  IBM Tool Bindings:                                                       │
│  [🟢 Code Engine]  [🟢 Cloud DB]  [🟢 Secrets Vault]  [🟢 Watsonx QA]   │
├─────────────────────────────────────────────────────────────────────────┤
│  💬 Request Revisions: [________________________]  [Request Changes]     │
│                                    [✅ Approve Specs & Deploy to IBM]    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 📝 Implementation Tasks

1. **Create `SpecReviewer.jsx`:**
   - Accepts props: `{ spec: SpecResponse, onApprove, onRevise, isLocked }`.
   - Manages active tab state (`requirements` | `design` | `tasks`).
   - Renders tab buttons with active underline animation.
   - Shows `IBM Tool Bindings` panel below tabs as coloured badge row.
   - **If `isLocked=true`:** all inputs become read-only and buttons are greyed with "Approved & Locked 🔒".

2. **Create `RequirementsTab.jsx`:** Render `spec.requirements` using a Markdown renderer (e.g. `react-markdown`).

3. **Create `DesignTab.jsx`:** Render `spec.design` Markdown, include IBM Cloud architecture note callout box.

4. **Create `TaskBreakdownTab.jsx`:**
   - Render `spec.tasks` as a checklist.
   - Show progress bar: `{completedCount}/{total} tasks reviewed`.
   - Each task is read-only (display only — not user-editable).

5. **Create `IBMToolBindingsPanel.jsx`:** Row of badges for each `ibm_bindings` key. Green = enabled. Grey = disabled.

6. **DEMO_MODE support:**
   ```js
   import { isDemoMode } from '../../config';
   import sddMock from '../../mocks/sdd_mock.json';
   
   const spec = isDemoMode ? sddMock : fetchedSpec;
   ```

---

## 🎨 Styling Notes (Dark Glassmorphism)

- Background: `rgba(255,255,255,0.05)` with `backdrop-filter: blur(12px)`.
- Accent: IBM Blue `#0F62FE`.
- Active tab: White underline `2px solid #fff`.
- Approval button: IBM Blue gradient with subtle glow on hover.
- Status badge `DRAFT`: amber. `APPROVED`: green. `LOCKED`: blue.

---

## 🧪 Testing & Verification

1. Run: `npm run dev` in `client/`.
2. Navigate to `http://localhost:5173` → the SDD section.
3. ✅ Tab switching between Requirements, Technical Design, Task Breakdown works.
4. ✅ IBM Tool Bindings panel shows 4 green badges.
5. ✅ "Approve Specs & Deploy to IBM" button triggers `onApprove()` callback.
6. ✅ After approval, all controls become read-only and show "Approved & Locked 🔒".
7. ✅ In `VITE_DEMO_MODE=true` mode, mock data is displayed without any API call.
