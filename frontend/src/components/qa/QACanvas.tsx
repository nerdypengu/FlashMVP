import { useState } from 'react'
import mockData from '../../mocks/qa_mock.json'
import QANodeCard from './QANodeCard'
import QAConnector from './QAConnector'
import ContextMenu from './ContextMenu'
import AddStepModal from './AddStepModal'
import { runDemoSteps } from './runDemoSteps.js'
import type { Run } from './RunHistoryTable'
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
  timeoutSeconds?: number
}

type Props = { nextRunNumber: number; onRunComplete: (run: Run) => void }

export default function QACanvas({ nextRunNumber, onRunComplete }: Props) {
  const [steps, setSteps] = useState<Step[]>(() => mockData.steps.map(step => ({ ...step, status: 'PENDING' as NodeStatus })))
  const [running, setRunning] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [showModal, setShowModal] = useState(false)

  const updateStep = (id: string, patch: Partial<Step>) =>
    setSteps(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))

  const resetSteps = () => {
    setSteps(prev => prev.map(s => ({ ...s, status: s.enabled ? 'PENDING' : 'SKIPPED', elapsed: undefined })))
    setSummary(null)
  }

  const runDemoQA = async (simulateFailure = false) => {
    if (running || !steps.some(step => step.enabled)) return
    setMenu(null)
    setRunning(true)
    resetSteps()
    try {
      const enabled = steps.filter(step => step.enabled)
      const failStepId = simulateFailure ? enabled[Math.min(1, enabled.length - 1)].id : null
      const result = await runDemoSteps(steps, (id: string, status: NodeStatus, elapsed?: number) =>
        updateStep(id, { status, elapsed }), failStepId)
      const run: Run = {
        run_number: nextRunNumber,
        branch: 'main',
        status: result.status,
        duration_seconds: Math.round(result.durationMs / 1000),
        timestamp: new Date().toISOString(),
        step_results: result.step_results,
      }
      onRunComplete(run)
      setSummary(`Run #${nextRunNumber} — ${result.status === 'PASSED' ? '🟢 All Passed' : '🔴 Failed'} (${(result.durationMs / 1000).toFixed(1)}s total)`)
    } finally {
      setRunning(false)
    }
  }

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    if (running) return
    setMenu({ x: e.clientX, y: e.clientY })
  }

  const addStep = (step: Step) => setSteps(prev => [...prev, step])

  const toggleStep = (id: string, enabled: boolean) => {
    if (running) return
    updateStep(id, { enabled, status: enabled ? 'PENDING' : 'SKIPPED', elapsed: undefined })
    setSummary(null)
  }

  return (
    <div className="qa-canvas-wrapper" onContextMenu={handleContextMenu}>
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
        {steps.map((step, i) => (
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
            {i < steps.length - 1 && <QAConnector status={step.status} />}
          </div>
        ))}
        <div style={{ marginLeft: steps.length > 0 ? 12 : 0 }}>
          <button className="qa-add-step-btn" onClick={() => setShowModal(true)} disabled={running}>
            + Add Custom Step
          </button>
        </div>
      </div>

      {summary && (
        <div className="qa-summary-bar">
          <span className="qa-summary-result">{summary}</span>
          <button className="btn btn--ghost" onClick={() => runDemoQA()}>Run Again</button>
        </div>
      )}

      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          onAddStep={() => setShowModal(true)}
          onRunAll={() => runDemoQA()}
          onReset={resetSteps}
          onClose={() => setMenu(null)}
        />
      )}

      {showModal && (
        <AddStepModal
          onAdd={s => addStep({ ...s, status: s.status as NodeStatus })}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
