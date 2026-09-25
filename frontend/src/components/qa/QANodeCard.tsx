type NodeStatus = 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'SKIPPED'

type QANodeCardProps = {
  id: string
  name: string
  status: NodeStatus
  durationMs: number
  enabled: boolean
  elapsed?: number
  onToggle: (id: string, enabled: boolean) => void
  running: boolean
}

const STATUS_EMOJI: Record<NodeStatus, string> = {
  PENDING: '🟡',
  RUNNING: '🔵',
  PASSED:  '🟢',
  FAILED:  '🔴',
  SKIPPED: '⚪',
}

export default function QANodeCard({ id, name, status, durationMs, enabled, elapsed, onToggle, running }: QANodeCardProps) {
  const cardClass = [
    'qa-node-card',
    !enabled && 'qa-node-card--disabled',
    status === 'RUNNING' && 'qa-node-card--running',
    status === 'PASSED'  && 'qa-node-card--passed',
    status === 'FAILED'  && 'qa-node-card--failed',
  ].filter(Boolean).join(' ')

  const durationLabel =
    status === 'PASSED' || status === 'FAILED'
      ? `${((elapsed ?? durationMs) / 1000).toFixed(1)}s`
      : status === 'RUNNING'
      ? '…'
      : `~${(durationMs / 1000).toFixed(1)}s`

  return (
    <div className={cardClass}>
      <div className="qa-node-name">{name}</div>
      <div className="qa-node-status">
        <span className={`badge badge--${status.toLowerCase()}`}>
          {STATUS_EMOJI[status]} {status}
        </span>
      </div>
      <div className="qa-node-duration">{durationLabel}</div>
      <label className="qa-node-toggle">
        <input
          type="checkbox"
          checked={enabled}
          onChange={e => onToggle(id, e.target.checked)}
          disabled={running}
        />
        Enabled
      </label>
    </div>
  )
}
