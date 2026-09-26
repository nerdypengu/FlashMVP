import type { CSSProperties } from 'react'
import { Check } from 'lucide-react'
import './WorkflowStepper.css'

const STEPS = ['Foundation', 'Spec review', 'QA pipeline', 'Deploy'] as const

/** Delivery-flow progress rail. `current` is 0-based. */
export default function WorkflowStepper({ current }: { current: number }) {
  const progress = Math.min(current, STEPS.length - 1) / (STEPS.length - 1)
  return (
    <nav className="wf-root" aria-label="Delivery progress">
      <ol className="wf-rail" style={{ '--wf-progress': progress } as CSSProperties}>
        {STEPS.map((label, index) => {
          const state = index < current ? 'done' : index === current ? 'current' : 'todo'
          return (
            <li key={label} className={`wf-step wf-step--${state}`} aria-current={state === 'current' ? 'step' : undefined}>
              <span className="wf-dot">{state === 'done' ? <Check size={11} strokeWidth={3.2} /> : <span>{index + 1}</span>}</span>
              <span className="wf-label">{label}</span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
