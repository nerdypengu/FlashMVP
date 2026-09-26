type NodeStatus = 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'SKIPPED'

const STATUS_ICON: Record<NodeStatus, string> = {
  PENDING: '»', RUNNING: '…', PASSED: '✓', FAILED: '!', SKIPPED: '−',
}

type Props = {
  number: number
  name: string
  filePath: string
  status: NodeStatus
  selected: boolean
  disabled: boolean
  error?: string
  onToggle: (selected: boolean) => void
}

export default function QANodeCard({ number, name, filePath, status, selected, disabled, error, onToggle }: Props) {
  return (
    <article className={`qa-node-card${!selected ? ' qa-node-card--disabled' : ''}`}>
      <div className="qa-node-heading">
        <span className="qa-node-number">{String(number).padStart(2, '0')}</span>
        <h3 className="qa-node-name">{name}</h3>
        <span className={`qa-node-status qa-stage-progress qa-stage-progress--${status.toLowerCase()}`}
          role="status" aria-label={`${name}: ${status.toLowerCase()}`} title={status.toLowerCase()}>
          <span aria-hidden="true">{STATUS_ICON[status]}</span>
        </span>
      </div>
      <div className="qa-node-details">
        <code className="qa-node-path" title={filePath}>{filePath}</code>
        {status === 'FAILED' && <div className="qa-node-error" role="alert">
          <strong>Why it failed</strong>
          <pre>{error || 'The runner did not provide error details for this job.'}</pre>
        </div>}
        <label className="qa-node-toggle">
          <input type="checkbox" checked={selected} disabled={disabled}
            onChange={(event) => onToggle(event.target.checked)} />
          Include in this run
        </label>
      </div>
    </article>
  )
}
