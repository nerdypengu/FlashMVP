# Specs-Driven Development (SDD) — Design Specification

| Header | Details |
| :--- | :--- |
| **Author** | FlashMVP Architecture Team |
| **Status** | Approved for Implementation |
| **Implements** | PRD §2.1 (FR1: Specs-Driven Development) |
| **Implemented by** | `BL-SDD-01` (AI Drafting Engine, BE) · `BL-SDD-02` (3-Part Reviewer UI, FE) · `BL-SDD-03` (Revision Loop & Locking, BE/FE) |

---

## 1. Feature Overview & Purpose

Specs-Driven Development (SDD) intercepts autonomous code generation by requiring explicit human review and sign-off on AI-drafted **Requirements**, **Technical Design**, and **Task Breakdown** before any code is executed or generated. 

Shifting validation to the specification phase prevents hallucinated or misaligned implementation errors when corrections cost a single sentence rather than major codebase refactors.

---

## 2. Core Artifact Bundle & Structure

The SDD engine produces a 3-part artifact bundle represented as a unified JSON state:

| Artifact | Content Type | Purpose |
| :--- | :--- | :--- |
| **Requirements** | Markdown (`# Requirements`) | High-level functional user stories, constraints, and business rules |
| **Technical Design** | Markdown (`# System Design`) | Full-stack architecture, database models, and API definitions |
| **Task Breakdown** | Array of `{ id, description, completed }` | Sequential execution steps for the coding agent |

---

## 3. State Machine & Lifecycle

```
       ┌────────────────────────┐
       │     uninitialized      │  User submits feature prompt
       └───────────┬────────────┘
                   │
                   ▼
         ┌───────────────────┐
         │     drafting      │  AI generates 3-part artifact bundle
         └─────────┬─────────┘
                   │
                   ▼
       ┌──────────────────────┐
       │   awaiting_approval  │ ◄───┐
       └───────────┬──────────┘     │
                   │                │ Revision requested (feedback provided)
  Request Revision │                │
                   ▼                │
       ┌──────────────────────┐     │
       │   changes_requested  │ ────┘
       └──────────────────────┘
                   │
  Approve Specs    │
                   ▼
         ┌───────────────────┐
         │     approved      │  Terminal lock state; unlocks code generation
         └───────────────────┘
```

| State | Meaning |
| :--- | :--- |
| `uninitialized` | Initial state before prompt is submitted. |
| `drafting` | AI engine is actively building requirements, design, and task list. |
| `awaiting_approval` | Specs rendered in UI; user review in progress. Code generation is **locked**. |
| `changes_requested` | User provided corrective feedback; AI patches the specs. |
| `approved` | Human has signed off; spec bundle is locked and handed off to execution. |

---

## 4. Interaction & Revision Loop

1. **Prompt Submission:** User submits prompt (e.g. `"E-Commerce store with Stripe integration"`) and selects stack template (`react-fastapi`).
2. **Drafting:** Backend `POST /api/v1/specs/generate` generates the 3-part artifact.
3. **Review & Editing:** Frontend displays 3 tabs (`Requirements`, `Design`, `Tasks`). User can directly edit text or check/uncheck tasks.
4. **Revision Loop:** If user enters feedback (e.g., `"Use Postgres instead of MongoDB"`), backend re-generates affected sections without wiping intact tasks.
5. **Approval Lock:** Clicking `"Approve Specs"` calls `POST /api/v1/specs/approve`, locking the specification UI and enabling the `Deploy` pipeline.

---

## 5. API Surface & Data Contract

### Pydantic Models (`server/app/schemas/spec.py`):
```python
from pydantic import BaseModel
from typing import List, Optional

class TaskItem(BaseModel):
    id: str
    description: str
    completed: bool = False

class SpecGenerateRequest(BaseModel):
    prompt: str
    template: str
    feedback: Optional[str] = None

class SpecResponse(BaseModel):
    feature_id: str
    status: str  # UNINITIALIZED, DRAFTING, AWAITING_APPROVAL, CHANGES_REQUESTED, APPROVED
    requirements: str
    design: str
    tasks: List[TaskItem]
```

### Endpoints Table:
| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/specs/generate` | BE | Generates or patches the 3-part SDD artifact bundle. |
| `POST` | `/api/v1/specs/approve` | BE | Locks spec bundle and transitions state to `APPROVED`. |
| `GET` | `/api/v1/specs/{feature_id}` | BE | Fetches current spec state and version snapshot. |

---

## 6. Edge Cases & Verification Criteria

| # | Edge Case | Expected Behavior |
| :--- | :--- | :--- |
| **E1** | Code deploy triggered while state is `AWAITING_APPROVAL` | Refused (`409 Conflict: Specs must be approved before execution`). |
| **E2** | Empty feedback string on `Request Revisions` | Refused (`400 Bad Request: Feedback instruction required`). |
| **E3** | Large prompt exceeding context limit | Summarizes historical prompt log while preserving active tasks. |
| **E4** | Re-approving an already `APPROVED` spec | Idempotent; returns existing approved state. |

---

## 7. Acceptance Criteria for Implementing Items

* **BL-SDD-01 (Backend):** `POST /api/v1/specs/generate` correctly returns structured requirements, design notes, and task array in `< 1.5s`.
* **BL-SDD-02 (Frontend):** React UI renders 3 distinct tabs (`Requirements`, `Design`, `Tasks`) with interactive checkboxes and text editing.
* **BL-SDD-03 (Fullstack):** Clicking `Approve Specs` calls `/api/v1/specs/approve`, transitions status badge to `APPROVED`, locks UI fields, and enables deploy controls.
