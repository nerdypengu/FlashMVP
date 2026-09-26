import { useEffect, useState } from 'react'

type AddStepModalProps = {
  onAdd: (step: { id: string; name: string; command: string; durationMs: number; timeoutSeconds: number; enabled: boolean; status: string }) => void
  onClose: () => void
}

export default function AddStepModal({ onAdd, onClose }: AddStepModalProps) {
  const [name, setName] = useState('')
  const [command, setCommand] = useState('')
  const [timeout, setTimeout_] = useState(30)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSubmit = () => {
    if (!name.trim() || !command.trim() || !Number.isFinite(timeout) || timeout < 1) return
    onAdd({
      id: `custom-${crypto.randomUUID()}`,
      name: name.trim(),
      command: command.trim(),
      durationMs: 800,
      timeoutSeconds: timeout,
      enabled: true,
      status: 'PENDING',
    })
    onClose()
  }

  return (
    <div className="modal-overlay" onMouseDown={onClose}>
      <div className="modal-box" role="dialog" aria-modal="true" aria-labelledby="add-step-title" onMouseDown={e => e.stopPropagation()}>
        <div className="modal-title" id="add-step-title">➕ Add Custom QA Step</div>

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

        <div className="modal-actions">
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn--primary" onClick={handleSubmit} disabled={!name.trim() || !command.trim() || !Number.isFinite(timeout) || timeout < 1}>
            Add to Pipeline
          </button>
        </div>
      </div>
    </div>
  )
}
