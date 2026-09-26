import { useState } from 'react'
import {
  CheckCircle2, RefreshCw, ClipboardList, Cpu, ListChecks,
  Lock, Loader, ChevronDown, ChevronUp,
} from 'lucide-react'
import type { SpecResponse } from '../../lib/specsApi'

// ── Types ─────────────────────────────────────────────────────────────────────

export type SpecData = {
  projectId: string
  template: any
  prompt: string
  status: 'DRAFT' | 'CHANGES_REQUESTED' | 'APPROVED'
  requirements: string
  architecture: string
  ibmBindings: { tool: string; purpose: string; status: string }[]
  tasks: { id: string; title: string; subagent: string; estimate: string }[]
}

type Tab = 'requirements' | 'design' | 'tasks'

const STATUS_COLOUR: Record<string, string> = {
  AWAITING_APPROVAL: '#E3A008',
  CHANGES_REQUESTED: '#E3A008',
  APPROVED: '#42BE65',
  DRAFT: '#E3A008',
}

const STATUS_BG: Record<string, string> = {
  AWAITING_APPROVAL: 'rgba(227,160,8,0.12)',
  CHANGES_REQUESTED: 'rgba(227,160,8,0.12)',
  APPROVED: 'rgba(66,190,101,0.12)',
  DRAFT: 'rgba(227,160,8,0.12)',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function SpecReviewer({
  spec: legacySpec,
  apiSpec,
  onApprove,
  onRevise,
  isLocked,
  loading,
  error,
}: {
  spec: SpecData
  apiSpec?: SpecResponse | null
  onApprove: () => void
  onRevise: (feedback: string) => void
  isLocked?: boolean
  loading?: boolean
  error?: string
}) {
  const [activeTab, setActiveTab] = useState<Tab>('requirements')
  const [feedback, setFeedback] = useState('')
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [feedbackErr, setFeedbackErr] = useState('')

  // Use real API data when available, fall back to legacy prop
  const requirements = apiSpec?.requirements ?? legacySpec.requirements
  const design = apiSpec?.design ?? legacySpec.architecture
  const tasks = apiSpec?.tasks ?? []
  const ibmBindings = apiSpec?.ibm_bindings
  const status = apiSpec?.status ?? legacySpec.status
  const locked = isLocked || status === 'APPROVED'

  const completedCount = tasks.filter(t => t.completed).length

  const handleRevise = () => {
    if (!feedback.trim()) { setFeedbackErr('Please enter your feedback.'); return }
    setFeedbackErr('')
    onRevise(feedback.trim())
    setFeedback('')
    setFeedbackOpen(false)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 320, gap: 16 }}>
        <Loader size={28} color="#0F62FE" style={{ animation: 'spin 1s linear infinite' }} />
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>IBM Bob 2.0 is drafting your spec…</div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: 12, padding: '16px 20px',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ClipboardList size={18} color="#0F62FE" />
          <span style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>IBM Bob 2.0 — Spec Review Gate</span>
        </div>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 10,
          background: STATUS_BG[status] ?? STATUS_BG.DRAFT,
          color: STATUS_COLOUR[status] ?? STATUS_COLOUR.DRAFT,
          border: `1px solid ${STATUS_COLOUR[status] ?? STATUS_COLOUR.DRAFT}50`,
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          {locked && <Lock size={10} />}
          {status}
        </span>
      </div>

      {error && (
        <div style={{ padding: '10px 20px', background: 'rgba(248,113,113,0.1)', borderBottom: '1px solid rgba(248,113,113,0.3)', fontSize: 12, color: '#F87171' }}>
          {error}
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0 20px' }}>
        {([
          { id: 'requirements', label: '📝 Requirements', icon: ClipboardList },
          { id: 'design', label: '🏗️ Technical Design', icon: Cpu },
          { id: 'tasks', label: `📋 Tasks${tasks.length ? ` (${completedCount}/${tasks.length})` : ''}`, icon: ListChecks },
        ] as { id: Tab; label: string; icon: any }[]).map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '10px 14px', background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600,
              color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.45)',
              borderBottom: activeTab === tab.id ? '2px solid #0F62FE' : '2px solid transparent',
              marginBottom: -1, transition: 'all 0.15s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div style={{ padding: 20, minHeight: 220, maxHeight: 340, overflowY: 'auto' }}>
        {activeTab === 'requirements' && (
          <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.7, color: 'rgba(255,255,255,0.82)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit' }}>
            {requirements || 'No requirements generated yet.'}
          </pre>
        )}
        {activeTab === 'design' && (
          <pre style={{ margin: 0, fontSize: 12, lineHeight: 1.7, color: 'rgba(255,255,255,0.82)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'inherit' }}>
            {design || 'No technical design generated yet.'}
          </pre>
        )}
        {activeTab === 'tasks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tasks.length === 0 && (
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>No tasks generated yet.</p>
            )}
            {/* Progress bar */}
            {tasks.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
                  <div style={{ height: '100%', borderRadius: 2, background: '#42BE65', width: `${(completedCount / tasks.length) * 100}%`, transition: 'width 0.3s' }} />
                </div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>{completedCount} / {tasks.length} completed</p>
              </div>
            )}
            {tasks.map(task => (
              <div key={task.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 10px',
                borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', minWidth: 70, paddingTop: 1 }}>{task.id}</span>
                <span style={{ fontSize: 12, color: task.completed ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.8)', textDecoration: task.completed ? 'line-through' : 'none' }}>
                  {task.description}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── IBM Tool Bindings ── */}
      {ibmBindings && (
        <div style={{ padding: '10px 20px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginRight: 4 }}>IBM Tools:</span>
          {Object.entries({
            'Code Engine': ibmBindings.code_engine,
            'Cloud DB': ibmBindings.cloud_db,
            'Secrets Vault': ibmBindings.secrets_vault,
            'Watsonx QA': ibmBindings.watsonx_qa,
          }).map(([name, active]) => (
            <span key={name} style={{
              fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 8,
              background: active ? 'rgba(66,190,101,0.15)' : 'rgba(255,255,255,0.05)',
              color: active ? '#42BE65' : '#6B7280',
              border: `1px solid ${active ? 'rgba(66,190,101,0.3)' : 'rgba(255,255,255,0.08)'}`,
            }}>
              {active ? '🟢' : '⚪'} {name}
            </span>
          ))}
        </div>
      )}

      {/* ── Revision + Approve actions ── */}
      {!locked && (
        <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Feedback toggle */}
          <button
            type="button"
            onClick={() => setFeedbackOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, background: 'transparent',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8, padding: '7px 12px',
              color: 'rgba(255,255,255,0.6)', fontSize: 12, cursor: 'pointer', alignSelf: 'flex-start',
            }}
          >
            <RefreshCw size={13} />
            Request Changes
            {feedbackOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {feedbackOpen && (
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={feedback}
                onChange={e => { setFeedback(e.target.value); setFeedbackErr('') }}
                placeholder='e.g. "Use MongoDB instead of PostgreSQL"'
                style={{
                  flex: 1, padding: '8px 12px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.04)',
                  border: feedbackErr ? '1px solid #F87171' : '1px solid rgba(255,255,255,0.12)',
                  color: '#fff', fontSize: 12, outline: 'none',
                }}
                onKeyDown={e => { if (e.key === 'Enter') handleRevise() }}
              />
              <button
                type="button"
                onClick={handleRevise}
                style={{
                  padding: '8px 14px', borderRadius: 8, border: 'none',
                  background: 'rgba(255,255,255,0.08)', color: '#fff', fontSize: 12, cursor: 'pointer',
                }}
              >
                Submit
              </button>
            </div>
          )}
          {feedbackErr && <p style={{ fontSize: 11, color: '#F87171', margin: 0 }}>{feedbackErr}</p>}

          {/* Approve button */}
          <button
            type="button"
            onClick={onApprove}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-end',
              padding: '10px 22px', borderRadius: 10, border: 'none',
              background: 'linear-gradient(135deg, #24A148 0%, #198038 100%)',
              color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(36,161,72,0.3)',
            }}
          >
            <CheckCircle2 size={15} />
            Approve Specs &amp; Deploy to IBM →
          </button>
        </div>
      )}

      {locked && (
        <div style={{
          padding: '12px 20px', borderTop: '1px solid rgba(66,190,101,0.2)',
          background: 'rgba(66,190,101,0.06)', display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Lock size={14} color="#42BE65" />
          <span style={{ fontSize: 12, color: '#42BE65', fontWeight: 600 }}>
            Specs Approved &amp; Locked — Deploy pipeline unlocked
          </span>
        </div>
      )}
    </div>
  )
}
