import type { CSSProperties, KeyboardEvent } from 'react'
import { ArrowRight, Atom, Check, Database, Hexagon, KeyRound, Server, ShieldCheck, Timer, type LucideIcon } from 'lucide-react'
import ArchitecturePreview from './ArchitecturePreview'
import { useSpotlight } from '../../hooks/useSpotlight'
import type { IBMBindingName, StarterTemplate } from '../../data/templates'

const ICONS: Record<string, LucideIcon> = { Atom, Hexagon }
const BINDING_ICONS: Record<IBMBindingName, LucideIcon> = {
  'IBM Code Engine': Server,
  'IBM Cloud DB': Database,
  'IBM Secrets Manager': KeyRound,
  'Watsonx QA': ShieldCheck,
}

/** BL-ARC-01 — IBM-ready starter template card. Click selects; "Use template" starts immediately. */
export default function TemplateCard({ template, selected, index, onSelect, onUse }: {
  template: StarterTemplate
  selected: boolean
  index: number
  onSelect: () => void
  onUse: () => void
}) {
  const Icon = ICONS[template.icon] ?? Atom
  const onPointerMove = useSpotlight<HTMLElement>()

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.target !== event.currentTarget) return
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect() }
  }

  return (
    <article
      className={`tc-card fx-spotlight${selected ? ' is-selected fx-beam' : ''}`}
      style={{ '--tc-accent': template.accent, '--fx-beam-color': template.accent, animationDelay: `${120 + index * 90}ms` } as CSSProperties}
      role="radio" aria-checked={selected} tabIndex={selected ? 0 : -1} aria-label={`${template.name} — ${template.tagline}`}
      onClick={onSelect} onKeyDown={onKeyDown} onPointerMove={onPointerMove}
    >
      <header className="tc-head">
        <span className="tc-icon" aria-hidden="true"><Icon size={20} strokeWidth={2} /></span>
        <div className="tc-titles">
          <h3 className="tc-title">{template.name}</h3>
          <p className="tc-tagline">{template.tagline}</p>
        </div>
        <span className="tc-radio" aria-hidden="true"><Check size={12} strokeWidth={3.2} /></span>
      </header>

      {template.badge && <span className="tc-badge">{template.badge}</span>}

      <div className="tc-preview">
        <ArchitecturePreview template={template} active={selected} />
      </div>

      <p className="tc-desc">{template.description}</p>

      <ul className="tc-stack" aria-label="Stack">
        {template.stack.map(item => <li key={item}>{item}</li>)}
      </ul>

      <ul className="tc-bindings" aria-label="IBM tool bindings">
        {template.ibm_bindings.map(binding => {
          const BindingIcon = BINDING_ICONS[binding]
          return (
            <li key={binding} title={binding}>
              <BindingIcon size={13} aria-hidden="true" />
              <span>{binding.replace(/^IBM /, '')}</span>
            </li>
          )
        })}
      </ul>

      <footer className="tc-foot">
        <span className="tc-meta"><Timer size={13} aria-hidden="true" /> Deploys in {template.estimatedDeploy.replace('~', '≈ ')}</span>
        <span className="tc-meta tc-meta--qa">{template.qaPipeline.length} QA gates</span>
        <button type="button" className="tc-use" onClick={event => { event.stopPropagation(); onUse() }}
          aria-label={`Use the ${template.name} template`}>
          Select <ArrowRight size={14} />
        </button>
      </footer>
    </article>
  )
}
