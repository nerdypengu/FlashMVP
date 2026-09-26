import { useEffect, useState } from 'react'

type AddStepModalProps = {
  stages: readonly string[]
  initialStep?: { id: string; name: string; command: string; stage: string; timeoutSeconds?: number; enabled: boolean }
  onAdd: (step: { id: string; name: string; command: string; durationMs: number; timeoutSeconds: number; enabled: boolean; status: string; stage: string }) => Promise<boolean>
  onClose: () => void
}

export default function AddStepModal({ stages, initialStep, onAdd, onClose }: AddStepModalProps) {
  const [name, setName] = useState(initialStep?.name ?? '')
  const [command, setCommand] = useState(initialStep?.command ?? '')
  const [timeout, setTimeout_] = useState(initialStep?.timeoutSeconds ?? 30)
  const [stage, setStage] = useState(initialStep?.stage ?? stages[0])
  const [saving, setSaving] = useState(false)
  const [saveFailed, setSaveFailed] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !saving) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose, saving])

  const handleSubmit = async () => {
    if (saving || !name.trim() || !command.trim() || !Number.isInteger(timeout) || timeout < 1) return
    setSaving(true)
    const saved = await onAdd({
      id: initialStep?.id ?? `custom-${crypto.randomUUID()}`,
      name: name.trim(),
      command: command.trim(),
      durationMs: 800,
      timeoutSeconds: timeout,
      enabled: initialStep?.enabled ?? true,
      status: 'PENDING',
      stage,
    })
    setSaving(false)
    setSaveFailed(!saved)
    if (saved) onClose()
  }

  return (
    <div className="modal-overlay" onMouseDown={() => { if (!saving) onClose() }}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-labelledby="add-step-title" onMouseDown={e => e.stopPropagation()}>
        <div className="modal-title" id="add-step-title">{initialStep ? 'Edit QA Step' : 'Add Custom QA Step'}</div>

        <div className="modal-field">
          <label htmlFor="qa-step-name">Step Name</label>
          <input
            id="qa-step-name"
            autoFocus
            className="modal-input"
            placeholder="e.g. E2E Tests"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        </div>

        <div className="modal-field">
          <label htmlFor="qa-step-command">Command</label>
          <input
            id="qa-step-command"
            className="modal-input"
            placeholder="e.g. npm run test:e2e"
            value={command}
            onChange={e => setCommand(e.target.value)}
          />
        </div>

        <div className="modal-field">
          <label htmlFor="qa-step-stage">Stage</label>
          <select id="qa-step-stage" className="modal-input" value={stage} onChange={e => setStage(e.target.value)}>
            {stages.map(option => <option key={option} value={option}>{option}</option>)}
          </select>
        </div>

        <div className="modal-field">
          <label htmlFor="qa-step-timeout">Timeout (seconds)</label>
          <input
            id="qa-step-timeout"
            className="modal-input"
            type="number"
            min={1}
            value={timeout}
            onChange={e => setTimeout_(Number(e.target.value))}
          />
        </div>

        {saveFailed && <p role="alert">Gagal menyimpan. Periksa koneksi dan izin database, lalu coba kembali.</p>}
        <div className="modal-actions">
          <button className="btn btn--ghost" onClick={onClose} disabled={saving}>Cancel</button>
          <button className="btn btn--primary" onClick={handleSubmit} disabled={saving || !name.trim() || !command.trim() || !Number.isInteger(timeout) || timeout < 1}>
            {saving ? 'Saving…' : initialStep ? 'Save changes' : 'Add to Pipeline'}
          </button>
        </div>
      </div>
    </div>
  )
}
