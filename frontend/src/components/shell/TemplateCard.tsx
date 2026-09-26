import type { CSSProperties } from 'react'
import { ArrowRight, Atom, Check, Clock, Hexagon, type LucideIcon } from 'lucide-react'
import type { StarterTemplate } from '../../data/templates'

const ICONS: Record<string, LucideIcon> = { Atom, Hexagon }

/** BL-ARC-01 — one IBM-ready starter template. Click to select, "Use template" to start immediately. */
export default function TemplateCard({ template, selected, onSelect, onUse }: {
  template: StarterTemplate
  selected: boolean
  onSelect: () => void
  onUse: () => void
}) {
  const Icon = ICONS[template.icon] ?? Atom
  return (
    <article className={`ts-card${selected ? ' is-selected' : ''}`} style={{ '--ts-accent': template.accent } as CSSProperties}>
      <button type="button" className="ts-card-hit" role="radio" aria-checked={selected} onClick={onSelect}
        aria-label={`Select ${template.name} template`} />
      <div className="ts-card-top">
        <span className="ts-card-icon" aria-hidden="true"><Icon size={22} /></span>
        {template.badge && <span className="ts-card-badge">{template.badge}</span>}
        <span className="ts-card-radio" aria-hidden="true">{selected && <Check size={12} strokeWidth={3} />}</span>
      </div>

      <h3 className="ts-card-title">{template.name}</h3>
      <p className="ts-card-tagline">{template.tagline}</p>
      <p className="ts-card-desc">{template.description}</p>

      <ul className="ts-stack" aria-label="Stack">
        {template.stack.map(item => <li key={item}>{item}</li>)}
      </ul>

      <div className="ts-services">
        {template.services.map(service => (
          <div key={service.name} className="ts-service">
            <span className="ts-service-name">{service.name}</span>
            <span className="ts-service-runtime">{service.runtime}</span>
            <code className="ts-service-port">:{service.port}</code>
          </div>
        ))}
      </div>

      <div className="ts-bindings">
        <p className="ts-label">IBM tool bindings</p>
        <ul>
          {template.ibm_bindings.map(binding => (
            <li key={binding}><span className="ts-dot" aria-hidden="true" />{binding}</li>
          ))}
        </ul>
      </div>

      <footer className="ts-card-foot">
        <span className="ts-eta"><Clock size={13} /> Deploy {template.estimatedDeploy}</span>
        <button type="button" className="ts-use" onClick={onUse}>
          Select <ArrowRight size={14} />
        </button>
      </footer>
    </article>
  )
}
