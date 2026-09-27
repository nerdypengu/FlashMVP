import { Check } from 'lucide-react'
import './WorkflowStepper.css'

const STEPS = ['Choose template', 'Review spec', 'QA pipeline', 'Deploy'] as const

/** Compact progress indicator for the FlashMVP delivery flow. `current` is 0-based. */
export default function WorkflowStepper({ current }: { current: number }) {
  return (
    <ol className="wf-stepper" aria-label="Delivery progress">
      {STEPS.map((label, index) => {
        const state = index < current ? 'done' : index === current ? 'current' : 'todo'
        return (
          <li key={label} className={`wf-step wf-step--${state}`} aria-current={state === 'current' ? 'step' : undefined}>
            <span className="wf-step-dot">{state === 'done' ? <Check size={11} strokeWidth={3} /> : index + 1}</span>
            <span className="wf-step-label">{label}</span>
          </li>
        )
      })}
    </ol>
  )
}
