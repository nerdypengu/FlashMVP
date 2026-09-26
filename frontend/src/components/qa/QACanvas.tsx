import { useState } from 'react'
import { Bot, FileCode, History } from 'lucide-react'
import mockData from '../../mocks/qa_mock.json'
import { DEMO_MODE } from '../../lib/person2Data'
import QANodeCard from './QANodeCard'
import QAConnector from './QAConnector'
import ContextMenu from './ContextMenu'
import AddStepModal from './AddStepModal'
import { getStageStatus, runDemoSteps } from './runDemoSteps.js'
import type { Run } from './RunHistoryTable'
import './QACanvas.css'

type NodeStatus = 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'SKIPPED'
type Step = {
  id: string; name: string; command: string; durationMs: number; enabled: boolean
  status: NodeStatus; stage: string; elapsed?: number; logOutput?: string
}
type Props = { runs: Run[]; nextRunNumber: number; onRunComplete: (run: Run) => void }

export default function QACanvas({ runs, nextRunNumber, onRunComplete }: Props) {
  const [steps, setSteps] = useState<Step[]>(() => DEMO_MODE ?
    mockData.steps.map(step => ({ ...step, status: 'PENDING' as NodeStatus })) : [])
  const [running, setRunning] = useState(false)
  const [summary, setSummary] = useState('')
  const [selectedRun, setSelectedRun] = useState<Run | null>(null)
  const [inspectedStep, setInspectedStep] = useState<Step | null>(null)
  const [editingStep, setEditingStep] = useState<Step | null>(null)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showYaml, setShowYaml] = useState(false)
  const stages = [...new Set(steps.map(step => step.stage))]
  const displaySteps = steps.map(step => {
    if (!selectedRun) return step
    const result = selectedRun.step_results.find(item => item.id === step.id)
    return result ? { ...step, status: result.status as NodeStatus, logOutput: result.log_output } :
      { ...step, status: 'SKIPPED' as NodeStatus }
  })
  const updateStep = (id: string, patch: Partial<Step>) =>
    setSteps(previous => previous.map(step => step.id === id ? { ...step, ...patch } : step))
  const resetSteps = () => {
    setSelectedRun(null); setSummary('')
    setSteps(previous => previous.map(step => ({ ...step, status: step.enabled ? 'PENDING' : 'SKIPPED', logOutput: undefined })))
  }
  const runQA = async (simulateFailure = false) => {
    if (!DEMO_MODE || running || !steps.some(step => step.enabled)) return
    resetSteps(); setMenu(null); setRunning(true)
    try {
      const enabled = steps.filter(step => step.enabled)
      const failedId = simulateFailure ? enabled[Math.min(1, enabled.length - 1)].id : null
      const result = await runDemoSteps(steps, (id: string, status: NodeStatus, elapsed?: number) =>
        updateStep(id, { status, elapsed }), failedId)
      result.step_results.forEach(step => {
        if (step.status === 'FAILED') updateStep(step.id, { logOutput: step.log_output })
      })
      onRunComplete({ run_number: nextRunNumber, branch: 'main', status: result.status,
        duration_seconds: Math.round(result.durationMs / 1000), timestamp: new Date().toISOString(),
        step_results: result.step_results })
      setSummary(`Run #${nextRunNumber} — ${result.status}`)
    } finally { setRunning(false) }
  }
  const yaml = `# Demo QA configuration (not executed in live mode)\nsteps:\n${steps.map(step =>
    `  - name: ${JSON.stringify(step.name)}\n    command: ${JSON.stringify(step.command)}\n    enabled: ${step.enabled}`).join('\n')}`

  return <div className="qa-workspace-container" style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
    <aside aria-label="QA run history" style={{ minWidth: 220, flex: '0 1 250px', padding: 16, background: '#101116', borderRadius: 12 }}>
      <h2 style={{ fontSize: 15 }}><History size={16} /> Run History</h2>
      <button type="button" className="btn btn--ghost" onClick={() => setSelectedRun(null)}>Current pipeline</button>
      {runs.map(run => <button type="button" key={run.run_number} onClick={() => setSelectedRun(run)}
        aria-pressed={selectedRun?.run_number === run.run_number}
        style={{ display: 'block', width: '100%', textAlign: 'left', marginTop: 8, padding: 10, borderRadius: 8,
          border: '1px solid var(--glass-border)', background: selectedRun === run ? '#17365c' : '#181b25', color: '#fff', cursor: 'pointer' }}>
        Run #{run.run_number} — {run.status}
      </button>)}
      {!runs.length && <p>No runs recorded for this project.</p>}
    </aside>
    <div className="qa-canvas-wrapper" style={{ flex: '1 1 450px', minWidth: 0 }}
      onContextMenu={event => { if (DEMO_MODE && !running) { event.preventDefault(); setMenu({ x: event.clientX, y: event.clientY }) } }}>
      <div className="qa-canvas-header">
        <h1 className="qa-canvas-title"><Bot size={20} /> QA Pipeline</h1>
        <p className="qa-canvas-subtitle">{selectedRun ? `Inspecting Run #${selectedRun.run_number}` : 'Review stages and test results.'}</p>
        <div className="qa-actions">
          {DEMO_MODE && <button className="btn btn--secondary" onClick={() => setShowYaml(true)}><FileCode size={14} /> View QA config</button>}
          {selectedRun ? <button className="btn btn--secondary" onClick={() => setSelectedRun(null)}>Clear inspection</button> : <>
            {DEMO_MODE && <button className="btn btn--secondary" onClick={() => runQA(true)} disabled={running || !steps.some(step => step.enabled)}>Simulate failure</button>}
            <button className="btn btn--primary" onClick={() => runQA()} disabled={!DEMO_MODE || running || !steps.some(step => step.enabled)}>
              {running ? 'Running…' : 'Run QA'}</button>
          </>}
        </div>
      </div>
      {!DEMO_MODE && <p className="qa-runner-note">Live execution will be enabled when the project runner supplies repository jobs.</p>}
      {!stages.length && <p className="qa-stage-empty">No pipeline configured for this project.</p>}
      <div className="qa-canvas-track" role="region" aria-label="QA pipeline stages"
        style={{ display: 'flex', alignItems: 'flex-start', padding: 12, gap: 8 }}>
        {stages.map((stage, stageIndex) => {
          const jobs = displaySteps.filter(step => step.stage === stage)
          return <section className="qa-stage" key={stage} aria-label={`${stage}: ${getStageStatus(jobs)}`} style={{ minWidth: 235 }}>
            <h2 style={{ fontSize: 14, marginBottom: 10 }}>{stage}</h2>
            <div className="qa-stage-jobs">{jobs.map(step => <QANodeCard key={step.id} {...step} running={running || !!selectedRun}
              onToggle={(id, enabled) => updateStep(id, { enabled, status: enabled ? 'PENDING' : 'SKIPPED' })}
              onSelect={() => setInspectedStep(step)} />)}</div>
            {stageIndex < stages.length - 1 && <QAConnector status={jobs.at(-1)?.status ?? 'PENDING'} />}
          </section>
        })}
      </div>
      {DEMO_MODE && !selectedRun && <button type="button" className="qa-add-step-btn" onClick={() => setShowModal(true)}>+ Add Custom Step</button>}
      {summary && <div className="qa-summary-bar"><strong>{summary}</strong><button className="btn btn--ghost" onClick={() => runQA()}>Run Again</button></div>}
      {menu && <ContextMenu {...menu} onAddStep={() => setShowModal(true)} onRunAll={() => runQA()} onReset={resetSteps} onClose={() => setMenu(null)} />}
      {showModal && <AddStepModal stages={stages.length ? stages : ['Custom']}
        initialStep={editingStep ? { ...editingStep, timeoutSeconds: 30 } : undefined}
        onAdd={async step => {
          setSteps(previous => editingStep ? previous.map(item => item.id === step.id ? { ...item, ...step, status: 'PENDING' } : item) :
            [...previous, { ...step, status: 'PENDING' }])
          return true
        }}
        onClose={() => { setShowModal(false); setEditingStep(null) }} />}
    </div>
    {inspectedStep && <div className="modal-overlay" onMouseDown={() => setInspectedStep(null)}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-label={`${inspectedStep.name} details`} onMouseDown={event => event.stopPropagation()}>
        <h2>{inspectedStep.name}</h2><code>{inspectedStep.command}</code>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{inspectedStep.logOutput || 'No execution log recorded for this step.'}</pre>
        {DEMO_MODE && !selectedRun && <button className="btn btn--secondary" onClick={() => {
          setEditingStep(inspectedStep); setInspectedStep(null); setShowModal(true)
        }}>Edit step</button>}
        <button className="btn btn--ghost" onClick={() => setInspectedStep(null)}>Close</button>
      </div>
    </div>}
    {showYaml && <div className="modal-overlay" onMouseDown={() => setShowYaml(false)}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-label="QA configuration" onMouseDown={event => event.stopPropagation()}>
        <h2>Demo QA configuration</h2><pre style={{ whiteSpace: 'pre-wrap' }}>{yaml}</pre>
        <button className="btn btn--ghost" onClick={() => setShowYaml(false)}>Close</button>
      </div>
    </div>}
  </div>
}
