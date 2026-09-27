/**
 * BL-ARC-01 — Starter Template Selector (first screen of the delivery flow).
 * The developer picks an IBM-ready template (with an embedded flashmvp.json)
 * and describes the app; IBM Bob's manifest parser turns that into an SDD spec.
 */
import { useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, History, Lock, Package, Sparkles, Zap } from 'lucide-react'
import TemplateCard from './TemplateCard'
import WorkflowStepper from './WorkflowStepper'
import { MAX_PROMPT_LENGTH, MIN_PROMPT_LENGTH, QUICK_PROMPTS, findTemplate, templates, type StarterTemplate } from '../../data/templates'
import { useSpecSession } from '../../context/SpecSessionContext'
import './TemplateSelectorPage.css'

export default function TemplateSelectorPage({ onGenerate }: {
  /** Optional hook for parents that want to observe the selection. */
  onGenerate?: (template: StarterTemplate, prompt: string) => void
}) {
  const navigate = useNavigate()
  const { session, isLocked, startSession } = useSpecSession()
  const [selectedId, setSelectedId] = useState(session?.templateId ?? templates[0].id)
  const [prompt, setPrompt] = useState('')
  const [touched, setTouched] = useState(false)
  const promptRef = useRef<HTMLTextAreaElement>(null)
  const promptId = useId()
  const hintId = useId()

  const selected = findTemplate(selectedId)
  const trimmed = prompt.trim()
  const promptValid = trimmed.length >= MIN_PROMPT_LENGTH
  const showError = touched && !promptValid

  const start = (template: StarterTemplate, text: string) => {
    startSession(template.id, text)
    onGenerate?.(template, text)
    navigate('/specs', { state: { templateId: template.id, prompt: text } })
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

  return (
    <div className="ts-root">
      <section className="ts-hero">
        <span className="ts-bob-banner"><Zap size={13} /> Powered by IBM Bob 2.0</span>
        <h1 className="ts-hero-title">Deploy your app to IBM Cloud in one click</h1>
        <p className="ts-hero-sub">No DevOps required. Pick a starter, describe what you want, and IBM Bob drafts a spec for you to approve before anything ships.</p>
      </section>

      <WorkflowStepper current={0} />

      {session?.spec && (
        <div className="ts-resume" role="note">
          {isLocked ? <Lock size={16} /> : <History size={16} />}
          <p>
            You have a <strong>{findTemplate(session.templateId).name}</strong> spec {isLocked ? 'approved and locked' : 'waiting for review'}.
            Starting a new one will replace it.
          </p>
          <button type="button" className="ts-btn ts-btn--ghost" onClick={() => navigate('/specs')}>
            {isLocked ? 'View spec' : 'Resume review'} <ArrowRight size={14} />
          </button>
        </div>
      )}

      <section aria-labelledby="ts-grid-title">
        <div className="ts-section-head">
          <h2 id="ts-grid-title" className="ts-section-title"><Package size={17} /> Select an IBM-ready starter template</h2>
          <span className="ts-section-note">Each template ships with a <code>flashmvp.json</code> manifest</span>
        </div>
        <div className="ts-grid" role="radiogroup" aria-labelledby="ts-grid-title">
          {templates.map(template => (
            <TemplateCard key={template.id} template={template} selected={template.id === selectedId}
              onSelect={() => setSelectedId(template.id)} onUse={() => startWithTemplate(template)} />
          ))}
        </div>
      </section>

      <section className="ts-prompt" aria-labelledby={promptId}>
        <div className="ts-prompt-head">
          <label id={promptId} htmlFor={`${promptId}-input`} className="ts-section-title">
            <Sparkles size={17} /> Or describe your project
          </label>
          <span className="ts-selected-pill">Using <strong>{selected.name}</strong></span>
        </div>
        <textarea id={`${promptId}-input`} ref={promptRef} className="ts-textarea" rows={3} maxLength={MAX_PROMPT_LENGTH}
          placeholder="e.g. A marketplace where local bakers list products, customers order for pickup, and pay with Stripe."
          value={prompt} aria-invalid={showError || undefined} aria-describedby={hintId}
          onChange={event => setPrompt(event.target.value)} onBlur={() => trimmed && setTouched(true)}
          onKeyDown={event => { if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) { event.preventDefault(); submit() } }} />
        <div className="ts-quick">
          <span className="ts-label">Try</span>
          {QUICK_PROMPTS.map(text => (
            <button key={text} type="button" className="ts-chip" onClick={() => { setPrompt(text); setTouched(false); promptRef.current?.focus() }}>
              {text}
            </button>
          ))}
        </div>
        <div className="ts-prompt-foot">
          <span id={hintId} className={showError ? 'ts-error' : 'ts-hint'}>
            {showError
              ? `Describe your project in at least ${MIN_PROMPT_LENGTH} characters.`
              : <>{prompt.length}/{MAX_PROMPT_LENGTH} · <kbd>Ctrl</kbd>/<kbd>⌘</kbd> + <kbd>Enter</kbd> to start</>}
          </span>
          <button type="button" className="ts-btn ts-btn--primary" onClick={submit}>
            Generate spec <ArrowRight size={15} />
          </button>
        </div>
      </section>
    </div>
  )
}
