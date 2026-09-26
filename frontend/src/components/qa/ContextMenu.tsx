import { useEffect } from 'react'

type ContextMenuProps = {
  x: number
  y: number
  onAddStep: () => void
  onRunAll: () => void
  onReset: () => void
  onClose: () => void
}

export default function ContextMenu({ x, y, onAddStep, onRunAll, onReset, onClose }: ContextMenuProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      {/* backdrop */}
      <div
        style={{ position: 'fixed', inset: 0, zIndex: 999 }}
        onMouseDown={onClose}
      />
      <div className="context-menu" style={{ top: y, left: x }}>
        <button className="context-menu-item" onClick={() => { onAddStep(); onClose() }}>
          ➕ Add Custom QA Step
        </button>
        <button className="context-menu-item" onClick={() => { onRunAll(); onClose() }}>
          ▶️ Run All Steps Now
        </button>
        <hr className="context-menu-divider" />
        <button className="context-menu-item" onClick={() => { onReset(); onClose() }}>
          🔄 Reset Pipeline
        </button>
      </div>
    </>
  )
}
