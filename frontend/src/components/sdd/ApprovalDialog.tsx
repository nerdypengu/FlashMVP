import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Bot, Database, Loader2, Lock, Rocket, ShieldCheck, X } from 'lucide-react'

// Sync-and-deploy confirmation for the continuous SDD flow.

const SUBAGENTS = [
  { icon: Database, name: 'Alpha', job: 'Provisions the IBM Cloud DB schema' },
  { icon: ShieldCheck, name: 'Beta', job: 'Runs Watsonx QA: lint, tests, secret scan' },
  { icon: Rocket, name: 'Gamma', job: 'Builds & deploys to IBM Code Engine' },
  { icon: Lock, name: 'Delta', job: 'Injects vault secrets & opens the SSL tunnel' },
]

/** BL-SDD-03 — explicit human sign-off before IBM Bob syncs the specs and deploys. */
export default function ApprovalDialog({ open, approving, reviewed, total, revisions, resync = false, onCancel, onConfirm }: {
  open: boolean
  approving: boolean
  resync?: boolean
  reviewed: number
  total: number
  revisions: number
  onCancel: () => void
  onConfirm: () => void
}) {
  const confirmRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const approvingRef = useRef(approving)
  const cancelRef = useRef(onCancel)
  approvingRef.current = approving
  cancelRef.current = onCancel

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    requestAnimationFrame(() => confirmRef.current?.focus())
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !approvingRef.current) { event.stopPropagation(); cancelRef.current() }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const items = Array.from(dialogRef.current.querySelectorAll<HTMLElement>('button:not([disabled])'))
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); previous?.focus?.() }
  }, [open])

  if (!open) return null
  const allReviewed = total > 0 && reviewed >= total

  return createPortal(
    <div className="ad-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !approving) onCancel() }}>
      <div className="ad-dialog" role="alertdialog" aria-modal="true" aria-labelledby="ad-title" aria-describedby="ad-desc" ref={dialogRef}>
        <button type="button" className="ad-close" onClick={onCancel} disabled={approving} aria-label="Cancel"><X size={16} /></button>
        <div className="ad-seal" aria-hidden="true">
          <span className="ad-seal-ring" />
          <span className="ad-seal-core"><Rocket size={24} /></span>
        </div>
        <h2 id="ad-title" className="ad-title">{resync ? 'Re-sync & deploy updates?' : 'Sync specs & deploy?'}</h2>
        <p id="ad-desc" className="ad-desc">
          IBM Bob verifies requirements, updates the technical design, runs Watsonx QA and rolls out your containers
          on IBM Code Engine. Specs stay editable, so you can keep refining and re-sync anytime.
        </p>

        <dl className="ad-stats">
          <div className={allReviewed ? 'is-ok' : 'is-warn'}><dt>Tasks reviewed</dt><dd>{reviewed}<span>/{total}</span></dd></div>
          <div><dt>Revisions</dt><dd>{revisions}</dd></div>
          <div className="is-ok"><dt>IBM bindings</dt><dd>4<span>/4</span></dd></div>
        </dl>

        {!allReviewed && total > 0 && (
          <p className="ad-warn"><AlertTriangle size={14} /> {total - reviewed} task{total - reviewed === 1 ? '' : 's'} not marked as reviewed yet.</p>
        )}

        <div className="ad-next">
          <p className="ad-next-title"><Bot size={14} /> What happens next</p>
          <ol>
            {SUBAGENTS.map(({ icon: Icon, name, job }, index) => (
              <li key={name} style={{ animationDelay: `${120 + index * 70}ms` }}>
                <span className="ad-agent"><Icon size={13} /></span>
                <span><strong>Subagent {name}</strong> {job}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="ad-actions">
          <button type="button" className="fx-btn fx-btn--ghost" onClick={onCancel} disabled={approving}>Keep reviewing</button>
          <button type="button" ref={confirmRef} className="fx-btn fx-btn--success fx-btn--lg" onClick={onConfirm} disabled={approving}>
            {approving ? <><Loader2 size={16} className="fx-spin" /> Deploying…</> : <><Rocket size={16} /> Confirm & deploy</>}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
