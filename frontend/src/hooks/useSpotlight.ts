import { useCallback, type PointerEvent } from 'react'

/** Feeds the cursor position into --mx / --my for `.fx-spotlight` surfaces. */
export function useSpotlight<T extends HTMLElement>() {
  return useCallback((event: PointerEvent<T>) => {
    const target = event.currentTarget
    const rect = target.getBoundingClientRect()
    target.style.setProperty('--mx', `${event.clientX - rect.left}px`)
    target.style.setProperty('--my', `${event.clientY - rect.top}px`)
  }, [])
}
