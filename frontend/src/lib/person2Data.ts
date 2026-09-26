import { supabase } from './supabaseClient'
import type { Run } from '../components/qa/RunHistoryTable'

export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'
export type Project = { id: string; project_id: string; app_name: string; db_schema: string | null }
export type ServiceRecord = { service_type: string; container_id: string | null; url: string | null; port: number | null }

export function database() {
  if (!supabase) throw new Error('Supabase is not configured. Check the frontend environment settings.')
  return supabase
}

export async function loadProjects(): Promise<Project[]> {
  const { data, error } = await database().from('projects').select('id,project_id,app_name,db_schema').order('created_at')
  if (error) throw error
  return data ?? []
}

export async function loadRuns(projectId: string): Promise<Run[]> {
  const { data, error } = await database().from('run_history')
    .select('id,run_number,branch,status,duration_ms,triggered_at,qa_steps')
    .eq('project_id', projectId).order('triggered_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map(row => ({
    run_number: row.run_number, branch: row.branch ?? '—', status: row.status,
    duration_seconds: (row.duration_ms ?? 0) / 1000, timestamp: row.triggered_at,
    step_results: (Array.isArray(row.qa_steps) ? row.qa_steps : []).map((step, index) => ({
      id: step.id ?? `${row.id}-${index}`, name: step.step_name ?? step.name ?? 'Unnamed step',
      status: step.status, duration: `${(step.duration_ms ?? 0) / 1000}s`,
      log_output: step.log_output ?? '',
    })),
  }))
}

export async function loadServices(projectId: string): Promise<ServiceRecord[]> {
  const { data, error } = await database().from('project_services')
    .select('service_type,container_id,url,port').eq('project_id', projectId)
  if (error) throw error
  return data ?? []
}

export function errorMessage(error: unknown) {
  return error && typeof error === 'object' && 'message' in error ? String(error.message) : 'Could not load data.'
}
