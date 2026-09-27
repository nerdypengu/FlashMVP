import { CircleDashed, CheckCircle2, RefreshCw } from 'lucide-react'

export type StatusTone = 'draft' | 'changes' | 'approved'

export function statusTone(status: string | undefined, isLocked?: boolean): StatusTone {
  if (status === 'APPROVED') return 'approved'
  if (status === 'CHANGES_REQUESTED') return 'changes'
  return 'draft'
}

const LABELS: Record<StatusTone, string> = {
  draft: 'Draft Specs',
  changes: 'Changes requested',
  approved: 'Specs Active & Verified',
}

/** SDD Status Badge — DRAFT (amber) · CHANGES REQUESTED (orange) · APPROVED & VERIFIED (green). */
export default function SpecStatusBadge({ status, isLocked = false }: { status?: string; isLocked?: boolean }) {
  const tone = statusTone(status, isLocked)
  const Icon = tone === 'approved' ? CheckCircle2 : tone === 'changes' ? RefreshCw : CircleDashed
  return (
    <span className={`sr-status sr-status--${tone}`} role="status" aria-live="polite">
      <Icon size={13} aria-hidden="true" />
      {LABELS[tone]}
    </span>
  )
}

