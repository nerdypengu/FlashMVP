import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getStageStatus, moveStep, orderStepsByStage, runDemoSteps } from './runDemoSteps.js'

const steps = [
  { id: 'lint', name: 'Lint', enabled: true, durationMs: 800 },
  { id: 'test', name: 'Test', enabled: true, durationMs: 1200 },
  { id: 'scan', name: 'Scan', enabled: true, durationMs: 600 },
]

test('jobs in the same stage stack together and run before the next stage', () => {
  const jobs = [
    { id: 'lint', stage: 'Lint' },
    { id: 'scan', stage: 'Security' },
    { id: 'unit', stage: 'Test' },
    { id: 'e2e', stage: 'Test' },
  ]
  assert.deepEqual(orderStepsByStage(jobs, ['Lint', 'Test', 'Security']).map(job => job.id), ['lint', 'unit', 'e2e', 'scan'])
  const moved = moveStep(jobs, 'scan', 'Test', 'e2e')
  assert.deepEqual(orderStepsByStage(moved, ['Lint', 'Test']).map(job => job.id), ['lint', 'unit', 'scan', 'e2e'])
  assert.deepEqual(orderStepsByStage(moveStep(moved, 'unit', 'Test', 'e2e', true), ['Test']).map(job => job.id), ['scan', 'e2e', 'unit'])
  assert.deepEqual(orderStepsByStage(moveStep(moved, 'lint', 'Test'), ['Test']).map(job => job.id), ['unit', 'scan', 'e2e', 'lint'])
})

test('stage indicators reflect their jobs', () => {
  const passed = { enabled: true, status: 'PASSED' }
  const skipped = { enabled: false, status: 'SKIPPED' }
  assert.equal(getStageStatus([]), 'pending')
  assert.equal(getStageStatus([{ enabled: true, status: 'PENDING' }]), 'pending')
  assert.equal(getStageStatus([passed, { enabled: true, status: 'RUNNING' }]), 'running')
  assert.equal(getStageStatus([passed, skipped]), 'passed')
  assert.equal(getStageStatus([passed, { enabled: true, status: 'FAILED' }]), 'failed')
  assert.equal(getStageStatus([skipped]), 'skipped')
})

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
