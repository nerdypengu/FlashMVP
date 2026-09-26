import assert from 'node:assert/strict'
import { networkRate, logLevel, telemetryWindow, telemetryTickLabel, intervalSummary, telemetryStaleAfter, telemetryPollingInterval } from './telemetryData.js'

const end = new Date(2026, 0, 1, 12, 37, 1).getTime()
for (const minutes of [5, 15, 60]) {
  const start = end - minutes * 60000
  const points = [start - 1, start, end, end + 1].map(time => ({ time }))
  for (const width of [240, 480, 1200]) {
    const window = telemetryWindow(points, minutes, end, width)
    assert.equal(window.start, start)
    assert.equal(window.end, end)
    assert.deepEqual(window.points, points.slice(1, 3))
    assert.ok(window.ticks.length >= 4 && window.ticks.length <= 6)
    assert.equal(window.ticks[0], start)
    assert.equal(window.ticks.at(-1), end)
    assert.ok(window.interval >= 5000)
    assert.equal(telemetryWindow([], minutes, end, width).start, start)
  }
  assert.ok(telemetryWindow([], minutes, end, 240).interval >= telemetryWindow([], minutes, end, 1200).interval)
}
assert.deepEqual([5, 15, 60].map(range => telemetryWindow([], range, end, 240).interval), [10000, 30000, 120000])
assert.deepEqual([5, 15, 60].map(range => telemetryWindow([], range, end, 1200).interval), [5000, 10000, 30000])
assert.equal(telemetryTickLabel(end, 30000), '12:37:01')
assert.equal(telemetryTickLabel(end, 60000), '12:37')
const summary = intervalSummary([
  { time: 0, cpu: 10, memory: 100 },
  { time: 4999, cpu: 90, memory: null },
  { time: 10000, cpu: 0, memory: NaN },
  { time: 15000, cpu: 20 },
  { time: 15001, cpu: 100 },
], 0, 15000, 5000, 5000)
assert.equal(summary.length, 4)
assert.equal(summary[0].cpu, 50)
assert.equal(summary[0].maximum.cpu, 90)
assert.equal(summary[0].memory, 100)
assert.equal(summary[1].cpu, null)
assert.equal(summary[1].maximum.cpu, null)
assert.equal(summary[2].cpu, 0)
assert.equal(summary[2].maximum.cpu, 0)
assert.equal(summary[2].memory, null)
assert.equal(summary[2].intervalEnd, 15000)
assert.ok(intervalSummary([], 0, 15000, 5000, 5000).every(row => row.cpu === null))
assert.equal(summary[3].cpu, 20)
assert.equal(summary[3].recordedFrom, 15000)
assert.equal(summary[0].recordedFrom, 0)
assert.equal(summary[0].recordedTo, 4999)
assert.equal(summary[1].recordedFrom, null)
assert.equal(intervalSummary([{ time: 6000, cpu: 5 }], 1000, 7000, 5000)[1].intervalEnd, 10000)

// Advancing the clock without new samples must not move or regroup recorded points.
const captured = [{ time: 242000, cpu: 10 }, { time: 272000, cpu: 30 }]
const recordedRows = now => intervalSummary(captured, now - 300000, now, 30000).filter(row => row.cpu !== null)
const initial = recordedRows(280000)
assert.deepEqual(recordedRows(281000), initial)
assert.deepEqual(recordedRows(299000), initial)
assert.deepEqual(initial.map(row => row.time), [242000, 272000])
assert.deepEqual(initial.map(row => row.intervalStart), [240000, 270000])
assert.deepEqual(initial.map(row => row.recordedTo), [242000, 272000])
const updated = intervalSummary([...captured, { time: 277000, cpu: 50 }], -20000, 280000, 30000).filter(row => row.cpu !== null)
assert.equal(updated[1].cpu, 40)
assert.equal(updated[1].time, 272000)
assert.equal(updated[1].recordedTo, 277000)

for (const pollingMs of [5000, 10000, 30000, 60000]) {
  for (const range of [5, 15, 60]) {
    assert.ok(telemetryWindow([], range, end, 1200, pollingMs).interval >= pollingMs)
  }
  assert.ok(telemetryStaleAfter(pollingMs) > pollingMs)
}
assert.deepEqual([5000, 10000, 30000, 60000].map(telemetryStaleAfter), [20000, 20000, 60000, 120000])

const before = { sampled_at: '2026-01-01T00:00:00Z', started_at: 'start', network_rx_bytes: 1024 }
const after = { ...before, sampled_at: '2026-01-01T00:00:05Z', network_rx_bytes: 11264 }
assert.equal(networkRate(before, after, 'network_rx_bytes'), 2)
assert.equal(networkRate(null, after, 'network_rx_bytes'), null)
assert.equal(networkRate(before, { ...after, network_rx_bytes: 0 }, 'network_rx_bytes'), null)
assert.equal(networkRate(before, { ...after, started_at: 'restart' }, 'network_rx_bytes'), null)
assert.equal(networkRate(before, { ...after, sampled_at: '2026-01-01T00:01:00Z' }, 'network_rx_bytes'), null)
assert.equal(networkRate(before, { ...after, network_rx_bytes: null }, 'network_rx_bytes'), null)
const slow = { ...after, sampled_at: '2026-01-01T00:01:00Z', network_rx_bytes: 123904 }
assert.equal(networkRate(before, slow, 'network_rx_bytes', telemetryStaleAfter(60000)), 2)
assert.equal(networkRate(before, { ...slow, sampled_at: '2026-01-01T00:02:01Z' }, 'network_rx_bytes', telemetryStaleAfter(60000)), null)
assert.equal(logLevel('2026-01-01T00:00:00Z ERROR: connection failed'), 'ERROR')
assert.equal(logLevel('2026-01-01T00:00:00Z {"level":"warning","message":"retry"}'), 'WARN')
assert.equal(logLevel('GET /error-page 200'), 'UNKNOWN')
assert.equal(logLevel('Traceback continuation'), 'UNKNOWN')
console.log('Telemetry calculations and log classification passed.')

for (const interval of [5000, 10000, 30000, 60000]) {
  assert.equal(telemetryPollingInterval(String(interval)), interval)
}
for (const invalid of [null, '', 'oops', '0', '-1', '15000']) {
  assert.equal(telemetryPollingInterval(invalid), 5000)
}

// Normal response latency must not break the line at a bucket boundary.
const jittered = [{ time: 4900, cpu: 10 }, { time: 10100, cpu: 20 }]
assert.deepEqual(intervalSummary(jittered, 0, 15000, 5000).filter(row => row.time <= 10100).map(row => row.cpu), [10, 20])
const outage = [{ time: 4900, cpu: 10 }, { time: 30100, cpu: 20 }]
assert.ok(intervalSummary(outage, 0, 35000, 5000).some(row => row.time > 4900 && row.time < 30100 && row.cpu === null))
const failed = [...jittered, { time: 7500, cpu: null }]
assert.ok(intervalSummary(failed, 0, 15000, 5000).some(row => row.time === 5000 && row.cpu === null))
const unavailable = [{ time: 4900, cpu: 10, memory: 100 }, { time: 10100, cpu: null, memory: 110 }]
assert.equal(intervalSummary(unavailable, 0, 15000, 5000).find(row => row.time === 10100).cpu, null)
