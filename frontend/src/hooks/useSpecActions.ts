/**
 * BL-SDD-03 — useSpecActions
 * Wraps the IBM Bob SDD endpoints:
 *   POST /api/v1/specs/generate
 *   POST /api/v1/specs/revise
 *   POST /api/v1/specs/approve
 * In DEMO_MODE every action resolves locally after a 1.5s simulated delay.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { DEMO_DELAY_MS, isDemoMode, sleep } from '../config'
import { apiRequest, isAbortError, toMessage } from '../lib/apiClient'
import { demoGenerate, demoRevise } from '../lib/specDemo'
import { useSpecSession } from '../context/SpecSessionContext'
import type { ApproveResponse, SpecResponse, SpecSection } from '../types/spec'

export type SpecAction = 'generate' | 'revise' | 'approve'

export function useSpecActions() {
  const { session, setSpec, addRevision, markApproved } = useSpecSession()
  const [pending, setPending] = useState<SpecAction | null>(null)
  const [error, setError] = useState<{ action: SpecAction; message: string } | null>(null)
  const controllerRef = useRef<AbortController | null>(null)
  const sessionRef = useRef(session)
  sessionRef.current = session

  useEffect(() => () => controllerRef.current?.abort(), [])

  const run = useCallback(async <T,>(action: SpecAction, task: (signal: AbortSignal) => Promise<T>): Promise<T | null> => {
    controllerRef.current?.abort()
    const controller = new AbortController()
    controllerRef.current = controller
    setPending(action)
    setError(null)
    try {
      return await task(controller.signal)
    } catch (err) {
      if (!isAbortError(err)) setError({ action, message: toMessage(err, `Could not ${action} the spec.`) })
      return null
    } finally {
      if (controllerRef.current === controller) {
        controllerRef.current = null
        setPending(null)
      }
    }
  }, [])

  const generate = useCallback(() => run('generate', async signal => {
    const current = sessionRef.current
    if (!current) throw new Error('Pick a starter template first.')
    let spec: SpecResponse
    if (isDemoMode) {
      await sleep(DEMO_DELAY_MS * 1.6, signal)
      spec = demoGenerate(current.prompt, current.templateId)
    } else {
      spec = await apiRequest<SpecResponse>('/api/v1/specs/generate', {
        method: 'POST', signal, body: { prompt: current.prompt, template: current.templateId },
      })
    }
    setSpec(spec)
    return spec
  }), [run, setSpec])

  const revise = useCallback((feedback: string, sections: SpecSection[] = ['all']) => run('revise', async signal => {
    const current = sessionRef.current
    if (!current?.spec) throw new Error('There is no spec to revise yet.')
    const trimmed = feedback.trim()
    if (!trimmed) throw new Error('Describe what IBM Bob should change.')
    let spec: SpecResponse
    if (isDemoMode) {
      await sleep(DEMO_DELAY_MS, signal)
      spec = demoRevise(current.spec, trimmed, sections, current.revisions.length + 1)
    } else {
      spec = await apiRequest<SpecResponse>('/api/v1/specs/revise', {
        method: 'POST', signal, body: { feature_id: current.spec.feature_id, feedback: trimmed, sections },
      })
    }
    setSpec(spec)
    addRevision({ id: `rev_${Date.now().toString(36)}`, feedback: trimmed, sections, at: new Date().toISOString() })
    return spec
  }), [run, setSpec, addRevision])


  const approve = useCallback(() => run('approve', async signal => {
    const current = sessionRef.current
    if (!current?.spec) throw new Error('There is no spec to approve yet.')
    if (isDemoMode) {
      await sleep(DEMO_DELAY_MS, signal)
    } else {
      const result = await apiRequest<ApproveResponse>('/api/v1/specs/approve', {
        method: 'POST', signal, body: { feature_id: current.spec.feature_id },
      })
      if (!result.locked) throw new Error('IBM Bob did not confirm the approval lock. Try again.')
    }
    markApproved()
    return true
  }), [run, markApproved])

  const cancel = useCallback(() => controllerRef.current?.abort(), [])
  const clearError = useCallback(() => setError(null), [])

  return { generate, revise, approve, cancel, pending, error, clearError }
}
