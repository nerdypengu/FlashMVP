import { useState, useEffect, useRef } from 'react'
import { DEMO_MODE, errorMessage, loadServices, type Project, type ServiceRecord } from '../../lib/person2Data'
import { backendResponse, requireLiveBackend } from '../../lib/backendApi'
import { sseEvents } from '../../lib/sseEvents.js'
import { logLevel } from '../telemetry/telemetryData.js'

const MOCK_LOGS: Record<string, string[]> = {
  frontend: [
    '[vite] server started on http://localhost:3001',
    '[vite] hmr connected',
    'GET / 200 in 12ms',
    'GET /assets/index.js 200 in 4ms',
    'GET /api/health 200 in 2ms',
  ],
  backend: [
    'INFO:     Started server process [1]',
    'INFO:     Waiting for application startup.',
    'INFO:     Application startup complete.',
    'INFO:     Uvicorn running on http://0.0.0.0:8001',
    'INFO:     127.0.0.1:54231 - "GET /docs HTTP/1.1" 200 OK',
  ],
}

const LIVE_LINES: Record<string, string[]> = {
  frontend: [
    'GET /api/v1/projects 200 in 8ms',
    'GET /api/v1/runs 200 in 5ms',
    'WebSocket connection established',
    'GET /assets/chunk-react.js 200 in 3ms',
    'Hot module replacement triggered',
  ],
  backend: [
    'INFO:     GET /api/v1/projects/proj_8f92a/containers 200',
    'INFO:     GET /api/v1/projects/proj_8f92a/runs 200',
    'INFO:     POST /api/v1/specs/approve 200',
    'INFO:     GET /api/v1/projects/proj_8f92a/containers/frontend/stats 200',
    '🔵 Polling container stats (cpu: 18%, ram: 210MB)',
  ],
}

export default function LogViewer({ project, service }: { project?: Project; service?: string }) {
  const [container, setContainer] = useState(service ?? (DEMO_MODE ? 'frontend' : ''))
  const [logs, setLogs] = useState<string[]>(DEMO_MODE ? MOCK_LOGS['frontend'] : [])
  const [services, setServices] = useState<ServiceRecord[]>([])
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('ALL')
  const [paused, setPaused] = useState<string[] | null>(null)
  const [follow, setFollow] = useState(true)
  const [connection, setConnection] = useState('Waiting')
  const [retry, setRetry] = useState(0)
  const logContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (service !== undefined || DEMO_MODE || !project) return
    let active = true
    loadServices(project.id).then(rows => {
      if (!active) return
      const containers = rows.filter(row => row.service_type !== 'db' && row.container_id)
      setServices(containers); setContainer(containers[0]?.service_type ?? '')
    }).catch(error => { if (active) setError(errorMessage(error)) })
    return () => { active = false }
  }, [project?.id, service])

  useEffect(() => {
    if (DEMO_MODE || !project || !container) return
    const controller = new AbortController()
    setLogs([]); setPaused(null); setError(''); setConnection('Connecting')
    const connect = async () => {
      await requireLiveBackend(controller.signal)
      const response = await backendResponse(`/api/v1/projects/${encodeURIComponent(project.project_id)}/containers/${encodeURIComponent(container)}/logs`, controller.signal)
      if (!response.body) throw new Error('Log stream is unavailable.')
      setConnection('Live')
      for await (const line of sseEvents(response.body)) {
        if (controller.signal.aborted) break
        if (line.startsWith('[STREAM_ERROR]')) throw new Error(line.replace('[STREAM_ERROR] ', ''))
        setLogs(previous => [...previous, line].slice(-500))
      }
      if (!controller.signal.aborted) setConnection('Disconnected')
    }
    connect().catch(error => { if (!controller.signal.aborted) { setError(errorMessage(error)); setConnection('Disconnected') } })
    return () => controller.abort()
  }, [project?.id, container, retry])

  // Reset logs on container switch
  useEffect(() => {
    if (!DEMO_MODE) return
    setLogs((MOCK_LOGS[container] ?? []).map(line => `${new Date().toISOString()} ${line}`))
  }, [container])

  // Simulate live SSE log stream
  useEffect(() => {
    if (!DEMO_MODE) return
    const lines = LIVE_LINES[container] ?? LIVE_LINES.frontend
    let i = 0
    const timer = setInterval(() => {
      setLogs(prev => {
        const next = [...prev, `${new Date().toISOString()} ${lines[i % lines.length]}`]
        return next.slice(-500)
      })
      i++
    }, 1500)
    return () => clearInterval(timer)
  }, [container])

  // Follow new logs inside the terminal without scrolling the page.
  useEffect(() => {
    const terminal = logContainerRef.current
    if (terminal && follow && !paused) terminal.scrollTop = terminal.scrollHeight
  }, [logs, follow, paused])

  const visible = (paused ?? logs).filter(line => (level === 'ALL' || logLevel(line) === level) && line.toLowerCase().includes(query.toLowerCase()))

  return (
    <section className="telemetry-logs" aria-labelledby="container-logs-title">
      <div className="telemetry-panel-heading">
        <h2 id="container-logs-title" className="telemetry-panel-title">Container Logs</h2>
        {service !== undefined ? <span className="telemetry-note">{service || 'No service selected'}</span> : <select
          aria-label="Log container"
          value={container}
          onChange={e => setContainer(e.target.value)}
          disabled={!DEMO_MODE && !services.length}
          style={{
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
            borderRadius: 6, color: 'var(--text-primary)', fontSize: 12,
            padding: '4px 10px', cursor: 'pointer',
          }}
        >
          {DEMO_MODE ? <><option value="frontend">frontend</option><option value="backend">backend</option></> :
            services.length ? services.map(service => <option key={service.service_type} value={service.service_type}>{service.service_type}</option>) :
            <option value="">No container configured</option>}
        </select>}
      </div>
      <div className="telemetry-toolbar telemetry-log-controls">
        <input aria-label="Search logs" placeholder="Search logs…" value={query} onChange={e => setQuery(e.target.value)} />
        <select aria-label="Log severity" value={level} onChange={e => setLevel(e.target.value)}>
          <option value="ALL">All levels</option>{['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE', 'UNKNOWN'].map(item => <option key={item} value={item}>{item === 'UNKNOWN' ? 'Unclassified' : item}</option>)}
        </select>
        <button type="button" onClick={() => setPaused(paused ? null : [...logs])}>{paused ? 'Resume' : 'Pause'}</button>
        <label><input type="checkbox" checked={follow} onChange={e => setFollow(e.target.checked)} /> Auto-scroll</label>
        {!DEMO_MODE && <button type="button" disabled={!container} onClick={() => setRetry(n => n + 1)}>Reconnect</button>}
        <span className="telemetry-note" role="status">{paused ? 'Paused view' : DEMO_MODE ? 'Demo logs' : connection} · {visible.length} shown</span>
      </div>
      <p className="telemetry-note">Latest 500 received entries. Severity is available only when provided by the application. Pause freezes the view while collection continues.</p>
      <div ref={logContainerRef} className="telemetry-panel telemetry-log-viewport" style={{
        padding: '12px 14px', height: 260, overflowY: 'auto', fontFamily: 'monospace',
        fontSize: 12, lineHeight: 1.7,
      }}>
        {error && <p role="alert" style={{ color: 'var(--red-fail)' }}>{error}</p>}
        {!error && !visible.length && <p>{logs.length ? 'No logs match these filters.' : 'No container logs received yet.'}</p>}
        {visible.map((line, i) => <details key={`${i}-${line}`} className={`telemetry-log-entry level-${logLevel(line).toLowerCase()}`}>
          <summary>{line.split('\n')[0]}</summary><pre>{line}</pre>
        </details>)}
      </div>
    </section>
  )
}
