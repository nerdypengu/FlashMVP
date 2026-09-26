import assert from 'node:assert/strict'
import { sseEvents } from './sseEvents.js'

const bytes = new TextEncoder().encode(': heartbeat\r\n\r\ndata: ✓ done\r\ndata: second line\r\n\r\ndata: next\n\n')
const stream = new ReadableStream({ start(controller) {
  for (const byte of bytes) controller.enqueue(Uint8Array.of(byte))
  controller.close()
} })
const events = []
for await (const event of sseEvents(stream)) events.push(event)
assert.deepEqual(events, ['✓ done\nsecond line', 'next'])
console.log('SSE fragmented stream check passed')
