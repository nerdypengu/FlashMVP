import { useState } from 'react'
import mockData from '../../mocks/qa_mock.json'
import { DEMO_MODE } from '../../lib/person2Data'
import QANodeCard from './QANodeCard'
import { getStageStatus, runDemoSteps } from './runDemoSteps.js'
import type { Run } from './RunHistoryTable'
import './QACanvas.css'

type NodeStatus = 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'SKIPPED'
type Step = {
  id: string; name: string; command: string; durationMs: number
  enabled: boolean; status: NodeStatus; stage: string; elapsed?: number; logOutput?: string
}
type Props = { nextRunNumber: number; onRunComplete: (run: Run) => void }

export default function QACanvas({ nextRunNumber, onRunComplete }: Props) {
  const [steps, setSteps] = useState<Step[]>(() => DEMO_MODE
    ? mockData.steps.map(step => ({ ...step, status: 'PENDING' as NodeStatus })) : [])
  const stages = [...new Set(steps.map(step => step.stage))]
  const [running, setRunning] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const busy = running

  const updateStep = (id: string, patch: Partial<Step>) =>
    setSteps(previous => previous.map(step => step.id === id ? { ...step, ...patch } : step))

  const runDemoQA = async (simulateFailure = false) => {
    if (!DEMO_MODE || busy || !steps.some(step => step.enabled)) return
    setRunning(true); setSummary(null)
    setSteps(previous => previous.map(step => ({ ...step, status: step.enabled ? 'PENDING' : 'SKIPPED', logOutput: undefined })))
    try {
      const enabled = steps.filter(step => step.enabled)
      const failedId = simulateFailure ? enabled[Math.min(1, enabled.length - 1)]?.id : null
      const result = await runDemoSteps(steps, (id: string, status: NodeStatus, elapsed?: number) =>
        updateStep(id, { status, elapsed }), failedId)
      for (const step of result.step_results) {
        if (step.status === 'FAILED') updateStep(step.id, { logOutput: step.log_output })
      }
      onRunComplete({
        run_number: nextRunNumber, branch: 'main', status: result.status,
        duration_seconds: Math.round(result.durationMs / 1000), timestamp: new Date().toISOString(),
        step_results: result.step_results,
      })
      setSummary(`Run #${nextRunNumber} — ${result.status}`)
    } finally { setRunning(false) }
  }

  return (
    <div className="qa-canvas-wrapper">
      <div className="qa-canvas-header">
        <span className="qa-eyebrow">DEVELOPER TOOLS / QA PIPELINE</span>
        <h1 className="qa-canvas-title">Build with confidence.</h1>
        <p className="qa-canvas-subtitle">Review your project's pipeline and test results.</p>
      </div>
      <div className="qa-canvas-body">
        <div className="qa-section-heading">
          <div><h2>Pipeline stages</h2><p>Stages and jobs follow your project's QA configuration.</p></div>
          <div className="qa-section-controls">
            <span>{String(steps.length).padStart(2, '0')} JOBS</span>
          </div>
        </div>
        {!stages.length && <p className="qa-stage-empty">No pipeline available. Stages and jobs will appear once your project's QA configuration is connected.</p>}
        <div className="qa-canvas-track" role="region" aria-label="QA pipeline stages"
          style={{ gridTemplateColumns: `repeat(${Math.max(stages.length, 1)}, minmax(220px, 280px))` }}>
          {stages.map(stage => {
            const jobs = steps.filter(step => step.stage === stage)
            const status = getStageStatus(jobs)
            return <div className="qa-stage-column" key={stage}>
              <span className={`qa-stage-progress qa-stage-progress--${status}`} aria-label={`${stage}: ${status}`}>
                {status === 'passed' ? '✓' : status === 'failed' ? '!' : status === 'running' ? '…' : '»'}
              </span>
              <section className="qa-stage" aria-label={`${stage} stage`}>
                <div className="qa-stage-heading"><h3>{stage}</h3><div><span>{jobs.length}</span>
                </div></div>
                <div className="qa-stage-jobs">
                  {jobs.map((step, index) => <QANodeCard key={step.id} number={index + 1} name={step.name}
                    filePath={step.command} status={step.status} selected={step.enabled} disabled={busy} error={step.logOutput}
                    onToggle={enabled => updateStep(step.id, { enabled, status: enabled ? 'PENDING' : 'SKIPPED' })} />)}
                  {!jobs.length && <p className="qa-stage-empty">Jobs will appear from the project runner.</p>}
                </div>
              </section>
            </div>
          })}
        </div>
        <div className="qa-actions">
          <button className="btn btn--primary" onClick={() => runDemoQA()} disabled={!DEMO_MODE || busy || !steps.some(step => step.enabled)}>
            {running ? 'Running…' : 'Run QA'} <span aria-hidden="true">→</span>
          </button>
          {DEMO_MODE && <button className="btn btn--secondary" onClick={() => runDemoQA(true)} disabled={busy}>Simulate failure</button>}
        </div>
        {!DEMO_MODE && <p className="qa-runner-note">Live execution will be enabled when the project runner supplies repository jobs.</p>}
      </div>
      {summary && <div className="qa-summary-bar"><span className="qa-summary-result">{summary}</span></div>}
    </div>
  )
}
