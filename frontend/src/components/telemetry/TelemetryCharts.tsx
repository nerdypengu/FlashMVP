import { useEffect, useRef, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { DEMO_MODE, errorMessage, loadServices, type Project } from '../../lib/person2Data'
import { backendResponse, requireLiveBackend } from '../../lib/backendApi'
import LogViewer from '../playground/LogViewer'
import { networkRate, telemetryWindow, telemetryTickLabel, intervalSummary, telemetryStaleAfter, telemetryPollingInterval } from './telemetryData.js'
import './telemetry.css'

type Stats = {
  sampled_at: string; status: string; cpu_percent: number | null; memory_mb: number | null;
  memory_limit_mb?: number; memory_percent?: number; restart_count?: number; uptime_seconds?: number;
  health: string; health_checked_at?: string; health_check_ms?: number; exit_code?: number; oom_killed?: boolean;
  network_rx_bytes?: number; network_tx_bytes?: number; started_at?: string; stats_error?: string;
}
type Point = { time: number; cpu: number | null; memory: number | null; health: number | null; rx: number | null; tx: number | null }
const value = (n: number | null | undefined, unit = '') => n == null ? 'Unavailable' : `${n.toLocaleString(undefined, { maximumFractionDigits: 1 })}${unit}`
const time = (n: number) => new Date(n).toLocaleTimeString()
const label = (s?: string) => s ? s.charAt(0) + s.slice(1).toLowerCase() : 'Unknown'

export default function TelemetryCharts({ project }: { project?: Project }) {
  const [services, setServices] = useState<string[]>(DEMO_MODE ? ['frontend', 'backend'] : [])
  const [container, setContainer] = useState(DEMO_MODE ? 'frontend' : '')
  const [serviceError, setServiceError] = useState('')
  const [error, setError] = useState('')
  const [stats, setStats] = useState<Stats | null>(null)
  const [data, setData] = useState<Point[]>([])
  const [refresh, setRefresh] = useState(0)
  const [busy, setBusy] = useState(false)
  const [range, setRange] = useState(5)
  const [pollingMs, setPollingMs] = useState(() => {
    try { return telemetryPollingInterval(localStorage.getItem('telemetry.pollingMs')) }
    catch { return 5000 }
  })
  const pollingInterval = useRef(pollingMs)
  const reschedulePoll = useRef<(() => void) | undefined>(undefined)
  useEffect(() => {
    pollingInterval.current = pollingMs
    try { localStorage.setItem('telemetry.pollingMs', String(pollingMs)) } catch { /* Storage may be disabled. */ }
    reschedulePoll.current?.()
  }, [pollingMs])
  const staleAfter = telemetryStaleAfter(pollingMs)
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (DEMO_MODE || !project) return
    let active = true
    setServiceError('')
    loadServices(project.id).then(rows => {
      if (!active) return
      const names = rows.filter(row => row.service_type !== 'db' && row.container_id).map(row => row.service_type)
      setServices(names); setContainer(current => names.includes(current) ? current : names[0] ?? '')
    }).catch(e => { if (active) setServiceError(errorMessage(e)) })
    return () => { active = false }
  }, [project?.id, refresh])

  useEffect(() => { setStats(null); setData([]); setError('') }, [project?.id, container])

  useEffect(() => {
    if (!container || (!DEMO_MODE && !project)) return
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    let previous: Stats | null = null
    const schedule = () => {
      clearTimeout(timer)
      timer = setTimeout(poll, pollingInterval.current)
    }
    reschedulePoll.current = () => { if (timer !== undefined) schedule() }
    const poll = async () => {
      timer = undefined
      setBusy(true)
      const signal = AbortSignal.any([controller.signal, AbortSignal.timeout(15000)])
      try {
        let next: Stats
        if (DEMO_MODE) {
          next = { sampled_at: new Date().toISOString(), status: 'RUNNING', cpu_percent: 12 + Math.random() * 12,
            memory_mb: 120 + Math.random() * 30, memory_limit_mb: 512, restart_count: 0, uptime_seconds: 3600,
            health: 'HEALTHY', health_checked_at: new Date().toISOString(), health_check_ms: 8 + Math.random() * 5 }
          next.memory_percent = next.memory_mb! / 512 * 100
        } else {
          await requireLiveBackend(signal)
          const response = await backendResponse(`/api/v1/projects/${encodeURIComponent(project!.project_id)}/containers/${encodeURIComponent(container)}/stats`, signal)
          next = await response.json()
        }
        if (controller.signal.aborted) return
        const timestamp = Date.parse(next.sampled_at)
        if (!Number.isFinite(timestamp)) throw new Error('The backend returned an invalid sample timestamp.')
        const staleAfter = telemetryStaleAfter(pollingInterval.current)
        const point: Point = { time: timestamp, cpu: next.cpu_percent, memory: next.memory_mb,
          health: next.health_check_ms ?? null, rx: networkRate(previous, next, 'network_rx_bytes', staleAfter), tx: networkRate(previous, next, 'network_tx_bytes', staleAfter) }
        previous = next
        setStats(next); setError(''); setNow(Date.now())
        // ponytail: this tab retains one hour; add backend retention for cross-session history.
        setData(points => {
          const last = points.at(-1)
          const gap = last && timestamp - last.time > staleAfter ? [{ time: last.time + 1, cpu: null, memory: null, health: null, rx: null, tx: null }] : []
          return [...points, ...gap, point].filter(p => p.time >= timestamp - 3600000)
        })
      } catch (e) {
        if (!controller.signal.aborted) {
          previous = null
          setError(errorMessage(e))
          setData(points => [...points, { time: Date.now(), cpu: null, memory: null, health: null, rx: null, tx: null }].filter(p => p.time >= Date.now() - 3600000))
        }
      } finally {
        if (!controller.signal.aborted) { setBusy(false); schedule() }
      }
    }
    void poll()
    return () => { controller.abort(); clearTimeout(timer); reschedulePoll.current = undefined }
  }, [project?.id, container, refresh])

  const stale = !!stats && (!!error || now - Date.parse(stats.sampled_at) > staleAfter)
  const current = stale ? null : stats
  const window = telemetryWindow(data, range, now)
  const chart = (title: string, unit: string, lines: [keyof Point, string, string][]) => (
    <TelemetryPanel title={title} unit={unit} lines={lines} data={data} range={range} now={now} pollingMs={pollingMs} />
  )
  const cards = [
    ['Service Health', label(current?.health), current?.health_checked_at ? `Checked ${new Date(current.health_checked_at).toLocaleTimeString()}` : 'No health check result'],
    ['Container', label(current?.status), current?.exit_code != null ? `Exit code ${current.exit_code}` : 'Runtime status'],
    ['CPU', value(current?.cpu_percent, '%'), '100% = one logical CPU'],
    ['Memory', value(current?.memory_mb, ' MiB'), `${value(current?.memory_percent, '%')} · limit ${value(current?.memory_limit_mb, ' MiB')}`],
    ['Uptime', current?.uptime_seconds == null ? 'Unavailable' : `${Math.floor(current.uptime_seconds / 3600)}h ${Math.floor(current.uptime_seconds % 3600 / 60)}m`, 'Since current start'],
    ['Restarts', value(current?.restart_count), current?.oom_killed ? 'Last termination: out of memory' : 'Reported by runtime'],
  ]
  return <>
    <div className="telemetry-toolbar">
      <label>Service <select value={container} onChange={e => setContainer(e.target.value)} disabled={!services.length}>
        {!services.length && <option value="">No container configured</option>}
        {services.map(name => <option key={name}>{name}</option>)}
      </select></label>
      <label>Chart range <select value={range} onChange={e => setRange(Number(e.target.value))}>
        <option value={5}>Last 5 minutes</option><option value={15}>Last 15 minutes</option><option value={60}>Last hour</option>
      </select></label>
      <label>Update interval <select value={pollingMs} onChange={e => setPollingMs(Number(e.target.value))}>
        <option value={5000}>5s</option><option value={10000}>10s</option><option value={30000}>30s</option><option value={60000}>1m</option>
      </select></label>
      <span className="telemetry-connection" role="status">{DEMO_MODE ? 'Demo data' : stale ? 'Stale' : error || serviceError ? 'Unavailable' : stats ? 'Connected' : busy ? 'Connecting…' : 'Waiting for service'}</span>
      <button type="button" disabled={busy} onClick={() => setRefresh(n => n + 1)}>Refresh</button>
    </div>
    <p className="telemetry-note">{stats ? `Last sample: ${new Date(stats.sampled_at).toLocaleString()}. ` : ''}Updates every {pollingMs / 1000} seconds. Historical data is available from this session only.</p>
    <p className="telemetry-note">Chart window: {time(window.start)} – {time(window.end)}. Periods without collected samples remain empty.</p>
    {(error || serviceError) && <p className="telemetry-error" role="alert">{serviceError || error}</p>}
    {current?.stats_error && <p className="telemetry-error" role="alert">{current.stats_error}</p>}
    <div className="telemetry-summary">{cards.map(([title, content, hint]) => <section className="telemetry-stat" key={title}>
      <h2>{title}</h2><strong>{content}</strong><small>{hint}</small>
    </section>)}</div>
    {current?.oom_killed && <p className="telemetry-error" role="alert">The runtime reports an out-of-memory termination. Review memory usage and container logs.</p>}
    <div className="telemetry-chart-grid">
      {chart('CPU Usage', '% · one core = 100%', [['cpu', 'CPU', '#6695ff']])}
      {chart('Memory Usage', 'MiB · includes cache', [['memory', 'Memory', '#ae8dff']])}
      {chart('Health-check Duration', 'ms · container check, not user request latency', [['health', 'Duration', '#55cbb5']])}
      {data.some(p => p.rx != null || p.tx != null) && chart('Network Throughput', 'KiB/s', [['rx', 'Received', '#6695ff'], ['tx', 'Sent', '#e5b45b']])}
    </div>
    {stats && stats.health === 'UNKNOWN' && <p className="telemetry-note">Service health requires a configured container health check. Running alone does not confirm application health.</p>}
    <LogViewer key={`${project?.id}-${container}`} project={project} service={container} />
  </>
}

function TelemetryPanel({ title, unit, lines, data, range, now, pollingMs }: {
  title: string; unit: string; lines: [keyof Point, string, string][]; data: Point[]; range: number; now: number; pollingMs: number
}) {
  const panel = useRef<HTMLElement>(null)
  const [width, setWidth] = useState(480)
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(1, entry.contentRect.width - 53)))
    observer.observe(panel.current!)
    return () => observer.disconnect()
  }, [])
  const window = telemetryWindow(data, range, now, width, pollingMs)
  const visible = intervalSummary(window.points, window.start, window.end, window.interval, telemetryStaleAfter(pollingMs))
  const empty = !visible.some(p => lines.some(([key]) => p[key] != null))
  return <section className="telemetry-panel" ref={panel}>
    <h2 className="telemetry-panel-title">{title} <span>{unit}</span></h2>
    <div style={{ position: 'relative' }}>
      {empty && <p style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none', fontSize: 12, color: 'var(--text-muted)' }}>No samples available</p>}
      <ResponsiveContainer width="100%" height={170}>
        <LineChart data={visible} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="time" type="number" scale="time" domain={[window.start, window.end]} ticks={window.ticks} allowDataOverflow tickFormatter={timestamp => telemetryTickLabel(timestamp, window.tickInterval)} tick={{ fontSize: 10 }} minTickGap={15} />
          <YAxis domain={[0, 'auto']} tick={{ fontSize: 10 }} width={45} />
          <Tooltip content={({ active, payload }) => active && payload?.length ? <div style={{ background: '#151820', border: '1px solid #343846', fontSize: 12, padding: 10 }}>
            <div>Interval: {time(payload[0].payload.intervalStart)} – {time(payload[0].payload.intervalEnd)}</div>
            <div>Recorded: {time(payload[0].payload.recordedFrom)} – {time(payload[0].payload.recordedTo)}</div>
            {payload.map(entry => <div key={String(entry.dataKey)} style={{ color: entry.color }}>
              {entry.name}: Avg {value(entry.value == null ? null : Number(entry.value))} · Max {value(entry.payload.maximum?.[String(entry.dataKey)])}
            </div>)}
            <small>{unit}</small>
          </div> : null} />
          {lines.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
          {lines.map(([key, name, color]) => <Line key={key} dataKey={key} name={name} stroke={color} dot={{ r: 2 }} strokeWidth={2} connectNulls={false} isAnimationActive={false} />)}
        </LineChart>
      </ResponsiveContainer>
    </div>
  </section>
}
