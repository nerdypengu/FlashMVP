import { useEffect, useState, useRef } from 'react'
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom'
import QACanvas from './components/qa/QACanvas'
import RunHistoryTable, { type Run } from './components/qa/RunHistoryTable'
import PlaygroundWindow from './components/playground/PlaygroundWindow'
import TelemetryCharts from './components/telemetry/TelemetryCharts'
import LogViewer from './components/playground/LogViewer'
import TemplateSelector, { TEMPLATES, type Template } from './components/shell/TemplateSelector'
import SpecReviewer, { type SpecData } from './components/sdd/SpecReviewer'
import AppCatalog from './components/portal/AppCatalog'
import BinaryCanvasBackground from './components/ui/BinaryCanvasBackground'
import TypewriterHero from './components/ui/TypewriterHero'
import mockData from './mocks/qa_mock.json'

// ── Tab definitions (all tabs stay in navbar — teammates' pages included) ──
const TABS = [
  { path: '/',           label: 'Overview'     },
  { path: '/starter',    label: 'Starter'      },
  { path: '/specs',      label: 'Specs Review' },
  { path: '/qa',         label: 'QA Canvas'    },
  { path: '/history',    label: 'Run History'  },
  { path: '/playground', label: 'Playground'   },
  { path: '/telemetry',  label: 'Telemetry'    },
  { path: '/hub',        label: 'xAppHub'      },
]

// ── Stub placeholder for teammate pages (Person 1 & 3 & 4 will own these) ──
function TeammatePage({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100%', gap: 12, opacity: 0.4,
    }}>
      <div style={{ fontSize: 32 }}>🚧</div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
        Owned by teammate — implementation in progress
      </div>
    </div>
  )
}

// ── Default spec for SpecReviewer (Person 1 scope, stub data) ──────────────
const DEFAULT_SPEC: SpecData = {
  projectId: 'proj_8f92a',
  template: TEMPLATES[0],
  prompt: 'E-commerce store with Supabase auth & Stripe checkout',
  status: 'DRAFT',
  requirements: `# FlashStore — E-Commerce Specification (PRD)\n\n## 1. Overview\nHigh-concurrency autonomous e-commerce engine.\n\n## 2. User Stories\n- US-01: Buyer browses and checks out via Stripe.\n- US-02: Admin inspects inventory and analytics.\n- US-03: Developer verifies container health and DB latency.\n\n## 3. Non-Functional Requirements\n- Supabase schema migration: < 200ms\n- Container boot: < 4.5s\n- Cloudflare SSL tunnel: zero manual DNS`,
  architecture: `CREATE SCHEMA IF NOT EXISTS app_8f92a;\n\nCREATE TABLE app_8f92a.products (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  name VARCHAR(255) NOT NULL,\n  price_cents INTEGER NOT NULL,\n  stock_count INTEGER NOT NULL DEFAULT 0,\n  created_at TIMESTAMPTZ DEFAULT NOW()\n);`,
  ibmBindings: [
    { tool: 'IBM Code Engine',       purpose: 'Serverless container fleet execution',                    status: 'Ready' },
    { tool: 'Supabase Dynamic DB',   purpose: 'Isolated multi-tenant PostgreSQL schema',                 status: 'Ready' },
    { tool: 'Cloudflare Quick Tunnel', purpose: 'Public HTTPS SSL egress URL',                           status: 'Ready' },
    { tool: 'watsonx QA Inspector',  purpose: 'Autonomous ESLint, Pytest, and Secret leak auditing',     status: 'Ready' },
  ],
  tasks: [
    { id: 'TSK-01', title: 'Provision isolated PostgreSQL schema in Supabase', subagent: 'Subagent Alpha (DB)',       estimate: '180ms' },
    { id: 'TSK-02', title: 'Synthesize FastAPI router & Pydantic models',      subagent: 'Subagent Gamma (FastAPI)', estimate: '1.2s'  },
    { id: 'TSK-03', title: 'Execute watsonx security & unit test audit',        subagent: 'Subagent Beta (QA)',       estimate: '2.6s'  },
    { id: 'TSK-04', title: 'Launch dual container fleet & Cloudflare tunnel',   subagent: 'Subagent Delta (Tunnel)', estimate: '3.1s'  },
  ],
}

export default function App() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const [runs, setRuns]               = useState<Run[]>(mockData.runs)
  const [spec, setSpec]               = useState<SpecData>(DEFAULT_SPEC)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [typingComplete, setTypingComplete] = useState(false)

  // Close mobile menu on route change
  useEffect(() => { setMobileMenuOpen(false) }, [location.pathname])

  // Close on Escape
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
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)

  // Sliding indicator refs
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
    indicator.style.width = `${btnRect.width}px`
    indicator.style.transform = `translateX(${btnRect.left - navRect.left - 5}px)`
  }, [location.pathname])

  return (
    <div className="app-shell">
      <BinaryCanvasBackground />

      <div className="page">
        {/* ── Floating Capsule Header ──────────────────────────── */}
        <header className="header">
          <button
            type="button"
            className="logo-btn"
            onClick={() => navigate('/')}
            title="FlashMVP — Return to Overview"
          >
            <img src="/assets/logo.webp" alt="FlashMVP" width="52" height="52" />
          </button>

          <nav className="nav-pill" aria-label="Main Navigation" ref={navRef}>
            <div className="nav-pill-indicator" ref={indicatorRef} />
            {TABS.map(tab => (
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

          <button
            type="button"
            className="sign-in-btn"
            onClick={() => navigate('/starter')}
          >
            ⚡ Start MVP
          </button>

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

        {/* ── Main Route Workspace ─────────────────────────────── */}
        <main className="hero-workspace">
          <Routes>
            {/* ── Overview: teammate (Person 1) ── */}
            <Route path="/" element={
              <div className="hero-overview">
                <div className="trust-row anim" style={{ '--d': '0.05s' } as React.CSSProperties}>
                  <div className="avatar-ring avatar-ring-1" title="IBM Cloud & Bob 2.0">
                    <div className="avatar-inner">
                      <i className="fa-brands fa-ibm" style={{ fontSize: '16px' }} />
                    </div>
                  </div>
                  <div className="avatar-ring avatar-ring-2" title="Docker Container Fleet">
                    <div className="avatar-inner">
                      <i className="fa-brands fa-docker" style={{ fontSize: '15px' }} />
                    </div>
                  </div>
                  <div className="avatar-ring avatar-ring-3" title="Cloudflare Quick Tunnel">
                    <div className="avatar-inner">
                      <i className="fa-brands fa-cloudflare" style={{ fontSize: '15px' }} />
                    </div>
                  </div>
                  <div className="trust-pill">
                    <span className="trust-text">Powered by IBM Bob 2.0 &amp; Cloud Fleet</span>
                  </div>
                </div>
                <TypewriterHero
                  line1Text="FLASHMVP"
                  line2Text="SPEC TO CONTAINER"
                  onComplete={() => setTypingComplete(true)}
                />
                <p className={`subhead sequential-reveal ${typingComplete ? 'sequential-reveal--visible' : ''}`} style={{ transitionDelay: '0.05s' }}>
                  Autonomous agentic middleware proxy. Transform natural prompts into production-grade
                  container fleets with automated 3-part SDD specs, instant Supabase DB provisioning, and
                  watsonx QA observability.
                </p>
                <div
                  className={`sequential-reveal ${typingComplete ? 'sequential-reveal--visible' : ''}`}
                  style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', transitionDelay: '0.18s' }}
                >
                  <button type="button" className="cta-btn" onClick={() => navigate('/starter')}>
                    ⚡ Launch Studio
                  </button>
                  <button
                    type="button"
                    className="cta-btn"
                    style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                    onClick={() => navigate('/playground')}
                  >
                    🖥️ Open Live Playground
                  </button>
                </div>
                <footer
                  className={`stats sequential-reveal ${typingComplete ? 'sequential-reveal--visible' : ''}`}
                  aria-label="Platform Statistics"
                  style={{ marginTop: 'clamp(24px, 4vh, 48px)', transitionDelay: '0.32s' }}
                >
                  {[
                    { icon: '<', value: '200', suffix: 'ms', label: 'DB Provisioning (Supabase)' },
                    { icon: '%', value: '99.9', suffix: '%', label: 'watsonx QA Reliability' },
                    { icon: '*', value: '24', suffix: '/7', label: 'Autonomous Container Fleet' },
                    { icon: '#', value: '1', suffix: '-Click', label: 'Spec-to-Deploy Cycle' },
                  ].map(s => (
                    <div key={s.label} className="stat-item">
                      <div className="stat-top">
                        <span className="stat-icon">{s.icon}</span>
                        <div className="stat-value-group">
                          <span className="stat-value">{s.value}</span>
                          <span className="stat-suffix">{s.suffix}</span>
                        </div>
                      </div>
                      <span className="stat-label">{s.label}</span>
                    </div>
                  ))}
                </footer>
              </div>
            } />

            {/* ── Starter: teammate (Person 1) ── */}
            <Route path="/starter" element={
              <div className="workspace-card glass-card page-enter">
                <TemplateSelector onGenerate={handleGenerateSpec} />
              </div>
            } />

            {/* ── Specs Review: teammate (Person 1 + 3) ── */}
            <Route path="/specs" element={
              <div className="workspace-card glass-card page-enter">
                <SpecReviewer
                  spec={spec}
                  onApprove={handleApproveSpec}
                  onRevise={handleReviseSpec}
                />
              </div>
            } />

            {/* ── QA Canvas: PERSON 2 ── */}
            <Route path="/qa" element={
              <div className="workspace-card qa-workspace page-enter">
                <QACanvas
                  nextRunNumber={Math.max(0, ...runs.map(r => r.run_number)) + 1}
                  onRunComplete={run => setRuns(prev => [run, ...prev])}
                />
              </div>
            } />

            {/* ── Run History: PERSON 2 ── */}
            <Route path="/history" element={
              <div className="workspace-card glass-card page-enter">
                <RunHistoryTable runs={runs} />
              </div>
            } />

            {/* ── Playground: PERSON 2 ── */}
            <Route path="/playground" element={
              <div className="workspace-card glass-card page-enter">
                <PlaygroundWindow />
              </div>
            } />

            {/* ── Telemetry: PERSON 2 ── */}
            <Route path="/telemetry" element={
              <div className="workspace-card glass-card page-enter telemetry-viewport">
                <div className="telemetry-layout">
                  <TelemetryCharts />
                  <LogViewer />
                </div>
              </div>
            } />

            {/* ── xAppHub: teammate (Person 4) ── */}
            <Route path="/hub" element={
              <div className="workspace-card glass-card page-enter">
                <AppCatalog onOpenPlayground={() => navigate('/playground')} />
              </div>
            } />

            {/* ── Fallback ── */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* ── Mobile Drawer ─────────────────────────────────────── */}
      {mobileMenuOpen && (
        <>
          <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)} />
          <nav className="mobile-menu-sheet" aria-label="Mobile Navigation">
            {TABS.map(tab => (
              <button
                key={tab.path}
                type="button"
                className={`mobile-nav-link ${isActive(tab.path) ? 'active' : ''}`}
                onClick={() => navigate(tab.path)}
              >
                {tab.label}
              </button>
            ))}
            <button
              type="button"
              className="mobile-sign-in"
              onClick={() => navigate('/starter')}
            >
              ⚡ Start New MVP
            </button>
          </nav>
        </>
      )}
    </div>
  )
}
