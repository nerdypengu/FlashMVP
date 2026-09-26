import { useEffect } from 'react'
import { CheckCircle2, XCircle, MinusCircle, X } from 'lucide-react'

type StepResult = { id: string; name: string; status: string; duration: string }

type Run = {
  run_number: number
  branch: string
  status: string
  duration_seconds: number
  timestamp: string
  step_results: StepResult[]
}

type Props = { run: Run; onClose: () => void }

const MOCK_LOGS: Record<string, string> = {
  PASSED: '✔ Step completed successfully\n[00:00] Starting step...\n[00:01] Executing checks...\n[00:02] All assertions passed.\n✔ Done',
  FAILED: '✖ Step failed\n[00:00] Starting step...\n[00:01] Running checks...\n[00:02] AssertionError: expected 0 errors, got 3\n✖ Pipeline halted',
  SKIPPED: 'Step was skipped (previous step failed)',
}

export default function RunDetailInspector({ run, onClose }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      {/* backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
      />
      {/* drawer */}
      <div role="dialog" aria-modal="true" aria-label={`Run #${run.run_number} details`} style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 480, maxWidth: '90vw',
        background: '#13131a', borderLeft: '1px solid var(--glass-border)',
        zIndex: 101, overflowY: 'auto', display: 'flex', flexDirection: 'column',
        animation: 'qa-drawer-in 180ms ease-out',
      }}>
        {/* header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Run #{run.run_number}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Branch: <code>{run.branch}</code> · {run.duration_seconds}s total
            </div>
            <div style={{ marginTop: 8 }}>
              <span className={`badge badge--${run.status.toLowerCase()}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                {run.status === 'PASSED' ? <CheckCircle2 size={12} /> : <XCircle size={12} />} {run.status}
              </span>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close run details" style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}>
            <X size={18} />
          </button>
        </div>

        {/* step results */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13 }}>Step Results</div>
          {run.step_results.map(step => (
            <div key={step.id} style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontWeight: 600, fontSize: 13 }}>{step.name}</span>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{step.duration}</span>
                  <span className={`badge badge--${step.status.toLowerCase()}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {step.status === 'PASSED' ? <CheckCircle2 size={12} /> : step.status === 'FAILED' ? <XCircle size={12} /> : <MinusCircle size={12} />} {step.status}
                  </span>
                </div>
              </div>
              <pre style={{ fontSize: 11, color: '#a8b1c0', background: '#0a0a0f', borderRadius: 6, padding: '10px 12px', margin: 0, overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                {MOCK_LOGS[step.status] ?? '(no logs)'}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
