/**
 * BL-ARC-01 — IBM-ready starter templates.
 * Mirrors backend/templates/<id>/flashmvp.json so the selector shows exactly
 * what IBM Bob's manifest parser will receive.
 */
export type IBMBindingName = 'IBM Code Engine' | 'IBM Cloud DB' | 'IBM Secrets Manager' | 'Watsonx QA'

export type TemplateService = { name: string; runtime: string; port: number }

export type StarterTemplate = {
  id: string
  name: string
  /** Kept as a short string for legacy consumers (ProjectsDashboard). */
  icon: string
  badge?: string
  tagline: string
  description: string
  stack: string[]
  services: TemplateService[]
  qaPipeline: string[]
  ibm_bindings: IBMBindingName[]
  /** Legacy alias for ibm_bindings. */
  ibmBindings: IBMBindingName[]
  accent: string
  estimatedDeploy: string
}

const ALL_BINDINGS: IBMBindingName[] = ['IBM Code Engine', 'IBM Cloud DB', 'IBM Secrets Manager', 'Watsonx QA']

export const templates: StarterTemplate[] = [
  {
    id: 'react-fastapi',
    name: 'React + FastAPI',
    icon: 'Atom',
    badge: 'Most popular',
    tagline: 'Full-stack web app with a Python backend',
    description: 'Vite + React SPA talking to an async FastAPI service. Ideal for dashboards, internal tools and AI-backed APIs.',
    stack: ['React 19', 'Vite', 'FastAPI', 'Python 3.11', 'PostgreSQL'],
    services: [
      { name: 'frontend', runtime: 'Node / Vite', port: 3000 },
      { name: 'backend', runtime: 'Python / Uvicorn', port: 8000 },
    ],
    qaPipeline: ['ESLint', 'Pytest', 'Watsonx Security Scan'],
    ibm_bindings: ALL_BINDINGS,
    ibmBindings: ALL_BINDINGS,
    accent: '#0F62FE',
    estimatedDeploy: '~90s',
  },
  {
    id: 'nextjs-go',
    name: 'Next.js + Go',
    icon: 'Hexagon',
    badge: 'High performance',
    tagline: 'SSR frontend with a high-performance Go API',
    description: 'Server-rendered Next.js front door backed by a compiled Go HTTP service. Built for SEO-heavy and high-throughput products.',
    stack: ['Next.js', 'React', 'Go 1.22', 'net/http', 'PostgreSQL'],
    services: [
      { name: 'frontend', runtime: 'Node / Next.js', port: 3000 },
      { name: 'backend', runtime: 'Go binary', port: 8080 },
    ],
    qaPipeline: ['ESLint', 'Go Test', 'Watsonx Security Scan'],
    ibm_bindings: ALL_BINDINGS,
    ibmBindings: ALL_BINDINGS,
    accent: '#8A3FFC',
    estimatedDeploy: '~75s',
  },
]

export const findTemplate = (id: string | undefined | null) =>
  templates.find(template => template.id === id) ?? templates[0]

export const QUICK_PROMPTS = [
  'E-commerce store with Stripe checkout and order history',
  'Internal helpdesk with ticket triage and SLA tracking',
  'SaaS analytics dashboard with team workspaces',
  'Booking app for clinics with reminders and calendar sync',
]

export const MIN_PROMPT_LENGTH = 12
export const MAX_PROMPT_LENGTH = 1200
