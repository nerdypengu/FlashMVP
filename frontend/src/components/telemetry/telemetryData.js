/** Keep the full selected window, including periods before this session. */
export function telemetryWindow(points, minutes, end, width = 480, pollingMs = 5000) {
  const start = end - minutes * 60000
  const duration = end - start
  const target = Math.max(1, width / 8)
  const interval = [5000, 10000, 15000, 30000, 60000, 120000]
    .find(step => step >= Math.max(pollingMs, duration / target)) ?? 120000
  const divisions = Math.max(1, Math.min(5, Math.floor(width / 80)))
  const tickInterval = duration / divisions
  const ticks = Array.from({ length: divisions + 1 }, (_, i) => start + i * tickInterval)
  return { start, end, interval, tickInterval, ticks,
    points: points.filter(point => point.time >= start && point.time <= end) }
}

/** Fixed clock-aligned intervals with actual sample times; missing values and empty intervals stay null.
 * @returns {Array<{time: number, intervalStart: number, intervalEnd: number, recordedFrom: number | null, recordedTo: number | null, cpu: number | null, memory: number | null, health: number | null, rx: number | null, tx: number | null, maximum: Record<string, number | null>}>}
 */
export function intervalSummary(points, start, end, interval, maxGapMs = 20000) {
  const firstBucket = Math.floor(start / interval) * interval
  const count = Math.floor(end / interval) - Math.floor(start / interval) + 1
  const buckets = Array.from({ length: count }, () => [])
  for (const point of points) {
    if (point.time < start || point.time > end) continue
    const index = Math.floor((point.time - firstBucket) / interval)
    buckets[index]?.push(point)
  }
  // A sample can land across a bucket boundary after normal request latency.
  // Omit only empty buckets inside a healthy polling gap; explicit null samples remain.
  const continuous = new Set()
  const ordered = points.filter(point => point.time >= start && point.time <= end).sort((a, b) => a.time - b.time)
  for (let i = 1; i < ordered.length; i++) {
    const before = ordered[i - 1], after = ordered[i]
    if (after.time - before.time > maxGapMs) continue
    for (let index = Math.floor((before.time - firstBucket) / interval) + 1;
      index < Math.floor((after.time - firstBucket) / interval); index++) continuous.add(index)
  }
  return buckets.map((samples, index) => {
    const intervalStart = firstBucket + index * interval
    const recorded = samples.filter(sample => ['cpu', 'memory', 'health', 'rx', 'tx'].some(key => Number.isFinite(sample[key])))
    const recordedFrom = recorded.length ? Math.min(...recorded.map(sample => sample.time)) : null
    const recordedTo = recorded.length ? Math.max(...recorded.map(sample => sample.time)) : null
    const row = { time: recordedFrom ?? intervalStart, intervalStart, intervalEnd: intervalStart + interval,
      recordedFrom, recordedTo, maximum: {} }
    for (const key of ['cpu', 'memory', 'health', 'rx', 'tx']) {
      const values = samples.map(sample => sample[key]).filter(Number.isFinite)
      row[key] = values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null
      row.maximum[key] = values.length ? Math.max(...values) : null
    }
    return row
  }).filter((_, index) => buckets[index].length > 0 || !continuous.has(index))
}

/** Include seconds only when adjacent axis labels are less than a minute apart. */
export function telemetryTickLabel(timestamp, interval) {
  const date = new Date(timestamp)
  const parts = [date.getHours(), date.getMinutes()]
  if (interval < 60000) parts.push(date.getSeconds())
  return parts.map(part => String(part).padStart(2, '0')).join(':')
}

/** Allow the selected polling cadence plus room for delayed samples. */
export const telemetryStaleAfter = pollingMs => Math.max(20000, pollingMs * 2)

/** Throughput from adjacent backend samples; resets and gaps stay unknown. */
export function networkRate(previous, current, field, maxGapMs = 20000) {
  if (!previous || previous.started_at !== current.started_at) return null
  const elapsed = (Date.parse(current.sampled_at) - Date.parse(previous.sampled_at)) / 1000
  const before = previous[field], after = current[field]
  if (!Number.isFinite(elapsed) || elapsed <= 0 || elapsed * 1000 > maxGapMs || !Number.isFinite(before) || !Number.isFinite(after) || after < before) return null
  return Math.round((after - before) / elapsed / 1024 * 100) / 100
}

export function logLevel(line) {
  const message = line.replace(/^\d{4}-\d\d-\d\dT\S+\s+/, '')
  let level
  try {
    const record = JSON.parse(message)
    level = String(record.level ?? record.severity ?? '').toUpperCase()
  } catch {
    level = message.match(/^\[?(ERROR|FATAL|CRITICAL|WARNING|WARN|INFO|DEBUG|TRACE)\b/i)?.[1].toUpperCase()
  }
  if (['FATAL', 'CRITICAL'].includes(level)) return 'ERROR'
  if (level === 'WARNING') return 'WARN'
  return ['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'].includes(level) ? level : 'UNKNOWN'
}

/** Only restore supported polling choices from browser storage. */
export function telemetryPollingInterval(stored) {
  const interval = Number(stored)
  return [5000, 10000, 30000, 60000].includes(interval) ? interval : 5000
}
