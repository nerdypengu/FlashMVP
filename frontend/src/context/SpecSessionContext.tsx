/**
 * SpecSessionContext — single source of truth for the SDD human-in-the-loop gate.
 *
 * Holds the selected template + prompt, the current IBM Bob spec, revision
 * history and the last sync time. Persisted to localStorage so review progress
 * and sync state survive reloads (BL-SDD-03). Specs stay editable after a sync.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, type ReactNode } from 'react'
import { DEFAULT_PROJECT_ID } from '../config'
import type { RevisionEntry, SpecResponse, SpecSession } from '../types/spec'

const STORAGE_KEY = 'flashmvp.sdd.session.v1'

type Action =
  | { type: 'start'; templateId: string; prompt: string; projectId?: string }
  | { type: 'setSpec'; spec: SpecResponse }
  | { type: 'addRevision'; entry: RevisionEntry }
  | { type: 'toggleReviewed'; taskId: string }
  | { type: 'setAllReviewed'; reviewed: boolean }
  | { type: 'approve'; at: string }
  | { type: 'reset' }

function reducer(state: SpecSession | null, action: Action): SpecSession | null {
  switch (action.type) {
    case 'start':
      return {
        templateId: action.templateId,
        prompt: action.prompt,
        projectId: action.projectId ?? state?.projectId ?? DEFAULT_PROJECT_ID,
        spec: null,
        revisions: [],
        reviewedTaskIds: [],
        approvedAt: null,
      }
    case 'reset':
      return null
  }
  if (!state) return state
  switch (action.type) {
    case 'setSpec': {
      const ids = new Set(action.spec.tasks.map(task => task.id))
      return { ...state, spec: action.spec, reviewedTaskIds: state.reviewedTaskIds.filter(id => ids.has(id)) }
    }
    case 'addRevision':
      return { ...state, revisions: [action.entry, ...state.revisions] }
    case 'toggleReviewed': {
      const has = state.reviewedTaskIds.includes(action.taskId)
      return {
        ...state,
        reviewedTaskIds: has
          ? state.reviewedTaskIds.filter(id => id !== action.taskId)
          : [...state.reviewedTaskIds, action.taskId],
      }
    }
    case 'setAllReviewed':
      if (!state.spec) return state
      return { ...state, reviewedTaskIds: action.reviewed ? state.spec.tasks.map(task => task.id) : [] }
    case 'approve':
      return {
        ...state,
        approvedAt: action.at,
        spec: state.spec ? { ...state.spec, status: 'APPROVED' } : state.spec,
        reviewedTaskIds: state.spec ? state.spec.tasks.map(task => task.id) : state.reviewedTaskIds,
      }
  }
  return state
}

function isSession(value: unknown): value is SpecSession {
  return !!value && typeof value === 'object' && 'templateId' in value && 'prompt' in value && 'revisions' in value
}

function load(): SpecSession | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isSession(parsed) ? parsed : null
  } catch {
    return null
  }
}

type SpecSessionContextValue = {
  session: SpecSession | null
  isLocked: boolean
  startSession: (templateId: string, prompt: string, projectId?: string) => void
  setSpec: (spec: SpecResponse) => void
  addRevision: (entry: RevisionEntry) => void
  toggleReviewed: (taskId: string) => void
  setAllReviewed: (reviewed: boolean) => void
  markApproved: () => void
  resetSession: () => void
}

const SpecSessionContext = createContext<SpecSessionContextValue | null>(null)

export function SpecSessionProvider({ children }: { children: ReactNode }) {
  const [session, dispatch] = useReducer(reducer, null, load)

  useEffect(() => {
    try {
      if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
      else localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* storage unavailable (private mode) — session stays in memory */
    }
  }, [session])

  const startSession = useCallback((templateId: string, prompt: string, projectId?: string) =>
    dispatch({ type: 'start', templateId, prompt, projectId }), [])
  const setSpec = useCallback((spec: SpecResponse) => dispatch({ type: 'setSpec', spec }), [])
  const addRevision = useCallback((entry: RevisionEntry) => dispatch({ type: 'addRevision', entry }), [])
  const toggleReviewed = useCallback((taskId: string) => dispatch({ type: 'toggleReviewed', taskId }), [])
  const setAllReviewed = useCallback((reviewed: boolean) => dispatch({ type: 'setAllReviewed', reviewed }), [])
  const markApproved = useCallback(() => dispatch({ type: 'approve', at: new Date().toISOString() }), [])
  const resetSession = useCallback(() => dispatch({ type: 'reset' }), [])

  const value = useMemo<SpecSessionContextValue>(() => ({
    session,
    isLocked: !!session?.approvedAt,
    startSession, setSpec, addRevision, toggleReviewed, setAllReviewed, markApproved, resetSession,
  }), [session, startSession, setSpec, addRevision, toggleReviewed, setAllReviewed, markApproved, resetSession])

  return <SpecSessionContext.Provider value={value}>{children}</SpecSessionContext.Provider>
}

export function useSpecSession() {
  const context = useContext(SpecSessionContext)
  if (!context) throw new Error('useSpecSession must be used inside <SpecSessionProvider>.')
  return context
}
