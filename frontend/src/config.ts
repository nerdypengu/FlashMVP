/**
 * FlashMVP — runtime configuration shared by Person 1 modules
 * (SDD reviewer, starter templates, secrets vault).
 *
 * VITE_DEMO_MODE=true  → every call is served from local mocks with simulated
 *                        latency so the 24/7 Vercel demo never needs a backend.
 */
export const isDemoMode = import.meta.env.VITE_DEMO_MODE === 'true'

export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8001').replace(/\/$/, '')

/** Simulated latency (ms) used for demo-mode transitions. BL-SDD-03 asks for 1.5s. */
export const DEMO_DELAY_MS = 1500

/** Fallback project used when no project is selected (matches the rest of the app's demo data). */
export const DEFAULT_PROJECT_ID = 'proj_8f92a'

export const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    }, { once: true })
  })
