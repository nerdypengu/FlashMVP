import { useState, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import mockData from '../../mocks/telemetry_mock.json'
import './telemetry.css'

type DataPoint = { time: string; cpu: number; ram: number }

function randomDelta(val: number, min: number, max: number, range: number) {
  const next = val + (Math.random() - 0.5) * range
  return Math.max(min, Math.min(max, Math.round(next)))
}

export default function TelemetryCharts() {
  const [data, setData] = useState<DataPoint[]>(mockData.series as DataPoint[])

  // Simulate live telemetry every 2s
  useEffect(() => {
    const timer = setInterval(() => {
      setData(prev => {
        const last = prev[prev.length - 1]
        const now = new Date()
        const time = now.toTimeString().slice(0, 8)
        const next: DataPoint = {
          time,
          cpu: randomDelta(last.cpu, 3, 95, 8),
          ram: randomDelta(last.ram, 100, 400, 20),
        }
        const updated = [...prev, next]
        return updated.length > 30 ? updated.slice(-30) : updated
      })
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="telemetry-chart-grid">
      <section style={{ minWidth: 0 }} aria-labelledby="cpu-usage-title">
        <h2 id="cpu-usage-title" className="telemetry-panel-title">CPU Usage <span>%</span></h2>
        <div className="telemetry-panel">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#8d8d8d' }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: '#8d8d8d' }} domain={[0, 100]} unit="%" />
            <Tooltip
              contentStyle={{ background: '#1c1c28', border: '1px solid var(--glass-border)', fontSize: 12 }}
              labelStyle={{ color: '#f4f4f4' }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone" dataKey="cpu" name="CPU %" stroke="#0F62FE"
              dot={false} strokeWidth={2} isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
        </div>
      </section>

      <section style={{ minWidth: 0 }} aria-labelledby="memory-usage-title">
        <h2 id="memory-usage-title" className="telemetry-panel-title">Memory Usage <span>MB</span></h2>
        <div className="telemetry-panel">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
            <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#8d8d8d' }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: '#8d8d8d' }} domain={[0, 500]} unit="MB" />
            <Tooltip
              contentStyle={{ background: '#1c1c28', border: '1px solid var(--glass-border)', fontSize: 12 }}
              labelStyle={{ color: '#f4f4f4' }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone" dataKey="ram" name="RAM MB" stroke="#7c5cd8"
              dot={false} strokeWidth={2} isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
        </div>
      </section>
    </div>
  )
}
