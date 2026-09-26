import { database } from './person2Data'

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8001').replace(/\/$/, '')

export async function requireLiveBackend(signal: AbortSignal) {
  const response = await fetch(`${API_URL}/`, { signal })
  if (!response.ok) throw new Error('Backend is unavailable.')
  const body = await response.json()
  if (body.demo_mode !== false) throw new Error('The backend is running in demo mode. Live container data is unavailable.')
}

export async function backendResponse(path: string, signal: AbortSignal) {
  const { data, error } = await database().auth.getSession()
  if (error) throw error
  if (!data.session) throw new Error('Sign in to access container data.')
  const response = await fetch(`${API_URL}${path}`, {
    signal, headers: { Authorization: `Bearer ${data.session.access_token}` },
  })
  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new Error(body?.detail ?? `Backend returned HTTP ${response.status}.`)
  }
  return response
}
