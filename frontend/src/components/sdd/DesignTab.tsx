import { Cloud } from 'lucide-react'
import MarkdownView from './MarkdownView'
import type { IBMToolBindings } from '../../types/spec'

/** BL-SDD-02 · Tab 2 — technical architecture with an IBM Cloud deployment callout. */
export default function DesignTab({ design, featureId, bindings }: {
  design: string
  featureId: string
  bindings: IBMToolBindings
}) {
  const notes = [
    bindings.code_engine && <>Containers are built and deployed to <strong>IBM Cloud Code Engine</strong> by Bob Subagent Gamma.</>,
    bindings.cloud_db && <>An isolated PostgreSQL schema <code className="sr-inline-code">app_{featureId}</code> is provisioned on <strong>IBM Cloud DB</strong> in under 200 ms.</>,
    bindings.secrets_vault && <>Runtime secrets are injected from <strong>IBM Secrets Manager</strong> — never written to <code className="sr-inline-code">.env</code> files.</>,
    bindings.watsonx_qa && <><strong>Watsonx QA</strong> runs lint, tests and a secret scan before every deploy.</>,
  ].filter(Boolean)

  return (
    <>
      <aside className="sr-callout" aria-label="IBM Cloud architecture note">
        <div className="sr-callout-icon"><Cloud size={18} /></div>
        <div>
          <p className="sr-callout-title">IBM Cloud architecture note</p>
          {notes.length ? (
            <ul className="sr-callout-list">{notes.map((note, index) => <li key={index}>{note}</li>)}</ul>
          ) : (
            <p className="sr-callout-text">No IBM tool bindings are enabled for this spec — deployment will need manual infrastructure.</p>
          )}
        </div>
      </aside>
      {design.trim()
        ? <MarkdownView source={design} />
        : <p className="sr-empty-note">IBM Bob has not produced a technical design yet.</p>}
    </>
  )
}
