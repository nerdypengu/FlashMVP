import { useState } from 'react'
import mockData from '../../mocks/qa_mock.json'
import QANodeCard from './QANodeCard'
import ContextMenu from './ContextMenu'
import AddStepModal from './AddStepModal'
import { getStageStatus, moveStep, orderStepsByStage, runDemoSteps } from './runDemoSteps.js'
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
  stage: string
  elapsed?: number
  timeoutSeconds?: number
}

type Props = { nextRunNumber: number; onRunComplete: (run: Run) => void }

export default function QACanvas({ nextRunNumber, onRunComplete }: Props) {
  const [steps, setSteps] = useState<Step[]>(() => mockData.steps.map(step => ({ ...step, status: 'PENDING' as NodeStatus })))
  const [stages, setStages] = useState(() => [...new Set(mockData.steps.map(step => step.stage))])
  const [addingStage, setAddingStage] = useState(false)
  const [stageName, setStageName] = useState('')
  const [running, setRunning] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const orderedSteps = orderStepsByStage(steps, stages)

  const updateStep = (id: string, patch: Partial<Step>) =>
    setSteps(previous => previous.map(step => step.id === id ? { ...step, ...patch } : step))

  const resetSteps = () => {
    setSteps(previous => previous.map(step => ({ ...step, status: step.enabled ? 'PENDING' : 'SKIPPED', elapsed: undefined })))
    setSummary(null)
  }

  const runDemoQA = async (simulateFailure = false) => {
    if (running || !steps.some(step => step.enabled)) return
    setMenu(null)
    setAddingStage(false)
    setRunning(true)
    resetSteps()
    try {
      const enabledSteps = orderedSteps.filter(step => step.enabled)
      const failStepId = simulateFailure ? enabledSteps[Math.min(1, enabledSteps.length - 1)].id : null
      const result = await runDemoSteps(orderedSteps, (id: string, status: NodeStatus, elapsed?: number) =>
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

  const toggleStep = (id: string, enabled: boolean) => {
    if (running) return
    updateStep(id, { enabled, status: enabled ? 'PENDING' : 'SKIPPED', elapsed: undefined })
    setSummary(null)
  }

  const moveJob = (id: string, stage: string, nearId: string | null = null, after = false) => {
    if (running || !stages.includes(stage)) return
    setSteps(previous => moveStep(previous, id, stage, nearId, after).map(step =>
      step.id === id ? { ...step, status: 'PENDING', elapsed: undefined } : step))
    setSummary(null)
  }

  const moveJobWithKeys = (id: string, key: string) => {
    const step = steps.find(item => item.id === id)
    if (!step || running) return
    const stageIndex = stages.indexOf(step.stage)
    const inStage = orderedSteps.filter(item => item.stage === step.stage)
    const index = inStage.findIndex(item => item.id === id)
    if (key === 'ArrowLeft' && stageIndex > 0) moveJob(id, stages[stageIndex - 1])
    else if (key === 'ArrowRight' && stageIndex < stages.length - 1) moveJob(id, stages[stageIndex + 1])
    else if (key === 'ArrowUp' && index > 0) moveJob(id, step.stage, inStage[index - 1].id)
    else if (key === 'ArrowDown' && index < inStage.length - 1) moveJob(id, step.stage, inStage[index + 1].id, true)
    requestAnimationFrame(() => document.getElementById(`qa-job-${id}`)?.focus())
  }

  const addStage = (event: React.FormEvent) => {
    event.preventDefault()
    const name = stageName.trim()
    if (running || !name || stages.some(stage => stage.toLowerCase() === name.toLowerCase())) return
    setStages(previous => [...previous, name])
    setStageName('')
    setAddingStage(false)
  }

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()
    if (!running) setMenu({ x: event.clientX, y: event.clientY })
  }

  const addStep = (step: Omit<Step, 'status'> & { status: NodeStatus }) =>
    setSteps(previous => [...previous, step])

  return (
    <div className="qa-canvas-wrapper" onContextMenu={handleContextMenu}>
      <div className="qa-canvas-header">
        <span className="qa-eyebrow">DEVELOPER TOOLS / QA PIPELINE</span>
        <h1 className="qa-canvas-title">Build with confidence.</h1>
        <p className="qa-canvas-subtitle">IBM Bob Subagent Beta runs each check in sequence before you ship.</p>
      </div>
      <div className="qa-canvas-body">
        <div className="qa-section-heading">
          <div>
            <h2>Pipeline steps</h2>
            <p>Drag jobs between stages or reorder them within a stage. Arrow keys work too.</p>
          </div>
          <div className="qa-section-controls">
            <span>{String(steps.length).padStart(2, '0')} JOBS</span>
            {addingStage ? (
              <form className="qa-add-stage-form" onSubmit={addStage}>
                <input autoFocus maxLength={32} aria-label="New stage name" placeholder="Stage name" value={stageName} disabled={running} onChange={e => setStageName(e.target.value)} onKeyDown={e => { if (e.key === 'Escape') setAddingStage(false) }} />
                <button type="submit" disabled={running || !stageName.trim() || stages.some(stage => stage.toLowerCase() === stageName.trim().toLowerCase())}>Add</button>
              </form>
            ) : (
              <button className="qa-add-step-btn" onClick={() => setAddingStage(true)} disabled={running}>+ Add stage</button>
            )}
            <button className="qa-add-step-btn" onClick={() => setShowModal(true)} disabled={running}>
              <span aria-hidden="true">+</span> Add job
            </button>
          </div>
        </div>
        <div className="qa-canvas-track" role="region" aria-label="QA pipeline steps" tabIndex={0} style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(230px, 1fr))` }}>
          {stages.map(stage => {
            const stageJobs = steps.filter(step => step.stage === stage)
            const status = getStageStatus(stageJobs)
            return (
              <div className="qa-stage-column" key={stage}>
                <span className={`qa-stage-progress qa-stage-progress--${status}`} role="img" aria-label={`${stage}: ${status}`}>
                  <span aria-hidden="true">{status === 'passed' ? '✓' : status === 'failed' ? '!' : status === 'running' ? '…' : status === 'skipped' ? '−' : '»'}</span>
                </span>
                <section className="qa-stage" aria-label={`${stage} stage`}
                  onDragOver={e => { if (!running) e.preventDefault() }}
                  onDrop={e => { e.preventDefault(); moveJob(e.dataTransfer.getData('text/plain'), stage) }}>
                  <div className="qa-stage-heading">
                    <h3>{stage}</h3>
                    <div>
                      <span>{stageJobs.length}</span>
                      {stages.length > 1 && !stageJobs.length && (
                        <button type="button" className="qa-remove-stage" aria-label={`Remove ${stage} stage`} title="Remove empty stage" disabled={running} onClick={() => setStages(previous => previous.filter(item => item !== stage))}>×</button>
                      )}
                    </div>
                  </div>
                  <div className="qa-stage-jobs">
                    {orderedSteps.map((step, index) => step.stage === stage && (
                      <QANodeCard
                        key={step.id}
                        number={index + 1}
                        id={step.id}
                        name={step.name}
                        status={step.status}
                        durationMs={step.durationMs}
                        enabled={step.enabled}
                        elapsed={step.elapsed}
                        stage={step.stage}
                        onMove={moveJob}
                        onMoveWithKeys={moveJobWithKeys}
                        onToggle={toggleStep}
                        running={running}
                      />
                    ))}
                  </div>
                </section>
              </div>
            )
          })}
        </div>
        <div className="qa-actions">
          <button className="btn btn--primary" onClick={() => runDemoQA()} disabled={running || !steps.some(step => step.enabled)}>
            {running ? 'Running…' : 'Run QA'} <span aria-hidden="true">→</span>
          </button>
          <button className="btn btn--secondary" onClick={() => runDemoQA(true)} disabled={running || !steps.some(step => step.enabled)}>Simulate failure</button>
          <button className="btn btn--ghost" onClick={resetSteps} disabled={running}>Reset</button>
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
      {showModal && <AddStepModal stages={stages} onAdd={step => addStep({ ...step, status: step.status as NodeStatus })} onClose={() => setShowModal(false)} />}
    </div>
  )
}
