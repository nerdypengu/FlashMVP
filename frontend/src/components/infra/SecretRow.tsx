import { useEffect, useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import type { SecretRecord } from '../../hooks/useSecrets'

/** BL-INF-02 — one masked secret row with a two-step delete. */
export default function SecretRow({ secret, locked, onDelete }: {
  secret: SecretRecord
  locked: boolean
  onDelete: (key: string) => Promise<void>
}) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!confirming) return
    const timer = setTimeout(() => setConfirming(false), 4000)
    return () => clearTimeout(timer)
  }, [confirming])

  const handleDelete = async () => {
    if (!confirming) { setConfirming(true); return }
    setDeleting(true)
    try {
      await onDelete(secret.key)
    } finally {
      setDeleting(false)
      setConfirming(false)
    }
  }

  const scope = String(secret.scope).toUpperCase()

  return (
    <tr className={deleting ? 'is-deleting' : undefined}>
      <td><code className="sm-key">{secret.key}</code></td>
      <td><span className={`sm-scope sm-scope--${scope.toLowerCase()}`}>{scope}</span></td>
      <td><span className="sm-masked" aria-label="Masked value">{secret.masked_value}</span></td>
      <td className="sm-col-action">
        <button type="button" className={`sm-del${confirming ? ' is-confirming' : ''}`} disabled={locked || deleting}
          onClick={() => void handleDelete()} aria-label={confirming ? `Confirm delete ${secret.key}` : `Delete ${secret.key}`}>
          {deleting ? <Loader2 size={14} className="sm-spin" /> : <Trash2 size={14} />}
          <span>{confirming ? 'Confirm' : 'Delete'}</span>
        </button>
      </td>
    </tr>
  )
}
