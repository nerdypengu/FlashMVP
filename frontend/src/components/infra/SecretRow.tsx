import { useEffect, useState } from 'react'
import { Check, Copy, Loader2, Trash2 } from 'lucide-react'
import type { SecretRecord } from '../../hooks/useSecrets'

/** BL-INF-02 — one masked secret row with copy-key and a two-step delete. */
export default function SecretRow({ secret, locked, fresh, onDelete }: {
  secret: SecretRecord
  locked: boolean
  fresh?: boolean
  onDelete: (key: string) => Promise<void>
}) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!confirming) return
    const timer = setTimeout(() => setConfirming(false), 4000)
    return () => clearTimeout(timer)
  }, [confirming])

  const handleDelete = async () => {
    if (!confirming) { setConfirming(true); return }
    setDeleting(true)
    try { await onDelete(secret.key) } finally { setDeleting(false); setConfirming(false) }
  }

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(secret.key)
      setCopied(true)
      setTimeout(() => setCopied(false), 1400)
    } catch { /* ignore */ }
  }

  const scope = String(secret.scope).toUpperCase()

  return (
    <tr className={`${deleting ? 'is-deleting' : ''}${fresh ? ' is-fresh' : ''}`}>
      <td>
        <span className="sm-key-cell">
          <code className="sm-key">{secret.key}</code>
          <button type="button" className="sm-copy" onClick={copyKey} aria-label={`Copy ${secret.key}`}>
            {copied ? <Check size={12} /> : <Copy size={12} />}
          </button>
        </span>
      </td>
      <td><span className={`sm-scope sm-scope--${scope.toLowerCase()}`}>{scope}</span></td>
      <td>
        <span className="sm-masked" aria-label="Masked value">
          <span className="sm-lock-dot" aria-hidden="true" />{secret.masked_value}
        </span>
      </td>
      <td className="sm-col-action">
        <button type="button" className={`sm-del${confirming ? ' is-confirming' : ''}`} disabled={locked || deleting}
          onClick={() => void handleDelete()} aria-label={confirming ? `Confirm delete ${secret.key}` : `Delete ${secret.key}`}>
          {deleting ? <Loader2 size={13} className="fx-spin" /> : <Trash2 size={13} />}
          <span>{confirming ? 'Confirm' : 'Delete'}</span>
        </button>
      </td>
    </tr>
  )
}
