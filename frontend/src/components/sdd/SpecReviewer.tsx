/**
 * BL-SDD-02 + BL-SDD-03 — IBM Bob 2.0 Spec Review
 *
 * Continuous, specs-driven review: the developer reads the 3-part artifact
 * (Requirements · Technical Design · Task Breakdown) plus the tracked .bob
 * package, adds requirements through IBM Bob (which re-syncs design and tasks),
 * and syncs + deploys to IBM Cloud whenever the specs are ready. Specs stay
 * editable after every sync.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import {
  AlertTriangle, ArrowRight, Boxes, Check, ClipboardList, Copy, FileText, Folder, History,
  KeyRound, Rocket, Sparkles, Wand2, X,
} from 'lucide-react'
import RequirementsTab from './RequirementsTab'
import DesignTab from './DesignTab'
import TaskBreakdownTab from './TaskBreakdownTab'
import PackageDocsTab from './PackageDocsTab'
import IBMToolBindingsPanel from './IBMToolBindingsPanel'
import SpecStatusBadge from './SpecStatusBadge'
import ReviewRing from './ReviewRing'
import DocOutline from './DocOutline'
import ApprovalDialog from './ApprovalDialog'
import { extractHeadings } from './MarkdownView'
import type { RevisionEntry, SpecResponse, SpecSection, SpecTab } from '../../types/spec'
import type { SpecAction } from '../../hooks/useSpecActions'
import '../../styles/flash-ui.css'
import './SpecReviewer.css'

const TABS: { id: SpecTab; label: string; short: string; icon: typeof FileText }[] = [
  { id: 'requirements', label: 'Requirements', short: 'Reqs', icon: FileText },
  { id: 'design', label: 'Technical Design', short: 'Design', icon: Boxes },
  { id: 'tasks', label: 'Task Breakdown', short: 'Tasks', icon: ClipboardList },
  { id: 'package', label: 'Package (.bob)', short: '.bob', icon: Folder },
]

export type SpecReviewerProps = {
  spec: SpecResponse
  /** Kept for API compatibility — specs stay editable after every sync. */
  isLocked?: boolean
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

const NON_TEXT_INPUTS = new Set(['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file'])
const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return true
  return target instanceof HTMLInputElement && !NON_TEXT_INPUTS.has(target.type)
}

export default function SpecReviewer({
  spec, onApprove, onRevise, pending = null, error, onDismissError,
  reviewedTaskIds = [], onToggleReviewed = () => {}, onSetAllReviewed = () => {},
  revisions = [], templateName, prompt, approvedAt, onOpenSecrets, onContinue,
}: SpecReviewerProps) {
  const [activeTab, setActiveTab] = useState<SpecTab>('requirements')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [celebrate, setCelebrate] = useState(false)
  const [copied, setCopied] = useState(false)
  const [seenRevision, setSeenRevision] = useState<Record<SpecTab, number>>(() => ({
    requirements: revisions.length, design: revisions.length, tasks: revisions.length, package: revisions.length,
  }))
  const [panelEl, setPanelEl] = useState<HTMLDivElement | null>(null)
  const tabRefs = useRef<Record<SpecTab, HTMLButtonElement | null>>({ requirements: null, design: null, tasks: null, package: null })
  const tabListRef = useRef<HTMLDivElement>(null)
  const lastSync = useRef(approvedAt)
  const [pill, setPill] = useState({ left: 0, width: 0 })
  const busy = pending !== null
  const revising = pending === 'revise'
  const syncing = pending === 'approve'
  const synced = !!approvedAt

  // Sliding pill behind the active tab.
  useLayoutEffect(() => {
    const measure = () => {
      const el = tabRefs.current[activeTab]
      if (el) setPill({ left: el.offsetLeft, width: el.offsetWidth })
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (tabListRef.current) observer.observe(tabListRef.current)
    return () => observer.disconnect()
  }, [activeTab])

  // Celebration plays every time a new sync completes.
  useEffect(() => {
    if (approvedAt && approvedAt !== lastSync.current) {
      lastSync.current = approvedAt
      setConfirmOpen(false)
      setCelebrate(true)
      const timer = setTimeout(() => setCelebrate(false), 2200)
      return () => clearTimeout(timer)
    }
    lastSync.current = approvedAt
  }, [approvedAt])

  // "Updated" dots on tabs touched by the latest revision until they are viewed.
  const latest = revisions[0]
  const revisionNumber = revisions.length
  const touched = (tab: SpecTab) =>
    tab !== 'package' && !!latest && seenRevision[tab] < revisionNumber && (latest.sections.includes('all') || latest.sections.includes(tab))
  useEffect(() => {
    setSeenRevision(current => ({ ...current, [activeTab]: revisionNumber }))
  }, [activeTab, revisionNumber])

  useEffect(() => { panelEl?.scrollTo({ top: 0 }) }, [activeTab, panelEl])

  // Keyboard shortcuts: 1–4 switch tabs.
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target) || confirmOpen) return
      const index = Number(event.key) - 1
      if (index >= 0 && index < TABS.length) setActiveTab(TABS[index].id)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [confirmOpen])

  const reviewedSet = new Set(reviewedTaskIds)
  const reviewedCount = spec.tasks.filter(task => task.completed || reviewedSet.has(task.id)).length

  const headings = useMemo(() => {
    const source = activeTab === 'design' ? extractHeadings(spec.design, 'des') : []
    return source.filter(heading => heading.level > 1)
  }, [activeTab, spec.design])

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

  const confirmSync = async () => {
    const result = await onApprove()
    if (!result) setConfirmOpen(false)
  }

  const copyFeatureId = async () => {
    try {
      await navigator.clipboard.writeText(spec.feature_id)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* ignore */ }
  }

  return (
    <div className="sr-root">
      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="sr-header fx-panel">
        <div className="sr-header-glow" aria-hidden="true" />
        <div className="sr-header-main">
          <p className="fx-eyebrow"><Sparkles size={13} /> IBM Bob 2.0 · Specs-driven development</p>
          <h1 className="sr-title">{templateName ? `${templateName} specification` : 'Specification review'}</h1>
          <div className="sr-meta">
            <button type="button" className="sr-chip-btn" onClick={copyFeatureId} title="Copy feature ID">
              <span className="sr-mono">{spec.feature_id}</span>
              {copied ? <Check size={12} /> : <Copy size={12} />}
            </button>
            <span className="sr-meta-item"><ClipboardList size={13} /> {spec.tasks.length} tasks</span>
            <span className="sr-meta-item"><History size={13} /> {revisions.length} {revisions.length === 1 ? 'revision' : 'revisions'}</span>
            {approvedAt && <span className="sr-meta-item sr-meta-item--ok"><Rocket size={13} /> Last synced {formatTime(approvedAt)}</span>}
          </div>
        </div>
        <div className="sr-header-side">
          <div className="sr-ring-wrap">
            <ReviewRing value={reviewedCount} total={spec.tasks.length} />
            <div>
              <p className="sr-ring-value">{reviewedCount}/{spec.tasks.length}</p>
              <p className="sr-ring-label">reviewed</p>
            </div>
          </div>
          <SpecStatusBadge status={spec.status} />
        </div>
      </header>

      {error && (
        <div className="sr-alert fx-enter" role="alert">
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
          <section className="sr-doc fx-panel">
            <div className="sr-doc-bar">
              <div className="sr-tabs" role="tablist" aria-label="Spec sections" ref={tabListRef}>
                <span className="sr-tab-pill" aria-hidden="true" style={{ transform: `translateX(${pill.left}px)`, width: pill.width }} />
                {TABS.map(({ id, label, short, icon: Icon }, index) => (
                  <button key={id} ref={el => { tabRefs.current[id] = el }} type="button" role="tab"
                    id={`sr-tab-${id}`} aria-controls={`sr-panel-${id}`} aria-selected={activeTab === id}
                    tabIndex={activeTab === id ? 0 : -1} className={`sr-tab${activeTab === id ? ' is-active' : ''}`}
                    onClick={() => setActiveTab(id)} onKeyDown={onTabKey}>
                    <Icon size={15} aria-hidden="true" />
                    <span className="sr-tab-label">{label}</span>
                    <span className="sr-tab-short" aria-hidden="true">{short}</span>
                    {id === 'tasks' && <span className="sr-tab-count">{reviewedCount}/{spec.tasks.length}</span>}
                    {touched(id) && <span className="sr-tab-updated" title="Updated in the latest revision"><span className="fx-sr-only">Updated</span></span>}
                    <kbd className="fx-kbd sr-tab-kbd" aria-hidden="true">{index + 1}</kbd>
                  </button>
                ))}
              </div>
            </div>

            <div className="sr-doc-body">
              <div className="sr-panel-wrap" aria-busy={revising}>
                <div className="sr-panel" role="tabpanel" id={`sr-panel-${activeTab}`} aria-labelledby={`sr-tab-${activeTab}`}
                  tabIndex={0} ref={setPanelEl}>
                  <div className="sr-panel-inner" key={`${activeTab}-${revisionNumber}`}>
                    {activeTab === 'requirements' && (
                      <RequirementsTab requirements={spec.requirements}
                        onAddRequirement={newReq => { void onRevise(`Added requirement ${newReq.id}: ${newReq.title}`, ['all']) }} />
                    )}
                    {activeTab === 'design' && <DesignTab design={spec.design} featureId={spec.feature_id} bindings={spec.ibm_bindings} />}
                    {activeTab === 'tasks' && (
                      <TaskBreakdownTab tasks={spec.tasks} reviewedIds={reviewedTaskIds}
                        onToggle={onToggleReviewed} onSetAll={onSetAllReviewed} />
                    )}
                    {activeTab === 'package' && <PackageDocsTab />}
                  </div>
                </div>
                {revising && (
                  <div className="sr-panel-overlay" role="status">
                    <div className="sr-scan" aria-hidden="true" />
                    <span className="sr-overlay-chip"><Wand2 size={15} /> <span className="fx-shimmer-text">IBM Bob is updating specs, design &amp; tasks…</span></span>
                  </div>
                )}
              </div>
              {headings.length > 1 && <DocOutline headings={headings} scrollRoot={panelEl} />}
            </div>

            <IBMToolBindingsPanel bindings={spec.ibm_bindings} />
          </section>

          {/* ── Action bar ────────────────────────────────────── */}
          <section className={`sr-dock sr-dock--sync fx-panel${synced ? ' is-synced' : ''}`} aria-label="Sync and deploy">
            <div className="sr-dock-info">
              <span className="sr-dock-icon" aria-hidden="true">{synced ? <Rocket size={18} /> : <Sparkles size={18} />}</span>
              <div>
                <p className="sr-dock-title">{synced ? 'Specs live on IBM Cloud' : 'Ready when your specs are'}</p>
                <p className="sr-dock-text">
                  {synced
                    ? <>Last synced {formatTime(approvedAt!)}. Keep refining: add requirements and IBM Bob re-syncs design and tasks.</>
                    : <>Add requirements from the Requirements tab; IBM Bob keeps design and tasks in sync. Deploy whenever you’re ready.</>}
                </p>
              </div>
            </div>
            <div className="sr-dock-buttons">
              {synced && onContinue && (
                <button type="button" className="fx-btn fx-btn--secondary" onClick={onContinue}>
                  QA pipeline <ArrowRight size={15} />
                </button>
              )}
              <button type="button" className="fx-btn fx-btn--primary sr-approve" disabled={busy} onClick={() => setConfirmOpen(true)}>
                <Rocket size={16} /> {synced ? 'Re-sync & deploy' : 'Sync specs & deploy to IBM Cloud'}
              </button>
            </div>
          </section>
        </div>

        {/* ── Summary aside ───────────────────────────────────── */}
        <aside className="sr-aside">
          {prompt && (
            <section className="sr-aside-card fx-panel">
              <h3 className="sr-aside-title">Original brief</h3>
              <blockquote className="sr-prompt">{prompt}</blockquote>
            </section>
          )}

          <section className="sr-aside-card fx-panel">
            <h3 className="sr-aside-title">Pre-deploy checklist</h3>
            <ul className="sr-checklist">
              {[
                { done: reviewedCount === spec.tasks.length && spec.tasks.length > 0, label: 'Tasks reviewed', value: `${reviewedCount}/${spec.tasks.length}` },
                { done: spec.ibm_bindings.secrets_vault, label: 'Secrets vault bound' },
                { done: Object.values(spec.ibm_bindings).every(Boolean), label: 'IBM tools bound', value: `${Object.values(spec.ibm_bindings).filter(Boolean).length}/4` },
                { done: synced, label: 'Synced & deployed' },
              ].map(item => (
                <li key={item.label} className={item.done ? 'is-done' : ''}>
                  <span className="sr-check-dot">{item.done && <Check size={10} strokeWidth={3.5} />}</span>
                  {item.label}
                  {item.value && <span className="sr-check-value">{item.value}</span>}
                </li>
              ))}
            </ul>
            {onOpenSecrets && (
              <button type="button" className="fx-btn fx-btn--secondary fx-btn--block" onClick={onOpenSecrets}>
                <KeyRound size={15} /> Manage environment secrets
              </button>
            )}
          </section>

          <section className="sr-aside-card fx-panel">
            <h3 className="sr-aside-title">Revision history <span className="sr-aside-count">{revisions.length}</span></h3>
            {revisions.length ? (
              <ol className="sr-timeline">
                {revisions.map((revision, index) => (
                  <li key={revision.id} className={index === 0 ? 'is-latest' : undefined}>
                    <span className="sr-timeline-dot" aria-hidden="true" />
                    <div>
                      <p className="sr-timeline-head">
                        <span>Revision {revisions.length - index}</span>
                        <time dateTime={revision.at}>{formatTime(revision.at)}</time>
                      </p>
                      <p className="sr-timeline-text">{revision.feedback}</p>
                      <p className="sr-timeline-tags">{revision.sections.map(section => <span key={section}>{section}</span>)}</p>
                    </div>
                  </li>
                ))}
                <li className="is-origin">
                  <span className="sr-timeline-dot" aria-hidden="true" />
                  <div><p className="sr-timeline-head"><span>First draft by IBM Bob</span></p></div>
                </li>
              </ol>
            ) : (
              <p className="sr-muted">No revisions yet. This is IBM Bob’s first draft.</p>
            )}
          </section>
        </aside>
      </div>

      <ApprovalDialog open={confirmOpen} approving={syncing} reviewed={reviewedCount} total={spec.tasks.length}
        revisions={revisions.length} resync={synced} onCancel={() => setConfirmOpen(false)} onConfirm={() => void confirmSync()} />

      {celebrate && (
        <div className="sr-celebrate" role="status" aria-live="assertive">
          <div className="sr-celebrate-burst" aria-hidden="true">
            {Array.from({ length: 12 }, (_, i) => <i key={i} style={{ '--r': `${i * 30}deg` } as CSSProperties} />)}
          </div>
          <div className="sr-celebrate-seal">
            <svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" /><path d="M15 27l7 7 15-16" /></svg>
          </div>
          <p className="sr-celebrate-title">Specs synced &amp; deploying</p>
          <p className="sr-celebrate-sub">IBM Bob’s subagents are rolling out your update</p>
        </div>
      )}
    </div>
  )
}
