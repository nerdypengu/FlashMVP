/**
 * BL-INF-02 — IBM Secrets Manager · Environment Variables modal.
 * Lists masked secrets, adds/updates keys with a scope, bulk-imports .env
 * text, deletes keys and finally "locks" the vault before deployment.
 */
import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import {
  AlertTriangle, CheckCircle2, Eye, EyeOff, FileUp, KeyRound, Loader2, Lock, Plus, RefreshCw, Save, Search, ShieldCheck, X,
} from 'lucide-react'
import SecretRow from './SecretRow'
import { SECRET_KEY_PATTERN, useSecrets, type SecretRecord, type SecretScope } from '../../hooks/useSecrets'
import { parseEnv } from '../../lib/envParser'
import { toMessage } from '../../lib/apiClient'
import { isDemoMode } from '../../config'
import '../../styles/flash-ui.css'
import './SecretsModal.css'

const SCOPES: { id: SecretScope; hint: string }[] = [
  { id: 'ALL', hint: 'Injected into every service' },
  { id: 'BACKEND', hint: 'Server-side only — safest for private keys' },
  { id: 'FRONTEND', hint: 'Bundled into the browser — public values only' },
]
const FOCUSABLE = 'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'

export default function SecretsModal({ open, projectId, onClose, onConfirm }: {
  open: boolean
  projectId: string
  onClose: () => void
  onConfirm?: (secrets: SecretRecord[]) => void
}) {
  const { secrets, loading, loadError, save, remove, reload } = useSecrets(projectId, open)
  const [mode, setMode] = useState<'single' | 'import'>('single')
  const [key, setKey] = useState('')
  const [value, setValue] = useState('')
  const [scope, setScope] = useState<SecretScope>('BACKEND')
  const [showValue, setShowValue] = useState(false)
  const [envText, setEnvText] = useState('')
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [fresh, setFresh] = useState<string[]>([])
  const [locking, setLocking] = useState(false)
  const dialogRef = useRef<HTMLDivElement>(null)
  const keyInputRef = useRef<HTMLInputElement>(null)
  const titleId = useId()
  const descId = useId()

  const busy = saving || locking
  const trimmedKey = key.trim()
  const keyInvalid = trimmedKey.length > 0 && !SECRET_KEY_PATTERN.test(trimmedKey)
  const isUpdate = secrets.some(secret => secret.key === trimmedKey)
  const parsed = useMemo(() => parseEnv(envText), [envText])
  const visible = useMemo(() => {
    const q = query.trim().toUpperCase()
    return q ? secrets.filter(secret => secret.key.includes(q) || String(secret.scope).includes(q)) : secrets
  }, [secrets, query])
  const counts = useMemo(() => ({
    ALL: secrets.filter(s => s.scope === 'ALL').length,
    BACKEND: secrets.filter(s => s.scope === 'BACKEND').length,
    FRONTEND: secrets.filter(s => s.scope === 'FRONTEND').length,
  }), [secrets])

  const busyRef = useRef(busy)
  const onCloseRef = useRef(onClose)
  busyRef.current = busy
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return
    setKey(''); setValue(''); setScope('BACKEND'); setShowValue(false); setEnvText(''); setQuery(''); setMode('single')
    setFormError(null); setActionError(null); setNotice(null); setLocking(false); setFresh([])
  }, [open])

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
    const timer = setTimeout(() => setNotice(null), 2800)
    return () => clearTimeout(timer)
  }, [notice])

  if (!open) return null

  const markFresh = (keys: string[]) => {
    setFresh(keys)
    setTimeout(() => setFresh([]), 1600)
  }

  const handleSave = async (event: FormEvent) => {
    event.preventDefault()
    setFormError(null)
    if (!trimmedKey) { setFormError('Enter a key name.'); keyInputRef.current?.focus(); return }
    if (keyInvalid) { setFormError('Use UPPER_SNAKE_CASE: letters, digits and underscores, not starting with a digit.'); return }
    if (!value) { setFormError('Enter a value for this secret.'); return }
    setSaving(true)
    try {
      await save(trimmedKey, value, scope)
      setNotice(`${trimmedKey} ${isUpdate ? 'updated' : 'encrypted & stored'}.`)
      markFresh([trimmedKey])
      setKey(''); setValue(''); setShowValue(false)
      keyInputRef.current?.focus()
    } catch (error) {
      setFormError(toMessage(error, 'Could not save the secret.'))
    } finally {
      setSaving(false)
    }
  }

  const handleImport = async () => {
    if (!parsed.pairs.length) { setFormError('Paste at least one KEY=VALUE line.'); return }
    setFormError(null)
    setSaving(true)
    const done: string[] = []
    try {
      for (const pair of parsed.pairs) {
        await save(pair.key, pair.value, scope)
        done.push(pair.key)
      }
      setNotice(`${done.length} secret${done.length === 1 ? '' : 's'} imported to ${scope}.`)
      markFresh(done)
      setEnvText('')
      setMode('single')
    } catch (error) {
      setFormError(`${toMessage(error, 'Import failed.')} (${done.length}/${parsed.pairs.length} imported)`)
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
    await new Promise(resolve => setTimeout(resolve, 650))
    onConfirm?.(secrets)
    setLocking(false)
    onClose()
  }

  return createPortal(
    <div className="sm-backdrop" onMouseDown={event => { if (event.target === event.currentTarget && !busy) onClose() }}>
      <div className="sm-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={descId} ref={dialogRef}>
        <header className="sm-header">
          <div className="sm-header-icon" aria-hidden="true"><KeyRound size={19} /></div>
          <div className="sm-header-text">
            <h2 id={titleId}>Environment secrets</h2>
            <p id={descId}>
              IBM Secrets Manager · encrypted at rest, injected into containers at deploy time. Values are write-only.
            </p>
          </div>
          <button type="button" className="sm-icon-btn" onClick={onClose} disabled={busy} aria-label="Close"><X size={16} /></button>
        </header>

        <div className="sm-body">
          <div className="sm-toolbar">
            <span className="sm-project"><span className="fx-dot-live" aria-hidden="true" /> <code>{projectId}</code></span>
            {isDemoMode && <span className="sm-demo">Demo vault</span>}
            <div className="sm-counts" aria-label="Secrets by scope">
              <span>{secrets.length} total</span>
              <span className="sm-count sm-count--backend">{counts.BACKEND} backend</span>
              <span className="sm-count sm-count--frontend">{counts.FRONTEND} frontend</span>
              <span className="sm-count sm-count--all">{counts.ALL} all</span>
            </div>
            <label className="sm-search">
              <Search size={13} aria-hidden="true" />
              <span className="fx-sr-only">Filter secrets</span>
              <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Filter…" spellCheck={false} />
            </label>
            <button type="button" className="sm-icon-btn" onClick={reload} disabled={loading} aria-label="Refresh secrets">
              <RefreshCw size={14} className={loading ? 'fx-spin' : undefined} />
            </button>
          </div>

          {(loadError || actionError) && (
            <div className="sm-alert" role="alert"><AlertTriangle size={15} /> {loadError ?? actionError}</div>
          )}

          <div className="sm-table-wrap">
            <table className="sm-table">
              <thead>
                <tr><th scope="col">Key</th><th scope="col">Scope</th><th scope="col">Value</th><th scope="col" className="sm-col-action"><span className="fx-sr-only">Actions</span></th></tr>
              </thead>
              <tbody>
                {loading && !secrets.length ? (
                  [0, 1, 2].map(row => (
                    <tr key={row} className="sm-skeleton-row" aria-hidden="true">
                      <td><span /></td><td><span /></td><td><span /></td><td><span /></td>
                    </tr>
                  ))
                ) : visible.length ? (
                  visible.map(secret => (
                    <SecretRow key={secret.key} secret={secret} locked={busy} fresh={fresh.includes(secret.key)} onDelete={handleDelete} />
                  ))
                ) : (
                  <tr><td colSpan={4} className="sm-empty">
                    {secrets.length ? `No secrets match “${query}”.` : <><ShieldCheck size={18} /> The vault is empty. Add your first key below.</>}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          <section className="sm-form" aria-label="Add secrets">
            <div className="sm-form-head">
              <div className="sm-modes" role="tablist" aria-label="Add mode">
                <button type="button" role="tab" aria-selected={mode === 'single'} className={mode === 'single' ? 'is-on' : ''}
                  onClick={() => { setMode('single'); setFormError(null) }}><Plus size={13} /> Single key</button>
                <button type="button" role="tab" aria-selected={mode === 'import'} className={mode === 'import' ? 'is-on' : ''}
                  onClick={() => { setMode('import'); setFormError(null) }}><FileUp size={13} /> Paste .env</button>
              </div>
              <div className="sm-scope-seg" role="radiogroup" aria-label="Scope">
                {SCOPES.map(option => (
                  <button key={option.id} type="button" role="radio" aria-checked={scope === option.id} title={option.hint}
                    className={`sm-scope-opt sm-scope-opt--${option.id.toLowerCase()}${scope === option.id ? ' is-on' : ''}`}
                    onClick={() => setScope(option.id)} disabled={busy}>
                    {option.id}
                  </button>
                ))}
              </div>
            </div>

            {mode === 'single' ? (
              <form className="sm-form-grid" onSubmit={handleSave} noValidate>
                <label className="sm-field">
                  <span>Key</span>
                  <input ref={keyInputRef} className="sm-input sm-input--mono" value={key} placeholder="OPENAI_API_KEY"
                    autoComplete="off" spellCheck={false} aria-invalid={keyInvalid || undefined} disabled={busy}
                    onChange={event => setKey(event.target.value.toUpperCase().replace(/\s+/g, '_'))} />
                </label>
                <label className="sm-field">
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
                <button type="submit" className="fx-btn fx-btn--primary sm-save" disabled={busy || !trimmedKey || !value || keyInvalid}>
                  {saving ? <Loader2 size={14} className="fx-spin" /> : <Save size={14} />}
                  {isUpdate ? 'Update' : 'Save'}
                </button>
              </form>
            ) : (
              <div className="sm-import">
                <label className="fx-sr-only" htmlFor={`${titleId}-env`}>Paste .env content</label>
                <textarea id={`${titleId}-env`} className="sm-input sm-input--mono sm-env" rows={5} spellCheck={false}
                  placeholder={'# Paste your .env\nSTRIPE_SECRET_KEY=sk_live_…\nJWT_SECRET="super-secret"'}
                  value={envText} onChange={event => setEnvText(event.target.value)} disabled={busy} />
                <div className="sm-import-foot">
                  <span className="sm-hint">
                    {parsed.pairs.length
                      ? <><strong>{parsed.pairs.length}</strong> key{parsed.pairs.length === 1 ? '' : 's'} detected{parsed.invalid ? ` · ${parsed.invalid} line${parsed.invalid === 1 ? '' : 's'} skipped` : ''} → <strong>{scope}</strong></>
                      : 'Comments, export prefixes and quoted values are supported.'}
                  </span>
                  <button type="button" className="fx-btn fx-btn--primary fx-btn--sm" onClick={() => void handleImport()} disabled={busy || !parsed.pairs.length}>
                    {saving ? <Loader2 size={13} className="fx-spin" /> : <FileUp size={13} />} Import {parsed.pairs.length || ''}
                  </button>
                </div>
              </div>
            )}

            <div className="sm-form-foot" aria-live="polite">
              {formError ? <span className="sm-error">{formError}</span>
                : mode === 'single' && keyInvalid ? <span className="sm-error">Use UPPER_SNAKE_CASE (A–Z, 0–9, _).</span>
                : mode === 'single' && isUpdate ? <span className="sm-hint">{trimmedKey} already exists. Saving will overwrite it.</span>
                : notice ? <span className="sm-success"><CheckCircle2 size={13} /> {notice}</span>
                : scope === 'FRONTEND' ? <span className="sm-warn"><AlertTriangle size={12} /> FRONTEND values ship to the browser. Never store private keys here.</span>
                : <span className="sm-hint">{SCOPES.find(option => option.id === scope)?.hint}.</span>}
            </div>
          </section>
        </div>

        <footer className="sm-footer">
          <span className="sm-footer-note"><Lock size={12} /> Encrypted at rest · write-only · never echoed back</span>
          <div className="sm-footer-actions">
            <button type="button" className="fx-btn fx-btn--ghost" onClick={onClose} disabled={busy}>Close</button>
            <button type="button" className="fx-btn fx-btn--success" onClick={() => void handleConfirm()} disabled={busy || loading}>
              {locking ? <Loader2 size={14} className="fx-spin" /> : <Lock size={14} />}
              {locking ? 'Syncing vault…' : 'Confirm & lock vault'}
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
