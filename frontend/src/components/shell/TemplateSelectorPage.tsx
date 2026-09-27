/**
 * BL-ARC-01 — Starter Template & Initial Architecture Configuration (Single Horizontal Display).
 * Shows the pre-configured starter template and read-only prompt created during project initialization.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Atom, Clock, Sparkles } from 'lucide-react'
import { MIN_PROMPT_LENGTH, MAX_PROMPT_LENGTH, findTemplate, type StarterTemplate } from '../../data/templates'

import { useSpecSession } from '../../context/SpecSessionContext'
import GitHubStarter from './GitHubStarter'
import './TemplateSelectorPage.css'

const MOCKED_PROJECT_PROMPT =
  'Deploy a high-performance React 19 frontend with Python FastAPI backend microservices, Supabase PostgreSQL schema, and watsonx QA automated testing.'

export default function TemplateSelectorPage({ onGenerate }: {
  onGenerate?: (template: StarterTemplate, prompt: string) => void
}) {
  const navigate = useNavigate()
  const { session, startSession } = useSpecSession()

  // Selected starter template (defaults to React + FastAPI)
  const selected = findTemplate(new URLSearchParams(window.location.search).get('github_template') ?? session?.templateId ?? 'react-fastapi')
  const [prompt, setPrompt] = useState(session?.prompt || MOCKED_PROJECT_PROMPT)

  const proceedToSpec = () => {
    const promptText = prompt.trim()
    if (promptText.length < MIN_PROMPT_LENGTH || promptText.length > MAX_PROMPT_LENGTH) return
    if (!session?.spec || session.templateId !== selected.id || session.prompt !== promptText) {
      startSession(selected.id, promptText)
    }
    onGenerate?.(selected, promptText)
    navigate('/specs', { state: { templateId: selected.id, prompt: promptText } })
  }

  return (
    <div className="ts-root" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>



      {/* ── Horizontal Single Selected Starter Card ─────────────────── */}
      <section style={{
        background: 'rgba(15, 17, 26, 0.85)',
        border: '1px solid rgba(15, 98, 254, 0.35)',
        borderRadius: 16, padding: 24,
        display: 'flex', flexDirection: 'column', gap: 20,
        boxShadow: '0 8px 32px rgba(15, 98, 254, 0.12)',
        backdropFilter: 'blur(20px)', position: 'relative'
      }}>
        {/* Header Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: 'linear-gradient(135deg, #0F62FE, #0043CE)',
              display: 'grid', placeItems: 'center', color: '#fff',
              boxShadow: '0 0 20px rgba(15, 98, 254, 0.5)', flexShrink: 0
            }}>
              <Atom size={26} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: 0 }}>
                  {selected.name}
                </h2>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                  background: 'rgba(15, 98, 254, 0.2)', border: '1px solid rgba(15, 98, 254, 0.4)',
                  color: '#60A5FA', textTransform: 'uppercase'
                }}>
                  Selected Starter Template
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#A6C8FF', margin: '4px 0 0 0' }}>
                {selected.tagline} — {selected.description}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} color="#A7F3D0" /> Estimated Deploy: <strong style={{ color: '#fff' }}>{selected.estimatedDeploy}</strong>
            </span>
          </div>
        </div>

        {/* Horizontal Detail Columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 16, paddingTop: 18,
          borderTop: '1px solid rgba(255,255,255,0.08)'
        }}>
          {/* Tech Stack */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Configured Tech Stack
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {selected.stack.map(st => (
                <span key={st} style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 12, color: '#fff',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  {st}
                </span>
              ))}
            </div>
          </div>

          {/* Microservices */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Container Microservices Fleet
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {selected.services.map(svc => (
                <div key={svc.name} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 10px', borderRadius: 6, background: 'rgba(0,0,0,0.3)',
                  fontSize: 12, border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <span style={{ fontWeight: 600, color: '#fff', textTransform: 'capitalize' }}>{svc.name}</span>
                  <span style={{ color: 'rgba(255,255,255,0.5)' }}>{svc.runtime}</span>
                  <code style={{ color: '#60A5FA', fontFamily: 'monospace' }}>:{svc.port}</code>
                </div>
              ))}
            </div>
          </div>

          {/* IBM Cloud Bindings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              IBM Bob 2.0 Cloud Bindings
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {selected.ibm_bindings.map(b => (
                <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#fff' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#42BE65', boxShadow: '0 0 6px #42BE65' }} />
                  <span>{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <GitHubStarter templateId={selected.id} />

      {/* ── Initial Prompt Description Box ─────────────────── */}
      <section style={{
        background: 'rgba(14, 16, 28, 0.78)',
        borderRadius: 16, padding: 22,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex', flexDirection: 'column', gap: 14
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} color="#0F62FE" />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>
              Initial Project Specification Description
            </h3>
          </div>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 6,
            background: 'rgba(15, 98, 254, 0.15)', border: '1px solid rgba(15, 98, 254, 0.3)',
            color: '#60A5FA'
          }}>
            Creation Manifest
          </span>
        </div>


        <textarea
          aria-label="Initial project specification description"
          readOnly={!!session}
          value={prompt}
          onChange={event => setPrompt(event.target.value)}
          maxLength={MAX_PROMPT_LENGTH}
          rows={3}
          style={{
            width: '100%', padding: 14, borderRadius: 10,
            background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.12)',
            color: '#A7F3D0', fontFamily: 'monospace', fontSize: 13, lineHeight: 1.6,
            resize: 'none', cursor: session ? 'not-allowed' : 'text'
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} color="#0F62FE" />
            Parsed into 3-Part SDD Specification by IBM Bob 2.0 Subagents
          </span>
          <button type="button" className="btn btn--primary" onClick={proceedToSpec}
            disabled={prompt.trim().length < MIN_PROMPT_LENGTH || prompt.trim().length > MAX_PROMPT_LENGTH}>
            {session?.spec ? "Review spec" : "Generate spec"} <ArrowRight size={16} />
          </button>
        </div>
      </section>

    </div>
  )
}
