/**
 * FlashMVP — Auth Context
 *
 * Provides the whole app with:
 *   user        — the logged-in Supabase user (null if not logged in)
 *   role        — 'admin' | 'user' | null  (read from flashmvp.profiles)
 *   loading     — true while the initial session is being restored
 *   signIn(email, password)  — sign in with email + password
 *   signUp(email, password)  — create a new account
 *   signInWithGithub()       — sign in via GitHub OAuth provider
 *   signOut()                — log out and clear session
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
  email: 'user@flashmvp.demo',
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
  signInWithGithub: () => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext<AuthContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user:    DEMO_MODE ? DEMO_USER : null,
    role:    DEMO_MODE ? 'user'   : null,
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
        setState({ user: DEMO_USER, role: 'user', loading: false })
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
        setState({ user: DEMO_USER, role: 'user', loading: false })
        return { error: null }
      }
      if (!supabase) return { error: 'Supabase not configured.' }

      const { error } = await supabase.auth.signUp({ email, password })
      if (error) return { error: error.message }
      return { error: null }
    },
    []
  )

  // ── signInWithGithub ──────────────────────────────────────────────────────
  const signInWithGithub = useCallback(async (): Promise<{ error: string | null }> => {
    if (DEMO_MODE) {
      const githubDemoUser = {
        id: 'demo-github-user-id',
        email: 'developer@github.com',
        user_metadata: { full_name: 'GitHub Developer', user_name: 'github_dev' }
      } as unknown as User
      setState({ user: githubDemoUser, role: 'user', loading: false })
      return { error: null }
    }
    if (!supabase) return { error: 'Supabase not configured.' }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    })
    if (error) return { error: error.message }
    return { error: null }
  }, [])

  // ── signOut ───────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    if (!DEMO_MODE) await supabase?.auth.signOut()
    setState({ user: null, role: null, loading: false })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, signInWithGithub, signOut }}>
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
