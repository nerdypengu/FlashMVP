import { useState } from 'react'
import { Zap, Database, Shield, Cpu, ChevronRight, Loader } from 'lucide-react'

export const TEMPLATES = [
  {
    id: 'react-fastapi',
    name: 'React + FastAPI',
    icon: 'Zap',
    badge: 'POPULAR',
    description: 'Full-stack SPA with IBM Cloud bindings. Vite + React 18 frontend, Python FastAPI backend.',
    ibmBindings: ['IBM Code Engine', 'IBM Cloud DB', 'IBM Secrets Manager', 'IBM Watsonx QA'],
  },
  {
    id: 'nextjs-go',
    name: 'Next.js + Go',
    icon: 'Cpu',
    badge: 'FAST',
    description: 'High-performance stack with SSR. Next.js 14 App Router + Go Fiber backend.',
    ibmBindings: ['IBM Code Engine', 'IBM Cloud DB', 'IBM Secrets Manager'],
  },
  {
    id: 'node-express',
    name: 'Node + Express',
    icon: 'Database',
    badge: 'CLASSIC',
    description: 'Battle-tested JS/TS stack. Node 20 + Express API with TypeScript throughout.',
    ibmBindings: ['IBM Code Engine', 'IBM Cloud DB', 'IBM Secrets Manager'],
  },
]

export type Template = typeof TEMPLATES[0]

const ICON_MAP: Record<string, React.FC<{ size: number; color: string }>> = {
  Zap, Database, Cpu,
}

const BADGE_COLOURS: Record<string, string> = {
  POPULAR: 'rgba(15,98,254,0.25)',
  FAST: 'rgba(66,190,101,0.2)',
  CLASSIC: 'rgba(253,224,71,0.15)',
}

const BADGE_TEXT: Record<string, string> = {
  POPULAR: '#60A5FA',
  FAST: '#42BE65',
  CLASSIC: '#FDE047',
}

export default function TemplateSelector({
  onGenerate,
}: {
  onGenerate: (template: Template, prompt: string) => void
}) {
  const [selected, setSelected] = useState<Template>(TEMPLATES[0])
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!prompt.trim()) { setError('Please describe what you want to build.'); return }
    setError('')
    setLoading(true)
    try {
      await onGenerate(selected, prompt.trim())
    } catch (e: any) {
      setError(e?.message ?? 'Failed to generate spec. Is the backend running?')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#fff', margin: '0 0 6px 0' }}>
          ⚡ Start a New Project
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
          Pick a stack template, describe your app, then IBM Bob 2.0 drafts a full spec for your review.
        </p>
      </div>

      {/* Template cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {TEMPLATES.map(t => {
          const IconComponent = ICON_MAP[t.icon] ?? Zap
          const isSelected = selected.id === t.id
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelected(t)}
              style={{
                textAlign: 'left',
                padding: 16,
                borderRadius: 12,
                border: isSelected ? '2px solid #0F62FE' : '1px solid rgba(255,255,255,0.1)',
                background: isSelected ? 'rgba(15,98,254,0.1)' : 'rgba(255,255,255,0.03)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <IconComponent size={20} color={isSelected ? '#0F62FE' : 'rgba(255,255,255,0.6)'} />
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 8,
                  background: BADGE_COLOURS[t.badge] ?? 'rgba(255,255,255,0.1)',
                  color: BADGE_TEXT[t.badge] ?? '#fff',
                  border: `1px solid ${BADGE_TEXT[t.badge] ?? '#fff'}40`,
                }}>
                  {t.badge}
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{t.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{t.description}</div>
              {/* IBM bindings */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                {t.ibmBindings.map(b => (
                  <span key={b} style={{
                    fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 6,
                    background: 'rgba(15,98,254,0.15)', color: '#60A5FA',
                    border: '1px solid rgba(15,98,254,0.3)',
                  }}>
                    {b}
                  </span>
                ))}
              </div>
            </button>
          )
        })}
      </div>

      {/* Prompt input */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>
          Describe your application
        </label>
        <textarea
          value={prompt}
          onChange={e => { setPrompt(e.target.value); setError('') }}
          placeholder={`e.g. "Build an e-commerce store with Stripe payments and product catalogue"`}
          rows={3}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 10,
            background: 'rgba(255,255,255,0.04)',
            border: error ? '1px solid #F87171' : '1px solid rgba(255,255,255,0.12)',
            color: '#fff',
            fontSize: 13,
            lineHeight: 1.6,
            resize: 'vertical',
            outline: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate() }}
        />
        {error && (
          <p style={{ fontSize: 12, color: '#F87171', margin: 0 }}>{error}</p>
        )}
      </div>

      {/* Generate button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
          Selected: <strong style={{ color: 'rgba(255,255,255,0.6)' }}>{selected.name}</strong> · Ctrl+Enter to generate
        </span>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 22px',
            borderRadius: 10,
            border: 'none',
            background: loading ? 'rgba(15,98,254,0.4)' : 'linear-gradient(135deg, #0F62FE 0%, #0043CE 100%)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 13,
            cursor: loading ? 'wait' : 'pointer',
            boxShadow: loading ? 'none' : '0 4px 20px rgba(15,98,254,0.35)',
            transition: 'all 0.15s',
          }}
        >
          {loading
            ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /><span>Generating Spec…</span></>
            : <><Zap size={15} /><span>Generate Spec with IBM Bob</span><ChevronRight size={14} /></>
          }
        </button>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
