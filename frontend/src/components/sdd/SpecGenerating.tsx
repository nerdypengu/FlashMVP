import { useEffect, useState } from 'react'
import { Check, Loader2, Sparkles } from 'lucide-react'

const STEPS = [
  'Parsing flashmvp.json manifest',
  'Drafting requirements & user stories',
  'Designing technical architecture',
  'Breaking the work into tasks',
  'Binding IBM Cloud tools',
]

/** Loading state shown while IBM Bob drafts the first spec (BL-SDD-01 is async). */
export default function SpecGenerating({ templateName, prompt, onCancel }: {
  templateName: string
  prompt: string
  onCancel?: () => void
}) {
  const [step, setStep] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setStep(value => Math.min(value + 1, STEPS.length - 1)), 520)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="sr-generating" role="status" aria-live="polite">
      <div className="sr-generating-orb" aria-hidden="true"><Sparkles size={22} /></div>
      <h2 className="sr-generating-title">IBM Bob is drafting your spec</h2>
      <p className="sr-generating-sub">{templateName} · “{prompt}”</p>
      <ol className="sr-generating-steps">
        {STEPS.map((label, index) => (
          <li key={label} className={index < step ? 'is-done' : index === step ? 'is-active' : ''}>
            {index < step ? <Check size={14} /> : index === step ? <Loader2 size={14} className="sr-spin" /> : <span className="sr-generating-bullet" />}
            {label}
          </li>
        ))}
      </ol>
      <div className="sr-skeleton" aria-hidden="true">
        <span style={{ width: '42%' }} /><span style={{ width: '88%' }} /><span style={{ width: '76%' }} /><span style={{ width: '64%' }} />
      </div>
      {onCancel && <button type="button" className="sr-btn sr-btn--ghost" onClick={onCancel}>Cancel</button>}
    </div>
  )
}
