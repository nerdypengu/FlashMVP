/**
 * FlashMVP — Route Guard
 *
 * Wraps protected routes. If the user is not logged in, redirects to /login.
 * While the session is being restored (loading=true), shows a spinner so
 * the user doesn't see a flash of the login screen on page refresh.
 */
import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

interface RequireAuthProps {
  children: ReactNode
}

export default function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading } = useAuth()

  // Still restoring the session from localStorage — don't redirect yet
  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', color: 'rgba(255,255,255,0.35)', fontSize: 13,
        gap: 10,
      }}>
        <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⚡</span>
        Restoring session…
      </div>
    )
  }

  // Not logged in — send to home page
  if (!user) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
