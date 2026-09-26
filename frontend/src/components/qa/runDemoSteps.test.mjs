import assert from 'node:assert/strict'
import { test } from 'node:test'
import { runDemoSteps } from './runDemoSteps.js'

const steps = [
  { id: 'lint', name: 'Lint', enabled: true, durationMs: 800 },
  { id: 'test', name: 'Test', enabled: true, durationMs: 1200 },
  { id: 'scan', name: 'Scan', enabled: true, durationMs: 600 },
]

test('demo QA records passed, failed, and skipped steps without running past a failure', async () => {
  const changes = []
  const waits = []
  const update = (id, status) => changes.push(`${id}:${status}`)
  const wait = async ms => { waits.push(ms) }

  const passed = await runDemoSteps(steps, update, null, wait)
  assert.equal(passed.status, 'PASSED')
  assert.equal(passed.durationMs, 2600)
  assert.deepEqual(passed.step_results.map(s => s.status), ['PASSED', 'PASSED', 'PASSED'])

  changes.length = 0
  waits.length = 0
  const failed = await runDemoSteps(steps, update, 'test', wait)
  assert.equal(failed.status, 'FAILED')
  assert.equal(failed.durationMs, 2000)
  assert.deepEqual(failed.step_results.map(s => s.status), ['PASSED', 'FAILED', 'SKIPPED'])
  assert.deepEqual(waits, [800, 1200])
  assert.deepEqual(changes, ['lint:RUNNING', 'lint:PASSED', 'test:RUNNING', 'test:FAILED', 'scan:SKIPPED'])

  const disabled = await runDemoSteps([{ ...steps[0], enabled: false }, steps[1]], update, null, wait)
  assert.deepEqual(disabled.step_results.map(s => s.status), ['SKIPPED', 'PASSED'])
  await assert.rejects(runDemoSteps([{ ...steps[0], enabled: false }], update, null, wait), /Enable at least one/)
})
