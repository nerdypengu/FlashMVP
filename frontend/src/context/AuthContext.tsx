/**
 * FlashMVP — Auth Context
 *
 * Provides the whole app with:
 *   user        — the logged-in Supabase user (null if not logged in)
 *   role        — 'admin' | 'user' | null  (read from flashmvp.profiles)
 *   loading     — true while the initial session is being restored
 *   signIn(email, password)  — sign in with email + password
 *   signUp(email, password)  — create a new account
 *   signOut()                — log out and clear session
 *
 * In DEMO_MODE (VITE_DEMO_MODE=true):
 *   - No real Supabase calls are made.
 *   - signIn() immediately resolves with a mock admin user.
 *   - The rest of the app sees a logged-in admin without needing real credentials.
 */
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabaseClient'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

// ── Mock demo user ────────────────────────────────────────────────────────────
const DEMO_USER = {
  id:    'demo-user-id',
  email: 'admin@flashmvp.demo',
} as unknown as User

// ── Types ─────────────────────────────────────────────────────────────────────
export type UserRole = 'admin' | 'user'

interface AuthState {
  user:    User | null
  role:    UserRole | null
  loading: boolean
}

interface AuthContextValue extends AuthState {
  signIn:  (email: string, password: string) => Promise<{ error: string | null }>
  signUp:  (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user:    DEMO_MODE ? DEMO_USER : null,
    role:    DEMO_MODE ? 'admin'   : null,
    loading: !DEMO_MODE,   // demo mode needs no async restore
  })

  // ── Fetch role from flashmvp.profiles after login ─────────────────────────
  const fetchRole = useCallback(async (userId: string): Promise<UserRole> => {
    if (!supabase) return 'user'
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single()
      return (data?.role as UserRole) ?? 'user'
    } catch {
      return 'user'
    }
  }, [])

  // ── Restore session on mount ───────────────────────────────────────────────
  useEffect(() => {
    if (DEMO_MODE) return   // demo mode: skip session restore
    if (!supabase) { setState({ user: null, role: null, loading: false }); return }

    supabase?.auth.getSession().then(async ({ data }) => {
      const user = data.session?.user ?? null
      const role = user ? await fetchRole(user.id) : null
      setState({ user, role, loading: false })
    })

    // Listen for sign-in / sign-out / token refresh events
    const { data: listener } = supabase?.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user ?? null
        setState({ user, role: null, loading: !!user })
        // Return immediately: awaiting a Supabase query inside this callback
        // holds the Auth lock and can deadlock the profile request.
        if (user) void fetchRole(user.id).then(role => setState(previous =>
          previous.user?.id === user.id ? { user, role, loading: false } : previous))
      }
    ) ?? { data: null }

    return () => { listener?.subscription.unsubscribe() }
  }, [fetchRole])

  // ── signIn ────────────────────────────────────────────────────────────────
  const signIn = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      if (DEMO_MODE) {
        setState({ user: DEMO_USER, role: 'admin', loading: false })
        return { error: null }
      }
      if (!supabase) return { error: 'Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' }

      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: error.message }
      return { error: null }
    },
    []
  )

  // ── signUp ────────────────────────────────────────────────────────────────
  const signUp = useCallback(
    async (email: string, password: string): Promise<{ error: string | null }> => {
      if (DEMO_MODE) {
        setState({ user: DEMO_USER, role: 'admin', loading: false })
        return { error: null }
      }
      if (!supabase) return { error: 'Supabase not configured.' }

      const { error } = await supabase.auth.signUp({ email, password })
      if (error) return { error: error.message }
      // Profile row is auto-created by the DB trigger (handle_new_user).
      return { error: null }
    },
    []
  )

  // ── signOut ───────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    if (!DEMO_MODE) await supabase?.auth.signOut()
    setState({ user: null, role: null, loading: false })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
