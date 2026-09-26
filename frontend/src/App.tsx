import { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom'
import { Zap } from 'lucide-react'

// ── Tool components ──────────────────────────────────────────────────────────
import QACanvas from './components/qa/QACanvas'
import RunHistoryTable, { type Run } from './components/qa/RunHistoryTable'
import PlaygroundWindow from './components/playground/PlaygroundWindow'
import TelemetryCharts from './components/telemetry/TelemetryCharts'
import LogViewer from './components/playground/LogViewer'
import TemplateSelector, { TEMPLATES, type Template } from './components/shell/TemplateSelector'
import SpecReviewer, { type SpecData } from './components/sdd/SpecReviewer'
import AppCatalog from './components/portal/AppCatalog'
import ProjectsDashboard from './components/dashboard/ProjectsDashboard'
import SkillPackageInspector from './components/sdd/SkillPackageInspector'
import ProjectDetailsTelemetry from './components/dashboard/ProjectDetailsTelemetry'
import ProjectDetailsPage from './components/dashboard/ProjectDetailsPage'
import EnvironmentConfigPage from './components/config/EnvironmentConfigPage'
import LandingHomePage from './components/home/LandingHomePage'

// ── Layout / auth ────────────────────────────────────────────────────────────
import BinaryCanvasBackground from './components/ui/BinaryCanvasBackground'
import TypewriterHero from './components/ui/TypewriterHero'
import LoginPage from './components/auth/LoginPage'
import RequireAuth from './components/auth/RequireAuth'
import DashboardLayout from './components/shell/DashboardLayout'
import { useAuth } from './context/AuthContext'
import mockData from './mocks/qa_mock.json'

// ── Default spec stub ────────────────────────────────────────────────────────
const DEFAULT_SPEC: SpecData = {
  projectId: 'proj_8f92a',
  template: TEMPLATES[0],
  prompt: 'E-commerce store with Supabase auth & Stripe checkout',
  status: 'DRAFT',
  requirements: `# FlashStore — E-Commerce Specification (PRD)\n\n## 1. Overview\nHigh-concurrency autonomous e-commerce engine.\n\n## 2. User Stories\n- US-01: Buyer browses and checks out via Stripe.\n- US-02: Admin inspects inventory and analytics.\n- US-03: Developer verifies container health and DB latency.\n\n## 3. Non-Functional Requirements\n- Supabase schema migration: < 200ms\n- Container boot: < 4.5s\n- Cloudflare SSL tunnel: zero manual DNS`,
  architecture: `CREATE SCHEMA IF NOT EXISTS app_8f92a;\n\nCREATE TABLE app_8f92a.products (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  name VARCHAR(255) NOT NULL,\n  price_cents INTEGER NOT NULL,\n  stock_count INTEGER NOT NULL DEFAULT 0,\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);`,
  ibmBindings: [
    { tool: 'IBM Code Engine',         purpose: 'Serverless container fleet execution',                status: 'Ready' },
    { tool: 'IBM Cloud DB',            purpose: 'Isolated multi-tenant PostgreSQL schema',            status: 'Ready' },
    { tool: 'Cloudflare Quick Tunnel', purpose: 'Public HTTPS SSL egress URL',                        status: 'Ready' },
    { tool: 'watsonx QA Inspector',    purpose: 'Autonomous ESLint, Pytest, and Secret leak auditing', status: 'Ready' },
  ],
  tasks: [
    { id: 'TSK-01', title: 'Provision isolated PostgreSQL schema in IBM Cloud DB', subagent: 'Subagent Alpha (DB)',       estimate: '180ms' },
    { id: 'TSK-02', title: 'Synthesize FastAPI router & Pydantic models',          subagent: 'Subagent Gamma (FastAPI)', estimate: '1.2s'  },
    { id: 'TSK-03', title: 'Execute watsonx security & unit test audit',            subagent: 'Subagent Beta (QA)',       estimate: '2.6s'  },
    { id: 'TSK-04', title: 'Launch dual container fleet & Cloudflare tunnel',       subagent: 'Subagent Delta (Tunnel)', estimate: '3.1s'  },
  ],
}

// ── Public top-bar tabs (only shown on the public shell) ─────────────────────
const PUBLIC_TABS = [
  { path: '/', label: 'Home' },
]

export default function App() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user }  = useAuth()

  const [runs, setRuns]               = useState<Run[]>(mockData.runs)
  const [spec, setSpec]               = useState<SpecData>(DEFAULT_SPEC)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [typingComplete, setTypingComplete] = useState(false)

  useEffect(() => { setMobileMenuOpen(false) }, [location.pathname])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setMobileMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const handleGenerateSpec = (template: Template, prompt: string) => {
    setSpec(prev => ({ ...prev, template, prompt, status: 'DRAFT' }))
    navigate('/specs')
  }
  const handleApproveSpec = () => {
    setSpec(prev => ({ ...prev, status: 'APPROVED' }))
    navigate('/qa')
  }
  const handleReviseSpec = (feedback: string) => {
    setSpec(prev => ({
      ...prev,
      status: 'CHANGES_REQUESTED',
      requirements: `${prev.requirements}\n\n## Revision Request\n- ${feedback}`,
    }))
  }

  const isActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path + '/')

  const navRef = useRef<HTMLElement>(null)
  const indicatorRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const nav = navRef.current
    const indicator = indicatorRef.current
    if (!nav || !indicator) return
    const activeBtn = nav.querySelector<HTMLButtonElement>('.nav-link.active')
    if (!activeBtn) return
    const navRect = nav.getBoundingClientRect()
    const btnRect = activeBtn.getBoundingClientRect()
    indicator.style.width  = `${btnRect.width}px`
    indicator.style.transform = `translateX(${btnRect.left - navRect.left - 5}px)`
  }, [location.pathname])

  // ── Dashboard routes share the same layout ──────────────────────────────
  const dashboardElement = (child: React.ReactNode) => (
    <RequireAuth>
      <DashboardLayout>{child}</DashboardLayout>
    </RequireAuth>
  )

  return (
    <Routes>

      {/* ════════════════════════════════════════════════════════════
          PUBLIC SHELL  — top-bar nav, hero homepage, login
      ════════════════════════════════════════════════════════════ */}
      <Route path="/*" element={
        <div className="app-shell">
          <BinaryCanvasBackground />
          <div className="page">

            {/* Top-bar header — public only */}
            <header className="header">
              <button type="button" className="logo-btn" onClick={() => navigate('/')}
                title="FlashMVP — Home">
                <img src="/assets/logo.webp" alt="FlashMVP" width="52" height="52" />
              </button>

              <nav className="nav-pill" aria-label="Main Navigation" ref={navRef}>
                <div className="nav-pill-indicator" ref={indicatorRef} />
                {PUBLIC_TABS.map(tab => (
                  <button
                    key={tab.path}
                    type="button"
                    className={`nav-link ${isActive(tab.path) ? 'active' : ''}`}
                    onClick={() => navigate(tab.path)}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>

              {user ? (
                <button type="button" className="sign-in-btn"
                  onClick={() => navigate('/dashboard')}>
                  <Zap size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} /> Dashboard
                </button>
              ) : (
                <button type="button" className="sign-in-btn"
                  onClick={() => navigate('/login')}>
                  Sign In
                </button>
              )}

              <button
                type="button"
                className={`burger-btn ${mobileMenuOpen ? 'open' : ''}`}
                aria-label="Toggle navigation"
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen(v => !v)}
              >
                <span className="burger-bar" />
                <span className="burger-bar" />
                <span className="burger-bar" />
              </button>
            </header>

            {/* Public page content */}
            <main className="hero-workspace">
              <Routes>

                {/* Home — redirects to /dashboard if logged in, else renders LandingHomePage */}
                <Route path="/" element={
                  user ? <Navigate to="/dashboard" replace /> : <LandingHomePage />
                } />

                {/* Login — redirects to /dashboard if already signed in */}
                <Route path="/login" element={
                  user ? <Navigate to="/dashboard" replace /> : <LoginPage />
                } />

                {/* Catch-all inside public shell → home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

          </div>

          {/* Mobile drawer */}
          {mobileMenuOpen && (
            <>
              <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
              <nav className="mobile-menu-sheet" aria-label="Mobile Navigation">
                <button type="button" className="mobile-nav-link"
                  onClick={() => { navigate('/'); setMobileMenuOpen(false) }}>
                  Home
                </button>
                {user ? (
                  <button type="button" className="mobile-sign-in"
                    onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false) }}>
                    <Zap size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} /> Dashboard
                  </button>
                ) : (
                  <button type="button" className="mobile-sign-in"
                    onClick={() => { navigate('/login'); setMobileMenuOpen(false) }}>
                    <Zap size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} /> Get Started
                  </button>
                )}
              </nav>
            </>
          )}
        </div>
      } />

      {/* ════════════════════════════════════════════════════════════
          DASHBOARD SHELL  — sidebar layout, all protected routes
      ════════════════════════════════════════════════════════════ */}

      <Route path="/dashboard" element={dashboardElement(
        <div className="workspace-card glass-card page-enter">
          <ProjectsDashboard />
        </div>
      )} />

      <Route path="/project/:projectId/details" element={dashboardElement(
        <div className="workspace-card glass-card page-enter">
          <ProjectDetailsPage />
        </div>
      )} />

      <Route path="/project/:projectId/telemetry" element={dashboardElement(
        <div className="workspace-card glass-card page-enter">
          <ProjectDetailsTelemetry />
        </div>
      )} />

      <Route path="/project/:projectId" element={dashboardElement(
        <div className="workspace-card glass-card page-enter">
          <ProjectDetailsPage />
        </div>
      )} />

      <Route path="/env-config" element={dashboardElement(
        <div className="workspace-card glass-card page-enter">
          <EnvironmentConfigPage />
        </div>
      )} />

      <Route path="/playground" element={dashboardElement(
        <div className="workspace-card glass-card page-enter">
          <PlaygroundWindow />
        </div>
      )} />

      <Route path="/skill-pack" element={dashboardElement(
        <div className="workspace-card glass-card page-enter">
          <SkillPackageInspector />
        </div>
      )} />

      <Route path="/specs" element={dashboardElement(
        <div className="workspace-card glass-card page-enter">
          <SkillPackageInspector />
        </div>
      )} />

      <Route path="/qa" element={dashboardElement(
        <div className="workspace-card glass-card page-enter">
          <QACanvas
            nextRunNumber={Math.max(0, ...runs.map(r => r.run_number)) + 1}
            onRunComplete={run => setRuns(prev => [run, ...prev])}
          />
        </div>
      )} />

    </Routes>
  )
}
