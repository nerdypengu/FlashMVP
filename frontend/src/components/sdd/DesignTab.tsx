import type { ReactNode } from 'react'
import { Database, KeyRound, Server, ShieldCheck, type LucideIcon } from 'lucide-react'
import MarkdownView from './MarkdownView'
import type { IBMToolBindings } from '../../types/spec'

type Note = { key: keyof IBMToolBindings; icon: LucideIcon; title: string; body: (featureId: string) => ReactNode }

const NOTES: Note[] = [
  { key: 'code_engine', icon: Server, title: 'IBM Code Engine', body: () => <>Containers are built and deployed by Bob Subagent Gamma.</> },
  { key: 'cloud_db', icon: Database, title: 'IBM Cloud DB', body: id => <>Isolated schema <code className="md-inline-code">app_{id}</code> provisioned in &lt; 200 ms.</> },
  { key: 'secrets_vault', icon: KeyRound, title: 'Secrets Manager', body: () => <>Secrets injected at runtime, never written to <code className="md-inline-code">.env</code>.</> },
  { key: 'watsonx_qa', icon: ShieldCheck, title: 'Watsonx QA', body: () => <>Lint, tests and a secret scan gate every deploy.</> },
]

/** BL-SDD-02 · Tab 2 — technical architecture with an IBM Cloud deployment callout. */
export default function DesignTab({ design, featureId, bindings }: {
  design: string
  featureId: string
  bindings: IBMToolBindings
}) {
  const active = NOTES.filter(note => bindings[note.key])
  return (
    <>
      <aside className="sr-callout" aria-label="IBM Cloud architecture note">
        <p className="sr-callout-eyebrow">IBM Cloud architecture note</p>
        {active.length ? (
          <ul className="sr-callout-grid">
            {active.map(({ key, icon: Icon, title, body }) => (
              <li key={key}>
                <span className="sr-callout-icon"><Icon size={15} /></span>
                <div>
                  <p className="sr-callout-title">{title}</p>
                  <p className="sr-callout-text">{body(featureId)}</p>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="sr-callout-text">No IBM tool bindings are enabled — deployment will need manual infrastructure.</p>
        )}
      </aside>
      {design.trim()
        ? <MarkdownView source={design} idPrefix="des" />
        : <p className="sr-empty-note">IBM Bob has not produced a technical design yet.</p>}
    </>
  )
}
