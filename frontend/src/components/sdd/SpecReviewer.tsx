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
  AlertTriangle, ArrowRight, Boxes, CheckCircle2, ClipboardList, Copy, FileText, History,
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
  const tabRefs = useRef<Record<SpecTab, HTMLButtonElement | null>>({ requirements: null, design: null, tasks: null })
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
                {activeTab === 'requirements' && <RequirementsTab requirements={spec.requirements} />}
                {activeTab === 'design' && <DesignTab design={spec.design} featureId={spec.feature_id} bindings={spec.ibm_bindings} />}
                {activeTab === 'tasks' && (
                  <TaskBreakdownTab tasks={spec.tasks} reviewedIds={reviewedTaskIds} isLocked={isLocked}
                    onToggle={onToggleReviewed} onSetAll={onSetAllReviewed} />
                )}
              </div>
              {revising && (
                <div className="sr-panel-overlay" role="status">
                  <Loader2 size={20} className="sr-spin" />
                  <span>IBM Bob is revising the spec…</span>
                </div>
              )}
            </div>

            <IBMToolBindingsPanel bindings={spec.ibm_bindings} />
          </section>

          {/* ── Action footer ─────────────────────────────────── */}
          {isLocked ? (
            <section className="sr-card sr-locked" aria-live="polite">
              <div className="sr-locked-icon"><Lock size={20} /></div>
              <div className="sr-locked-body">
                <p className="sr-locked-title">Approved &amp; Locked 🔒</p>
                <p className="sr-locked-text">
                  This spec is signed off{approvedAt ? ` (${formatTime(approvedAt)})` : ''}. Requirements, design and tasks are now
                  read-only and the deployment pipeline is unlocked.
                </p>
              </div>
              {onContinue && (
                <button type="button" className="sr-btn sr-btn--primary" onClick={onContinue}>
                  Continue to QA Pipeline <ArrowRight size={15} />
                </button>
              )}
            </section>
          ) : (
            <section className="sr-card sr-actions" aria-label="Review actions">
              <div className="sr-revise">
                <label htmlFor={feedbackId} className="sr-section-label">
                  <MessageSquareText size={14} /> Request revisions
                </label>
                <textarea id={feedbackId} className="sr-textarea" rows={3} maxLength={MAX_FEEDBACK}
                  placeholder="Describe what to change (e.g. use PostgreSQL instead of MongoDB)"
                  value={feedback} disabled={busy} onChange={event => setFeedback(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) { event.preventDefault(); void submitRevision() }
                  }} />
                <div className="sr-revise-row">
                  <div className="sr-chips" role="group" aria-label="Sections to revise">
                    {SECTION_OPTIONS.map(option => (
                      <button key={option.id} type="button" disabled={busy}
                        className={`sr-chip${sections.includes(option.id) ? ' is-on' : ''}`}
                        aria-pressed={sections.includes(option.id)} onClick={() => toggleSection(option.id)}>
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <span className="sr-counter">{feedback.length}/{MAX_FEEDBACK}</span>
                </div>
              </div>

              <div className="sr-action-bar">
                <button type="button" className="sr-btn sr-btn--secondary" disabled={!feedback.trim() || busy}
                  onClick={() => void submitRevision()}>
                  {revising ? <Loader2 size={15} className="sr-spin" /> : <span aria-hidden="true">📝</span>}
                  {revising ? 'Requesting changes…' : 'Request Changes'}
                </button>
                <button type="button" className="sr-btn sr-btn--approve" disabled={busy || confirming}
                  onClick={() => setConfirming(true)}>
                  <CheckCircle2 size={16} /> Approve Specs &amp; Deploy to IBM Cloud
                </button>
              </div>

              {confirming && (
                <div className="sr-confirm" role="alertdialog" aria-labelledby="sr-confirm-title" aria-describedby="sr-confirm-text">
                  <p id="sr-confirm-title" className="sr-confirm-title">Lock this spec and unlock deployment?</p>
                  <p id="sr-confirm-text" className="sr-confirm-text">
                    After approval the spec can no longer be revised. IBM Bob will dispatch its subagents to provision the
                    database, run Watsonx QA and deploy to Code Engine.
                    {!allReviewed && spec.tasks.length > 0 && (
                      <span className="sr-confirm-warn"> Only {reviewedCount} of {spec.tasks.length} tasks are marked as reviewed.</span>
                    )}
                  </p>
                  <div className="sr-confirm-actions">
                    <button type="button" className="sr-btn sr-btn--ghost" disabled={approving} onClick={() => setConfirming(false)}>Cancel</button>
                    <button type="button" className="sr-btn sr-btn--approve" disabled={approving} onClick={() => void confirmApproval()} autoFocus>
                      {approving ? <><Loader2 size={15} className="sr-spin" /> Locking spec…</> : <><Lock size={15} /> Confirm &amp; lock</>}
                    </button>
                  </div>
                </div>
              )}
            </section>
          )}
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
