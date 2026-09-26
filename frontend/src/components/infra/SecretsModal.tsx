/**
 * BL-INF-02 — IBM Secrets Manager · Environment Variables modal.
 * Lists masked secrets, adds/updates keys with a scope, deletes keys and
 * finally "locks" the vault before IBM Code Engine deployment.
 */
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, Lock, Plus, RefreshCw, Save, X } from 'lucide-react'
import SecretRow from './SecretRow'
import { SECRET_KEY_PATTERN, useSecrets, type SecretRecord, type SecretScope } from '../../hooks/useSecrets'
import { toMessage } from '../../lib/apiClient'
import { isDemoMode } from '../../config'
import './SecretsModal.css'

const SCOPES: SecretScope[] = ['ALL', 'FRONTEND', 'BACKEND']
const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'

export default function SecretsModal({ open, projectId, onClose, onConfirm }: {
  open: boolean
  projectId: string
  onClose: () => void
  onConfirm?: (secrets: SecretRecord[]) => void
}) {
  const { secrets, loading, loadError, save, remove, reload } = useSecrets(projectId, open)
  const [key, setKey] = useState('')
  const [value, setValue] = useState('')
  const [scope, setScope] = useState<SecretScope>('ALL')
  const [showValue, setShowValue] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [locking, setLocking] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const keyInputRef = useRef<HTMLInputElement>(null)
  const titleId = useId()
  const descId = useId()

  const busy = saving || locking
  const trimmedKey = key.trim()
  const keyInvalid = trimmedKey.length > 0 && !SECRET_KEY_PATTERN.test(trimmedKey)
  const isUpdate = secrets.some(secret => secret.key === trimmedKey)

  // Reset transient state whenever the modal opens.
  useEffect(() => {
    if (!open) return
    setKey(''); setValue(''); setScope('ALL'); setShowValue(false)
    setFormError(null); setActionError(null); setNotice(null); setLocking(false)
  }, [open])

  const busyRef = useRef(busy)
  const onCloseRef = useRef(onClose)
  busyRef.current = busy
  onCloseRef.current = onClose

  // Focus management, Escape to close, focus trap, scroll lock.
  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => keyInputRef.current?.focus())

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busyRef.current) { event.stopPropagation(); onCloseRef.current(); return }
      if (event.key !== 'Tab' || !dialogRef.current) return
      const focusables = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previouslyFocused?.focus?.()
    }
  }, [open])

  useEffect(() => {
    if (!notice) return
    const timer = setTimeout(() => setNotice(null), 2600)
    return () => clearTimeout(timer)
  }, [notice])

  if (!open) return null

  const handleSave = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    if (!trimmedKey) { setFormError('Enter a key name.'); keyInputRef.current?.focus(); return }
    if (keyInvalid) { setFormError('Use UPPER_SNAKE_CASE: letters, digits and underscores, not starting with a digit.'); return }
    if (!value) { setFormError('Enter a value for this secret.'); return }
    setSaving(true)
    try {
      await save(trimmedKey, value, scope)
      setNotice(`${trimmedKey} ${isUpdate ? 'updated' : 'saved'} to the vault.`)
      setKey(''); setValue(''); setShowValue(false)
      keyInputRef.current?.focus()
    } catch (error) {
      setFormError(toMessage(error, 'Could not save the secret.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (secretKey: string) => {
    setActionError(null)
    try {
      await remove(secretKey)
      setNotice(`${secretKey} removed from the vault.`)
    } catch (error) {
      setActionError(toMessage(error, `Could not delete ${secretKey}.`))
    }
  }

  const handleConfirm = async () => {
    setLocking(true)
    await new Promise(resolve => setTimeout(resolve, 500))
    onConfirm?.(secrets)
    setLocking(false)
    onClose()
  }

  return createPortal(
    <div className="sm-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose() }}>
      <div className="sm-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descId} ref={dialogRef}>
        <header className="sm-header">
          <div className="sm-header-icon"><KeyRound size={18} /></div>
          <div className="sm-header-text">
            <h2 id={titleId}>IBM Secrets Manager — Environment Variables</h2>
            <p id={descId}>
              Encrypted at rest and injected into containers at deploy time. Values are write-only and are never shown again.
            </p>
          </div>
          <button type="button" className="sm-icon-btn" onClick={onClose} disabled={busy} aria-label="Close"><X size={16} /></button>
        </header>

        <div className="sm-body">
          <div className="sm-subhead">
            <span className="sm-project">Project <code>{projectId}</code></span>
            {isDemoMode && <span className="sm-demo">Demo vault</span>}
            <button type="button" className="sm-link" onClick={reload} disabled={loading}>
              <RefreshCw size={13} className={loading ? 'sm-spin' : undefined} /> Refresh
            </button>
          </div>

          {(loadError || actionError) && (
            <div className="sm-alert" role="alert"><AlertTriangle size={15} /> {loadError ?? actionError}</div>
          )}

          <div className="sm-table-wrap">
            <table className="sm-table">
              <thead>
                <tr><th scope="col">Key name</th><th scope="col">Scope</th><th scope="col">Value</th><th scope="col" className="sm-col-action">Action</th></tr>
              </thead>
              <tbody>
                {loading && !secrets.length ? (
                  [0, 1, 2].map(row => (
                    <tr key={row} className="sm-skeleton-row" aria-hidden="true">
                      <td><span /></td><td><span /></td><td><span /></td><td><span /></td>
                    </tr>
                  ))
                ) : secrets.length ? (
                  secrets.map(secret => <SecretRow key={secret.key} secret={secret} locked={busy} onDelete={handleDelete} />)
                ) : (
                  <tr><td colSpan={4} className="sm-empty">No secrets stored yet. Add your first key below.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <form className="sm-form" onSubmit={handleSave} noValidate>
            <p className="sm-form-title"><Plus size={14} /> Add new secret</p>
            <div className="sm-form-grid">
              <label className="sm-field">
                <span>Key</span>
                <input ref={keyInputRef} className="sm-input sm-input--mono" value={key} placeholder="OPENAI_API_KEY"
                  autoComplete="off" spellCheck={false} aria-invalid={keyInvalid || undefined} disabled={busy}
                  onChange={event => setKey(event.target.value.toUpperCase().replace(/\s+/g, '_'))} />
              </label>
              <label className="sm-field sm-field--scope">
                <span>Scope</span>
                <select className="sm-input" value={scope} onChange={event => setScope(event.target.value as SecretScope)} disabled={busy}>
                  {SCOPES.map(option => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label className="sm-field sm-field--value">
                <span>Value</span>
                <div className="sm-input-group">
                  <input className="sm-input sm-input--mono" type={showValue ? 'text' : 'password'} value={value}
                    placeholder="sk-…" autoComplete="new-password" spellCheck={false} disabled={busy}
                    onChange={event => setValue(event.target.value)} />
                  <button type="button" className="sm-eye" onClick={() => setShowValue(show => !show)}
                    aria-label={showValue ? 'Hide value' : 'Show value'} aria-pressed={showValue}>
                    {showValue ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </label>
              <button type="submit" className="sm-btn sm-btn--save" disabled={busy || !trimmedKey || !value || keyInvalid}>
                {saving ? <Loader2 size={14} className="sm-spin" /> : <Save size={14} />}
                {isUpdate ? 'Update key' : 'Save key'}
              </button>
            </div>
            <div className="sm-form-foot" aria-live="polite">
              {formError ? <span className="sm-error">{formError}</span>
                : keyInvalid ? <span className="sm-error">Use UPPER_SNAKE_CASE (A–Z, 0–9, _).</span>
                : isUpdate ? <span className="sm-hint">{trimmedKey} already exists — saving will overwrite it.</span>
                : notice ? <span className="sm-success"><CheckCircle2 size={13} /> {notice}</span>
                : <span className="sm-hint">FRONTEND keys are exposed to the browser bundle — never store private keys there.</span>}
            </div>
          </form>
        </div>

        <footer className="sm-footer">
          <button type="button" className="sm-btn sm-btn--ghost" onClick={onClose} disabled={busy}><X size={14} /> Close</button>
          <button type="button" className="sm-btn sm-btn--primary" onClick={() => void handleConfirm()} disabled={busy || loading}>
            {locking ? <Loader2 size={14} className="sm-spin" /> : <Lock size={14} />}
            {locking ? 'Syncing vault…' : 'Confirm & Lock Vault'}
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
