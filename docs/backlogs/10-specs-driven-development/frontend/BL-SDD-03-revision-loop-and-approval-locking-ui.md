# BL-SDD-03 — Revision Loop & Approval Locking UI
> **Assigned To:** 🎨 **Person 1** — Lead Frontend & SDD UX Architect  
> **Feature:** Specs-Driven Development (SDD) | **Layer:** Frontend  
> **File:** `client/src/components/sdd/SpecReviewer.jsx` (extend BL-SDD-02 component)

---

## 🎯 What This Does

Extends the `SpecReviewer.jsx` component (BL-SDD-02) to handle the **revision feedback loop** and **approval locking state**:

- Developer enters corrective feedback text → clicks "Request Changes" → spec re-generates with IBM Bob 2.0.
- Developer clicks "Approve Specs & Deploy to IBM" → all controls lock and the deployment pipeline unlocks.

---

## 🗂️ Files to Edit

| File | Action |
| :--- | :--- |
| `client/src/components/sdd/SpecReviewer.jsx` | Add revision textarea, request changes button, approve action |
| `client/src/hooks/useSpecActions.js` | **CREATE** — hook wrapping `POST /specs/revise` and `POST /specs/approve` |

---

## 📝 Implementation Tasks

1. **Revision Textarea & Button:**
   - Input: `placeholder="Describe what to change (e.g. use PostgreSQL instead of MongoDB)"`.
   - Button: `"📝 Request Changes"` → calls `POST /api/v1/specs/revise`.
   - On success: refreshes spec state with new content. Status badge changes to `🟡 CHANGES REQUESTED`.

2. **Approval Button:**
   - Button: `"✅ Approve Specs & Deploy to IBM Cloud"` (IBM Blue gradient).
   - On click: calls `POST /api/v1/specs/approve`.
   - On success: sets `isLocked=true` → all inputs become read-only, buttons replaced with `"🔒 Approved & Locked"` badge.
   - Emits `onApproved()` event to parent — parent unlocks the QA Pipeline step.

3. **Status Badge:** Rendered in top-right corner of `SpecReviewer.jsx`:
   - `DRAFT` → `🟡 DRAFT`
   - `CHANGES_REQUESTED` → `🔄 CHANGES REQUESTED`
   - `APPROVED` → `🟢 APPROVED & LOCKED`

4. **DEMO_MODE:** When `isDemoMode=true`, simulate the approval flow with `setTimeout(1500)` transitions without API calls.

---

## 🧪 Testing & Verification

1. Run: `npm run dev` in `client/`.
2. ✅ Enter feedback text → click "Request Changes" → spec tabs refresh with new content.
3. ✅ Click "Approve" → all inputs lock → badge changes to `🟢 APPROVED & LOCKED`.
4. ✅ Approved state persists on page reload (via localStorage or context).
5. ✅ In `VITE_DEMO_MODE=true` → animated transition with fake 1.5s delay.
