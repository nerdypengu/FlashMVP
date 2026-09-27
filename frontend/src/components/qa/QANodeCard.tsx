import { CheckCircle2, CircleX, Clock3, LoaderCircle, MinusCircle } from 'lucide-react'

type NodeStatus = 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'SKIPPED'
export function QAStatusIcon({ status }: { status: NodeStatus }) {
  const Icon = status === 'PASSED' ? CheckCircle2 : status === 'FAILED' ? CircleX :
    status === 'RUNNING' ? LoaderCircle : status === 'SKIPPED' ? MinusCircle : Clock3
  return <Icon size={17} aria-hidden="true" className={status === 'RUNNING' ? 'qa-status-spinner' : undefined} />
}

type Props = {
  number: number; name: string; file: string; status: NodeStatus; durationMs: number; onSelect: () => void
}

export default function QANodeCard({ number, name, file, status, durationMs, onSelect }: Props) {
  return <article className={`qa-node-card qa-node-card--${status.toLowerCase()}`}>
    <div className="qa-node-top">
      <span className="qa-node-number">{String(number).padStart(2, '0')}</span>
      <button type="button" className="qa-node-title" onClick={onSelect} title={`Inspect ${name}`}>{name}</button>
      <span className={`qa-node-status qa-status-color--${status.toLowerCase()}`} role="img" title={status.toLowerCase()} aria-label={`${name}: ${status.toLowerCase()}`}>
        <span className="qa-status-icon" key={status}><QAStatusIcon status={status} /></span>
      </span>
    </div>
    <div className="qa-node-runtime"><Clock3 size={13} aria-hidden="true" />
      <code title={file} style={{ overflowWrap: 'anywhere' }}>{file}</code>
      {(status === 'PASSED' || status === 'FAILED') && <strong>{(durationMs / 1000).toFixed(1)}s</strong>}
    </div>
  </article>
}
