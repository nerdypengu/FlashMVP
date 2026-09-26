import { CheckCircle2, XCircle, AlertCircle, MinusCircle, Clock, Settings, Loader2 } from 'lucide-react'

type NodeStatus = 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'SKIPPED'

type QANodeCardProps = {
  id: string
  name: string
  command: string
  status: NodeStatus
  durationMs: number
  enabled: boolean
  elapsed?: number
  onToggle: (id: string, enabled: boolean) => void
  onSelect: () => void
  running: boolean
}

export default function QANodeCard({
  id,
  name,
  command,
  status,
  durationMs,
  enabled,
  elapsed,
  onToggle,
  onSelect,
  running
}: QANodeCardProps) {
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

  const renderStatusIcon = () => {
    switch (status) {
      case 'PASSED': return <CheckCircle2 size={12} />
      case 'FAILED': return <XCircle size={12} />
      case 'RUNNING': return <Loader2 size={12} className="spin" />
      case 'PENDING': return <AlertCircle size={12} />
      case 'SKIPPED': return <MinusCircle size={12} />
    }
  }

  return (
    <div
      className={cardClass}
      onClick={onSelect}
      style={{ cursor: 'pointer' }}
      title="Click to inspect node configuration & logs"
    >
      {/* Top row: Name + Status */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div className="qa-node-name">{name}</div>
        <span className={`badge badge--${status.toLowerCase()}`} style={{ fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          {renderStatusIcon()} {status}
        </span>
      </div>

      {/* Expanded Command Area */}
      <div style={{
        background: '#08090E',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 6,
        padding: '8px 10px',
        margin: '4px 0',
        fontFamily: 'monospace',
        fontSize: 12,
        color: '#A7F3D0',
        overflowX: 'auto',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: 6
      }}>
        <span style={{ color: 'rgba(255,255,255,0.3)', userSelect: 'none' }}>$</span>
        <span>{command}</span>
      </div>

      {/* Bottom row: Duration + Toggle + Inspect Hint */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
        <div className="qa-node-duration" style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <Clock size={11} /> <span>{durationLabel}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label className="qa-node-toggle" onClick={e => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={enabled}
              onChange={e => onToggle(id, e.target.checked)}
              disabled={running}
            />
            <span>Enabled</span>
          </label>
          <span style={{ fontSize: 11, color: '#60A5FA', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Settings size={11} /> <span>Details</span>
          </span>
        </div>
      </div>
    </div>
  )
}
