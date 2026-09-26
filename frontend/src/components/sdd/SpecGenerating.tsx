import { useEffect, useState } from 'react'
import { Check, FileSearch, Boxes, ClipboardList, FileText, Link2, Sparkles, X } from 'lucide-react'

const STEPS = [
  { icon: FileSearch, label: 'Parsing flashmvp.json manifest' },
  { icon: FileText, label: 'Drafting requirements & user stories' },
  { icon: Boxes, label: 'Designing technical architecture' },
  { icon: ClipboardList, label: 'Breaking the work into tasks' },
  { icon: Link2, label: 'Binding IBM Cloud tools' },
]

/** Loading state while IBM Bob drafts the first spec (BL-SDD-01 is async). */
export default function SpecGenerating({ templateName, prompt, onCancel }: {
  templateName: string
  prompt: string
  onCancel?: () => void
}) {
  const [step, setStep] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  useEffect(() => {
    const stepTimer = setInterval(() => setStep(value => Math.min(value + 1, STEPS.length - 1)), 560)
    const clock = setInterval(() => setElapsed(value => value + 0.1), 100)
    return () => { clearInterval(stepTimer); clearInterval(clock) }
  }, [])
  const progress = Math.min(96, ((step + 0.6) / STEPS.length) * 100)

  return (
    <div className="sg-root fx-panel" role="status" aria-live="polite">
      <div className="sg-aurora" aria-hidden="true" />
      <div className="sg-orb" aria-hidden="true">
        <span className="sg-ring sg-ring--1" />
        <span className="sg-ring sg-ring--2" />
        <span className="sg-ring sg-ring--3" />
        <span className="sg-core"><Sparkles size={22} /></span>
      </div>

      <h2 className="sg-title">IBM Bob is drafting your spec</h2>
      <p className="sg-sub"><span className="sg-template">{templateName}</span> “{prompt}”</p>

      <div className="sg-bar" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>

      <div className="sg-body">
        <ol className="sg-steps">
          {STEPS.map(({ icon: Icon, label }, index) => {
            const state = index < step ? 'done' : index === step ? 'active' : 'todo'
            return (
              <li key={label} className={`sg-step is-${state}`}>
                <span className="sg-step-icon">{state === 'done' ? <Check size={13} strokeWidth={3} /> : <Icon size={13} />}</span>
                <span className={state === 'active' ? 'fx-shimmer-text' : undefined}>{label}</span>
              </li>
            )
          })}
        </ol>
        <div className="sg-doc" aria-hidden="true">
          <div className="sg-doc-bar"><i /><i /><i /><span>requirements.md</span></div>
          {[44, 92, 78, 0, 36, 88, 70, 82, 0, 40, 94, 60].map((width, index) =>
            width
              ? <span key={index} className="sg-line" style={{ width: `${width}%`, animationDelay: `${index * 140}ms` }} />
              : <span key={index} className="sg-gap" />,
          )}
        </div>
      </div>

      <div className="sg-foot">
        <span className="sg-clock">{elapsed.toFixed(1)}s</span>
        {onCancel && <button type="button" className="fx-btn fx-btn--ghost fx-btn--sm" onClick={onCancel}><X size={14} /> Cancel</button>}
      </div>
    </div>
  )
}
