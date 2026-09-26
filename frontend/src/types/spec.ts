/**
 * Data contracts mirrored from backend/app/schemas/spec.py (BL-SDD-01 / BL-SDD-03).
 */
export type SpecStatus = 'DRAFTING' | 'AWAITING_APPROVAL' | 'DRAFT' | 'CHANGES_REQUESTED' | 'APPROVED'

export type SpecTask = {
  id: string
  description: string
  completed: boolean
}

export type IBMToolBindings = {
  code_engine: boolean
  cloud_db: boolean
  secrets_vault: boolean
  watsonx_qa: boolean
}

export type SpecResponse = {
  feature_id: string
  status: SpecStatus | string
  requirements: string
  design: string
  tasks: SpecTask[]
  ibm_bindings: IBMToolBindings
}

export type SpecSection = 'requirements' | 'design' | 'tasks' | 'all'

export type ApproveResponse = {
  feature_id: string
  status: string
  locked: boolean
}

export type RevisionEntry = {
  id: string
  feedback: string
  sections: SpecSection[]
  at: string
}

/** Everything the SDD gate needs to survive a page reload. */
export type SpecSession = {
  templateId: string
  prompt: string
  projectId: string
  spec: SpecResponse | null
  revisions: RevisionEntry[]
  reviewedTaskIds: string[]
  approvedAt: string | null
}

export type SpecTab = 'requirements' | 'design' | 'tasks'
