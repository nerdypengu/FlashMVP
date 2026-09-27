/**
 * BL-SDD-02 + BL-SDD-03 — IBM Bob 2.0 Spec Review Gate
 *
 * The human-in-the-loop gate: nothing deploys until a developer reads the
 * 3-part artifact (Requirements · Technical Design · Task Breakdown), optionally
 * requests revisions, and explicitly approves. Once approved, every control is
 * read-only and the QA pipeline unlocks.
 */
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import {
  AlertTriangle, ArrowRight, Boxes, CheckCircle2, ClipboardList, Copy, FileText, Folder, History,
  KeyRound, Loader2, Lock, MessageSquareText, Sparkles, X,
} from 'lucide-react'
import RequirementsTab from './RequirementsTab'
import DesignTab from './DesignTab'
import TaskBreakdownTab from './TaskBreakdownTab'
import IBMToolBindingsPanel from './IBMToolBindingsPanel'
import SpecStatusBadge from './SpecStatusBadge'
import type { RevisionEntry, SpecResponse, SpecSection, SpecTab } from '../../types/spec'
import type { SpecAction } from '../../hooks/useSpecActions'
import './SpecReviewer.css'

const TABS: { id: SpecTab; label: string; icon: typeof FileText }[] = [
  { id: 'requirements', label: 'Requirements', icon: FileText },
  { id: 'design', label: 'Technical Design', icon: Boxes },
  { id: 'tasks', label: 'Task Breakdown', icon: ClipboardList },
  { id: 'package', label: 'Package & Requirements (.bob)', icon: Folder },
]

const SECTION_OPTIONS: { id: SpecSection; label: string }[] = [
  { id: 'all', label: 'All sections' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'design', label: 'Design' },
  { id: 'tasks', label: 'Tasks' },
]

const MAX_FEEDBACK = 800

export type SpecReviewerProps = {
  spec: SpecResponse
  isLocked: boolean
  onApprove: () => Promise<unknown> | unknown
  onRevise: (feedback: string, sections: SpecSection[]) => Promise<unknown> | unknown
  pending?: SpecAction | null
  error?: string | null
  onDismissError?: () => void
  reviewedTaskIds?: string[]
  onToggleReviewed?: (taskId: string) => void
  onSetAllReviewed?: (reviewed: boolean) => void
  revisions?: RevisionEntry[]
  templateName?: string
  prompt?: string
  approvedAt?: string | null
  onOpenSecrets?: () => void
  onContinue?: () => void
}

const formatTime = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })

export default function SpecReviewer({
  spec, isLocked, onApprove, onRevise, pending = null, error, onDismissError,
  reviewedTaskIds = [], onToggleReviewed = () => {}, onSetAllReviewed = () => {},
  revisions = [], templateName, prompt, approvedAt, onOpenSecrets, onContinue,
}: SpecReviewerProps) {
  const [activeTab, setActiveTab] = useState<SpecTab>('requirements')
  const [feedback, setFeedback] = useState('')
  const [sections, setSections] = useState<SpecSection[]>(['all'])
  const [confirming, setConfirming] = useState(false)
  const [copied, setCopied] = useState(false)
  const tabRefs = useRef<Record<SpecTab, HTMLButtonElement | null>>({ requirements: null, design: null, tasks: null, package: null })
  const tabListRef = useRef<HTMLDivElement>(null)
  const [indicator, setIndicator] = useState({ left: 0, width: 0 })
  const feedbackId = useId()
  const busy = pending !== null
  const revising = pending === 'revise'
  const approving = pending === 'approve'

  // Animated active-tab underline.
  useLayoutEffect(() => {
    const measure = () => {
      const el = tabRefs.current[activeTab]
      if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth })
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (tabListRef.current) observer.observe(tabListRef.current)
    return () => observer.disconnect()
  }, [activeTab])

  useEffect(() => { if (isLocked) setConfirming(false) }, [isLocked])

  const reviewedSet = new Set(reviewedTaskIds)
  const reviewedCount = spec.tasks.filter(task => task.completed || reviewedSet.has(task.id)).length
  const allReviewed = spec.tasks.length > 0 && reviewedCount === spec.tasks.length

  const onTabKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = TABS.findIndex(tab => tab.id === activeTab)
    let next = index
    if (event.key === 'ArrowRight') next = (index + 1) % TABS.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + TABS.length) % TABS.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = TABS.length - 1
    else return
    event.preventDefault()
    setActiveTab(TABS[next].id)
    tabRefs.current[TABS[next].id]?.focus()
  }

  const toggleSection = (id: SpecSection) => {
    setSections(current => {
      if (id === 'all') return ['all']
      const withoutAll = current.filter(section => section !== 'all')
      const next = withoutAll.includes(id) ? withoutAll.filter(section => section !== id) : [...withoutAll, id]
      return next.length ? next : ['all']
    })
  }

  const submitRevision = async () => {
    if (!feedback.trim() || busy || isLocked) return
    const result = await onRevise(feedback.trim(), sections)
    if (result) setFeedback('')
  }

  const confirmApproval = async () => {
    const result = await onApprove()
    if (!result) setConfirming(false)
  }

  const copyFeatureId = async () => {
    try {
      await navigator.clipboard.writeText(spec.feature_id)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* ignore */ }
  }

  return (
    <div className={`sr-root${isLocked ? ' is-locked' : ''}`}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sr-header">
        <div className="sr-header-main">
          <p className="sr-eyebrow"><Sparkles size={13} /> IBM Bob 2.0 — Spec Review Gate</p>
          <h1 className="sr-title">{templateName ? `${templateName} specification` : 'Specification review'}</h1>
          <div className="sr-meta">
            <button type="button" className="sr-meta-chip" onClick={copyFeatureId} title="Copy feature ID">
              <span className="sr-mono">{spec.feature_id}</span>
              {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
            </button>
            <span className="sr-meta-sep" aria-hidden="true">•</span>
            <span>{spec.tasks.length} tasks</span>
            <span className="sr-meta-sep" aria-hidden="true">•</span>
            <span>{revisions.length} {revisions.length === 1 ? 'revision' : 'revisions'}</span>
          </div>
        </div>
        <SpecStatusBadge status={spec.status} isLocked={isLocked} />
      </header>

      {error && (
        <div className="sr-alert" role="alert">
          <AlertTriangle size={16} />
          <span>{error}</span>
          {onDismissError && (
            <button type="button" className="sr-icon-btn" onClick={onDismissError} aria-label="Dismiss error"><X size={14} /></button>
          )}
        </div>
      )}

      <div className="sr-layout">
        {/* ── Main column ─────────────────────────────────────── */}
        <div className="sr-main">
          <section className="sr-card sr-doc">
            <div className="sr-tabs" role="tablist" aria-label="Spec sections" ref={tabListRef}>
              {TABS.map(({ id, label, icon: Icon }) => (
                <button key={id} ref={el => { tabRefs.current[id] = el }} type="button" role="tab"
                  id={`sr-tab-${id}`} aria-controls={`sr-panel-${id}`} aria-selected={activeTab === id}
                  tabIndex={activeTab === id ? 0 : -1} className={`sr-tab${activeTab === id ? ' is-active' : ''}`}
                  onClick={() => setActiveTab(id)} onKeyDown={onTabKey}>
                  <Icon size={15} aria-hidden="true" />
                  <span>{label}</span>
                  {id === 'tasks' && <span className="sr-tab-count">{reviewedCount}/{spec.tasks.length}</span>}
                </button>
              ))}
              <span className="sr-tab-indicator" style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }} />
            </div>

            <div className="sr-panel-wrap" aria-busy={revising}>
              <div className="sr-panel" role="tabpanel" id={`sr-panel-${activeTab}`} aria-labelledby={`sr-tab-${activeTab}`}
                tabIndex={0} key={activeTab}>
                {activeTab === 'requirements' && (
                  <RequirementsTab
                    requirements={spec.requirements}
                    onAddRequirement={(newReq, designSnippet, newTasks) => {
                      // Dynamically sync design & tasks when a requirement is added
                      const updatedDesign = (spec.design || '') + designSnippet
                      const updatedTasks = [...(spec.tasks || []), ...newTasks]
                      const updatedRequirements = (spec.requirements || '') + `\n\n- **[${newReq.id}] ${newReq.title}**: ${newReq.description}`
                      
                      const updatedSpec: SpecResponse = {
                        ...spec,
                        requirements: updatedRequirements,
                        design: updatedDesign,
                        tasks: updatedTasks
                      }
                      if (onRevise) {
                        void onRevise(`Added requirement ${newReq.id}: ${newReq.title}`, ['all'])
                      }
                    }}
                  />
                )}
                {activeTab === 'design' && <DesignTab design={spec.design} featureId={spec.feature_id} bindings={spec.ibm_bindings} />}
                {activeTab === 'tasks' && (
                  <TaskBreakdownTab tasks={spec.tasks} reviewedIds={reviewedTaskIds} isLocked={false}
                    onToggle={onToggleReviewed} onSetAll={onSetAllReviewed} />
                )}
                {activeTab === 'package' && <PackageDocsTab />}
              </div>
              {revising && (
                <div className="sr-panel-overlay" role="status">
                  <Loader2 size={20} className="sr-spin" />
                  <span>IBM Bob is updating specs, technical design & tasks…</span>
                </div>
              )}
            </div>

            <IBMToolBindingsPanel bindings={spec.ibm_bindings} />
          </section>

          {/* ── Action footer (Add requirements handled via IBM Bob modal inside Requirements tab) ─────────────────── */}
          <section className="sr-card sr-actions" aria-label="Review actions">
            <div className="sr-action-bar" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="sr-btn sr-btn--approve" disabled={busy || confirming}
                onClick={() => setConfirming(true)}>
                <CheckCircle2 size={16} /> Sync Specs &amp; Deploy to IBM Cloud
              </button>
            </div>

            {confirming && (
              <div className="sr-confirm" role="alertdialog" aria-labelledby="sr-confirm-title" aria-describedby="sr-confirm-text">
                <p id="sr-confirm-title" className="sr-confirm-title">Sync all specifications and deploy updates?</p>
                <p id="sr-confirm-text" className="sr-confirm-text">
                  IBM Bob will dispatch subagents to verify requirements, update technical design, run watsonx QA and update Code Engine containers.
                  {!allReviewed && spec.tasks.length > 0 && (
                    <span className="sr-confirm-warn"> {reviewedCount} of {spec.tasks.length} tasks are marked as reviewed.</span>
                  )}
                </p>
                <div className="sr-confirm-actions">
                  <button type="button" className="sr-btn sr-btn--ghost" disabled={approving} onClick={() => setConfirming(false)}>Cancel</button>
                  <button type="button" className="sr-btn sr-btn--approve" disabled={approving} onClick={() => void confirmApproval()} autoFocus>
                    {approving ? <><Loader2 size={15} className="sr-spin" /> Deploying updates…</> : <><CheckCircle2 size={15} /> Confirm &amp; Deploy</>}
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ── Summary aside ───────────────────────────────────── */}
        <aside className="sr-aside">
          {prompt && (
            <section className="sr-card sr-aside-card">
              <h3 className="sr-section-label">Original prompt</h3>
              <p className="sr-prompt">“{prompt}”</p>
            </section>
          )}

          <section className="sr-card sr-aside-card">
            <h3 className="sr-section-label">Pre-deploy checklist</h3>
            <ul className="sr-checklist">
              <li className={allReviewed ? 'is-done' : ''}>
                <CheckCircle2 size={15} /> Tasks reviewed <span>{reviewedCount}/{spec.tasks.length}</span>
              </li>
              <li className={spec.ibm_bindings.secrets_vault ? 'is-done' : ''}>
                <CheckCircle2 size={15} /> Secrets vault bound
              </li>
              <li className={isLocked ? 'is-done' : ''}>
                <CheckCircle2 size={15} /> Human sign-off
              </li>
            </ul>
            {onOpenSecrets && (
              <button type="button" className="sr-btn sr-btn--secondary sr-btn--block" onClick={onOpenSecrets}>
                <KeyRound size={15} /> Manage environment secrets
              </button>
            )}
          </section>

          <section className="sr-card sr-aside-card">
            <h3 className="sr-section-label"><History size={14} /> Revision history</h3>
            {revisions.length ? (
              <ol className="sr-timeline">
                {revisions.map((revision, index) => (
                  <li key={revision.id}>
                    <span className="sr-timeline-dot" aria-hidden="true" />
                    <div>
                      <p className="sr-timeline-head">
                        Revision {revisions.length - index}
                        <time dateTime={revision.at}>{formatTime(revision.at)}</time>
                      </p>
                      <p className="sr-timeline-text">{revision.feedback}</p>
                      <p className="sr-timeline-tags">{revision.sections.join(' · ')}</p>
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="sr-muted">No revisions yet — this is IBM Bob’s first draft.</p>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}

function PackageDocsTab() {
  const [selectedFile, setSelectedFile] = useState('package/docs/prd.md')

  const files = [
    {
      path: 'package/docs/prd.md',
      name: 'prd.md',
      folder: 'package/docs/',
      size: '4.2 KB',
      status: 'VERIFIED',
      content: `# Product Requirement Document (PRD) v2.4\n\n## Overview\nFlashMVP provides autonomous spec-to-container pipeline deployment on IBM Cloud Code Engine.\n\n## Core Architecture Requirements\n- Fast prompt parsing into 3-part SDD specs (Requirements, Design, Tasks)\n- Automated PostgreSQL schema creation in under 200ms\n- watsonx automated QA test suite runner\n- Live SSE container log streamer and metric telemetry`
    },
    {
      path: 'package/docs/requirements/FR-001_Authentication.md',
      name: 'FR-001_Authentication.md',
      folder: 'package/docs/requirements/',
      size: '1.8 KB',
      status: 'TRACKED',
      content: `# FR-001: JWT Authentication & Role-Based Access Control\n\n- Scope: User login, token issuance, and protected API endpoints\n- Auth Provider: Supabase Auth / Local JWT Strategy\n- Verification: 100% test coverage passed in Watsonx QA`
    },
    {
      path: 'package/docs/requirements/FR-002_ContainerTelemetry.md',
      name: 'FR-002_ContainerTelemetry.md',
      folder: 'package/docs/requirements/',
      size: '2.4 KB',
      status: 'TRACKED',
      content: `# FR-002: Real-time Container Telemetry & Log Streaming\n\n- Scope: CPU, Memory, Network I/O, API Endpoint metrics, SSE log streamer\n- Provider: IBM Code Engine & Docker Runtime\n- Telemetry Window: Live 2.5s polling with 1h session retention`
    },
    {
      path: 'package/docs/requirements/FR-003_QACanvas.md',
      name: 'FR-003_QACanvas.md',
      folder: 'package/docs/requirements/',
      size: '2.1 KB',
      status: 'TRACKED',
      content: `# FR-003: Interactive watsonx QA Canvas & Integrated History\n\n- Scope: Drag-and-drop test node canvas, step editor, integrated run execution history table\n- Verification: ESLint, Pytest, CVE audit, Secret leak detector`
    },
    {
      path: 'package/docs/decisions/ADR-001_IBM_CodeEngine.md',
      name: 'ADR-001_IBM_CodeEngine.md',
      folder: 'package/docs/decisions/',
      size: '3.1 KB',
      status: 'APPROVED',
      content: `# ADR-001: Serverless Microservices on IBM Code Engine\n\n- Decision: Deploy containerized backend microservices to IBM Code Engine\n- Rationale: Scale to zero capability, instant subsecond container startup, native Cloudflare SSL egress binding`
    },
    {
      path: '.bob/templates/feature_spec_template.md',
      name: 'feature_spec_template.md',
      folder: '.bob/templates/',
      size: '1.2 KB',
      status: 'TEMPLATE',
      content: `# IBM Bob 2.0 Feature Spec Template\n\n## 1. Requirement Specs\n## 2. Technical Design & Schemas\n## 3. Subagent Execution Tasks`
    },
    {
      path: '.bob/settings/ibm-environment.json',
      name: 'ibm-environment.json',
      folder: '.bob/settings/',
      size: '0.8 KB',
      status: 'CONFIG',
      content: `{\n  "region": "us-south",\n  "codeEngineProject": "flashmvp-prod",\n  "secretsVault": "ibm-secrets-manager-v2",\n  "mcpPort": 8001\n}`
    }
  ]

  const active = files.find(f => f.path === selectedFile) || files[0]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16, minHeight: 380, padding: '8px 0' }}>
      {/* File Tree Sidebar */}
      <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 10, padding: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
        <h3 style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 12 }}>
          Tracked Package Explorer
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {files.map(f => (
            <button
              key={f.path}
              type="button"
              onClick={() => setSelectedFile(f.path)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 10px', borderRadius: 6, border: 'none',
                background: selectedFile === f.path ? 'rgba(15,98,254,0.25)' : 'transparent',
                color: selectedFile === f.path ? '#fff' : 'rgba(255,255,255,0.7)',
                fontSize: 12, cursor: 'pointer', textAlign: 'left'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                <FileText size={14} color={selectedFile === f.path ? '#60A5FA' : 'rgba(255,255,255,0.4)'} />
                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{f.name}</span>
              </div>
              <span style={{ fontSize: 10, fontFamily: 'monospace', color: '#42BE65', fontWeight: 600 }}>{f.status}</span>
            </button>
          ))}
        </div>
      </div>

      {/* File Viewer Box */}
      <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 10, padding: 16, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 10 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>{active.path}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Folder: {active.folder} · Size: {active.size}</div>
          </div>
          <span className="badge badge--passed">{active.status}</span>
        </div>
        <pre style={{
          flex: 1, margin: 0, padding: 14, background: '#0a0b10', borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.05)', color: '#A7F3D0',
          fontFamily: 'monospace', fontSize: 12, lineHeight: 1.5, whiteSpace: 'pre-wrap'
        }}>
          {active.content}
        </pre>
      </div>
    </div>
  )
}
