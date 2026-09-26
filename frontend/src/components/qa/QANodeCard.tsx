type NodeStatus = 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'SKIPPED'
const STATUS_ICON: Record<NodeStatus, string> = { PENDING: '»', RUNNING: '…', PASSED: '✓', FAILED: '!', SKIPPED: '−' }

type QANodeCardProps = {
  number: number
  id: string
  name: string
  status: NodeStatus
  durationMs: number
  enabled: boolean
  elapsed?: number
  onMove: (id: string, stage: string, nearId?: string | null, after?: boolean) => void
  onMoveWithKeys: (id: string, key: string) => void
  stage: string
  onToggle: (id: string, enabled: boolean) => void
  running: boolean
}

export default function QANodeCard({ number, id, name, status, durationMs, enabled, elapsed, stage, onMove, onMoveWithKeys, onToggle, running }: QANodeCardProps) {
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
    <div className={cardClass} id={`qa-job-${id}`} draggable={!running} tabIndex={running ? -1 : 0}
      aria-label={`${name}, ${status.toLowerCase()} in ${stage} stage. Drag to move, or use arrow keys to reorder.`}
      onDragStart={e => { e.dataTransfer.setData('text/plain', id); e.dataTransfer.effectAllowed = 'move' }}
      onDragOver={e => {
        if (running) return
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        const after = e.clientY > e.currentTarget.getBoundingClientRect().top + e.currentTarget.offsetHeight / 2
        e.currentTarget.classList.toggle('qa-node-card--drop-after', after)
        e.currentTarget.classList.toggle('qa-node-card--drop-before', !after)
      }}
      onDragLeave={e => {
        e.currentTarget.classList.remove('qa-node-card--drop-before', 'qa-node-card--drop-after')
      }}
      onDrop={e => {
        e.preventDefault()
        e.stopPropagation()
        e.currentTarget.classList.remove('qa-node-card--drop-before', 'qa-node-card--drop-after')
        const after = e.clientY > e.currentTarget.getBoundingClientRect().top + e.currentTarget.offsetHeight / 2
        onMove(e.dataTransfer.getData('text/plain'), stage, id, after)
      }}
      onKeyDown={e => { if (e.target === e.currentTarget && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) { e.preventDefault(); onMoveWithKeys(id, e.key) } }}>
      <div className="qa-node-heading">
        <span className="qa-node-number">{String(number).padStart(2, '0')}</span>
        <h3 className="qa-node-name">{name}</h3>
        <span className={`qa-node-status qa-stage-progress qa-stage-progress--${status.toLowerCase()}`} role="status" aria-label={`${name}: ${status.toLowerCase()}`} title={status.toLowerCase()}>
          <span aria-hidden="true">{STATUS_ICON[status]}</span>
        </span>
      </div>
      <div className="qa-node-details">
        <div className="qa-node-duration">{status === 'PASSED' || status === 'FAILED' ? 'Completed in' : 'Estimated runtime'} <strong>{durationLabel}</strong></div>
        <div className="qa-node-controls">
          <label className="qa-node-toggle">
            <input
              type="checkbox"
              checked={enabled}
              onChange={e => onToggle(id, e.target.checked)}
              disabled={running}
            />
            Enabled
          </label>
          <span className="qa-node-drag-hint" aria-hidden="true">⠿ Drag</span>
        </div>
      </div>
    </div>
  )
}
