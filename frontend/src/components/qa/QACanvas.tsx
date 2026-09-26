import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Bot, FileCode, History } from 'lucide-react'
import { API_URL, DEMO_MODE, errorMessage, runRecordToRun } from '../../lib/person2Data'
import { backendResponse } from '../../lib/backendApi'
import QANodeCard, { QAStatusIcon } from './QANodeCard'
import { getStageStatus, runDemoSteps } from './runDemoSteps.js'
import type { Run } from './RunHistoryTable'
import './QACanvas.css'

type NodeStatus = 'PENDING' | 'RUNNING' | 'PASSED' | 'FAILED' | 'SKIPPED'
type Stage = { stage: string; files: string[] }
type Step = { id: string; stage: string; name: string; file: string; enabled: boolean;
  durationMs: number; status: NodeStatus; logOutput?: string }
type Props = { projectId: string; runs: Run[]; onRunComplete: (run: Run) => void }

export default function QACanvas({ projectId, runs, onRunComplete }: Props) {
  const [pipeline, setPipeline] = useState<Stage[]>([])
  const [steps, setSteps] = useState<Step[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [running, setRunning] = useState(false)
  const [summary, setSummary] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedRun = searchParams.get('run')
  const selectedRun = runs.find(run => String(run.run_number) === requestedRun) ?? null
  const missingRun = requestedRun !== null && !selectedRun
  const [inspectedStep, setInspectedStep] = useState<Step | null>(null)
  const [showManifest, setShowManifest] = useState(false)

  useEffect(() => { setInspectedStep(null); setSummary('') }, [requestedRun])

  const selectRun = (run: Run | null) => {
    setSearchParams(previous => {
      const next = new URLSearchParams(previous)
      if (run) next.set('run', String(run.run_number))
      else next.delete('run')
      return next
    })
  }

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true); setError('')
    const load = async () => {
      const path = `/api/v1/projects/${encodeURIComponent(projectId)}/qa-pipeline`
      const response = DEMO_MODE ? await fetch(`${API_URL}${path}`, { signal: controller.signal }) :
        await backendResponse(path, controller.signal)
      if (!response.ok) throw new Error(`QA pipeline is unavailable (HTTP ${response.status}).`)
      const stages: Stage[] = await response.json()
      if (!Array.isArray(stages) || !stages.every(item => typeof item.stage === 'string' && Array.isArray(item.files)))
        throw new Error('Bob returned an invalid qa_pipeline.')
      if (controller.signal.aborted) return
      setPipeline(stages)
      setSteps(stages.flatMap(item => item.files.map(file => ({
        id: `${item.stage}:${file}`, stage: item.stage, name: file.split('/').at(-1) ?? file,
        file, enabled: true, durationMs: 600, status: 'PENDING' as NodeStatus,
      }))))
    }
    load().catch(err => { if (!controller.signal.aborted) setError(errorMessage(err)) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [projectId])

  const displaySteps: Step[] = selectedRun ? selectedRun.step_results.map(result => ({
    id: result.id, stage: result.stage ?? 'Archived run', name: result.name, file: result.name,
    enabled: true, durationMs: Number.parseFloat(result.duration) * 1000 || 0,
    status: result.status as NodeStatus, logOutput: result.log_output,
  })) : missingRun ? [] : steps
  const stages = [...new Set(displaySteps.map(step => step.stage))]
  const updateStatus = (id: string, status: NodeStatus) =>
    setSteps(previous => previous.map(step => step.id === id ? { ...step, status } : step))

  const runQA = async (simulateFailure = false) => {
    if (!DEMO_MODE || running || !steps.length) return
    selectRun(null); setError(''); setSummary(''); setRunning(true)
    setSteps(previous => previous.map(step => ({ ...step, status: 'PENDING' })))
    try {
      const failedId = simulateFailure ? steps[Math.min(1, steps.length - 1)].id : null
      await runDemoSteps(steps, (id: string, status: NodeStatus) => updateStatus(id, status), failedId)
      const response = await fetch(`${API_URL}/api/v1/projects/${encodeURIComponent(projectId)}/qa/run`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ simulate_failure: simulateFailure }),
      })
      if (!response.ok) throw new Error(`Could not save this run to the demo database (HTTP ${response.status}).`)
      const run = runRecordToRun(await response.json())
      onRunComplete(run)
      setSummary(`Run #${run.run_number} — ${run.status} (demo simulation)`)
    } catch (err) { setError(errorMessage(err)) }
    finally { setRunning(false) }
  }

  return <div className="qa-workspace-container" style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
    <aside aria-label="QA run history" className="qa-run-history" style={{ minWidth: 220, flex: '0 1 250px', padding: 16 }}>
      <h2 style={{ fontSize: 15 }}><History size={16} /> Run History</h2>
      <button type="button" className="btn btn--ghost" onClick={() => selectRun(null)}>Current pipeline</button>
      {runs.map(run => <button type="button" key={run.run_number} onClick={() => selectRun(run)}
        aria-pressed={selectedRun?.run_number === run.run_number} className="qa-run-entry">
        Run #{run.run_number} — {run.status}
      </button>)}
      {!runs.length && <p>No runs recorded for this project.</p>}
    </aside>
    <div className="qa-canvas-wrapper" style={{ flex: '1 1 450px', minWidth: 0 }}>
      <div className="qa-canvas-header">
        <h1 className="qa-canvas-title"><Bot size={20} /> QA Pipeline</h1>
        <p className="qa-canvas-subtitle">{selectedRun ? `Inspecting Run #${selectedRun.run_number}` : missingRun ? 'Requested run is unavailable.' : 'Stages and test files are generated by Bob.'}</p>
        <div className="qa-actions">
          {!!pipeline.length && <button className="btn btn--secondary" onClick={() => setShowManifest(true)}><FileCode size={14} /> View qa_pipeline</button>}
          {requestedRun !== null ? <button className="btn btn--secondary" onClick={() => selectRun(null)}>Clear inspection</button> : <>
            {DEMO_MODE && <button className="btn btn--secondary" onClick={() => runQA(true)} disabled={running || !steps.length}>Simulate failure</button>}
            <button className="btn btn--primary" onClick={() => runQA()} disabled={!DEMO_MODE || running || !steps.length}>
              {running ? 'Running…' : 'Run QA'}</button>
          </>}
        </div>
      </div>
      {loading && <p className="qa-runner-note" role="status">Loading Bob's qa_pipeline…</p>}
      {error && <p className="qa-runner-note" role="alert">{error}</p>}
      {missingRun && <p className="qa-runner-note" role="alert">Run #{requestedRun} was not found in this project's history.</p>}
      {!DEMO_MODE && <p className="qa-runner-note">Live test execution will be available when the Bob runner is connected.</p>}
      {!!stages.length && <div className="qa-status-strip" role="group" aria-label="QA pipeline stages status">
        {stages.map((stage, index) => {
          const status = getStageStatus(displaySteps.filter(step => step.stage === stage)).toUpperCase() as NodeStatus
          return <span className={`qa-status-step qa-status-step--${status.toLowerCase()}`} key={stage}>
            {index > 0 && <span className="qa-status-connector" aria-hidden="true" />}
            <button type="button" className={`qa-status-dot qa-status-color--${status.toLowerCase()}`}
              title={`${stage} — ${status.toLowerCase()}`} aria-label={`${stage}: ${status.toLowerCase()}`}
              onClick={() => document.getElementById(`qa-stage-${index}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })}>
              <span className="qa-status-icon" key={status}><QAStatusIcon status={status} /></span>
            </button>
          </span>
        })}
      </div>}
      {!loading && !error && !requestedRun && !stages.length && <p className="qa-stage-empty">No QA stages are defined in this project's flashmvp.json.</p>}
      <div className="qa-canvas-track" role="region" aria-label="QA pipeline stages" style={{ display: 'flex', alignItems: 'flex-start', padding: 12, gap: 8 }}>
        {stages.map((stage, index) => <section className="qa-stage" id={`qa-stage-${index}`} key={stage} style={{ minWidth: 200 }}>
          <h2 className="qa-stage-title">{stage}</h2>
          <div className="qa-stage-jobs">{displaySteps.filter(step => step.stage === stage).map(step =>
            <QANodeCard key={step.id} number={displaySteps.indexOf(step) + 1} name={step.name} file={step.file} status={step.status}
              durationMs={step.durationMs} onSelect={() => setInspectedStep(step)} />)}</div>
        </section>)}
      </div>
      {summary && <div className="qa-summary-bar"><strong>{summary}</strong></div>}
    </div>
    {inspectedStep && <div className="modal-overlay" onMouseDown={() => setInspectedStep(null)}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-label={`${inspectedStep.name} details`} onMouseDown={event => event.stopPropagation()}>
        <h2>{inspectedStep.name}</h2><code>{inspectedStep.file}</code>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{inspectedStep.logOutput || 'No execution log recorded for this file.'}</pre>
        <button className="btn btn--ghost" onClick={() => setInspectedStep(null)}>Close</button>
      </div>
    </div>}
    {showManifest && <div className="modal-overlay" onMouseDown={() => setShowManifest(false)}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-label="Bob QA pipeline" onMouseDown={event => event.stopPropagation()}>
        <h2>flashmvp.json · qa_pipeline</h2><pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify({ qa_pipeline: pipeline }, null, 2)}</pre>
        <button className="btn btn--ghost" onClick={() => setShowManifest(false)}>Close</button>
      </div>
    </div>}
  </div>
}
