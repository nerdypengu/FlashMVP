import { useState } from 'react'
import { History, Bot, FileText, CheckCircle2, XCircle, Settings, Copy, X, Play, Square, Check, FileCode } from 'lucide-react'
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

type Props = {
  nextRunNumber?: number
  onRunComplete?: (run: Run) => void
}

const STEP_MOCK_LOGS: Record<string, string> = {
  s1: `[watsonx-qa] Running ESLint v8.57.0...
Scanning client/src/ and server/app/...
✔ 42 source files verified.
✔ 0 lint errors, 0 warnings detected.
Done in 0.8s.`,
  s2: `[watsonx-qa] Running Pytest 8.1.1 test suite...
tests/test_auth.py::test_jwt_verification PASSED [ 50%]
tests/test_db.py::test_postgres_schema_migration FAILED [100%]

=========================== FAILURES ===========================
___ test_postgres_schema_migration ___
> AssertionError: Expected table 'app_8f92a.products' in IBM Cloud DB schema, got TableNotFound.
> Please run: bob-skill-cloud-db migrate --schema=app_8f92a
=========================== 1 failed, 1 passed in 1.2s ===========================`,
  s3: `[watsonx-qa] Running Watsonx Security & Vulnerability Audit...
Scanning repository secrets vault, API tokens, and docker environment...
✔ 0 hardcoded secret leaks found.
✔ Dependency CVE Audit: 0 high-severity vulnerabilities.
✔ IBM Secrets Manager proxy token verified.
Done in 0.6s.`
}

export default function QACanvas({ nextRunNumber = 6, onRunComplete }: Props) {
  const [runs, setRuns] = useState<Run[]>(mockData.runs as Run[])
  const [selectedRun, setSelectedRun] = useState<Run | null>(null)
  const [inspectedStep, setInspectedStep] = useState<Step | null>(null)

  const [steps, setSteps] = useState<Step[]>(() =>
    mockData.steps.map(step => ({ ...step, status: 'PENDING' as NodeStatus }))
  )
  const [running, setRunning] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showYamlDrawer, setShowYamlDrawer] = useState(false)
  const [copiedYaml, setCopiedYaml] = useState(false)

  // Form edit states for inspected step modal
  const [editName, setEditName] = useState('')
  const [editCommand, setEditCommand] = useState('')
  const [editDuration, setEditDuration] = useState(1000)

  // Calculate active displayed steps based on whether a historical run is selected
  const displaySteps = steps.map(step => {
    if (!selectedRun) return step
    const match = selectedRun.step_results.find(r => r.id === step.id)
    if (match) {
      return {
        ...step,
        status: match.status as NodeStatus,
        elapsed: parseFloat(match.duration) || step.durationMs / 1000
      }
    }
    return { ...step, status: 'SKIPPED' as NodeStatus }
  })

  const updateStep = (id: string, patch: Partial<Step>) =>
    setSteps(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)))

  const resetSteps = () => {
    setSelectedRun(null)
    setSteps(prev =>
      prev.map(step => ({
        ...step,
        status: step.enabled ? 'PENDING' : 'SKIPPED',
        elapsed: undefined
      }))
    )
    setSummary(null)
  }

  const runDemoQA = async (simulateFailure = false) => {
    if (running || !steps.some(step => step.enabled)) return
    setSelectedRun(null)
    setMenu(null)
    setRunning(true)
    setSteps(prev =>
      prev.map(step => ({
        ...step,
        status: step.enabled ? 'PENDING' : 'SKIPPED',
        elapsed: undefined
      }))
    )
    setSummary(null)

    try {
      const enabledSteps = steps.filter(step => step.enabled)
      const failStepId = simulateFailure
        ? enabledSteps[Math.min(1, enabledSteps.length - 1)].id
        : null

      const result = await runDemoSteps(
        steps,
        (id: string, status: NodeStatus, elapsed?: number) =>
          updateStep(id, { status, elapsed }),
        failStepId
      )

      const newRun: Run = {
        run_number: Math.max(...runs.map(r => r.run_number), 0) + 1,
        branch: 'main',
        status: result.status,
        duration_seconds: Math.round(result.durationMs / 1000),
        timestamp: new Date().toISOString(),
        step_results: result.step_results
      }

      setRuns(prev => [newRun, ...prev])
      if (onRunComplete) onRunComplete(newRun)

      setSummary(
        `Run #${newRun.run_number} — ${
          result.status === 'PASSED' ? 'All Passed' : 'Failed (Broken Step Pinpointed)'
        } (${(result.durationMs / 1000).toFixed(1)}s total)`
      )
    } finally {
      setRunning(false)
    }
  }

  const toggleStep = (id: string, enabled: boolean) => {
    if (running) return
    updateStep(id, { enabled, status: enabled ? 'PENDING' : 'SKIPPED', elapsed: undefined })
    setSummary(null)
  }

  const handleContextMenu = (event: React.MouseEvent) => {
    event.preventDefault()
    if (!running) setMenu({ x: event.clientX, y: event.clientY })
  }

  const addStep = (step: Omit<Step, 'status'> & { status: NodeStatus }) =>
    setSteps(prev => [...prev, step])

  const openNodeInspector = (step: Step) => {
    setInspectedStep(step)
    setEditName(step.name)
    setEditCommand(step.command)
    setEditDuration(step.durationMs)
  }

  const handleSaveStepConfig = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inspectedStep) return
    updateStep(inspectedStep.id, {
      name: editName,
      command: editCommand,
      durationMs: Number(editDuration)
    })
    setInspectedStep(null)
  }

  // Generate .watsonx-qa.yml configuration text
  const generateYaml = () => {
    return `# .watsonx-qa.yml — IBM Bob 2.0 Watsonx QA Pipeline Workflow
version: "2.1.0"
name: Watsonx Security & Test Audit Pipeline
agent_skill: bob-skill-watsonx-qa
target_platform: IBM Cloud Code Engine

steps:
${steps
  .map(
    s => `  - id: "${s.id}"
    name: "${s.name}"
    command: "${s.command}"
    timeout_ms: ${s.durationMs}
    enabled: ${s.enabled}`
  )
  .join('\n')}`
  }

  const handleCopyYaml = () => {
    navigator.clipboard.writeText(generateYaml())
    setCopiedYaml(true)
    setTimeout(() => setCopiedYaml(false), 2500)
  }

  return (
    <div className="qa-workspace-container" style={{ display: 'flex', gap: 20, width: '100%', height: '100%' }}>
      
      {/* ── Left Side: Run History Sidebar ────────────────────────────── */}
      <div style={{
        width: 320,
        minWidth: 280,
        display: 'flex',
        flexDirection: 'column',
        background: 'rgba(15, 17, 26, 0.75)',
        backdropFilter: 'blur(20px)',
        borderRadius: 16,
        border: '1px solid rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
        flexShrink: 0
      }}>
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <History size={16} color="#60A5FA" />
            <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>Run History</span>
          </div>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 10 }}>
            {runs.length} runs
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            type="button"
            onClick={() => setSelectedRun(null)}
            style={{
              textAlign: 'left',
              padding: '10px 14px',
              borderRadius: 8,
              border: !selectedRun ? '1px solid #0F62FE' : '1px solid rgba(255,255,255,0.06)',
              background: !selectedRun ? 'rgba(15,98,254,0.15)' : 'rgba(255,255,255,0.02)',
              color: !selectedRun ? '#fff' : 'rgba(255,255,255,0.7)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span>Live Mode / Draft Canvas</span>
            {!selectedRun && <span style={{ fontSize: 10, color: '#60A5FA' }}>ACTIVE</span>}
          </button>

          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', padding: '4px 6px 2px 6px', fontWeight: 600 }}>
            PAST EXECUTIONS (Click to inspect broken steps)
          </div>

          {runs.map(r => {
            const isSelected = selectedRun?.run_number === r.run_number
            const isPassed = r.status === 'PASSED'

            return (
              <div
                key={r.run_number}
                onClick={() => setSelectedRun(r)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 10,
                  background: isSelected ? 'rgba(15, 98, 254, 0.18)' : 'rgba(255,255,255,0.02)',
                  border: isSelected ? '1px solid #0F62FE' : '1px solid rgba(255,255,255,0.06)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6
                }}
                onMouseEnter={e => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                }}
                onMouseLeave={e => {
                  if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>
                    Run #{r.run_number}
                  </span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
                    background: isPassed ? 'rgba(66, 190, 101, 0.15)' : 'rgba(218, 30, 40, 0.15)',
                    color: isPassed ? '#42BE65' : '#DA1E28',
                    border: isPassed ? '1px solid rgba(66, 190, 101, 0.3)' : '1px solid rgba(218, 30, 40, 0.3)',
                    display: 'flex', alignItems: 'center', gap: 4
                  }}>
                    {isPassed ? <><CheckCircle2 size={10} /> PASSED</> : <><XCircle size={10} /> FAILED</>}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                  <span>branch: <code style={{ color: '#A7F3D0' }}>{r.branch}</code></span>
                  <span>{r.duration_seconds}s total</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Right Side: Visual QA Node Canvas ────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'hidden' }}>
        <div className="qa-canvas-wrapper" onContextMenu={handleContextMenu} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          {/* Header toolbar */}
          <div className="qa-canvas-header">
            <div>
              <div className="qa-canvas-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bot size={18} color="#0F62FE" />
                <span>IBM Bob Subagent Beta — QA Pipeline</span>
                {selectedRun && (
                  <span style={{
                    fontSize: 11, padding: '2px 8px', borderRadius: 8,
                    background: selectedRun.status === 'PASSED' ? 'rgba(66,190,101,0.2)' : 'rgba(218,30,40,0.2)',
                    color: selectedRun.status === 'PASSED' ? '#42BE65' : '#DA1E28',
                    border: selectedRun.status === 'PASSED' ? '1px solid rgba(66,190,101,0.4)' : '1px solid rgba(218,30,40,0.4)'
                  }}>
                    Inspecting Run #{selectedRun.run_number} ({selectedRun.status})
                  </span>
                )}
              </div>
              <div className="qa-canvas-subtitle">
                bob-skill-watsonx-qa · Click any node to inspect or edit shell commands
              </div>
            </div>

            <div className="qa-actions">
              <button
                className="btn btn--secondary"
                onClick={() => setShowYamlDrawer(true)}
                title="Export .watsonx-qa.yml configuration"
                style={{ display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <FileCode size={14} />
                <span>View .watsonx-qa.yml</span>
              </button>
              
              {selectedRun ? (
                <button className="btn btn--secondary" onClick={resetSteps}>
                  Clear Inspection Mode
                </button>
              ) : (
                <>
                  <button className="btn btn--secondary" onClick={() => runDemoQA(true)} disabled={running || !steps.some(step => step.enabled)}>
                    Simulate Failure
                  </button>
                  <button className="btn btn--primary" onClick={() => runDemoQA()} disabled={running || !steps.some(step => step.enabled)}>
                    {running ? 'Running…' : 'Run Live QA'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Canvas Track */}
          <div className="qa-canvas-track" style={{ flex: 1, minHeight: 240, overflowX: 'auto', display: 'flex', alignItems: 'center', padding: '24px' }}>
            {displaySteps.map((step, index) => (
              <div key={step.id} style={{ display: 'flex', alignItems: 'center' }}>
                <QANodeCard
                  id={step.id}
                  name={step.name}
                  command={step.command}
                  status={step.status}
                  durationMs={step.durationMs}
                  enabled={step.enabled}
                  elapsed={step.elapsed}
                  onToggle={toggleStep}
                  onSelect={() => openNodeInspector(step)}
                  running={running}
                />
                {index < displaySteps.length - 1 && <QAConnector status={step.status} />}
              </div>
            ))}

            <button className="qa-add-step-btn" onClick={() => setShowModal(true)} disabled={running}>
              + Add Custom Step
            </button>
          </div>

          {/* Summary status bar */}
          {summary && (
            <div className="qa-summary-bar">
              <span className="qa-summary-result">{summary}</span>
              <button className="btn btn--ghost" onClick={() => runDemoQA()}>Run Again</button>
            </div>
          )}

          {/* Context menu */}
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

          {/* Add Step Modal */}
          {showModal && (
            <AddStepModal
              onAdd={step => addStep({ ...step, status: step.status as NodeStatus })}
              onClose={() => setShowModal(false)}
            />
          )}
        </div>
      </div>

      {/* ── Node Inspection & Configuration Modal ───────────────────── */}
      {inspectedStep && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            width: '100%', maxWidth: 580,
            background: '#0D0F17',
            border: '1px solid rgba(15, 98, 254, 0.3)',
            borderRadius: 20,
            padding: 24,
            boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(15, 98, 254, 0.2)',
            display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Settings size={20} color="#0F62FE" />
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>
                    Node Config &amp; Output Inspector
                  </h3>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                    Node ID: <code style={{ color: '#60A5FA' }}>{inspectedStep.id}</code>
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectedStep(null)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveStepConfig} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
                    Step Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff', fontSize: 13, outline: 'none'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
                    Timeout (ms)
                  </label>
                  <input
                    type="number"
                    value={editDuration}
                    onChange={e => setEditDuration(Number(e.target.value))}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff', fontSize: 13, outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>
                  Shell Command (`command`)
                </label>
                <input
                  type="text"
                  value={editCommand}
                  onChange={e => setEditCommand(e.target.value)}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                    color: '#A7F3D0', fontSize: 13, fontFamily: 'monospace', outline: 'none'
                  }}
                />
              </div>

              {/* Terminal Log Output Window */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                    Execution Log Output (stdout / stderr)
                  </label>
                  <span style={{ fontSize: 10, color: '#60A5FA', fontFamily: 'monospace' }}>watsonx-qa.log</span>
                </div>

                <pre style={{
                  background: '#08090E',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10,
                  padding: 14,
                  fontSize: 11,
                  fontFamily: 'monospace',
                  color: 'rgba(255,255,255,0.85)',
                  lineHeight: 1.5,
                  maxHeight: 160,
                  overflowY: 'auto',
                  margin: 0
                }}>
                  {STEP_MOCK_LOGS[inspectedStep.id] || `[watsonx-qa] Running step command: ${inspectedStep.command}\n✔ Step finished successfully.`}
                </pre>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button
                  type="button"
                  onClick={() => setInspectedStep(null)}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent', color: 'rgba(255,255,255,0.7)', fontSize: 12, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 18px', borderRadius: 8, border: 'none',
                    background: '#0F62FE', color: '#fff', fontWeight: 600, fontSize: 12,
                    cursor: 'pointer', boxShadow: '0 4px 14px rgba(15,98,254,0.3)'
                  }}
                >
                  Save Config Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── .watsonx-qa.yml Workflow File Export Modal / Drawer ─────── */}
      {showYamlDrawer && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            width: '100%', maxWidth: 580,
            background: '#0D0F17',
            border: '1px solid rgba(15, 98, 254, 0.3)',
            borderRadius: 20,
            padding: 24,
            boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(15, 98, 254, 0.2)',
            display: 'flex', flexDirection: 'column', gap: 16
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileCode size={20} color="#60A5FA" />
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>
                    Generated `.watsonx-qa.yml` Workflow Config
                  </h3>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                    Auto-synced with visual canvas nodes &amp; step commands
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowYamlDrawer(false)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Code Block */}
            <pre style={{
              background: '#08090E',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              padding: 16,
              fontSize: 12,
              fontFamily: 'monospace',
              color: '#A7F3D0',
              overflowX: 'auto',
              maxHeight: 320,
              margin: 0
            }}>
              {generateYaml()}
            </pre>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setShowYamlDrawer(false)}
                style={{
                  padding: '9px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                  background: 'transparent', color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer'
                }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleCopyYaml}
                style={{
                  padding: '9px 18px', borderRadius: 8, border: 'none',
                  background: copiedYaml ? '#42BE65' : '#0F62FE',
                  color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6
                }}
              >
                {copiedYaml ? <Check size={14} /> : <Copy size={14} />}
                <span>{copiedYaml ? 'Copied to Clipboard!' : 'Copy .watsonx-qa.yml'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
