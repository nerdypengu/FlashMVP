# BL-APR-02 — E-signature record, immutable `approval_history`, progressive lock, state-based permission locks

|                |                                                                                                                                                                                                                                               |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Owner**      | BE-2                                                                                                                                                                                                                                          |
| **Wave**       | 2                                                                                                                                                                                                                                             |
| **Estimate**   | 6 days                                                                                                                                                                                                                                        |
| **Depends on** | APR-01 (gate state + evaluation), EDC-01 (`edc_form_instances.locked / lock_gate`, `edc_forms.lock_after_gate`), EDC-02 (guard trigger honours `locked`), FND-03 (`private.raise_immutable`), SYS-03 (role matrix keys, for the lock overlay) |
| **Blocks**     | APR-03 (sign flow), CRF-03 (appendix reads e-sign text + timestamp from `approval_history`), CW-04/05/08/11 (dual e-sign forms reuse `esignatures`), CRF-01 (locked-data guarantee)                                                           |
| **Repo**       | `optimus-code`                                                                                                                                                                                                                                |
| **Branch**     | `feat/BL-APR-02-esignature-approval-history-locks`                                                                                                                                                                                            |
| **Status**     | STUB — flesh out before Wave 2                                                                                                                                                                                                                |

> Read first: `docs/backlog/00-README.md`, `00-standards/*`, `BL-APR-01`, `50-edc/BL-EDC-01` §3.2 (guard trigger), `kit.md` §2 `ESignDialog` (payload `{ typedName, attested, reason? }`, D-1 verifier hook). No React in this item. BE lead co-signs the lock design.

---

## 1. Requirements covered

| ID                  | Rank | Requirement (quoted)                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------- | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| URS-FUS-82          | C    | State-based permission locks should override the static role permission matrix after gate completion. Specified roles lose specified create, read, update, and delete permissions on locked form types.                                                                                                                                                                                                                                                                                   |
| URS-FUS-58          | C    | An Appendix shall contain all applicable individual CRF forms for each subject according to the approved CRF template, including the applicable electronic signature text and timestamp from approval_history at the moment of signing.                                                                                                                                                                                                                                                   |
| URS-FUS-93          | C    | The system shall maintain a comprehensive, tamper-proof Audit Trail recording all critical user actions across all modules, including … approval/rejection, EDC lock … — _every signature and lock is audited_                                                                                                                                                                                                                                                                            |
| URS-FUS-95          | C    | The Audit Trail shall be immutable: no user, including Super Admins, shall be able to modify, delete, or suppress Audit Trail records. — _same guarantee applied to `approval_history` and `esignatures`_                                                                                                                                                                                                                                                                                 |
| URS-FUS-91          | C    | Each user account shall have an associated unique identifier, username, for traceability in study forms and approval workflows. — _signature rows store `user_id` + display name at signing time_                                                                                                                                                                                                                                                                                         |
| URS-N-§2 Flow       | —    | "Gates follow their configured order in sequential mode and use role-based electronic signatures. A gate may be approved, returned for revision, or, when conditional, marked Not Applicable."                                                                                                                                                                                                                                                                                            |
| URS-N-§2.10         | —    | "Completion of the applicable workflow activities and approval gates progressively locks study data and determines eligibility for CRF Document Renderer generation."                                                                                                                                                                                                                                                                                                                     |
| URS-FS-22 / 34 / 35 | —    | SAIGMW-OVA: "sign berupa teks nama dan time stamp disimpan untuk dipakai ketika approval" (signature = typed name text + timestamp, stored for use at approval); FS-35 TS-35-04 PI legal statement: "I have reviewed this CRF and confirmed that to the best of my knowledge, it has accurately reflected the study information obtained for this study subject. All entries were made either by me or by a person under my supervision who has signed the Delegation and Signature Log." |
| URS-N-§1.5          | —    | User Matrix "Approval Chain": SC Full · SCL Full · RP Full · PI Full · others View / —. Mockup `approve_gate → RP, PI` (signers); SC/SCL "Full" = manage/return, never sign a gate                                                                                                                                                                                                                                                                                                        |

`revoke_on_complete` (spec §9) is a mockup/design-doc term: when a gate completes, the roles listed in the gate's `revoke_on_complete` lose the listed actions on the form types the gate locks (the mechanism for FUS-82). No numbered URS row names it.

## 2. Context

Three durable facts live here. (1) **`esignatures`** — one row per signing act (gate step, dosing PIC/Verificator, meals SCL/RP, SAE reporter/PI/sponsor, EOS RP then PI): who, role, typed name, the exact `meaning` text shown, `signed_at = now()`, what was signed (gate id / form instance id) and a content hash of the signed payload. (2) **`approval_history`** — append-only timeline per gate: opened, signed step n/m, approved, returned (reason), not-applicable (reason), overridden (reason); CRF-03 prints from here (FUS-58). (3) **Locks** — on gate approval, every `edc_form_instances` row whose form has `lock_after_gate <= gate_no` (in scope: the subject / all subjects) becomes `locked` with `lock_gate`, and a **permission-lock overlay** (`gate_permission_locks`: tenant, study, gate_no, role, form_type_key, revoked_actions[]) is written from the gate config's `revoke_on_complete`; `private.edc_can()` (EDC-01 §3.4) consults the overlay so FUS-82 is enforced in the DB, not the UI.

**Mockup:** `_mockup/app_pml_diagnosis_s6_approval_gate3.png` ("RP signs first … then PI reads the legal statement and signs second. After both signatures, all data for this study is permanently locked."), `gate1.png` REQUIRED SIGN-OFF "Awaiting: RP. Your role does not have sign-off on this gate." and APPROVAL HISTORY; `app_regenic_profile.png` E-SIGNATURE "Dr. Sarah Wijaya - Head of Clinical — Managed by administrator · Read-only" (the signer's display string comes from `users.display_name` + role label; never editable by the signer). `kit.md` `ESignDialog`: Sign enabled only when typed name matches and attestation ticked; D-1 verifier (Keycloak re-auth / OTP) is a later plug-in — this item stores what the dialog sends plus server time.

**Tenant differences:** PML — all of it. Regenic — module off; `esignatures` may still be used for optional form-submit e-sign (EDC-02 keeps `submit_signature` on the instance for now; migration of that payload into `esignatures` is a documented follow-up, not a Wave 2 task).

**URS vs mockup:** the mockup says Gate 3 locks "all data for this study"; FUS-56 speaks per subject. Lock scope follows APR-01's per-subject evaluation with a study-level roll-up: EOS for subject X locks X's instances; when every subject has Gate 3 approved the study's `study_edc.status` is already `locked` (EDC-02) and Gate 4 opens study-wide.

**Scope summary (to be detailed):** tables `esignatures` (immutable, `private.raise_immutable`), `approval_history` (immutable; `gate_id`, `event`, `step_no`, `signature_id`, `reason`, `actor_id`, `actor_name`, `actor_role`, `occurred_at`, `snapshot jsonb` of the gate blockers at that moment), `gate_permission_locks`; RPCs `rpc_sign_gate_step(p_gate_id, p_esign jsonb)` (one transaction: role must equal the step's required role, order enforced for sequential steps RP→PI, typed name = caller display name, writes signature + history, and if it was the last step → `approval_gates.status = 'approved'` + `private.apply_gate_locks(gate)` + `private.apply_permission_locks(gate)` + notify APR-01 to re-evaluate dependants), `rpc_sign_form(p_form_instance_id, p_role_slot, p_esign)` (dual-sign forms for CW-04/05/08/11: slots `pic | verificator | scl | rp | pi | sponsor`; second slot cannot equal the first signer's user), `rpc_gate_history(p_gate_id)`, `rpc_effective_permissions(p_study_id, p_form_type_key)` (role matrix minus overlay — for FE gating and `private.edc_can`), `rpc_release_gate_locks` **does not exist** (locks are permanent; a `returned` gate before approval never locked anything; post-approval correction is a design-doc question — surface to Russell). Actions `signGateStep`, `signForm`, queries `getGateHistory`, `getEffectivePermissions`. Audit `module: 'approval_chain'`: `GATE_STEP_SIGNED`, `GATE_APPROVED`, `FORM_SIGNED`, `GATE_LOCKS_APPLIED`, `PERMISSION_LOCKS_APPLIED`. Screens: none (APR-03; the `ESignDialog` and CW-FE-02 dual-sign widget by FE-2).

## 3. Data model

_TODO before Wave 2 — see BL-SPO-01 for the expected depth._

## 4. Server actions & queries

_TODO before Wave 2 — see BL-SPO-01 for the expected depth._

## 5. UI

_TODO before Wave 2 — see BL-SPO-01 for the expected depth._ (None here — APR-03 / CW-FE-02.)

## 6. Edge cases

_TODO before Wave 2 — see BL-SPO-01 for the expected depth._

## 7. Tests required

_TODO before Wave 2 — see BL-SPO-01 for the expected depth._

## 8. Out of scope

- Gate configuration, evaluation, sequential/independent, NA, override → **APR-01**
- Gate pages, `ESignDialog` wiring, history timeline → **APR-03**; dual-sign widget → **CW-FE-02**
- Keycloak re-auth / OTP as signature verifier (D-1) → **AUTH-01** follow-up; today typed name + attestation
- Which forms carry `lock_after_gate` → CRF-05 seed / EDC-03 builder
- Printing signatures into the CRF appendix → **CRF-03** (reads `approval_history` + `esignatures`)
- Static role matrix (`module × action`) → **SYS-03**; this item only overlays it after gate completion
- Study status `Completed` after Gate 3/4 → **STU-01** (reads gate state)

## 9. Acceptance checklist

_TODO before Wave 2 — see BL-SPO-01 for the expected depth._

## 10. Security checklist

_TODO before Wave 2 — see BL-SPO-01 for the expected depth._
