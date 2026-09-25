# Approval Chain — design

|                    |                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------- |
| **Author**         | Russell                                                                                           |
| **Status**         | Draft for review — April and Eugenia. Due 17 Oct; early so APR-01 can start on time.              |
| **Implements**     | URS N-§1.4, N-§2 flow, N-§2.10, FUS-16, FUS-56, FUS-58, FUS-79, FUS-82, FUS-91/93/94/95           |
| **Implemented by** | BL-APR-01 (engine, BE-2) · BL-APR-02 (signatures, history, locks, BE-2) · BL-APR-03 (pages, FE-2) |

This document is the authority for the Approval Chain. Where it disagrees with the APR stubs, this wins; where it disagrees with the URS, the URS wins and this document is wrong — say so.

---

## 1. What the chain is for

A gate is a point where a named role asserts, under electronic signature, that a body of clinical data is complete and correct. Approving a gate does three things, and they are inseparable:

1. **It progresses the study.** The next gate opens (sequential mode).
2. **It locks data.** Every form instance configured with `lock_after_gate = N` becomes read-only when gate N is approved. Locks are progressive and, within a study, permanent.
3. **It decides output eligibility.** The CRF Document Renderer refuses to run until every subject has cleared Gate 3 and, where applicable, Gate 4 (FUS-56).

The chain is configurable because the two tenants differ completely: PML runs four gates, Regenic runs none.

## 2. The four gates (PML seed)

| Gate | Name               | Scope                      | Signers                  | Opens when                                                                                             | Locks                                                  |
| ---- | ------------------ | -------------------------- | ------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------ |
| 1    | Screening Approval | **per subject**            | RP                       | screening forms for that subject are submitted                                                         | screening forms for that subject                       |
| 2    | Verification       | **per subject per period** | RP                       | Gate 1 approved for the subject; the period's required CW forms are submitted                          | that period's clinical forms for that subject          |
| 3    | End of Study       | **per study**              | RP **then** PI (ordered) | every subject is `soft_locked` or `withdrawn`, and Gates 1–2 are approved for every subject and period | everything in the study; `study_edc.status = 'locked'` |
| 4    | Deviation Report   | **per study**, conditional | PI                       | Gate 3 approved **and** ≥ 1 deviation exists                                                           | deviation reports                                      |

Scope is the part most easily got wrong. Gate 1 and Gate 2 produce many gate rows per study — one per subject, one per subject-period. Gate 3 and Gate 4 produce exactly one row each. The mockup's "26 of 26 subjects completed. Gate 1 and Gate 2 approved for all periods." is Gate 3's _prerequisite summary_, computed by aggregating the per-subject rows; it is not itself a gate state.

**Gate 4 is conditional.** When the study has no deviation, it is marked `not_applicable` — by the PI, explicitly, not automatically — and then it is not a CRF prerequisite (FUS-56). Auto-detection (CW-03 flags sampling deviations beyond tolerance) decides whether the gate is _offered_, never whether it is _satisfied_. A human states that there is nothing to report.

## 3. States

```
                 ┌─────────────────┐
                 │ not_configured  │  module off (Regenic) — terminal, no rows written
                 └─────────────────┘

  blocked ──────▶ pending ──────▶ approved            (sequential: previous gate not yet approved)
                    │  ▲
                    │  └────── returned ◀── return_for_revision (signer, reason required)
                    │
                    └──────────▶ not_applicable       (conditional gates only)
```

| State            | Meaning                                                                                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `not_configured` | The tenant has `approval_chain` off. Every evaluation returns this; no rows exist.                                                                                           |
| `blocked`        | Sequential mode, and the previous gate in the same scope is not approved. The UI shows "Waiting on earlier gates to be approved before this one can open (sequential mode)." |
| `pending`        | Open, prerequisites met or not — the page shows which. Signable only when prerequisites are met.                                                                             |
| `returned`       | A signer sent it back with a mandatory reason. Data it had locked is **not** unlocked (see §6). Re-enters `pending` when the reason is addressed and a signer re-evaluates.  |
| `approved`       | All required signatures collected, in order. Locks applied. Terminal.                                                                                                        |
| `not_applicable` | A conditional gate declared irrelevant, with reason. Terminal. Not a CRF prerequisite.                                                                                       |

`approved` and `not_applicable` are terminal **by design**: there is no un-approve. A study that must move backwards does so through EDC-02's audited reopen of specific form instances plus a new gate evaluation — never by rewriting gate state. This is what makes the lock trustworthy.

## 4. Execution modes

`approval.executionMode` per tenant, per study at freeze time:

- **`sequential`** (default, PML): gate N is `blocked` until gate N−1 is `approved` **in the same scope**. Scope matters — Gate 2 for subject S period 2 waits on Gate 1 for subject S, not on Gate 2 for some other subject.
- **`independent`**: every configured gate is `pending` from the start; prerequisites still apply. Gate 3 still requires all subjects complete, because that is a prerequisite, not an ordering rule.

## 5. Signatures

Every signature is a row in `esignatures`, written only by APR-02, never updated, never deleted.

**What a signature captures** (FUS-58, FUS-91, FS-22/34/35):

| Field                                        | Source                                                                                  |
| -------------------------------------------- | --------------------------------------------------------------------------------------- |
| `typed_name`                                 | typed by the signer in the dialog, each time — never pre-filled, never stored for reuse |
| `meaning`                                    | the attestation text shown verbatim at signing time, stored with the signature          |
| `signer_role`                                | the role the signer held **at that moment**, snapshotted                                |
| `signed_at`                                  | `now()` server-side. Never a device clock.                                              |
| `user_id`, `user_email`, `user_display_name` | frozen, not join-resolved later (ALCOA+)                                                |

The kit's `ESignDialog` already implements the interaction: typed name plus an explicit attestation tick, the meaning shown verbatim, and a pluggable `verifier`. Use it; do not build a second signing UI. The `verifier` slot is where re-authentication lands when AUTH-01 ships (T3 accounts re-enter an OTP to sign) — until then it is absent and the typed name plus attestation is the control.

**Gate 3 is a dual, ordered signature.** RP signs first, recording the study outcome (`completed` | `withdrawn` + reason). Only then may the PI sign, and the PI sees the legal statement. The gate becomes `approved` on the second signature, not the first. Implement the ordering as a check on the previous step's signature, not as two independent buttons the UI happens to render in order.

**Nobody signs for someone else.** A signature row's `user_id` is always `auth.uid()`. This is the reason FND-11 exists: RPCs take their actor from the session, never from an argument.

## 6. Locking

Two mechanisms, both driven by gate approval, and they answer different questions.

**Data lock — "can this value change?"** `edc_forms.lock_after_gate` (set on the template, copied at study instantiation) names the gate that freezes a form. On approval of gate N, APR-02 sets `locked_at` and `lock_gate = N` on every matching `edc_form_instances` row in scope. EDC-01's `private.edc_values_guard()` already refuses writes to a locked instance — APR-02 adds no new enforcement path, it only sets state. EDC-02's reopen never lifts a gate lock; a locked instance stays locked.

**Permission lock — "can this role still act in this module?"** FUS-82: "State-based permission locks should override the static role permission matrix after gate completion. Specified roles lose specified create, read, update, and delete permissions on locked form types." This is not the same as freezing values: it removes a role's ability to act at all, on a module, after a gate. It needs its own rows — `gate_permission_locks` — because the revoked actions are per role, per module, per gate.

> **This supersedes D13's provisional note** that the ERD's `module_lock_records` could be folded into `edc_lock_events`. It cannot: lock _events_ are an append-only audit of who locked what and when; permission locks are live state that `private.edc_can()` and SYS-03's effective-permission matrix must read on every request. Different lifetimes, different readers, different shapes. Keep both, and take the ERD's idea under the clearer name.

**Returning a gate does not unlock anything.** A `returned` gate had not been approved, so it had locked nothing. If a _previously approved_ gate's data must change, that is EDC-02's audited reopen of named instances, with its own reason and audit row — not a lock rollback. Stating this explicitly because "return should undo the lock" is the intuitive wrong answer.

## 7. Configuration

Per tenant in `tenants.settings.approval` (SYS-07 edits it), frozen per study at activation — the same rule as the EDC structure, and for the same reason: a study's rules must not change under it mid-flight.

```jsonc
{
  "executionMode": "sequential", // | "independent"
  "steps": [
    {
      "gate": 1,
      "key": "screening",
      "label": "Screening Approval",
      "scope": "subject",
      "signers": [{ "role": "RP", "required": true }],
      "conditional": false,
      "revokeOnComplete": []
    },
    {
      "gate": 2,
      "key": "verification",
      "label": "Verification",
      "scope": "subject_period",
      "signers": [{ "role": "RP", "required": true }],
      "conditional": false,
      "revokeOnComplete": [{ "role": "NURSE", "module": "clinical_workflow", "actions": ["create", "update"] }]
    },
    {
      "gate": 3,
      "key": "end_of_study",
      "label": "End of Study",
      "scope": "study",
      "signers": [
        { "role": "RP", "required": true, "order": 1, "captures": "outcome" },
        { "role": "PI", "required": true, "order": 2, "meaning": "legal_statement" }
      ],
      "conditional": false,
      "revokeOnComplete": [{ "role": "SC", "module": "edc", "actions": ["create", "update", "delete"] }]
    },
    {
      "gate": 4,
      "key": "deviation_report",
      "label": "Deviation Report",
      "scope": "study",
      "signers": [{ "role": "PI", "required": true }],
      "conditional": true,
      "revokeOnComplete": []
    }
  ]
}
```

Regenic ships `{ "steps": [] }` with the module off. Every evaluation returns `not_configured`, and outputs read `study_edc.status = 'locked'` alone.

## 8. Override

A TENANT_ADMIN may force a gate to `approved` when the named signer is unavailable — a real operational need in a study that cannot pause. Constraints, all mandatory:

- A reason is required, minimum 20 characters, stored on the history row.
- The override is recorded as `action = 'override'` with the overriding user's identity — **never** as a signature by the absent signer. `esignatures` gets no row.
- **Gate 3's PI signature cannot be overridden.** It carries a legal statement that only the PI can make. If the PI is unavailable, the study waits.
- Overrides appear in the gate history, in the audit trail, and in the CRF appendix wherever signatures are rendered, marked as overrides.

If April wants overrides removed entirely for the 2026 scope, that is a defensible call and simplifies APR-01 — say so in review.

## 9. Data model

Owned by APR-01 (`approval_chain_config`, `approval_gates`) and APR-02 (`esignatures`, `approval_history`, `gate_permission_locks`). Names follow D13.

```sql
-- Frozen per study at activation; the tenant default lives in tenants.settings.approval
create table public.approval_chain_config (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id),
  study_id      uuid references public.studies(id),          -- null = the tenant default snapshot
  execution_mode text not null default 'sequential' check (execution_mode in ('sequential','independent')),
  steps         jsonb not null,                              -- §7 contract
  is_active     boolean not null default true,
  frozen_at     timestamptz,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id), updated_by uuid references auth.users(id),
  constraint approval_chain_config_study_unique unique (study_id)
);

-- One row per (study, gate, scope instance). Subject/period null for study-scoped gates.
create table public.approval_gates (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid not null references public.tenants(id),
  study_id      uuid not null references public.studies(id),
  gate_number   integer not null check (gate_number between 1 and 4),
  subject_id    uuid references public.edc_subjects(id) on delete cascade,
  period_no     integer,
  status        text not null default 'blocked'
                  check (status in ('blocked','pending','returned','approved','not_applicable')),
  outcome       text check (outcome in ('completed','withdrawn')),   -- gate 3, from the RP signature
  outcome_reason text,
  decided_at    timestamptz, decided_by uuid references auth.users(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  constraint approval_gates_scope_unique unique (study_id, gate_number, subject_id, period_no)
);
```

`esignatures` (one row per signature, §5 fields, immutable), `approval_history` (append-only: every evaluate, sign, return, override, NA — with actor, reason, before/after status), and `gate_permission_locks` (`study_id`, `gate_number`, `role_key`, `module_key`, `revoked_actions text[]`, `locked_at`) are specified in APR-02 §3 against this document.

**Immutability**, the same pattern as FND-03: `revoke update, delete, truncate` from `anon, authenticated` on `esignatures` and `approval_history`, plus `private.raise_immutable()` triggers. Not policy-only — a missing policy is a bug away from mutable; a trigger is not.

**RLS**: standard tenant scoping (`tenant_id in (select private.my_tenant_ids())`), plus the T3 clause on study-scoped tables. Writes go through the RPCs below, which check the signer role themselves; no direct `insert` grant on `approval_gates` for `authenticated`.

## 10. RPC surface

| RPC                                                        | Owner  | Does                                                                                                                      |
| ---------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| `rpc_freeze_approval_chain(study_id)`                      | APR-01 | snapshots `tenants.settings.approval` into `approval_chain_config` at study activation                                    |
| `rpc_evaluate_gate(study_id, gate, subject_id, period_no)` | APR-01 | recomputes status from prerequisites + mode; idempotent; returns the row                                                  |
| `rpc_gate_state(study_id)`                                 | APR-01 | every gate row plus the aggregate summary the pages and the Study Hub panel render                                        |
| `rpc_list_pending_gates(tenant_id)`                        | APR-01 | FUS-16 dashboard tile — gates awaiting _this user's_ role                                                                 |
| `rpc_crf_prerequisites(study_id)`                          | APR-01 | FUS-56 — per subject: Gate 3 done, Gate 4 done or NA; lists who is pending                                                |
| `rpc_sign_gate(gate_id, typed_name, meaning, reason)`      | APR-02 | validates role + order, writes `esignatures` + `approval_history`, approves on the last required signature, applies locks |
| `rpc_return_gate(gate_id, reason)`                         | APR-02 | `returned` + history row; reason mandatory                                                                                |
| `rpc_mark_gate_not_applicable(gate_id, reason)`            | APR-02 | conditional gates only                                                                                                    |
| `rpc_override_gate(gate_id, reason)`                       | APR-02 | §8; refuses Gate 3's PI step                                                                                              |

All `security invoker`, `set search_path = ''`, actor from `auth.uid()`.

## 11. Edge cases that must be tested

| #   | Case                                                     | Expected                                                                                                                                                                           |
| --- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | Regenic study, any gate                                  | `not_configured`; no rows; CRF/paper eligibility reads `study_edc.status` only                                                                                                     |
| E2  | Gate 2 signed while Gate 1 is `pending`, sequential      | refused, `409 CONFLICT`, "gate is blocked"                                                                                                                                         |
| E3  | PI signs Gate 3 before RP                                | refused — step order is enforced server-side, not by button order                                                                                                                  |
| E4  | Same user holds RP **and** PI                            | still two signature rows, two distinct actions; the second cannot be the same `esignatures` row. Flag in review: should one person be allowed to sign both steps of Gate 3 at all? |
| E5  | Gate 4 marked NA, then a deviation is later recorded     | gate re-opens to `pending`; `approval_history` keeps the NA row; CRF prerequisites fail again                                                                                      |
| E6  | Subject withdrawn mid-study                              | excluded from Gate 3's "all subjects" prerequisite; Gate 1/2 rows stay as they were                                                                                                |
| E7  | Approve Gate 3 with one subject still `active`           | refused, listing the subject — never a partial approval                                                                                                                            |
| E8  | Write to a form instance locked by Gate 2                | `42501 edc_locked` from EDC-01's guard, unchanged by this module                                                                                                                   |
| E9  | Return a gate that had locked nothing                    | allowed; no unlock happens (§6)                                                                                                                                                    |
| E10 | Override attempted on Gate 3 PI step                     | refused, always                                                                                                                                                                    |
| E11 | Two signers sign the same step concurrently              | `pg_advisory_xact_lock` on the gate id; one wins, the other gets `CONFLICT`                                                                                                        |
| E12 | Tenant edits `approval.steps` after a study is activated | the study keeps its frozen config; only new studies see the change                                                                                                                 |
| E13 | Cross-tenant gate id passed to any RPC                   | `NOT_FOUND`, never `FORBIDDEN`                                                                                                                                                     |

## 12. What I want challenged in review

1. **Gate 2's scope.** I have it per subject _per period_. If verification is actually per period across all subjects at once, Gate 2 becomes one row per period and the prerequisite aggregation changes. Eugenia — check this against how PML actually runs a BA/BE period.
   - **Answer (Eugenia)**: Keep `scope: "subject_period"`. In PML BA/BE trials, verification is performed per subject per period (`verification_rp` form, URS-FS-34). The database scope remains `subject_period` for granular tracking and locking, while the Gate 2 UI page presents the aggregated period summary (e.g., "20/20 subjects confirmed for Period 1") with optional single-signature batch cohort sign-off.
2. **Overrides at all** (§8). Keeping them costs APR-01 a day and adds a permanent audit surface. April's call.
   - **Answer (April)** : Yes, implement the overrides rule. 
3. **E4** — one person holding both RP and PI on Gate 3. Dual signature exists to get two humans; if the roster allows one person to hold both, the control is theatre. I would forbid it. Needs a real answer from someone who knows the staffing.
   - **Answer (Eugenia)**: Forbid same-person signing (`signer_2.user_id != signer_1.user_id`). RP and PI are distinct clinical trial roles on the Delegation Log. The PI attestation text (`URS-FS-35` / TS-35-04) explicitly states the PI is verifying entries made by staff *"under my supervision"*. The backend `rpc_sign_gate` must enforce that two distinct users sign Gate 3.
4. **`gate_permission_locks` vs folding into `edc_lock_events`** (§6). I argue they are different things; D13 provisionally said fold. This document is the "unless the design doc shows a need" clause D13 anticipated.
   - **Answer (Eugenia)**: Keep `gate_permission_locks` separate. `edc_lock_events` is an immutable audit trail of lock events, whereas `gate_permission_locks` is live authorization state queried by `private.edc_can()` on every request to override static role matrix permissions.
5. **Gate 4 auto-detection** — I have detection deciding whether the gate is _offered_, with a human always making the assertion. The alternative (auto-NA when no deviations found) is less work and less safe.

## 13. Acceptance for the implementing items

**APR-01** is done when: config freezes at activation; `rpc_evaluate_gate` is idempotent and correct for all four scopes in both modes; `rpc_gate_state`, `rpc_list_pending_gates` and `rpc_crf_prerequisites` return what the pages and CRF-01 need; E1, E2, E5, E6, E7, E12, E13 are covered by tests; RLS tests prove cross-tenant isolation on both tables.

**APR-02** is done when: signatures are immutable and capture §5 in full; Gate 3's ordering is enforced server-side; approval applies both lock mechanisms; `approval_history` is append-only with a trigger, not just a missing policy; E3, E4, E8, E9, E10, E11 are covered; the CRF appendix can render signature text and timestamp from `approval_history` (FUS-58).

**APR-03** is done when: all four gate pages match the mockups including the blocked/pending/returned/NA states and the evidence summaries; signing goes through the kit `ESignDialog`; every action shows loading, success and failure with the root cause; the history panel renders `approval_history` in order.
