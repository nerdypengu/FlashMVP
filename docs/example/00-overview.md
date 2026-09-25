# 70-approval-chain — Approval Chain — overview

Configurable module `approval_chain` (URS-FUS-79; PML on with four seeded gates, Regenic off). Narrative-only in the URS (§1.4, §2 flow, §2.10) plus FUS-56 (CRF prerequisites), FUS-58 (signature text + timestamp from `approval_history`), FUS-82 (state-based permission locks). The mockup contributes `approval.steps`, `approval.executionMode` and the four gate pages. **The authoritative design is [`00-design-approval-chain.md`](00-design-approval-chain.md) (Russell, W1 — draft for review)**; APR-01/02 are written to it, and their stubs are fleshed out only after it is approved.

## Purpose

Gates control study progression, lock data progressively, and decide output eligibility: Gate 1 Screening Approval (RP, per subject, closes the Screening Workflow) → Gate 2 Verification (RP, per subject/period) → Gate 3 End of Study (RP outcome + PI legal statement, dual sequential signature; locks the subject's data) → Gate 4 Deviation Report (PI, conditional; Not Applicable when no deviation). Every signature is a stored record; every gate event is an immutable history row; completed gates revoke configured permissions on locked form types.

## URS coverage

| URS                                                                                                                                                                                                              | Where             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| N-§1.4 Approval Chain, N-§2 flow (four gates, sequential, return, NA), N-§2.10 (progressive lock), FUS-56 (gate state for CRF), FUS-16 (pending gates), FUS-79 toggle, mockup `approval.steps` / `executionMode` | **APR-01** (BE-2) |
| FUS-82, FUS-58, FUS-91/93/95 (immutability of signatures/history), FS-22/34/35 e-sign text + timestamp, TS-35-04 PI statement                                                                                    | **APR-02** (BE-2) |
| Gate pages: status, required sign-off, evidence, approve / return / NA, e-sign form, history                                                                                                                     | **APR-03** (FE-2) |

## Items

| ID     | Title                                                                                                                                                                                 | Owner | Wave | Est | Status                                                  |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ---- | --- | ------------------------------------------------------- |
| APR-01 | Approval Chain engine: `approval_chain_config` per tenant/study, gate evaluation incl. aggregate prerequisites, sequential/independent, conditional NA, Hastings override with reason | BE-2  | 2    | 7   | STUB — `BL-APR-01-approval-chain-engine.md`             |
| APR-02 | E-signature record, immutable `approval_history`, progressive lock scope, `revoke_on_complete`, state-based permission locks                                                          | BE-2  | 2    | 6   | STUB — `BL-APR-02-esignature-approval-history-locks.md` |
| APR-03 | Gate 1–4 pages: status, required sign-off, evidence, approve / return / Not Applicable, e-sign form, history                                                                          | FE-2  | 2    | 6   | written by FE-2                                         |

## Table ownership

| Table                   | Created by | Written by                                                                                    |
| ----------------------- | ---------- | --------------------------------------------------------------------------------------------- |
| `approval_chain_config` | APR-01     | SYS-07 (tenant `approval.steps` edits land here), APR-01 freeze per study                     |
| `approval_gates`        | APR-01     | APR-01 (evaluate, return, NA, override), APR-02 (`approved` on last signature)                |
| `esignatures`           | APR-02     | APR-02 only (gate steps + form slots); immutable                                              |
| `approval_history`      | APR-02     | APR-01 events + APR-02 signatures; immutable; read by CRF-03, APR-03, DASH-01                 |
| `gate_permission_locks` | APR-02     | APR-02 on gate completion; read by `private.edc_can` (EDC-01) and SYS-03's effective matrix   |
| `edc_form_instances`    | EDC-01     | APR-02 sets `locked` + `lock_gate` (progressive lock); EDC-02 unlock never touches gate locks |

BE-3 (CRF-01/03) **reads** `approval_history` / `esignatures` and never writes them (spec §4).

## Sequencing

Design doc ([`00-design-approval-chain.md`](00-design-approval-chain.md), in review) → APR-01 (config + state + evaluation; draft PR day 3 so APR-03 can start on the read RPCs) → APR-02 (signatures, history, locks) → APR-03 (pages) → CW-11 (Gates 2–4 evidence forms) → CRF-01 prerequisite RPC. SCR-01 must call `rpc_evaluate_gate(…, 1, subject)` so Gate 1 has a producer before APR-03 ships.

## Tenant differences

| Aspect         | Regenic                                          | PML                                                                                       |
| -------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Module         | off — outputs read `study_edc.status = 'locked'` | on — four gates seeded from SAIGMW-OVA `default_approval_chain` + tenant `approval.steps` |
| Execution mode | n/a                                              | `approval.executionMode` sequential (default) / independent                               |
| Signers        | n/a                                              | Gate 1 RP · Gate 2 RP · Gate 3 RP → PI · Gate 4 PI (conditional)                          |
| Override       | n/a                                              | TENANT_ADMIN (Hastings) with reason, per design doc                                       |

## Mockup screens

`app_pml_diagnosis_s6_approval_gate1.png` … `gate4.png`; Study Hub APPROVAL panel in `app_pml_diagnosis_s6.png`; CRF prerequisites rows in `app_pml_crf-generator.png`; Profile E-SIGNATURE block in `app_regenic_profile.png`; Dashboard "Pending Approvals" tile (`app_pml_dashboard.png`).

## Out

- Evidence forms (screening result, verification, EOS, deviation report, dosing/meals/SAE dual sign) → 55-screening, 75-clinical-workflow
- CRF appendix rendering of signatures → 80-crf-renderer
- Static role matrix and module toggle → 20-system-config (SYS-03, SYS-04, SYS-07)
- Keycloak re-auth / OTP as signature verifier → AUTH-01 follow-up
- Reminders "Gate 2 pending review" → 88-notifications
- QA Workflow gate (URS §2.11) → Phase 2
