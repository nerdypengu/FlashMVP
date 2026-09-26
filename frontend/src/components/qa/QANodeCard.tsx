import { CheckCircle2, XCircle, MinusCircle, Clock, Loader2, Settings } from 'lucide-react'

type NodeStatus = 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'SKIPPED'
type Props = {
  id: string; name: string; command: string; status: NodeStatus; durationMs: number
  enabled: boolean; elapsed?: number; error?: string; running: boolean
  onToggle: (id: string, enabled: boolean) => void; onSelect: () => void
}

export default function QANodeCard({ id, name, command, status, durationMs, enabled, elapsed, error, running, onToggle, onSelect }: Props) {
  const Icon = status === 'PASSED' ? CheckCircle2 : status === 'FAILED' ? XCircle :
    status === 'SKIPPED' ? MinusCircle : status === 'RUNNING' ? Loader2 : Clock
  return <article className={`qa-node-card qa-node-card--${status.toLowerCase()}${enabled ? '' : ' qa-node-card--disabled'}`}>
    <button type="button" onClick={onSelect} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      width: '100%', color: 'inherit', background: 'transparent', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left' }}>
      <strong className="qa-node-name">{name}</strong>
      <span className={`badge badge--${status.toLowerCase()}`} aria-label={`${name}: ${status.toLowerCase()}`}>
        <Icon size={13} /> {status}
      </span>
    </button>
    <code title={command} style={{ display: 'block', overflowWrap: 'anywhere', color: '#A7F3D0', fontSize: 11 }}>{command}</code>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span className="qa-node-duration">{status === 'PASSED' || status === 'FAILED' ?
        `${((elapsed ?? durationMs) / 1000).toFixed(1)}s` : `~${(durationMs / 1000).toFixed(1)}s`}</span>
      <label className="qa-node-toggle"><input type="checkbox" checked={enabled} disabled={running}
        onChange={event => onToggle(id, event.target.checked)} /> Enabled</label>
      <button type="button" onClick={onSelect} aria-label={`Inspect ${name}`} style={{ background: 'transparent', border: 0, color: 'inherit', cursor: 'pointer' }}>
        <Settings size={14} />
      </button>
    </div>
    {status === 'FAILED' && <div className="qa-node-error" role="alert"><strong>Why it failed</strong>
      <pre>{error || 'The runner did not provide error details for this job.'}</pre></div>}
  </article>
}
