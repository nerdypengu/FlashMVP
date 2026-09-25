# BL-APR-03 — Gate 1–4 pages: status, required sign-off, evidence, approve / return / Not Applicable, e-sign form, history

|                |                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Owner**      | FE-2                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| **Wave**       | 2                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| **Estimate**   | 6 days                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| **Depends on** | **APR-01** (`approval_chain_config`, gate evaluation RPC, sequential/independent, conditional NA, override), **APR-02** (`approval_history`, e-signature record, progressive lock), Russell's Approval Chain design doc, SCR-01/02 (Gate 1 subject + evidence), CW-03/08/11 (Gate 2–4 evidence sources — Wave 3, so Gate 2–4 evidence panels ship with placeholders first), STU-01 (Study Hub APPROVAL card links here), kit `ESignDialog` |
| **Blocks**     | CRF-04 (prerequisite panel reuses `GateStatusRow`), DASH-01 (Pending Approvals KPI + tasks), NTF-01 (approval pending reminders), QA-03 PML path                                                                                                                                                                                                                                                                                           |
| **Repo**       | `optimus-code`                                                                                                                                                                                                                                                                                                                                                                                                                             |
| **Branch**     | `feat/BL-APR-03-gate-pages-and-e-sign-forms`                                                                                                                                                                                                                                                                                                                                                                                               |
| **Status**     | STUB — flesh out before Wave 2                                                                                                                                                                                                                                                                                                                                                                                                             |

> Read first: `docs/backlog/00-README.md`, `00-standards/kit.md` (`ESignDialog`, `SignatureStamp`, `ActivityFeed`, `ConfirmDialog`), `00-standards/data-access.md`, `00-standards/security.md` (A07, A08), `00-standards/multi-tenancy.md`, `00-standards/ui.md`, `00-standards/testing.md`. Then `70-approval-chain/00-overview.md`, BL-APR-01/02 §3, the Approval Chain design doc.

---

## 1. Requirements covered

| ID         | Rank | Requirement (quoted)                                                                                                                                                                                                                                                                                                                                                                                                          |
| ---------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| URS-N-§1.4 | —    | "Approval Chain: Manages sequential approval gates that control study progression, data locking, and downstream output eligibility. For PML, Gate 1 is completed at the end of the Screening Workflow, while subsequent approval gates are applied to the downstream Clinical Workflow according to the approved study process."                                                                                              |
| URS-N-§2   | —    | "For PML, the approval chain is configurable and seeded with four enabled gates in the current prototype: Gate 1 — Screening Approval, Gate 2 — Verification, Gate 3 — End of Study, and conditional Gate 4 — Deviation Report. Gates follow their configured order in sequential mode and use role-based electronic signatures. A gate may be approved, returned for revision, or, when conditional, marked Not Applicable." |
| URS-N-§2.3 | —    | "The Study Hub provides Overview, Team, and Audit Trail information, … study status controls, and configurable approval status." — _APPROVAL card on Study Hub links to these pages_                                                                                                                                                                                                                                          |
| URS-FUS-56 | C    | "Prerequisites: all subjects in the study must have completed Gate 3 and, where applicable, Gate 4. Gate 4 (Deviation Report) is conditional and may be marked Not Applicable, in which case it is not a prerequisite…" — _NA action lives here_                                                                                                                                                                              |
| URS-FUS-58 | C    | "…including the applicable electronic signature text and timestamp from approval*history at the moment of signing." — \_the e-sign form captures the meaning text shown to the signer*                                                                                                                                                                                                                                        |
| URS-FUS-82 | C    | "State-based permission locks should override the static role permission matrix after gate completion…" — _pages display the resulting locks; APR-02 enforces_                                                                                                                                                                                                                                                                |
| URS-FUS-16 | D    | "…pending task notifications including: approval gates awaiting signature (PML)…" — _exposes pending-gate query for DASH-01_                                                                                                                                                                                                                                                                                                  |
| URS-N-§1.5 | —    | "Approval Chain": Head of Clinical View · SC Full · SCL Full · Nurse View · Phlebotomist View · RP **Full** · PI **Full** · Admin — · QA View. Signers per gate from `approval_chain_config` (default: gate1 RP · gate2 RP · gate3 RP + PI · gate4 PI conditional). SC/SCL "Full" = may return for revision / request review, never sign                                                                                      |
| URS-N-§1.6 | —    | Approval Chain: Phlebotomist External — · Nurse External — · Sponsor/Auditor — (T3 never opens gate pages)                                                                                                                                                                                                                                                                                                                    |

## 2. Context

Four pages under the Study Hub: `diagnosis/[studyId]/approval/gate{1,2,3,4}` (mockup route; sidebar-less, breadcrumb `Studies › {study} › Approvals › Gate n — {name}`). Each page: **header card** (title "Gate 1 — Screening Approval", one-line description, `StatusBadge` Pending Approval / Approved / Blocked / Returned / Not Applicable; when blocked: "Waiting on earlier gates to be approved before this one can open (sequential mode)."), **REQUIRED SIGN-OFF** (list of signer roles with ✓/○ and "Awaiting: RP. Your role does not have sign-off on this gate."), **SUPPORTING EVIDENCE** (per gate, from APR-01's evaluation payload), **actions** (Approve → `ESignDialog`; Return for revision → `ConfirmDialog requireReason`; Gate 4 only: Mark Not Applicable → `ConfirmDialog requireReason`; Gate 3: RP signs first with outcome Completed / Withdrawn + reason, then PI signs second after reading the legal statement — dual sequential e-sign), **APPROVAL HISTORY** (`ActivityFeed` from `approval_history`, `SignatureStamp` per signature; "No activity yet."). Gate scope (per subject for Gate 1, per period for Gate 2, per study for 3/4) follows the design doc; Gate 1 page therefore has a subject selector.

**Mockup:** `_mockup/app_pml_diagnosis_s6_approval_gate1.png` (evidence: Informed Consent, Demography, Medical History, Physical Assessment, Vital Signs Screening, ECG Screening, Laboratory Examination, Serology Test, Drug & Alcohol Abuse, Inclusion / Exclusion Criteria), `…gate2.png` (Time Sampling T0–T24 complete · 2 minor deviations (<3 min) · Dosing Log dual PIC/Verificator sign · Vital Sign Monitoring 24 timepoints · AE Monitoring · Meals Record verified by SCL), `…gate3.png` ("26 of 26 subjects completed. Gate 1 and Gate 2 approved for all periods." + dual-signature explanation), `…gate4.png` (">1 minute" deviation rule; "If none occurred, mark it Not Applicable."), `_mockup/app_pml_diagnosis_s6.png` (Study Hub APPROVAL card with four gate rows).

**Tenant differences:** PML — four gates enabled by seed. Regenic — none enabled by default; pages render "No approval gates are configured for this tenant" (`EmptyState`) and the Study Hub card is hidden; module `approval_chain` toggle (FUS-79) 404s the routes when off. `approval.executionMode` (SYS-07): sequential shows the Blocked banner; independent lets any enabled gate open.

**URS vs mockup:** mockup `approve_gate` = RP, PI (matches URS Full). Mockup Gate 2 evidence line "2 minor deviations (<3 min)" contradicts Gate 4's ">1 minute" rule — deviation threshold is **1 minute** (URS §2 / CW-03); evidence text shows the count only.

**Scope summary.** Tables: none new (APR-01/02 own `approval_chain_config`, the gate-state table, `approval_history`, `esignatures`). RPCs consumed (names as published in APR-01/02): `rpc_evaluate_gate` + `rpc_gate_status` (status, blocked reason, signer steps, evidence payload), `rpc_sign_gate_step(p_gate_state_id, p_step, p_signature jsonb { typedName, attested, meaning, outcome?, reason? })` (APR-02 — one call per signer step; Gate 3 = RP step then PI step), `rpc_return_gate`, `rpc_set_gate_not_applicable`, `rpc_override_gate` (Hastings, reason — rendered for TENANT_ADMIN only), `rpc_gate_history`, `rpc_list_pending_gates` (DASH-01 / NTF-01). Queries: `getGatePage(studyId, gate, scopeId?)`, `listPendingGates(tenant)` (DASH-01/NTF-01). Actions: `approveGate` (ESign payload; roles from config, checked server-side by APR-02 — the UI passes nothing about roles), `returnGate` (reason ≥ 10), `markGateNotApplicable` (Gate 4, reason), `signEndOfStudyRp` / `signEndOfStudyPi` (Gate 3 dual sequence with outcome). Audit: written by APR-02's RPC (`GATE_APPROVED/RETURNED/NA`, signature text + timestamp); UI records nothing extra. Screens: `GateHeaderCard`, `RequiredSignoffList`, `EvidencePanel` (per-gate renderers: `Gate1Evidence` form checklist with ✓/!, `Gate2Evidence` CW summaries, `Gate3Evidence` counts + dual-sign text, `Gate4Evidence` deviation summary), `GateActions` (`RoleGate` on signer roles from the evaluation payload), `EndOfStudyOutcomeDialog` (Completed / Withdrawn + reason, then `ESignDialog`), `ApprovalHistoryFeed`, `GateStatusRow` (shared with STU-01 / CRF-04). Meaning texts stored with the signature: "I have reviewed the screening forms for this subject and approve eligibility" (G1), "I verify the clinical workflow data for this period" (G2), "I confirm the study outcome and lock all data for this study" (G3, RP then PI), "I have reviewed the protocol deviation report" (G4).

## 3. Data model

_TODO before Wave 2 — see BL-SPO-01 for the expected depth._

## 4. Server actions & queries

_TODO before Wave 2 — see BL-SPO-01 for the expected depth._

## 5. UI

_TODO before Wave 2 — see BL-SPO-01 for the expected depth._

## 6. Edge cases

_TODO before Wave 2 — see BL-SPO-01 for the expected depth._

## 7. Tests required

_TODO before Wave 2 — see BL-SPO-01 for the expected depth._

## 8. Out of scope

- Gate configuration, evaluation, sequential/independent logic, aggregate prerequisites, Hastings override → **APR-01**
- Signature record, immutable history, progressive lock scope, `revoke_on_complete`, state-based permission locks → **APR-02**
- Evidence _sources_: screening forms → **SCR-01/02**; time sampling / dosing / vitals / AE / meals → **CW-03..08**; verification / EOS / deviation report → **CW-11**
- Approval settings UI (`approval.steps`, execution mode) → **SYS-07**
- Study Hub APPROVAL card → **STU-01** (imports `GateStatusRow`)
- CRF prerequisite panel → **CRF-04**; reminders → **NTF-01**
- Keycloak re-auth / OTP for signatures (`verifier`) → foundation D-1
- Protocol approval (SCL) → **PRO-03** (not a gate)

## 9. Acceptance checklist

_TODO before Wave 2 — see BL-SPO-01 for the expected depth._

## 10. Security checklist

_TODO before Wave 2 — see BL-SPO-01 for the expected depth._
