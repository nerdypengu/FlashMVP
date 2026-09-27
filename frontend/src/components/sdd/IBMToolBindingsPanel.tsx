import { Database, KeyRound, Server, ShieldCheck, type LucideIcon } from 'lucide-react'
import type { IBMToolBindings } from '../../types/spec'

const BINDINGS: { key: keyof IBMToolBindings; label: string; skill: string; icon: LucideIcon }[] = [
  { key: 'code_engine', label: 'Code Engine', skill: 'bob-skill-code-engine', icon: Server },
  { key: 'cloud_db', label: 'Cloud DB', skill: 'bob-skill-cloud-db', icon: Database },
  { key: 'secrets_vault', label: 'Secrets Vault', skill: 'bob-skill-secrets-vault', icon: KeyRound },
  { key: 'watsonx_qa', label: 'Watsonx QA', skill: 'bob-skill-watsonx-qa', icon: ShieldCheck },
]

/** BL-SDD-02 — IBM tool binding status row. Green = enabled, grey = disabled. */
export default function IBMToolBindingsPanel({ bindings }: { bindings: IBMToolBindings }) {
  const enabled = BINDINGS.filter(binding => bindings[binding.key]).length
  return (
    <section className="sr-bindings" aria-labelledby="sr-bindings-title">
      <h3 id="sr-bindings-title" className="sr-bindings-title">
        IBM tool bindings <span>{enabled}/{BINDINGS.length} enabled</span>
      </h3>
      <ul className="sr-bindings-row">
        {BINDINGS.map(({ key, label, skill, icon: Icon }) => {
          const on = !!bindings[key]
          return (
            <li key={key} className={`sr-binding${on ? ' is-on' : ''}`}>
              <span className="sr-binding-icon"><Icon size={14} aria-hidden="true" /></span>
              <span className="sr-binding-text">
                <span className="sr-binding-label">{label}</span>
                <span className="sr-binding-skill">{skill}</span>
              </span>
              <span className="sr-binding-state" aria-label={on ? 'enabled' : 'disabled'}>
                <span className="sr-binding-dot" aria-hidden="true" />{on ? 'Bound' : 'Off'}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
