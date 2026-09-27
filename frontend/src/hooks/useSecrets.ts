/**
 * BL-INF-02 — useSecrets
 *   GET    /api/v1/projects/{id}/secrets
 *   POST   /api/v1/projects/{id}/secrets
 *   DELETE /api/v1/projects/{id}/secrets/{key}
 * Raw values are only ever sent, never received — the API returns masked values.
 * DEMO_MODE keeps an in-memory vault per project so the modal is fully interactive offline.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { isDemoMode, sleep } from '../config'
import { apiRequest, isAbortError, toMessage } from '../lib/apiClient'

export type SecretScope = 'ALL' | 'FRONTEND' | 'BACKEND'

export type SecretRecord = {
  project_id: string
  key: string
  scope: SecretScope | string
  masked_value: string
  status: string
}

export const SECRET_KEY_PATTERN = /^[A-Z_][A-Z0-9_]*$/

export function maskValue(value: string) {
  const dash = value.indexOf('-')
  const prefix = dash > 0 && dash <= 6 ? value.slice(0, dash + 1) : ''
  return `${prefix}****`
}

const demoVaults = new Map<string, SecretRecord[]>()
function demoVault(projectId: string) {
  if (!demoVaults.has(projectId)) {
    demoVaults.set(projectId, [
      { project_id: projectId, key: 'OPENAI_API_KEY', scope: 'BACKEND', masked_value: 'sk-****', status: 'STORED' },
      { project_id: projectId, key: 'STRIPE_KEY', scope: 'FRONTEND', masked_value: 'pk-****', status: 'STORED' },
      { project_id: projectId, key: 'IBM_DB_PASSWORD', scope: 'ALL', masked_value: '****', status: 'STORED' },
    ])
  }
  return demoVaults.get(projectId)!
}

const sortByKey = (rows: SecretRecord[]) => [...rows].sort((a, b) => a.key.localeCompare(b.key))

export function useSecrets(projectId: string, enabled: boolean) {
  const [secrets, setSecrets] = useState<SecretRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)
  const base = `/api/v1/projects/${encodeURIComponent(projectId)}/secrets`
  const mounted = useRef(true)
  useEffect(() => {
    mounted.current = true
    return () => { mounted.current = false }
  }, [])

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    setLoading(true)
    setLoadError(null)
    const load = async () => {
      if (isDemoMode) {
        await sleep(350, controller.signal)
        return demoVault(projectId)
      }
      return apiRequest<SecretRecord[]>(base, { signal: controller.signal })
    }
    load()
      .then(rows => setSecrets(sortByKey(rows)))
      .catch(error => { if (!isAbortError(error)) setLoadError(toMessage(error, 'Could not load secrets.')) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [enabled, projectId, base, reloadToken])

  const save = useCallback(async (key: string, value: string, scope: SecretScope) => {
    let record: SecretRecord
    if (isDemoMode) {
      await sleep(450)
      record = { project_id: projectId, key, scope, masked_value: maskValue(value), status: 'STORED' }
      const vault = demoVault(projectId).filter(row => row.key !== key)
      demoVaults.set(projectId, [...vault, record])
    } else {
      record = await apiRequest<SecretRecord>(base, { method: 'POST', body: { key, value, scope } })
    }
    if (mounted.current) setSecrets(rows => sortByKey([...rows.filter(row => row.key !== key), record]))
    return record
  }, [base, projectId])

  const remove = useCallback(async (key: string) => {
    if (isDemoMode) {
      await sleep(300)
      demoVaults.set(projectId, demoVault(projectId).filter(row => row.key !== key))
    } else {
      await apiRequest(`${base}/${encodeURIComponent(key)}`, { method: 'DELETE' })
    }
    if (mounted.current) setSecrets(rows => rows.filter(row => row.key !== key))
  }, [base, projectId])

  const reload = useCallback(() => setReloadToken(value => value + 1), [])

  return { secrets, loading, loadError, save, remove, reload }
}
