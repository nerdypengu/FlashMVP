/** @template {{ stage: string }} T @param {T[]} steps @param {readonly string[]} stages @returns {T[]} */
export const orderStepsByStage = (steps, stages) => stages.flatMap(stage => steps.filter(step => step.stage === stage))

/** @param {{ enabled: boolean, status: string }[]} steps */
export function getStageStatus(steps) {
  const enabled = steps.filter(step => step.enabled)
  if (steps.some(step => step.status === 'FAILED')) return 'failed'
  if (steps.some(step => step.status === 'RUNNING')) return 'running'
  if (enabled.length && enabled.every(step => step.status === 'PASSED')) return 'passed'
  if (steps.length && steps.every(step => step.status === 'SKIPPED')) return 'skipped'
  return 'pending'
}

/** @template {{ id: string, stage: string }} T @param {T[]} steps @param {string} id @param {string} stage @param {string | null} [nearId] @param {boolean} [after] @returns {T[]} */
export function moveStep(steps, id, stage, nearId = null, after = false) {
  const source = steps.find(step => step.id === id)
  if (!source || id === nearId) return steps
  const remaining = steps.filter(step => step.id !== id)
  const targetIndex = nearId === null ? -1 : remaining.findIndex(step => step.id === nearId && step.stage === stage)
  if (nearId !== null && targetIndex === -1) return steps
  const lastInStage = remaining.reduce((last, step, index) => step.stage === stage ? index + 1 : last, remaining.length)
  const index = nearId === null ? lastInStage : targetIndex + Number(after)
  return [...remaining.slice(0, index), { ...source, stage }, ...remaining.slice(index)]
}

/** @param {string | null} failStepId */
export async function runDemoSteps(steps, onStatus, failStepId = null, wait = ms => new Promise(resolve => setTimeout(resolve, ms))) {
  if (!steps.some(step => step.enabled)) throw new Error('Enable at least one QA step')

  let failed = false
  let durationMs = 0
  const step_results = []

  for (const step of steps) {
    if (!step.enabled || failed) {
      onStatus(step.id, 'SKIPPED')
      step_results.push({ id: step.id, name: step.name, status: 'SKIPPED', duration: '—' })
      continue
    }

    onStatus(step.id, 'RUNNING')
    // Demo-only: a custom timeout must not make the preview wait 30 seconds.
    const elapsed = Math.min(step.durationMs, 1500)
    await wait(elapsed)
    durationMs += elapsed
    const status = step.id === failStepId ? 'FAILED' : 'PASSED'
    onStatus(step.id, status, elapsed)
    step_results.push({ id: step.id, name: step.name, status, duration: `${(elapsed / 1000).toFixed(1)}s` })
    if (status === 'FAILED') failed = true
  }

  return { status: failed ? 'FAILED' : 'PASSED', durationMs, step_results }
}
