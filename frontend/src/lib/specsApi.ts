/**
 * specsApi.ts — typed client for the FlashMVP /specs backend endpoints
 * Mirrors the Pydantic contracts in backend/app/schemas/spec.py
 */

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')

// ── Types (mirror backend schemas/spec.py) ────────────────────────────────────

export type TaskItem = {
  id: string
  description: string
  completed: boolean
}

export type IBMToolBinding = {
  code_engine: boolean
  cloud_db: boolean
  secrets_vault: boolean
  watsonx_qa: boolean
}

export type SpecStatus =
  | 'DRAFTING'
  | 'AWAITING_APPROVAL'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'

export type SpecResponse = {
  feature_id: string
  status: SpecStatus
  requirements: string
  design: string
  tasks: TaskItem[]
  ibm_bindings: IBMToolBinding
}

// ── API calls ─────────────────────────────────────────────────────────────────

/** POST /api/v1/specs/generate — draft a 3-part SDD from prompt + template */
export async function generateSpec(prompt: string, template: string): Promise<SpecResponse> {
  const res = await fetch(`${API_URL}/api/v1/specs/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, template }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.detail ?? `Generate failed (HTTP ${res.status})`)
  }
  return res.json()
}

/** POST /api/v1/specs/approve — lock spec to APPROVED */
export async function approveSpec(feature_id: string): Promise<{ feature_id: string; status: string; locked: boolean }> {
  const res = await fetch(`${API_URL}/api/v1/specs/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feature_id }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.detail ?? `Approve failed (HTTP ${res.status})`)
  }
  return res.json()
}

/** POST /api/v1/specs/revise — patch selected sections with feedback */
export async function reviseSpec(
  feature_id: string,
  feedback: string,
  sections: string[]
): Promise<SpecResponse> {
  const res = await fetch(`${API_URL}/api/v1/specs/revise`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ feature_id, feedback, sections }),
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.detail ?? `Revise failed (HTTP ${res.status})`)
  }
  return res.json()
}

/** GET /api/v1/specs/{feature_id} — fetch current spec state */
export async function getSpec(feature_id: string): Promise<SpecResponse> {
  const res = await fetch(`${API_URL}/api/v1/specs/${feature_id}`)
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new Error(body?.detail ?? `Get spec failed (HTTP ${res.status})`)
  }
  return res.json()
}
