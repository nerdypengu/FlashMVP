/**
 * BL-ARC-01 — Project starter template (shown inside Project Details).
 * Displays the IBM-ready starter chosen at project creation (with its embedded
 * flashmvp.json topology), the GitHub starter repository, and the creation
 * manifest prompt that IBM Bob parses into the 3-part SDD spec.
 */
import { useRef, useState, type CSSProperties } from 'react'
import { useNavigate } from 'react-router-dom'
import { Atom, Database, Hexagon, KeyRound, Server, ShieldCheck, Timer, type LucideIcon } from 'lucide-react'
import ArchitecturePreview from './ArchitecturePreview'
import PromptComposer from './PromptComposer'
import GitHubStarter from './GitHubStarter'
import { MAX_PROMPT_LENGTH, MIN_PROMPT_LENGTH, findTemplate, type IBMBindingName, type StarterTemplate } from '../../data/templates'
import { useSpecSession } from '../../context/SpecSessionContext'
import { useSpotlight } from '../../hooks/useSpotlight'
import '../../styles/flash-ui.css'
import './TemplateSelectorPage.css'

const MOCKED_PROJECT_PROMPT =
  'Deploy a high-performance React 19 frontend with Python FastAPI backend microservices, Supabase PostgreSQL schema, and watsonx QA automated testing.'

const ICONS: Record<string, LucideIcon> = { Atom, Hexagon }
const BINDING_ICONS: Record<IBMBindingName, LucideIcon> = {
  'IBM Code Engine': Server,
  'IBM Cloud DB': Database,
  'IBM Secrets Manager': KeyRound,
  'Watsonx QA': ShieldCheck,
}

export default function TemplateSelectorPage({ onGenerate }: {
  onGenerate?: (template: StarterTemplate, prompt: string) => void
}) {
  const navigate = useNavigate()
  const { session, startSession } = useSpecSession()
  const onPointerMove = useSpotlight<HTMLElement>()
  const promptRef = useRef<HTMLTextAreaElement>(null)

  const selected = findTemplate(new URLSearchParams(window.location.search).get('github_template') ?? session?.templateId ?? 'react-fastapi')
  const [prompt, setPrompt] = useState(session?.prompt || MOCKED_PROJECT_PROMPT)
  const [touched, setTouched] = useState(false)
  const trimmed = prompt.trim()
  const valid = trimmed.length >= MIN_PROMPT_LENGTH && trimmed.length <= MAX_PROMPT_LENGTH
  const Icon = ICONS[selected.icon] ?? Atom

  const proceedToSpec = () => {
    setTouched(true)
    if (!valid) { promptRef.current?.focus(); return }
    if (!session?.spec || session.templateId !== selected.id || session.prompt !== trimmed) {
      startSession(selected.id, trimmed)
    }
    onGenerate?.(selected, trimmed)
    navigate('/specs', { state: { templateId: selected.id, prompt: trimmed } })
  }

  return (
    <div className="ts-root ts-root--project">
      {/* ── Selected starter ─────────────────────────────────── */}
      <article className="tc-card tc-card--wide is-selected fx-beam fx-spotlight"
        style={{ '--tc-accent': selected.accent, '--fx-beam-color': selected.accent } as CSSProperties}
        onPointerMove={onPointerMove} aria-label={`Selected starter template: ${selected.name}`}>
        <header className="tc-head">
          <span className="tc-icon" aria-hidden="true"><Icon size={20} /></span>
          <div className="tc-titles">
            <div className="tc-title-row">
              <h3 className="tc-title">{selected.name}</h3>
              <span className="tc-badge tc-badge--inline">Selected starter</span>
            </div>
            <p className="tc-tagline">{selected.tagline}</p>
          </div>
          <span className="tc-meta tc-meta--pill"><Timer size={13} aria-hidden="true" /> Deploys in {selected.estimatedDeploy.replace('~', '≈ ')}</span>
        </header>

        <div className="tc-wide-body">
          <div className="tc-preview">
            <ArchitecturePreview template={selected} active />
          </div>

          <div className="tc-wide-side">
            <p className="tc-desc">{selected.description}</p>

            <div>
              <p className="tc-label">Tech stack</p>
              <ul className="tc-stack" aria-label="Stack">
                {selected.stack.map(item => <li key={item}>{item}</li>)}
              </ul>
            </div>

            <div>
              <p className="tc-label">Container fleet</p>
              <ul className="tc-services">
                {selected.services.map(service => (
                  <li key={service.name}>
                    <span className="tc-service-dot" aria-hidden="true" />
                    <span className="tc-service-name">{service.name}</span>
                    <span className="tc-service-runtime">{service.runtime}</span>
                    <code>:{service.port}</code>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div>
          <p className="tc-label">IBM Bob 2.0 cloud bindings</p>
          <ul className="tc-bindings tc-bindings--4" aria-label="IBM tool bindings">
            {selected.ibm_bindings.map(binding => {
              const BindingIcon = BINDING_ICONS[binding]
              return <li key={binding}><BindingIcon size={13} aria-hidden="true" /><span>{binding}</span></li>
            })}
          </ul>
        </div>
      </article>

      <GitHubStarter templateId={selected.id} />

      {/* ── Creation manifest ────────────────────────────────── */}
      <section className="ts-section" aria-labelledby="ts-manifest">
        <header className="ts-section-head">
          <span className="ts-step-num" aria-hidden="true">✦</span>
          <div>
            <h2 id="ts-manifest" className="ts-section-title">Initial project specification</h2>
            <p className="ts-section-sub">IBM Bob’s subagents parse this creation manifest into a 3-part SDD spec.</p>
          </div>
          <span className="ts-section-aside">{session ? 'Creation manifest' : 'Editable until first spec'}</span>
        </header>
        <PromptComposer ref={promptRef} value={prompt} onChange={value => { setPrompt(value); setTouched(false) }}
          onSubmit={proceedToSpec} template={selected} showError={touched && !valid}
          readOnly={!!session} suggestions={!session} submitLabel={session?.spec ? 'Review spec' : 'Generate spec'} />
      </section>
    </div>
  )
}
