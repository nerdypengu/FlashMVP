import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Radio, Cpu, HardDrive, Globe, Terminal, ArrowLeft } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import projectsMock from '../../mocks/projects_mock.json'
import LogViewer from '../playground/LogViewer'

type DataPoint = { time: string; cpu: number; ram: number; hits: number }

function randomDelta(val: number, min: number, max: number, range: number) {
  const next = val + (Math.random() - 0.5) * range
  return Math.max(min, Math.min(max, Math.round(next)))
}

export default function ProjectDetailsTelemetry() {
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId?: string }>()

  // Find project or fallback
  const project = projectsMock.find(p => p.id === projectId) || projectsMock[0]

  // Live Telemetry data stream
  const [telemetrySeries, setTelemetrySeries] = useState<DataPoint[]>(() => {
    const points: DataPoint[] = []
    const now = Date.now()
    for (let i = 20; i >= 0; i--) {
      const t = new Date(now - i * 3000).toTimeString().slice(0, 8)
      points.push({
        time: t,
        cpu: Math.floor(15 + Math.random() * 25),
        ram: Math.floor(140 + Math.random() * 60),
        hits: Math.floor(40 + Math.random() * 30)
      })
    }
    return points
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetrySeries(prev => {
        const last = prev[prev.length - 1]
        const nowStr = new Date().toTimeString().slice(0, 8)
        const next: DataPoint = {
          time: nowStr,
          cpu: randomDelta(last.cpu, 5, 85, 6),
          ram: randomDelta(last.ram, 120, 380, 15),
          hits: randomDelta(last.hits, 10, 120, 10)
        }
        const updated = [...prev, next]
        return updated.length > 30 ? updated.slice(-30) : updated
      })
    }, 2500)
    return () => clearInterval(timer)
  }, [])

  const apiEndpoints = [
    { method: 'GET', path: '/api/v1/products', hits: 5120, avgLatency: '18ms', successRate: '99.8%' },
    { method: 'POST', path: '/api/v1/checkout', hits: 3420, avgLatency: '42ms', successRate: '99.5%' },
    { method: 'POST', path: '/api/v1/auth/login', hits: 2100, avgLatency: '35ms', successRate: '99.9%' },
    { method: 'GET', path: '/api/v1/cart', hits: 1800, avgLatency: '12ms', successRate: '100%' },
    { method: 'GET', path: '/api/v1/health', hits: 1840, avgLatency: '4ms', successRate: '100%' }
  ]

  const totalHits = apiEndpoints.reduce((sum, e) => sum + e.hits, 0)
  const currentCpu = telemetrySeries[telemetrySeries.length - 1]?.cpu || 24
  const currentRam = telemetrySeries[telemetrySeries.length - 1]?.ram || 184

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 32 }}>

      {/* ── Top Navigation & Title Header ───────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          style={{
            alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: '#60A5FA', fontSize: 13,
            fontWeight: 600, cursor: 'pointer', padding: 0
          }}
        >
          <ArrowLeft size={14} /> <span>Back to Projects</span>
        </button>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          padding: '24px 28px',
          background: 'rgba(15, 98, 254, 0.06)',
          borderRadius: 16,
          border: '1px solid rgba(15, 98, 254, 0.2)',
          backdropFilter: 'blur(16px)',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <Radio size={24} color="#0F62FE" />
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                  {project.name} — Observability &amp; Analytics
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <a
                    href={project.repoUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: 12, color: '#60A5FA', fontFamily: 'monospace', textDecoration: 'none' }}
                  >
                    <i className="fa-brands fa-github" style={{ marginRight: 4, color: '#fff' }} />
                    {project.repo}
                  </a>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>•</span>
                  <span style={{ fontSize: 12, color: '#A7F3D0', fontFamily: 'monospace' }}>
                    us-south.codeengine.appdomain.cloud
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 20,
              background: 'rgba(66, 190, 101, 0.15)', border: '1px solid rgba(66, 190, 101, 0.3)',
              color: '#42BE65', fontSize: 12, fontWeight: 700
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#42BE65', boxShadow: '0 0 8px #42BE65' }} />
              IBM Code Engine: 2 Replicas Active
            </span>
          </div>
        </div>
      </div>

      {/* ── Summary Metrics Bar ─────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16
      }}>
        <div style={{
          padding: 18, borderRadius: 14, background: 'rgba(15, 17, 26, 0.75)',
          border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 4
        }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Total Web &amp; API Hits (24h)</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{totalHits.toLocaleString()}</span>
            <span style={{ fontSize: 11, color: '#42BE65', fontWeight: 600 }}>↑ 14% vs yesterday</span>
          </div>
        </div>

        <div style={{
          padding: 18, borderRadius: 14, background: 'rgba(15, 17, 26, 0.75)',
          border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 4
        }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Unique Web Visitors / Users</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#60A5FA' }}>1,420</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>active accounts</span>
          </div>
        </div>

        <div style={{
          padding: 18, borderRadius: 14, background: 'rgba(15, 17, 26, 0.75)',
          border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 4
        }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>IBM Container CPU Usage</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#0F62FE' }}>{currentCpu}%</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>0.34 Cores / 1.0 Core</span>
          </div>
        </div>

        <div style={{
          padding: 18, borderRadius: 14, background: 'rgba(15, 17, 26, 0.75)',
          border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 4
        }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Container RAM Allocation</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#A7F3D0' }}>{currentRam} MB</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>512 MB Max</span>
          </div>
        </div>
      </div>

      {/* ── Live CPU & RAM Line Charts Grid ─────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: 20
      }}>
        {/* CPU Chart */}
        <div style={{
          padding: 20, borderRadius: 16, background: 'rgba(15, 17, 26, 0.75)',
          border: '1px solid rgba(15, 98, 254, 0.25)', backdropFilter: 'blur(20px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Cpu size={16} color="#0F62FE" />
              <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>IBM Container CPU Usage (%)</span>
            </div>
            <span style={{ fontSize: 11, color: '#0F62FE', fontFamily: 'monospace' }}>
              Live 2.5s Stream
            </span>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={telemetrySeries} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#8d8d8d' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#8d8d8d' }} domain={[0, 100]} unit="%" />
              <Tooltip
                contentStyle={{ background: '#1c1c28', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }}
                labelStyle={{ color: '#f4f4f4' }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone" dataKey="cpu" name="CPU %" stroke="#0F62FE"
                dot={false} strokeWidth={2} isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* RAM Chart */}
        <div style={{
          padding: 20, borderRadius: 16, background: 'rgba(15, 17, 26, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(20px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <HardDrive size={16} color="#A7F3D0" />
              <span style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>Container RAM Usage (MB)</span>
            </div>
            <span style={{ fontSize: 11, color: '#A7F3D0', fontFamily: 'monospace' }}>
              Max 512 MB
            </span>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={telemetrySeries} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#8d8d8d' }} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#8d8d8d' }} domain={[0, 500]} unit="MB" />
              <Tooltip
                contentStyle={{ background: '#1c1c28', border: '1px solid rgba(255,255,255,0.1)', fontSize: 12 }}
                labelStyle={{ color: '#f4f4f4' }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line
                type="monotone" dataKey="ram" name="RAM (MB)" stroke="#A7F3D0"
                dot={false} strokeWidth={2} isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── API Endpoint Traffic & Status Code Breakdown ─────────────── */}
      <div style={{
        padding: 20, borderRadius: 16, background: 'rgba(15, 17, 26, 0.75)',
        border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: '0 0 2px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Globe size={16} color="#60A5FA" />
              <span>Top Hit API Endpoints &amp; Web Access Traffic</span>
            </h3>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              Real-time request metrics captured by IBM Bob 2.0 container proxy.
            </p>
          </div>
          <span style={{ fontSize: 11, color: '#42BE65', fontWeight: 600 }}>98.6% 200 OK Status</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>
                <th style={{ padding: '8px 12px' }}>HTTP METHOD</th>
                <th style={{ padding: '8px 12px' }}>API ENDPOINT PATH</th>
                <th style={{ padding: '8px 12px' }}>TOTAL HITS</th>
                <th style={{ padding: '8px 12px' }}>AVG LATENCY</th>
                <th style={{ padding: '8px 12px' }}>SUCCESS RATE</th>
              </tr>
            </thead>
            <tbody>
              {apiEndpoints.map(ep => (
                <tr key={ep.path} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 4,
                      background: ep.method === 'GET' ? 'rgba(66, 190, 101, 0.15)' : 'rgba(15, 98, 254, 0.15)',
                      color: ep.method === 'GET' ? '#42BE65' : '#60A5FA',
                      fontFamily: 'monospace'
                    }}>
                      {ep.method}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', color: '#fff' }}>
                    {ep.path}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: '#fff' }}>
                    {ep.hits.toLocaleString()}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#A7F3D0' }}>
                    {ep.avgLatency}
                  </td>
                  <td style={{ padding: '10px 12px', color: '#42BE65', fontWeight: 600 }}>
                    {ep.successRate}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── SSE Container Live Log Terminal ───────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Terminal size={16} color="#60A5FA" />
          <span>Live IBM Code Engine Container SSE Log Streamer</span>
        </h3>
        <LogViewer />
      </div>

    </div>
  )
}
