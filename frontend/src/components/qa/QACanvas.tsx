import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Bot, FileCode, History, Layers } from 'lucide-react'
import mockData from '../../mocks/qa_mock.json'
import { API_URL, DEMO_MODE, errorMessage, runRecordToRun } from '../../lib/person2Data'
import QANodeCard from './QANodeCard'
import QAConnector from './QAConnector'
import ContextMenu from './ContextMenu'
import AddStepModal from './AddStepModal'
import RunHistoryTable from './RunHistoryTable'
import { getStageStatus, runDemoSteps } from './runDemoSteps.js'
import type { Run } from './RunHistoryTable'
import './QACanvas.css'

type NodeStatus = 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'SKIPPED'
type Step = {
  id: string; stage: string; name: string; file?: string; command?: string; enabled: boolean;
  durationMs: number; status: NodeStatus; logOutput?: string
}
type Props = { projectId: string; runs: Run[]; onRunComplete: (run: Run) => void }

export default function QACanvas({ projectId, runs, onRunComplete }: Props) {
  const [steps, setSteps] = useState<Step[]>(() =>
    (mockData.steps || []).map((step: any) => ({
      id: step.id,
      stage: step.stage,
      name: step.name,
      file: step.command || step.file || step.name,
      command: step.command,
      enabled: step.enabled ?? true,
      durationMs: step.durationMs || 450,
      status: (step.status as NodeStatus) || 'PENDING',
    }))
  )
  const [error, setError] = useState('')
  const [running, setRunning] = useState(false)
  const [summary, setSummary] = useState('')
  const [searchParams] = useSearchParams()
  const [selectedRunState, setSelectedRunState] = useState<Run | null>(null)
  const requestedRun = searchParams.get('run')
  const selectedRun = selectedRunState || (runs.find(run => String(run.run_number) === requestedRun) ?? null)
  
  const [inspectedStep, setInspectedStep] = useState<Step | null>(null)
  const [editingStep, setEditingStep] = useState<Step | null>(null)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showYaml, setShowYaml] = useState(false)
  const [viewTab, setViewTab] = useState<'canvas' | 'history'>('canvas')

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
    setSelectedRunState(null)
    setSummary('')
    setSteps(previous => previous.map(step => ({ ...step, status: step.enabled ? 'PENDING' : 'SKIPPED', logOutput: undefined })))
  }

  const runQA = async (simulateFailure = false) => {
    if (!DEMO_MODE || running || !steps.length) return
    setSelectedRunState(null)
    setError('')
    setSummary('')
    setRunning(true)
    setSteps(previous => previous.map(step => ({ ...step, status: 'PENDING' })))
    try {
      const failedId = simulateFailure ? steps[Math.min(1, steps.length - 1)].id : null
      await runDemoSteps(steps, (id: string, status: NodeStatus) => updateStep(id, { status }), failedId)
      if (projectId) {
        const response = await fetch(`${API_URL}/api/v1/projects/${encodeURIComponent(projectId)}/qa/run`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ simulate_failure: simulateFailure }),
        })
        if (response.ok) {
          const run = runRecordToRun(await response.json())
          onRunComplete(run)
          setSummary(`Run #${run.run_number} — ${run.status} (demo simulation)`)
        }
      }
    } catch (err) { setError(errorMessage(err)) }
    finally { setRunning(false) }
  }

  const yaml = `# QA pipeline configuration\nsteps:\n${steps.map(step =>
    `  - name: ${JSON.stringify(step.name)}\n    command: ${JSON.stringify(step.command || step.file)}\n    enabled: ${step.enabled}`).join('\n')}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%' }}>

      {/* ── Top Header and Controls ───────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 16, padding: '18px 24px',
        background: 'rgba(15, 98, 254, 0.06)', borderRadius: 16,
        border: '1px solid rgba(15, 98, 254, 0.2)', backdropFilter: 'blur(16px)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bot size={24} color="#0F62FE" />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>
              watsonx QA Canvas &amp; Execution Engine
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: '4px 0 0 0' }}>
            {selectedRun ? `Inspecting Run #${selectedRun.run_number}` : 'Interactive pipeline canvas and complete execution audit history.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Tab Switcher */}
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: 3, border: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              type="button"
              onClick={() => setViewTab('canvas')}
              style={{
                padding: '6px 14px', borderRadius: 6, border: 'none',
                background: viewTab === 'canvas' ? '#0F62FE' : 'transparent',
                color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <Layers size={14} /> <span>Pipeline Canvas</span>
            </button>
            <button
              type="button"
              onClick={() => setViewTab('history')}
              style={{
                padding: '6px 14px', borderRadius: 6, border: 'none',
                background: viewTab === 'history' ? '#0F62FE' : 'transparent',
                color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <History size={14} /> <span>Run History ({runs.length})</span>
            </button>
          </div>

          {DEMO_MODE && (
            <button className="btn btn--secondary" onClick={() => setShowYaml(true)}>
              <FileCode size={14} /> View QA config
            </button>
          )}

          {selectedRun ? (
            <button className="btn btn--secondary" onClick={() => setSelectedRunState(null)}>
              Clear Inspection
            </button>
          ) : (
            <>
              {DEMO_MODE && (
                <button className="btn btn--secondary" onClick={() => runQA(true)} disabled={running || !steps.some(step => step.enabled)}>
                  Simulate Failure
                </button>
              )}
              <button className="btn btn--primary" onClick={() => runQA()} disabled={!DEMO_MODE || running || !steps.some(step => step.enabled)}>
                {running ? 'Running Pipeline…' : 'Execute QA Run'}
              </button>
            </>
          )}
        </div>
      </div>

      {error && <p role="alert" style={{ color: '#FA4D56' }}>{error}</p>}

      {/* ── View Content: Canvas or History ──────────────────────────── */}
      {viewTab === 'canvas' ? (
        <div className="qa-workspace-container" style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {/* Quick Run Selection Sidebar */}
          <aside aria-label="QA run history" style={{ minWidth: 220, flex: '0 1 240px', padding: 16, background: '#101116', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
            <h2 style={{ fontSize: 14, margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <History size={15} color="#60A5FA" /> <span>Recent QA Runs</span>
            </h2>
            <button type="button" className="btn btn--ghost" style={{ width: '100%', marginBottom: 8, fontSize: 12 }} onClick={() => setSelectedRunState(null)}>
              Interactive Current Pipeline
            </button>
            {runs.map(run => (
              <button
                type="button" key={run.run_number} onClick={() => setSelectedRunState(run)}
                aria-pressed={selectedRun?.run_number === run.run_number}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  width: '100%', textAlign: 'left', marginTop: 6, padding: '8px 10px', borderRadius: 8,
                  border: selectedRun?.run_number === run.run_number ? '1px solid #0F62FE' : '1px solid var(--glass-border)',
                  background: selectedRun?.run_number === run.run_number ? 'rgba(15,98,254,0.2)' : '#181b25',
                  color: '#fff', cursor: 'pointer', fontSize: 12
                }}
              >
                <span>Run #{run.run_number}</span>
                <span className={`badge badge--${run.status.toLowerCase()}`}>{run.status}</span>
              </button>
            ))}
            {!runs.length && <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>No runs recorded yet.</p>}
          </aside>

          {/* Interactive Pipeline Canvas */}
          <div className="qa-canvas-wrapper" style={{ flex: '1 1 450px', minWidth: 0 }}
            onContextMenu={event => { if (DEMO_MODE && !running) { event.preventDefault(); setMenu({ x: event.clientX, y: event.clientY }) } }}>
            {!DEMO_MODE && <p className="qa-runner-note">Live execution enabled when repository runner connects.</p>}
            {!stages.length && <p className="qa-stage-empty">No pipeline configured for this project.</p>}

            <div className="qa-canvas-track" role="region" aria-label="QA pipeline stages"
              style={{ display: 'flex', alignItems: 'center', padding: 12, gap: 10, overflowX: 'auto' }}>
              {stages.map((stage, stageIndex) => {
                const jobs = displaySteps.filter(step => step.stage === stage)
                return (
                  <React.Fragment key={stage}>
                    <section className="qa-stage" aria-label={`${stage}: ${getStageStatus(jobs)}`} style={{ minWidth: 235, flexShrink: 0 }}>
                      <h2 style={{ fontSize: 14, marginBottom: 10 }}>{stage}</h2>
                      <div className="qa-stage-jobs">
                        {jobs.map((step, stepIndex) => (
                          <QANodeCard
                            key={step.id}
                            number={stepIndex + 1}
                            name={step.name}
                            file={step.file || step.command || ''}
                            status={step.status}
                            durationMs={step.durationMs}
                            onSelect={() => setInspectedStep(step)}
                          />
                        ))}
                      </div>
                    </section>
                    {stageIndex < stages.length - 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: '0 4px' }}>
                        <QAConnector status={jobs.at(-1)?.status ?? 'PENDING'} />
                      </div>
                    )}
                  </React.Fragment>
                )
              })}
            </div>
            {DEMO_MODE && !selectedRun && <button type="button" className="qa-add-step-btn" onClick={() => setShowModal(true)}>+ Add Custom Step</button>}
            {summary && <div className="qa-summary-bar"><strong>{summary}</strong><button className="btn btn--ghost" onClick={() => runQA()}>Run Again</button></div>}
            {menu && <ContextMenu {...menu} onAddStep={() => setShowModal(true)} onRunAll={() => runQA()} onReset={resetSteps} onClose={() => setMenu(null)} />}
            {showModal && <AddStepModal stages={stages.length ? stages : ['Custom']}
              initialStep={editingStep ? { ...editingStep, command: editingStep.command || editingStep.file || '', timeoutSeconds: 30 } : undefined}
              onAdd={async step => {
                const newStep: Step = {
                  id: step.id || `step-${Date.now()}`,
                  stage: step.stage,
                  name: step.name,
                  command: step.command,
                  file: step.command,
                  enabled: step.enabled,
                  durationMs: 500,
                  status: 'PENDING'
                }
                setSteps(previous => editingStep ? previous.map(item => item.id === newStep.id ? { ...item, ...newStep } : item) :
                  [...previous, newStep])
                return true
              }}
              onClose={() => { setShowModal(false); setEditingStep(null) }} />}
          </div>
        </div>
      ) : (
        /* History Table View */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <RunHistoryTable runs={runs} />
        </div>
      )}

      {inspectedStep && <div className="modal-overlay" onMouseDown={() => setInspectedStep(null)}>
        <div className="modal-box" role="dialog" aria-modal="true" aria-label={`${inspectedStep.name} details`} onMouseDown={event => event.stopPropagation()}>
          <h2>{inspectedStep.name}</h2><code>{inspectedStep.command || inspectedStep.file}</code>
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
  )
}
