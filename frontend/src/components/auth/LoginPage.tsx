/**
 * FlashMVP — Login Page
 *
 * Single page that handles Sign In, Sign Up, and GitHub OAuth login.
 * Uses Supabase Auth through the AuthContext.
 * Matches the existing dark glassmorphism design system.
 */
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

type Mode = 'signin' | 'signup'

function GithubIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

export default function LoginPage() {
  const { signIn, signUp, signInWithGithub } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode]         = useState<Mode>('signin')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [error, setError]       = useState<string | null>(null)
  const [info, setInfo]         = useState<string | null>(null)
  const [busy, setBusy]         = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)

    if (mode === 'signup' && password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setBusy(true)
    try {
      if (mode === 'signin') {
        const { error: err } = await signIn(email, password)
        if (err) { setError(err); return }
        navigate('/dashboard')
      } else {
        const { error: err } = await signUp(email, password)
        if (err) { setError(err); return }
        setInfo('Account created! Check your email to confirm, then sign in.')
        setMode('signin')
      }
    } finally {
      setBusy(false)
    }
  }

  const handleGithubLogin = async () => {
    setError(null)
    setInfo(null)
    setBusy(true)
    try {
      const { error: err } = await signInWithGithub()
      if (err) {
        setError(err)
        return
      }
      navigate('/dashboard')
    } catch {
      setError('Failed to connect to GitHub OAuth.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 400,
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: 16,
        padding: '36px 32px',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}>

        {/* Logo + title */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/assets/logo.webp" alt="FlashMVP" width={52} height={52}
            style={{ marginBottom: 14 }} />
          <div style={{ fontWeight: 700, fontSize: 18, color: '#fff', letterSpacing: '-0.3px' }}>
            FlashMVP
          </div>
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
            IBM Bob 2.0 Middleware Platform
          </div>
        </div>

        {/* Mode toggle */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 10,
          padding: 3,
          marginBottom: 24,
          gap: 3,
        }}>
          {(['signin', 'signup'] as Mode[]).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(null); setInfo(null) }}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 8,
                border: 'none',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
                transition: 'all 0.15s',
                background: mode === m ? 'var(--ibm-blue)' : 'transparent',
                color: mode === m ? '#fff' : 'var(--muted)',
              }}
            >
              {m === 'signin' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              required
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={inputStyle}
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label style={labelStyle}>Confirm Password</label>
              <input
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                style={inputStyle}
              />
            </div>
          )}

          {/* Error / info messages */}
          {error && (
            <div style={{
              fontSize: 12, color: 'var(--red-fail)',
              background: 'rgba(218,30,40,0.12)',
              border: '1px solid rgba(218,30,40,0.3)',
              borderRadius: 8, padding: '8px 12px',
            }}>
              {error}
            </div>
          )}
          {info && (
            <div style={{
              fontSize: 12, color: 'var(--green-pass)',
              background: 'rgba(36,161,72,0.12)',
              border: '1px solid rgba(36,161,72,0.3)',
              borderRadius: 8, padding: '8px 12px',
            }}>
              {info}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            style={{
              marginTop: 4,
              padding: '12px 0',
              borderRadius: 10,
              border: 'none',
              background: busy ? 'rgba(15,98,254,0.4)' : 'var(--ibm-blue)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
              cursor: busy ? 'not-allowed' : 'pointer',
              transition: 'background 0.15s',
              letterSpacing: '0.2px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            {busy ? (
              mode === 'signin' ? 'Signing in…' : 'Creating account…'
            ) : mode === 'signin' ? (
              <><LogIn size={16} /> Sign In</>
            ) : (
              <><UserPlus size={16} /> Create Account</>
            )}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          margin: '20px 0 16px 0',
          gap: 12
        }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.12)' }} />
          <span style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            or continue with
          </span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.12)' }} />
        </div>

        {/* GitHub OAuth Login Button */}
        <button
          type="button"
          onClick={handleGithubLogin}
          disabled={busy}
          style={{
            width: '100%',
            padding: '11px 0',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.18)',
            background: 'rgba(255,255,255,0.07)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 13,
            cursor: busy ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            transition: 'all 0.15s ease'
          }}
        >
          <GithubIcon size={18} />
          <span>Connect with GitHub</span>
        </button>

        {/* Demo mode hint */}
        {import.meta.env.VITE_DEMO_MODE === 'true' && (
          <div style={{
            marginTop: 20, padding: '10px 14px',
            background: 'rgba(15,98,254,0.08)',
            border: '1px solid rgba(15,98,254,0.25)',
            borderRadius: 8, fontSize: 11, color: 'rgba(255,255,255,0.5)',
            textAlign: 'center', lineHeight: 1.6,
          }}>
            <strong style={{ color: 'rgba(15,98,254,0.9)' }}>DEMO MODE ACTIVE</strong>
            {' '}— Sign in with email or click <strong>Connect with GitHub</strong> to access the workspace.
          </div>
        )}
      </div>
    </div>
  )
}

// ── Shared input styles ───────────────────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: 'rgba(255,255,255,0.55)',
  marginBottom: 6,
  letterSpacing: '0.3px',
  textTransform: 'uppercase',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 8,
  border: '1px solid var(--glass-border)',
  background: 'rgba(255,255,255,0.06)',
  color: '#fff',
  fontSize: 14,
  outline: 'none',
  boxSizing: 'border-box',
}
