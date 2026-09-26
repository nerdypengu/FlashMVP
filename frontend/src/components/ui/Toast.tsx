/**
 * Lightweight toast system for the FlashMVP delivery flow.
 * <ToastProvider> once near the root, then `const toast = useToast()`.
 */
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import '../../styles/flash-ui.css'

type ToastTone = 'success' | 'info' | 'error'
type ToastItem = { id: number; tone: ToastTone; title: string; text?: string; leaving?: boolean }
type ToastApi = {
  show: (tone: ToastTone, title: string, text?: string) => void
  success: (title: string, text?: string) => void
  info: (title: string, text?: string) => void
  error: (title: string, text?: string) => void
}

const ToastContext = createContext<ToastApi | null>(null)
const ICONS = { success: CheckCircle2, info: Info, error: AlertTriangle }

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setItems(list => list.map(item => (item.id === id ? { ...item, leaving: true } : item)))
    setTimeout(() => setItems(list => list.filter(item => item.id !== id)), 240)
  }, [])

  const show = useCallback((tone: ToastTone, title: string, text?: string) => {
    const id = nextId.current++
    setItems(list => [...list.slice(-3), { id, tone, title, text }])
    setTimeout(() => dismiss(id), tone === 'error' ? 6500 : 4200)
  }, [dismiss])

  const api = useMemo<ToastApi>(() => ({
    show,
    success: (title, text) => show('success', title, text),
    info: (title, text) => show('info', title, text),
    error: (title, text) => show('error', title, text),
  }), [show])

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div className="fx-toasts" role="region" aria-label="Notifications" aria-live="polite">
          {items.map(item => {
            const Icon = ICONS[item.tone]
            return (
              <div key={item.id} className={`fx-toast fx-toast--${item.tone}${item.leaving ? ' is-leaving' : ''}`}
                role={item.tone === 'error' ? 'alert' : 'status'}>
                <span className="fx-toast-icon"><Icon size={15} /></span>
                <div className="fx-toast-body">
                  <p className="fx-toast-title">{item.title}</p>
                  {item.text && <p className="fx-toast-text">{item.text}</p>}
                </div>
                <button type="button" className="fx-toast-close" onClick={() => dismiss(item.id)} aria-label="Dismiss notification">
                  <X size={13} />
                </button>
              </div>
            )
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  )
}

const noop = () => {}
const FALLBACK: ToastApi = { show: noop, success: noop, info: noop, error: noop }

/** Safe to call outside the provider (becomes a no-op), so components stay reusable. */
export function useToast(): ToastApi {
  return useContext(ToastContext) ?? FALLBACK
}
