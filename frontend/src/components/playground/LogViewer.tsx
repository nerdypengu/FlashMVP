import { useState, useEffect, useRef } from 'react'

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

export default function LogViewer() {
  const [container, setContainer] = useState<'frontend' | 'backend'>('frontend')
  const [logs, setLogs] = useState<string[]>(MOCK_LOGS['frontend'])
  const logEndRef = useRef<HTMLDivElement>(null)

  // Reset logs on container switch
  useEffect(() => {
    setLogs(MOCK_LOGS[container])
  }, [container])

  // Simulate live SSE log stream
  useEffect(() => {
    const lines = LIVE_LINES[container]
    let i = 0
    const timer = setInterval(() => {
      setLogs(prev => {
        const next = [...prev, lines[i % lines.length]]
        return next.length > 100 ? next.slice(-100) : next
      })
      i++
    }, 1500)
    return () => clearInterval(timer)
  }, [container])

  // Auto-scroll
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontWeight: 600, fontSize: 13 }}>🖥️ Container Logs</span>
        <select
          value={container}
          onChange={e => setContainer(e.target.value as 'frontend' | 'backend')}
          style={{
            background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
            borderRadius: 6, color: 'var(--text-primary)', fontSize: 12,
            padding: '4px 10px', cursor: 'pointer',
          }}
        >
          <option value="frontend">frontend</option>
          <option value="backend">backend</option>
        </select>
      </div>
      <div style={{
        background: '#070710', border: '1px solid var(--glass-border)', borderRadius: 6,
        padding: '12px 14px', height: 260, overflowY: 'auto', fontFamily: 'monospace',
        fontSize: 12, lineHeight: 1.7,
      }}>
        {logs.map((line, i) => (
          <div key={i} style={{ color: line.startsWith('✗') || line.includes('ERROR') ? 'var(--red-fail)' : '#a8e6a3' }}>
            {line}
          </div>
        ))}
        <div ref={logEndRef} />
      </div>
    </div>
  )
}
