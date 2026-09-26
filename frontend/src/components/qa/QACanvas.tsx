import { useState } from 'react'
import mockData from '../../mocks/qa_mock.json'
import QANodeCard from './QANodeCard'
import QAConnector from './QAConnector'
import { runDemoSteps } from './runDemoSteps.js'
import './QACanvas.css'

type NodeStatus = 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'SKIPPED'

type Step = {
  id: string
  name: string
  command: string
  durationMs: number
  enabled: boolean
  status: NodeStatus
  elapsed?: number
}

export default function QACanvas() {
  const [steps, setSteps] = useState<Step[]>(() => mockData.steps.map(step => ({ ...step, status: 'PENDING' as NodeStatus })))
  const [running, setRunning] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [runNumber, setRunNumber] = useState(13)

  const updateStep = (id: string, patch: Partial<Step>) =>
    setSteps(previous => previous.map(step => step.id === id ? { ...step, ...patch } : step))

  const resetSteps = () => {
    setSteps(previous => previous.map(step => ({ ...step, status: step.enabled ? 'PENDING' : 'SKIPPED', elapsed: undefined })))
    setSummary(null)
  }

  const runDemoQA = async (simulateFailure = false) => {
    if (running || !steps.some(step => step.enabled)) return
    setRunning(true)
    resetSteps()
    try {
      const enabledSteps = steps.filter(step => step.enabled)
      const failStepId = simulateFailure ? enabledSteps[Math.min(1, enabledSteps.length - 1)].id : null
      const result = await runDemoSteps(steps, (id: string, status: NodeStatus, elapsed?: number) =>
        updateStep(id, { status, elapsed }), failStepId)
      setSummary(`Run #${runNumber + 1} — ${result.status === 'PASSED' ? '🟢 All Passed' : '🔴 Failed'} (${(result.durationMs / 1000).toFixed(1)}s total)`)
      setRunNumber(previous => previous + 1)
    } finally {
      setRunning(false)
    }
  }

  const toggleStep = (id: string, enabled: boolean) => {
    if (running) return
    updateStep(id, { enabled, status: enabled ? 'PENDING' : 'SKIPPED', elapsed: undefined })
    setSummary(null)
  }

  return (
    <div className="qa-canvas-wrapper">
      <div className="qa-canvas-header">
        <div>
          <div className="qa-canvas-title">🤖 IBM Bob Subagent Beta — QA Pipeline</div>
          <div className="qa-canvas-subtitle">bob-skill-watsonx-qa · ESLint · Pytest · Watsonx Security</div>
        </div>
        <div className="qa-actions">
          <button className="btn btn--secondary" onClick={resetSteps} disabled={running}>Reset</button>
          <button className="btn btn--secondary" onClick={() => runDemoQA(true)} disabled={running || !steps.some(step => step.enabled)}>
            Simulate Failure
          </button>
          <button className="btn btn--primary" onClick={() => runDemoQA()} disabled={running || !steps.some(step => step.enabled)}>
            {running ? '⏳ Running…' : '▶ Run QA'}
          </button>
        </div>
      </div>

      <div className="qa-canvas-track">
        {steps.map((step, index) => (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center' }}>
            <QANodeCard
              id={step.id}
              name={step.name}
              status={step.status}
              durationMs={step.durationMs}
              enabled={step.enabled}
              elapsed={step.elapsed}
              onToggle={toggleStep}
              running={running}
            />
            {index < steps.length - 1 && <QAConnector status={step.status} />}
          </div>
        ))}
        <button className="qa-add-step-btn" disabled>+ Add Custom Step</button>
      </div>

      {summary && <div className="qa-summary-bar"><span className="qa-summary-result">{summary}</span></div>}
    </div>
  )
}
