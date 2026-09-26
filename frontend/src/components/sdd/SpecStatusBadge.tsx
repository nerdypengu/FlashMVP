import { CircleDashed, Lock, RefreshCw } from 'lucide-react'

export type StatusTone = 'draft' | 'changes' | 'approved'

export function statusTone(status: string | undefined, isLocked: boolean): StatusTone {
  if (isLocked || status === 'APPROVED') return 'approved'
  if (status === 'CHANGES_REQUESTED') return 'changes'
  return 'draft'
}

const LABELS: Record<StatusTone, string> = {
  draft: 'Draft',
  changes: 'Changes requested',
  approved: 'Approved & locked',
}

/** BL-SDD-03 — DRAFT (amber) · CHANGES REQUESTED (orange) · APPROVED & LOCKED (green). */
export default function SpecStatusBadge({ status, isLocked }: { status?: string; isLocked: boolean }) {
  const tone = statusTone(status, isLocked)
  const Icon = tone === 'approved' ? Lock : tone === 'changes' ? RefreshCw : CircleDashed
  return (
    <span className={`sr-status sr-status--${tone}`} role="status" aria-live="polite">
      <Icon size={13} aria-hidden="true" />
      {LABELS[tone]}
    </span>
  )
}
