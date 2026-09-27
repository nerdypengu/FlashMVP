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
      <div className="sr-bindings-head">
        <h3 id="sr-bindings-title" className="sr-section-label">IBM Tool Bindings</h3>
        <span className="sr-bindings-count">{enabled}/{BINDINGS.length} enabled</span>
      </div>
      <ul className="sr-bindings-row">
        {BINDINGS.map(({ key, label, skill, icon: Icon }) => {
          const on = !!bindings[key]
          return (
            <li key={key} className={`sr-binding${on ? ' is-on' : ''}`} title={`${skill} — ${on ? 'enabled' : 'disabled'}`}>
              <span className="sr-binding-dot" aria-hidden="true" />
              <Icon size={14} aria-hidden="true" />
              <span>{label}</span>
              <span className="sr-visually-hidden">{on ? 'enabled' : 'disabled'}</span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
