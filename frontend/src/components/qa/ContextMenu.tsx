import { useEffect } from 'react'
import { Plus, Play, RotateCcw } from 'lucide-react'

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
        <button className="context-menu-item" onClick={() => { onAddStep(); onClose() }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={14} /> <span>Add Custom QA Step</span>
        </button>
        <button className="context-menu-item" onClick={() => { onRunAll(); onClose() }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Play size={14} /> <span>Run All Steps Now</span>
        </button>
        <hr className="context-menu-divider" />
        <button className="context-menu-item" onClick={() => { onReset(); onClose() }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <RotateCcw size={14} /> <span>Reset Pipeline</span>
        </button>
      </div>
    </>
  )
}
