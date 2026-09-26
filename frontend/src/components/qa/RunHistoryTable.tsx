import { useState } from 'react'
import RunDetailInspector from './RunDetailInspector'

type StepResult = { id: string; name: string; status: string; duration: string }

export type Run = {
  run_number: number
  branch: string
  status: string
  duration_seconds: number
  timestamp: string
  step_results: StepResult[]
}

function relativeTime(ts: string) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 1000)
  if (diff < 60)   return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  return `${Math.floor(diff/3600)}h ago`
}

export default function RunHistoryTable({ runs }: { runs: Run[] }) {
  const [selected, setSelected] = useState<Run | null>(null)

  return (
    <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--glass-border)', fontWeight: 600 }}>
        📋 Workflow Run History
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'rgba(255,255,255,0.03)', fontSize: 12, color: 'var(--text-muted)' }}>
            <th style={th}>Run</th>
            <th style={th}>Branch</th>
            <th style={th}>Status</th>
            <th style={th}>Duration</th>
            <th style={th}>When</th>
          </tr>
        </thead>
        <tbody>
          {runs.map(run => (
            <tr
              key={run.run_number}
              style={{ cursor: 'pointer', borderBottom: '1px solid var(--glass-border)' }}
              onClick={() => setSelected(run)}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <td style={td}>
                <button className="qa-run-open" onClick={() => setSelected(run)} aria-label={`Open Run #${run.run_number} details`}>
                  #{run.run_number}
                </button>
              </td>
              <td style={td}><code style={{ fontSize: 12, color: 'var(--text-muted)' }}>{run.branch}</code></td>
              <td style={td}>
                <span className={`badge badge--${run.status.toLowerCase()}`}>
                  {run.status === 'PASSED' ? '🟢' : '🔴'} {run.status}
                </span>
              </td>
              <td style={td}>{run.duration_seconds}s</td>
              <td style={td} title={run.timestamp}>{relativeTime(run.timestamp)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {selected && (
        <RunDetailInspector run={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

const th: React.CSSProperties = { padding: '10px 20px', textAlign: 'left', fontWeight: 500 }
const td: React.CSSProperties = { padding: '12px 20px', fontSize: 13 }
