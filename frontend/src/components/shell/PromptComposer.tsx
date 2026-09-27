import { forwardRef, useEffect, useId, useState, type CSSProperties, type RefObject } from 'react'
import { ArrowUp, CornerDownLeft, Sparkles } from 'lucide-react'
import { MAX_PROMPT_LENGTH, MIN_PROMPT_LENGTH, QUICK_PROMPTS, type StarterTemplate } from '../../data/templates'

const PLACEHOLDERS = [
  'A marketplace where local bakers list products and customers pay with Stripe…',
  'An internal helpdesk that triages tickets and tracks SLAs…',
  'A clinic booking app with SMS reminders and calendar sync…',
  'A SaaS analytics dashboard with team workspaces…',
]

/** Animated "typing" placeholder that cycles through example prompts. */
function useTypingPlaceholder(enabled: boolean) {
  const [text, setText] = useState('')
  useEffect(() => {
    if (!enabled) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setText(PLACEHOLDERS[0]); return }
    let index = 0
    let chars = 0
    let deleting = false
    let timer: ReturnType<typeof setTimeout>
    const tick = () => {
      const target = PLACEHOLDERS[index]
      if (!deleting) {
        chars += 1
        setText(target.slice(0, chars))
        if (chars >= target.length) { deleting = true; timer = setTimeout(tick, 2200); return }
        timer = setTimeout(tick, 28 + Math.random() * 30)
      } else {
        chars -= 3
        setText(target.slice(0, Math.max(0, chars)))
        if (chars <= 0) { deleting = false; index = (index + 1) % PLACEHOLDERS.length; timer = setTimeout(tick, 350); return }
        timer = setTimeout(tick, 16)
      }
    }
    timer = setTimeout(tick, 600)
    return () => clearTimeout(timer)
  }, [enabled])
  return text
}

type Props = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  template: StarterTemplate
  showError: boolean
  /** Locks the text once a project spec exists (creation manifest). */
  readOnly?: boolean
  /** Show the example-prompt chips under the box. */
  suggestions?: boolean
  submitLabel?: string
}

const PromptComposer = forwardRef<HTMLTextAreaElement, Props>(function PromptComposer(
  { value, onChange, onSubmit, template, showError, readOnly = false, suggestions = true, submitLabel = 'Generate spec' }, ref,
) {
  const id = useId()
  const [focused, setFocused] = useState(false)
  const placeholder = useTypingPlaceholder(!value && !readOnly)
  const ready = value.trim().length >= MIN_PROMPT_LENGTH
  const pct = Math.min(100, (value.length / MAX_PROMPT_LENGTH) * 100)

  return (
    <div className="pc-root">
      <div className={`pc-shell${focused && !readOnly ? ' is-focused' : ''}${showError ? ' is-invalid' : ''}${ready ? ' is-ready' : ''}${readOnly ? ' is-readonly' : ''}`}>
        <div className="pc-glow" aria-hidden="true" />
        <label htmlFor={id} className="fx-sr-only">Describe your project</label>
        <textarea id={id} ref={ref} className="pc-input" rows={3} maxLength={MAX_PROMPT_LENGTH}
          value={value} placeholder={placeholder} aria-invalid={showError || undefined} readOnly={readOnly}
          aria-describedby={`${id}-hint`}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          onChange={event => onChange(event.target.value)}
          onKeyDown={event => { if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) { event.preventDefault(); onSubmit() } }} />
        <div className="pc-toolbar">
          <span className="pc-template" style={{ '--pc-accent': template.accent } as CSSProperties}>
            <span className="pc-template-dot" aria-hidden="true" />
            {template.name}
          </span>
          <span className="pc-meter" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>
          <span id={`${id}-hint`} className={`pc-hint${showError ? ' is-error' : ''}`}>
            {showError
              ? `At least ${MIN_PROMPT_LENGTH} characters`
              : readOnly
                ? <>Creation manifest · locked</>
                : <><kbd className="fx-kbd">Ctrl</kbd><kbd className="fx-kbd"><CornerDownLeft size={10} /></kbd> to generate</>}
          </span>
          <button type="button" className="pc-send" onClick={onSubmit} aria-label={`${submitLabel} with IBM Bob`}>
            <span>{submitLabel}</span>
            <span className="pc-send-icon"><ArrowUp size={15} strokeWidth={2.5} /></span>
          </button>
        </div>
      </div>
      {suggestions && !readOnly && <div className="pc-suggestions" role="list" aria-label="Example prompts">
        <Sparkles size={13} aria-hidden="true" />
        {QUICK_PROMPTS.map(text => (
          <button key={text} type="button" role="listitem" className="pc-suggestion"
            onClick={() => { onChange(text); (ref as RefObject<HTMLTextAreaElement | null>)?.current?.focus() }}>
            {text}
          </button>
        ))}
      </div>}
    </div>
  )
})

export default PromptComposer
