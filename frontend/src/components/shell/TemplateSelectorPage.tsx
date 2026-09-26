/**
 * BL-ARC-01 — Starter Template Selector (first screen of the delivery flow).
 * The developer picks an IBM-ready template (with an embedded flashmvp.json)
 * and describes the app; IBM Bob's manifest parser turns that into an SDD spec.
 */
import { useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Boxes, Cloud, History, Lock, ShieldCheck, Sparkles, Zap } from 'lucide-react'
import TemplateCard from './TemplateCard'
import WorkflowStepper from './WorkflowStepper'
import PromptComposer from './PromptComposer'
import { MIN_PROMPT_LENGTH, findTemplate, templates, type StarterTemplate } from '../../data/templates'
import { useSpecSession } from '../../context/SpecSessionContext'
import '../../styles/flash-ui.css'
import './TemplateSelectorPage.css'

const METRICS = [
  { icon: Zap, value: '< 90s', label: 'prompt to live URL' },
  { icon: Cloud, value: '4', label: 'IBM services pre-wired' },
  { icon: ShieldCheck, value: '100%', label: 'human-approved deploys' },
]

export default function TemplateSelectorPage({ onGenerate }: {
  /** Optional hook for parents that want to observe the selection. */
  onGenerate?: (template: StarterTemplate, prompt: string) => void
}) {
  const navigate = useNavigate()
  const { session, isLocked, startSession } = useSpecSession()
  const [selectedId, setSelectedId] = useState(session?.templateId ?? templates[0].id)
  const [prompt, setPrompt] = useState('')
  const [touched, setTouched] = useState(false)
  const [launching, setLaunching] = useState(false)
  const promptRef = useRef<HTMLTextAreaElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)

  const selected = findTemplate(selectedId)
  const trimmed = prompt.trim()
  const promptValid = trimmed.length >= MIN_PROMPT_LENGTH
  const showError = touched && !promptValid

  const start = (template: StarterTemplate, text: string) => {
    if (launching) return
    setLaunching(true)
    startSession(template.id, text)
    onGenerate?.(template, text)
    // Let the launch animation play before the route change.
    setTimeout(() => navigate('/specs', { state: { templateId: template.id, prompt: text } }), 260)
  }

  const submit = () => {
    setTouched(true)
    if (!promptValid) { promptRef.current?.focus(); return }
    start(selected, trimmed)
  }

  /** "Select →" on a card starts immediately — using the typed prompt, or the template's own brief. */
  const startWithTemplate = (template: StarterTemplate) => {
    setSelectedId(template.id)
    start(template, promptValid ? trimmed : `${template.tagline}. ${template.description}`)
  }

  // Roving arrow-key navigation across the radio group.
  const onGridKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(event.key)) return
    event.preventDefault()
    const index = templates.findIndex(template => template.id === selectedId)
    const delta = event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1
    const next = templates[(index + delta + templates.length) % templates.length]
    setSelectedId(next.id)
    requestAnimationFrame(() => gridRef.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus())
  }

  return (
    <div className={`ts-root${launching ? ' is-launching' : ''}`}>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="ts-hero">
        <div className="ts-aurora" aria-hidden="true"><span /><span /><span /></div>
        <div className="ts-gridlines" aria-hidden="true" />
        <div className="ts-hero-inner">
          <span className="ts-pill fx-enter">
            <span className="fx-dot-live" aria-hidden="true" />
            Powered by IBM Bob 2.0
            <span className="ts-pill-sep" aria-hidden="true" />
            <span className="ts-pill-muted">Specs-driven delivery</span>
          </span>
          <h1 className="ts-title fx-enter" style={{ animationDelay: '60ms' }}>
            Ship to IBM Cloud<br /><span className="fx-gradient-text">from a single sentence.</span>
          </h1>
          <p className="ts-sub fx-enter" style={{ animationDelay: '120ms' }}>
            Pick a production-ready foundation, describe your product, and IBM Bob drafts the requirements, architecture and
            task plan. Nothing deploys until you sign off. No DevOps required.
          </p>
          <ul className="ts-metrics fx-enter" style={{ animationDelay: '180ms' }}>
            {METRICS.map(({ icon: Icon, value, label }) => (
              <li key={label}><Icon size={15} aria-hidden="true" /><strong>{value}</strong><span>{label}</span></li>
            ))}
          </ul>
        </div>
      </section>

      <WorkflowStepper current={0} />

      {session?.spec && (
        <div className="ts-resume fx-panel fx-enter" role="note">
          <span className="ts-resume-icon">{isLocked ? <Lock size={15} /> : <History size={15} />}</span>
          <p>
            Your <strong>{findTemplate(session.templateId).name}</strong> spec is {isLocked ? 'approved and locked' : 'waiting for review'}.
            <span> Starting a new one replaces it.</span>
          </p>
          <button type="button" className="fx-btn fx-btn--secondary fx-btn--sm" onClick={() => navigate('/specs')}>
            {isLocked ? 'View spec' : 'Resume review'} <ArrowRight size={14} />
          </button>
        </div>
      )}

      {/* ── Step 1 · Foundation ─────────────────────────────── */}
      <section aria-labelledby="ts-step1" className="ts-section">
        <header className="ts-section-head">
          <span className="ts-step-num" aria-hidden="true">01</span>
          <div>
            <h2 id="ts-step1" className="ts-section-title">Choose a foundation</h2>
            <p className="ts-section-sub">
              Every starter ships with a <code>flashmvp.json</code> manifest that binds it to IBM Cloud services.
            </p>
          </div>
          <span className="ts-section-aside"><Boxes size={14} /> {templates.length} templates</span>
        </header>
        <div className="ts-grid" role="radiogroup" aria-labelledby="ts-step1" ref={gridRef} onKeyDown={onGridKey}>
          {templates.map((template, index) => (
            <TemplateCard key={template.id} template={template} index={index} selected={template.id === selectedId}
              onSelect={() => setSelectedId(template.id)} onUse={() => startWithTemplate(template)} />
          ))}
        </div>
      </section>

      {/* ── Step 2 · Brief ──────────────────────────────────── */}
      <section aria-labelledby="ts-step2" className="ts-section">
        <header className="ts-section-head">
          <span className="ts-step-num" aria-hidden="true">02</span>
          <div>
            <h2 id="ts-step2" className="ts-section-title">Describe your product</h2>
            <p className="ts-section-sub">Plain language is perfect. Mention users, key flows and integrations.</p>
          </div>
          <span className="ts-section-aside"><Sparkles size={14} /> IBM Bob drafts the spec</span>
        </header>
        <PromptComposer ref={promptRef} value={prompt} onChange={value => { setPrompt(value); if (touched && value.trim().length >= MIN_PROMPT_LENGTH) setTouched(false) }}
          onSubmit={submit} template={selected} showError={showError} />
      </section>
    </div>
  )
}
