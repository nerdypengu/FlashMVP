# BL-APR-01 — Approval Chain engine

|                |                                                                                                                                                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Owner**      | BE-2                                                                                                                                                                                                                                                     |
| **Wave**       | 2                                                                                                                                                                                                                                                        |
| **Estimate**   | 7 days                                                                                                                                                                                                                                                   |
| **Depends on** | **[`00-design-approval-chain.md`](00-design-approval-chain.md)** — this item implements it, not this stub · EDC-01/02 (soft-lock state, `lock_after_gate`), SCR-01 (Gate 1 trigger), SYS-07 (`approval.executionMode`, `approval.steps`), FND-06 (roles) |
| **Blocks**     | APR-02 (signatures + history + locks), APR-03 (gate pages), CW-11 (Gates 2–4 wiring), CRF-01 (prerequisite RPC reads gate state), STU-01 (Study Hub APPROVAL panel), DASH-01 (Pending Approvals tile), NTF-01 (approval pending reminder)                |
| **Repo**       | `optimus-code`                                                                                                                                                                                                                                           |
| **Branch**     | `feat/BL-APR-01-approval-chain-engine`                                                                                                                                                                                                                   |
| **Status**     | STUB — design doc published 2026-09-23 and in review; flesh out once it is approved                                                                                                                                                                      |

> Read first: `docs/backlog/00-README.md`, `00-standards/*`, `50-edc/BL-EDC-01` §3, `50-edc/BL-EDC-02` §3.3, and [`00-design-approval-chain.md`](00-design-approval-chain.md). No React in this item. BE lead is second signature on the lock/RLS design (spec §4).

---

## 1. Requirements covered

| ID            | Rank | Requirement (quoted)                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| URS-N-§1.4    | —    | "Approval Chain: Manages sequential approval gates that control study progression, data locking, and downstream output eligibility. For PML, Gate 1 is completed at the end of the Screening Workflow, while subsequent approval gates are applied to the downstream Clinical Workflow according to the approved study process."                                                                                              |
| URS-N-§2 Flow | —    | "For PML, the approval chain is configurable and seeded with four enabled gates in the current prototype: Gate 1 — Screening Approval, Gate 2 — Verification, Gate 3 — End of Study, and conditional Gate 4 — Deviation Report. Gates follow their configured order in sequential mode and use role-based electronic signatures. A gate may be approved, returned for revision, or, when conditional, marked Not Applicable." |
| URS-N-§2 Flow | —    | "The current Regenic approval configuration has no approval gates enabled by default, so locked study data can proceed to the Paper Generation workflow."                                                                                                                                                                                                                                                                     |
| URS-N-§2.10   | —    | "The workflow is integrated with the Approval Chain. Completion of the applicable workflow activities and approval gates progressively locks study data and determines eligibility for CRF Document Renderer generation."                                                                                                                                                                                                     |
| URS-FUS-56    | C    | Prerequisites: all subjects in the study must have completed Gate 3 and, where applicable, Gate 4. Gate 4 (Deviation Report) is conditional and may be marked Not Applicable, in which case it is not a prerequisite. The Generate CRF button shall be disabled with a clear explanation if prerequisites are not met, listing which subjects are pending. — _engine exposes the per-subject gate state CRF-01 reads_         |
| URS-FUS-79    | I    | Toggle options should include: … Approval Chain. — _module `approval_chain`; Regenic off by default_                                                                                                                                                                                                                                                                                                                          |
| URS-FUS-16    | D    | The Dashboard shall display pending task notifications including: approval gates awaiting signature (PML) … — _engine exposes `rpc_list_pending_gates`_                                                                                                                                                                                                                                                                       |
| URS-N-§1.5    | —    | User Matrix "Approval Chain": HoC View · SC Full · SCL Full · Nurse View · Phlebotomist View · RP Full · PI Full · Admin — · QA View. Mockup `approve_gate → RP, PI`. §1.6: T3 roles no access (Sponsor/Auditor sees Deviation/SAE reports via FUS-77 only)                                                                                                                                                                   |
| Mockup config | —    | `approval.steps` (structured) and `approval.executionMode` (sequential \| independent); defaults gate1 RP required · gate2 RP required · gate3 RP + PI required · gate4 PI conditional; PML seed all four, Regenic none                                                                                                                                                                                                       |

"Hastings override with reason" (spec §9): Hastings = TENANT_ADMIN (URS glossary). No URS row grants it; it is a design-doc decision — keep it audited, reason-mandatory, and never for Gate 3's PI signature unless the design doc says so.

## 2. Context

The engine answers three questions for any (study, gate[, subject]): **is it open** (sequential mode: previous gate approved for the same scope; independent: always), **are the prerequisites met** (aggregate evidence: e.g. Gate 3 requires _all_ subjects soft-locked and Gate 1+2 approved for _all periods_; Gate 1 is per subject; Gate 4 is applicable only when ≥ 1 deviation exists — CW-03/CW-11), and **who must sign** (roles from `approval.steps`). Signing, history and locking are APR-02; this item owns config, state and evaluation.

**Mockup:** `_mockup/app_pml_diagnosis_s6_approval_gate1..4.png` — Gate 1 "Screening Approval" (per subject, RP; evidence = screening forms), Gate 2 "Verification" (RP; evidence Time Sampling, Dosing Log, Vital Signs, AE, Meals; "Blocked — Waiting on earlier gates to be approved before this one can open (sequential mode)"), Gate 3 "End of Study" (RP signs first with outcome Completed / Withdrawn + reason, PI reads the legal statement and signs second; "26 of 26 subjects completed. Gate 1 and Gate 2 approved for all periods."; after both signatures all data permanently locked), Gate 4 "Deviation Report" (PI; auto-detected > 1 min sampling deviations; Not Applicable when none). Statuses: Pending Approval · Approved · Blocked · Returned · Not Applicable. Study Hub APPROVAL panel (`app_pml_diagnosis_s6.png`). CRF Renderer prerequisite rows "Gate 1–4 … 20/20 subject records confirmed" (`app_pml_crf-generator.png`).

**Tenant differences:** PML — module on, four gates seeded from the SAIGMW-OVA package `default_approval_chain` + tenant `approval.steps`. Regenic — module off; every evaluation returns `not_configured` and outputs read `study_edc.status = 'locked'` only. Configuration is per tenant with per-study override (a study freezes its chain at activation, like the EDC structure).

**URS vs mockup:** the mockup scopes Gate 1 per subject and Gates 2–4 per study; FS-22/34 sign **per subject**, FS-35 (EOS) per subject too, and FUS-56 counts subjects "completed Gate 3". Design decision to confirm in the doc: Gates 1–3 evaluate **per subject** with a study-level roll-up ("all subjects"), Gate 4 per study. The mockup's "approve / return" also needs the "Returned" reopen path into EDC-02's `rpc_reopen_form_instance`.

**Scope summary (to be detailed from the design doc):** tables `approval_chain_configs` (tenant_id, study_id null = tenant default, gates jsonb: `[{ gate: 1..4, key, label, required_roles: ['RP'] | ['RP','PI'] (ordered), conditional: bool, scope: 'subject'|'study', prerequisites: [...] }]`, execution_mode, active), `approval_gates` (runtime state: tenant_id, study_id, gate_no, subject_id null for study scope, period_no, status `pending | blocked | approved | returned | not_applicable`, opened_at, evaluated_at, blockers jsonb, current_step int, last_history_id); RPCs `rpc_evaluate_gate(p_study_id, p_gate_no, p_subject_id, p_period_no)` (pure prerequisite evaluation → blockers list; called by SCR-01, CW-11, EDC-02 soft lock, and on demand), `rpc_gate_status(p_study_id)` (Study Hub panel + CRF prerequisite rows: per gate counts approved / pending / blocked / NA, pending subjects listed), `rpc_list_pending_gates(p_tenant)` (Dashboard + NTF-01), `rpc_set_gate_not_applicable(p_gate_id, p_reason)` (conditional gates only, PI), `rpc_return_gate(p_gate_id, p_reason)` (→ `returned`, reopens the referenced instances via EDC-02), `rpc_override_gate(p_gate_id, p_reason)` (TENANT_ADMIN, reason ≥ 20 chars, audited `GATE_OVERRIDDEN`, disallowed where the design doc says), `rpc_freeze_chain_for_study(p_study_id)` (copy tenant config into study config at EDC activation). Actions `evaluateGate`, `returnGate`, `setGateNotApplicable`, `overrideGate`, queries `getGateStatus`, `listPendingGates`. Audit `module: 'approval_chain'`: `GATE_OPENED`, `GATE_BLOCKED`, `GATE_RETURNED`, `GATE_NOT_APPLICABLE`, `GATE_OVERRIDDEN`, `CHAIN_CONFIG_CHANGED`. Screens: none (APR-03 by FE-2).

## 3. Data model

_TODO before Wave 2 — see BL-SPO-01 for the expected depth._

## 4. Server actions & queries

_TODO before Wave 2 — see BL-SPO-01 for the expected depth._

## 5. UI

_TODO before Wave 2 — see BL-SPO-01 for the expected depth._ (None here — APR-03.)

## 6. Edge cases

_TODO before Wave 2 — see BL-SPO-01 for the expected depth._

## 7. Tests required

_TODO before Wave 2 — see BL-SPO-01 for the expected depth._

## 8. Out of scope

- E-signature record, `approval_history`, progressive lock (`lock_after_gate`), `revoke_on_complete`, state-based permission locks (FUS-82) → **APR-02**
- Gate pages, e-sign forms, history timeline UI → **APR-03**
- The evidence itself: screening result (SCR-01), verification / EOS / deviation report forms (CW-11), deviation detection (CW-03)
- `approval.steps` / `approval.executionMode` editing UI → **SYS-07**; Approval Chain module toggle → **SYS-04**
- CRF prerequisite panel → **CRF-04** (reads `rpc_gate_status`)
- Reminders "Gate 2 pending review" → **NTF-01**
- QA Workflow gate (URS §2.11) → Phase 2

## 9. Acceptance checklist

_TODO before Wave 2 — see BL-SPO-01 for the expected depth._

## 10. Security checklist

_TODO before Wave 2 — see BL-SPO-01 for the expected depth._
