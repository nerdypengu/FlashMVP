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
