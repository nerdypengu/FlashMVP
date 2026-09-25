# BL-SDD-03 — Revision Loop & Approval Locking API
> **Assigned To:** 🤖 **Person 3** — IBM Agent Engine & Core Skills Engineer  
> **Feature:** Specs-Driven Development (SDD) | **Layer:** Backend  
> **IBM Bob 2.0 Skill:** `bob-skill-manifest-parser` — Revision loop & spec state machine  
> **File:** `server/app/api/specs.py`

---

## 🎯 What This Does

After the developer reviews IBM Bob 2.0's SDD output, they have two choices:

- **Request Revisions** → Bob re-generates only the changed sections while preserving intact tasks.
- **Approve Specs** → Bob locks the spec into read-only mode and **unlocks** the deployment pipeline.

This backlog implements the backend API for both actions.

---

## 🗂️ Files to Edit / Create

| File | Action | Purpose |
| :--- | :--- | :--- |
| `server/app/api/specs.py` | **EDIT** | Add `POST /api/v1/specs/approve` and `POST /api/v1/specs/revise` routes |
| `server/app/schemas/spec.py` | **EDIT** | Add `ApproveRequest` and `ReviseRequest` Pydantic models |
| `server/app/services/spec_generator.py` | **EDIT** | Add `revise()` function that patches only changed sections |

---

## 💻 API Contracts

```python
# POST /api/v1/specs/approve
class ApproveRequest(BaseModel):
    project_id: str

class ApproveResponse(BaseModel):
    project_id: str
    status: str   # "APPROVED"
    locked: bool  # True — deployment pipeline now unlocked

# POST /api/v1/specs/revise
class ReviseRequest(BaseModel):
    project_id: str
    feedback: str   # "Change the DB to MongoDB instead of PostgreSQL"
    sections: list  # ["requirements"] | ["design"] | ["tasks"] | ["all"]
```

---

## 📝 Implementation Tasks

1. **`POST /api/v1/specs/approve`:**
   - Validate `project_id` exists.
   - Set `spec.status = "APPROVED"` and `spec.locked = True` in in-memory store or DB.
   - Return `ApproveResponse`.

2. **`POST /api/v1/specs/revise`:**
   - Accept `feedback` and `sections` list.
   - Re-call `spec_generator.revise(project_id, feedback, sections)` to regenerate only the requested sections.
   - Return updated `SpecResponse` with `status: "CHANGES_REQUESTED"`.

3. **Locking enforcement:** Any call to `/api/v1/deploy` must first verify `spec.locked == True`. If not, return `403 Forbidden: "Specs not approved"`.

---

## 🧪 Testing & Verification

1. Start: `uvicorn app.main:app --reload --port 8000`
2. First generate a spec via `POST /api/v1/specs/generate`.
3. ✅ Test `POST /api/v1/specs/approve` → expect `{ status: "APPROVED", locked: true }`.
4. ✅ Test `POST /api/v1/specs/revise` with feedback → expect regenerated sections, `status: "CHANGES_REQUESTED"`.
5. ✅ Test deploy endpoint without approving first → expect `403 Forbidden`.
