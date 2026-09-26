/**
 * FlashMVP — Supabase browser client
 * Uses the ANON KEY only — safe to bundle into the browser.
 * In DEMO_MODE (VITE_DEMO_MODE=true) returns a null client so the rest of the
 * app falls back to mock data without throwing on missing env vars.
 */
import { createClient } from '@supabase/supabase-js'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'
const SUPABASE_URL      = import.meta.env.VITE_SUPABASE_URL      ?? ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const supabase =
  DEMO_MODE || !SUPABASE_URL || !SUPABASE_ANON_KEY
    ? null
    : createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { db: { schema: 'flashmvp' } })
