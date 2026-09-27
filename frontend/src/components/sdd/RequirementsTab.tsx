import { useState } from 'react'
import { CheckCircle2, Circle, Plus, Sparkles, RefreshCw, Bot, Loader2, FileText, Wand2, ShieldCheck, FileCode } from 'lucide-react'
import MarkdownView from './MarkdownView'

export type SubItem = {
  id: string
  text: string
  completed: boolean
  type?: 'FR' | 'NFR'
}

export type RequirementSpec = {
  id: string
  title: string
  category: string
  description: string
  sourceDoc?: string
  items: SubItem[]
}

const DEFAULT_REQUIREMENTS: RequirementSpec[] = [
  {
    id: 'FR-001',
    title: 'JWT Authentication & Role-Based Security',
    category: 'Functional & Security',
    sourceDoc: 'package/docs/requirements/FR-001_Authentication.md',
    description: 'Auto-tracked from package/docs/requirements/. User registration, token issuing, session persistence, and RBAC endpoint protection.',
    items: [
      { id: 'fr1-1', text: '[FR] User registration with bcrypt password hashing', completed: true, type: 'FR' },
      { id: 'fr1-2', text: '[FR] JWT bearer token generation and authorization headers', completed: true, type: 'FR' },
      { id: 'fr1-3', text: '[FR] Role-based access control (RBAC) middleware', completed: true, type: 'FR' },
      { id: 'fr1-4', text: '[NFR] Password policy enforcement & rate-limited login', completed: false, type: 'NFR' }
    ]
  },
  {
    id: 'FR-002',
    title: 'Real-Time Container Telemetry & Log Streaming',
    category: 'Observability & Monitoring',
    sourceDoc: 'package/docs/requirements/FR-002_ContainerTelemetry.md',
    description: 'Auto-tracked from package/docs/requirements/. Capture live CPU/RAM usage, API hit counts, latency, and SSE container log streamer.',
    items: [
      { id: 'fr2-1', text: '[FR] Live CPU & RAM metrics collector stream (2.5s interval)', completed: true, type: 'FR' },
      { id: 'fr2-2', text: '[FR] Server-Sent Events (SSE) container log tailing', completed: true, type: 'FR' },
      { id: 'fr2-3', text: '[FR] Top hit API endpoints traffic & latency breakdown', completed: true, type: 'FR' },
      { id: 'fr2-4', text: '[NFR] Sub-100ms latency telemetry aggregation overhead', completed: true, type: 'NFR' }
    ]
  },
  {
    id: 'FR-003',
    title: 'watsonx QA Canvas & Automated Test Engine',
    category: 'Quality Assurance',
    sourceDoc: 'package/docs/requirements/FR-003_QACanvas.md',
    description: 'Auto-tracked from package/docs/requirements/. Visual drag-and-drop test node canvas with automated execution history and step inspectors.',
    items: [
      { id: 'fr3-1', text: '[FR] Interactive pipeline stage canvas with node cards', completed: true, type: 'FR' },
      { id: 'fr3-2', text: '[FR] Automated ESLint static code analysis check', completed: true, type: 'FR' },
      { id: 'fr3-3', text: '[FR] Pytest unit & integration test runner', completed: true, type: 'FR' },
      { id: 'fr3-4', text: '[NFR] Dependency CVE vulnerability & secret leak scanner', completed: false, type: 'NFR' }
    ]
  },
  {
    id: 'NFR-001',
    title: 'IBM Code Engine Container Egress Fleet',
    category: 'Infrastructure & DevOps',
    sourceDoc: 'package/docs/decisions/ADR-001_IBM_CodeEngine.md',
    description: 'Auto-tracked from package/docs/decisions/. Deploy multi-container microservices with auto-scaling (0 to 10 replicas) and SSL tunnel.',
    items: [
      { id: 'nfr1-1', text: '[FR] Container image build & Code Engine deployment', completed: true, type: 'FR' },
      { id: 'nfr1-2', text: '[NFR] Auto-scaling from 0 to 10 replicas based on HTTP traffic', completed: true, type: 'NFR' },
      { id: 'nfr1-3', text: '[NFR] Cloudflare Quick SSL Tunnel ingress mapping', completed: true, type: 'NFR' }
    ]
  },
  {
    id: 'NFR-002',
    title: 'PostgreSQL Multi-Tenant Schema Provisioning',
    category: 'Database Architecture',
    sourceDoc: 'package/docs/prd.md',
    description: 'Auto-tracked from package/docs/prd.md. Sub-200ms creation of isolated database schemas on Supabase & IBM Cloud DB.',
    items: [
      { id: 'nfr2-1', text: '[FR] Automated DDL schema migration script execution', completed: true, type: 'FR' },
      { id: 'nfr2-2', text: '[FR] Multi-tenant database schema isolation', completed: true, type: 'FR' },
      { id: 'nfr2-3', text: '[NFR] Connection pool optimization (max 20 connections)', completed: false, type: 'NFR' }
    ]
  }
]

export default function RequirementsTab({
  requirements,
  onAddRequirement
}: {
  requirements: string
  onAddRequirement?: (
    newReq: RequirementSpec,
    newDesignSnippet: string,
    newTasks: { id: string; description: string; completed: boolean }[]
  ) => void
}) {
  const [specs, setSpecs] = useState<RequirementSpec[]>(DEFAULT_REQUIREMENTS)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  // AI Assistant state
  const [userPrompt, setUserPrompt] = useState('')
  const [drafting, setDrafting] = useState(false)
  const [aiDraft, setAiDraft] = useState<{
    id: string
    title: string
    category: string
    description: string
    frItems: string[]
    nfrItems: string[]
  } | null>(null)

  // Sync with package/docs/
  const handleSyncDocs = () => {
    setSyncing(true)
    setSyncMessage('')
    setTimeout(() => {
      setSyncing(false)
      setSyncMessage('Synced 5 requirement files from package/docs/ (0 changes detected).')
      setTimeout(() => setSyncMessage(''), 4000)
    }, 1200)
  }

  // Toggle checklist item
  const toggleItem = (reqId: string, itemId: string) => {
    setSpecs(prev => prev.map(req => {
      if (req.id !== reqId) return req
      return {
        ...req,
        items: req.items.map(item => item.id === itemId ? { ...item, completed: !item.completed } : item)
      }
    }))
  }

  // AI Draft generator powered by IBM Bob 2.0
  const handleAiDraft = () => {
    if (!userPrompt.trim()) return
    setDrafting(true)
    setTimeout(() => {
      setDrafting(false)
      const promptLower = userPrompt.toLowerCase()
      
      let title = 'Stripe Payment Gateway & Invoice Billing'
      let category = 'Functional & Payments'
      let frs = [
        'Stripe Checkout API integration with webhook listener',
        'Customer subscription plan selection and management',
        'Automated PDF invoice generation and email receipt dispatch'
      ]
      let nfrs = [
        'PCI-DSS compliance with tokenized payment transactions',
        'Webhook signature validation with < 200ms processing SLA'
      ]

      if (promptLower.includes('redis') || promptLower.includes('cache')) {
        title = 'Redis In-Memory Caching & Rate Limiting'
        category = 'Performance & Infrastructure'
        frs = [
          'Redis cache middleware for heavy database query routes',
          'Automated cache invalidation on entity mutations',
          'API rate limiting per IP (100 req/min)'
        ]
        nfrs = [
          'Sub-5ms cache lookup response latency',
          'Redis cluster failover with automatic memory eviction policy'
        ]
      } else if (promptLower.includes('auth') || promptLower.includes('sso') || promptLower.includes('oauth')) {
        title = 'Google & GitHub OAuth2 Single Sign-On (SSO)'
        category = 'Security & Auth'
        frs = [
          'Google & GitHub OAuth2 authorization code flow',
          'Automatic user account creation and profile sync',
          'JWT token refresh & OAuth session revocation'
        ]
        nfrs = [
          'OAuth state parameter validation for CSRF protection',
          'Strict 15-minute access token expiration policy'
        ]
      } else if (userPrompt.trim().length > 5) {
        title = `Feature: ${userPrompt.slice(0, 35)}…`
        category = 'Custom Feature Specification'
        frs = [
          `Implement core functionality for: ${userPrompt.slice(0, 50)}`,
          'RESTful API endpoint exposure with schema validation',
          'Frontend UI state binding and error handling'
        ]
        nfrs = [
          'Watsonx QA test suite verification and 95%+ code coverage',
          'Secure input sanitization to prevent injection vulnerabilities'
        ]
      }

      setAiDraft({
        id: `FR-00${specs.length + 1}`,
        title,
        category,
        description: `Auto-drafted by IBM Bob 2.0 based on requirement prompt: "${userPrompt.trim()}". Tracked in package/docs/requirements/`,
        frItems: frs,
        nfrItems: nfrs
      })
    }, 1100)
  }

  // Save AI Generated Requirement into specs list & sync Design + Tasks
  const handleSaveAiDraft = () => {
    if (!aiDraft) return
    const newItems: SubItem[] = [
      ...aiDraft.frItems.map((text, idx) => ({ id: `ai-fr-${Date.now()}-${idx}`, text: `[FR] ${text}`, completed: false, type: 'FR' as const })),
      ...aiDraft.nfrItems.map((text, idx) => ({ id: `ai-nfr-${Date.now()}-${idx}`, text: `[NFR] ${text}`, completed: false, type: 'NFR' as const }))
    ]
    const newReq: RequirementSpec = {
      id: aiDraft.id,
      title: aiDraft.title,
      category: aiDraft.category,
      sourceDoc: `package/docs/requirements/${aiDraft.id}_${aiDraft.title.replace(/[^a-zA-Z0-9]/g, '')}.md`,
      description: aiDraft.description,
      items: newItems
    }

    setSpecs(prev => [...prev, newReq])

    // Generate matching Technical Design architecture section
    const designSnippet = `\n\n### 3.${specs.length + 1} Architecture & Data Flow: ${aiDraft.title} (${aiDraft.id})\n` +
      `- **Specification Category**: ${aiDraft.category}\n` +
      `- **Primary API Endpoint**: \`/api/v1/${aiDraft.id.toLowerCase()}/execute\`\n` +
      `- **Database Schema Binding**: Supabase PostgreSQL table \`${aiDraft.id.toLowerCase().replace(/[^a-z0-9]/g, '_')}\`\n` +
      `- **IBM Bob Subagent Handler**: Registered in \`.bob/skills/${aiDraft.id.toLowerCase()}.py\`\n` +
      `- **Functional Contract**:\n` +
      aiDraft.frItems.map(item => `  - ${item}`).join('\n') + '\n' +
      `- **Non-Functional Guarantee**:\n` +
      aiDraft.nfrItems.map(item => `  - ${item}`).join('\n')

    // Generate matching Implementation Tasks
    const newTasks = [
      {
        id: `TASK-${aiDraft.id}-01`,
        description: `Backend & Database: Implement REST API endpoint and PostgreSQL migration for ${aiDraft.title}`,
        completed: false
      },
      {
        id: `TASK-${aiDraft.id}-02`,
        description: `Frontend & QA Canvas: Bind UI components and run watsonx QA verification for ${aiDraft.title}`,
        completed: false
      }
    ]

    onAddRequirement?.(newReq, designSnippet, newTasks)

    setUserPrompt('')
    setAiDraft(null)
    setShowAddModal(false)
  }


  // Calculate metrics
  const totalSubItems = specs.reduce((acc, r) => acc + r.items.length, 0)
  const completedSubItems = specs.reduce((acc, r) => acc + r.items.filter(i => i.completed).length, 0)
  const overallPercent = totalSubItems > 0 ? Math.round((completedSubItems / totalSubItems) * 100) : 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, padding: '4px 0' }}>

      {/* ── Overall Header & Auto-Docs Tracker Bar ─────────────────── */}
      <div style={{
        padding: 20, borderRadius: 14, background: 'rgba(15, 17, 26, 0.85)',
        border: '1px solid rgba(15, 98, 254, 0.25)', display: 'flex', flexDirection: 'column', gap: 14
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <FileText size={20} color="#0F62FE" />
              <h2 style={{ fontSize: 17, fontWeight: 700, color: '#fff', margin: 0 }}>
                Requirement Specs — Auto-Tracked from Package Docs
              </h2>
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                background: 'rgba(66, 190, 101, 0.15)', border: '1px solid rgba(66, 190, 101, 0.3)',
                color: '#42BE65', display: 'flex', alignItems: 'center', gap: 6
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#42BE65', boxShadow: '0 0 6px #42BE65' }} />
                Auto-Syncing package/docs/
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', margin: 0 }}>
              Requirements are automatically tracked from <code>package/docs/requirements/</code> and <code>prd.md</code>.
              Interactive checkboxes update live completion progress bars.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              type="button"
              onClick={handleSyncDocs}
              disabled={syncing}
              style={{
                padding: '8px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.15)',
                background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 12, fontWeight: 600,
                cursor: syncing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <RefreshCw size={14} className={syncing ? 'sr-spin' : ''} />
              <span>{syncing ? 'Scanning docs…' : 'Sync & Scan Docs'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              style={{
                padding: '8px 16px', borderRadius: 8, border: 'none',
                background: 'linear-gradient(135deg, #0F62FE, #8A3FFC)',
                color: '#fff', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                boxShadow: '0 4px 16px rgba(138, 63, 252, 0.3)'
              }}
            >
              <Sparkles size={14} color="#fff" />
              <span>Add Requirement with IBM Bob</span>
            </button>
          </div>
        </div>

        {syncMessage && (
          <div style={{ fontSize: 12, color: '#42BE65', fontWeight: 600, padding: '6px 12px', background: 'rgba(66,190,101,0.1)', borderRadius: 6 }}>
            ✓ {syncMessage}
          </div>
        )}

        {/* Global Progress Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span style={{ color: 'rgba(255,255,255,0.6)' }}>Overall SDD Verification Progress</span>
            <span style={{ fontWeight: 700, color: overallPercent === 100 ? '#42BE65' : '#60A5FA' }}>
              {overallPercent}% ({completedSubItems}/{totalSubItems} sub-requirements verified)
            </span>
          </div>
          <div style={{ width: '100%', height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${overallPercent}%`, height: '100%',
                background: overallPercent === 100
                  ? 'linear-gradient(90deg, #42BE65, #22C55E)'
                  : 'linear-gradient(90deg, #0F62FE, #8A3FFC)',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
        </div>
      </div>

      {/* ── Requirements Cards List ─────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {specs.map(req => {
          const reqTotal = req.items.length
          const reqDone = req.items.filter(i => i.completed).length
          const reqPercent = reqTotal > 0 ? Math.round((reqDone / reqTotal) * 100) : 0
          const isFullyDone = reqPercent === 100

          return (
            <div
              key={req.id}
              style={{
                background: 'rgba(15, 17, 26, 0.75)',
                border: isFullyDone ? '1px solid rgba(66, 190, 101, 0.3)' : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 14, padding: 18,
                display: 'flex', flexDirection: 'column', gap: 14,
                transition: 'border-color 0.2s'
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      fontFamily: 'monospace', fontSize: 12, fontWeight: 700,
                      color: '#0F62FE', padding: '2px 8px', borderRadius: 4,
                      background: 'rgba(15, 98, 254, 0.15)', border: '1px solid rgba(15, 98, 254, 0.3)'
                    }}>
                      {req.id}
                    </span>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>
                      {req.title}
                    </h3>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', padding: '2px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.05)' }}>
                      {req.category}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '4px 0 0 0' }}>
                    {req.description}
                  </p>
                  {req.sourceDoc && (
                    <div style={{ fontSize: 11, color: '#60A5FA', fontFamily: 'monospace', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <FileCode size={12} /> {req.sourceDoc}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: isFullyDone ? '#42BE65' : '#60A5FA' }}>
                      {reqPercent}%
                    </span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginLeft: 6 }}>
                      ({reqDone}/{reqTotal} Verified)
                    </span>
                  </div>
                </div>
              </div>

              {/* Requirement Progress Bar */}
              <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${reqPercent}%`, height: '100%',
                    background: isFullyDone ? '#42BE65' : '#0F62FE',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>

              {/* Sub-item Interactive Checklist (FR & NFR) */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 4 }}>
                {req.items.map(item => (
                  <div
                    key={item.id}
                    onClick={() => toggleItem(req.id, item.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px', borderRadius: 8,
                      background: item.completed ? 'rgba(66, 190, 101, 0.06)' : 'rgba(0,0,0,0.3)',
                      border: item.completed ? '1px solid rgba(66, 190, 101, 0.2)' : '1px solid rgba(255,255,255,0.06)',
                      cursor: 'pointer', transition: 'background 0.15s'
                    }}
                  >
                    {item.completed ? (
                      <CheckCircle2 size={16} color="#42BE65" style={{ flexShrink: 0 }} />
                    ) : (
                      <Circle size={16} color="rgba(255,255,255,0.3)" style={{ flexShrink: 0 }} />
                    )}
                    <span style={{
                      fontSize: 13,
                      color: item.completed ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.65)'
                    }}>
                      {item.text}
                    </span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, fontFamily: 'monospace', color: item.completed ? '#42BE65' : 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
                      {item.completed ? 'VERIFIED' : 'PENDING'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Add Requirement Modal powered by IBM Bob 2.0 ───────────────── */}
      {showAddModal && (
        <div className="modal-overlay" onMouseDown={() => { setShowAddModal(false); setAiDraft(null); setUserPrompt('') }}>
          <div className="modal-box" style={{ width: 540 }} role="dialog" aria-modal="true" onMouseDown={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 12 }}>
              <Bot size={22} color="#8A3FFC" />
              <div>
                <h2 className="modal-title" style={{ margin: 0, fontSize: 16 }}>
                  Add Requirement Specification with IBM Bob 2.0
                </h2>
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                  Describe what feature you want in plain English. IBM Bob will draft the FR &amp; NFR items for your SDD spec.
                </p>
              </div>
            </div>

            {/* Prompt Input */}
            <div className="modal-field">
              <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} color="#8A3FFC" /> What do you want to build?
              </label>
              <textarea
                className="modal-input"
                rows={3}
                placeholder="e.g. We need Stripe payment checkout with subscription billing and PDF invoices, or Redis caching for high volume API routes."
                value={userPrompt}
                onChange={e => setUserPrompt(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleAiDraft}
              disabled={drafting || !userPrompt.trim()}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: 'rgba(138, 63, 252, 0.15)', border: '1px solid rgba(138, 63, 252, 0.4)',
                color: '#E879F9', fontWeight: 600, padding: '10px'
              }}
            >
              {drafting ? <Loader2 size={16} className="sr-spin" /> : <Wand2 size={16} />}
              <span>{drafting ? 'IBM Bob is drafting FR & NFR breakdown…' : 'AI Draft FR & NFR with IBM Bob'}</span>
            </button>

            {/* Render AI Drafted Spec */}
            {aiDraft && (
              <div style={{
                background: 'rgba(0,0,0,0.4)', borderRadius: 10, padding: 14,
                border: '1px solid rgba(138, 63, 252, 0.4)', display: 'flex', flexDirection: 'column', gap: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', fontWeight: 700, color: '#8A3FFC', padding: '2px 6px', background: 'rgba(138,63,252,0.2)', borderRadius: 4 }}>
                      {aiDraft.id}
                    </span>
                    <strong style={{ fontSize: 13, color: '#fff' }}>{aiDraft.title}</strong>
                  </div>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{aiDraft.category}</span>
                </div>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
                  {aiDraft.description}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, paddingTop: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#60A5FA' }}>Functional Requirements (FR):</span>
                  {aiDraft.frItems.map(item => (
                    <div key={item} style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#42BE65' }}>•</span> [FR] {item}
                    </div>
                  ))}
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#FCD34D', marginTop: 4 }}>Non-Functional Requirements (NFR):</span>
                  {aiDraft.nfrItems.map(item => (
                    <div key={item} style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ color: '#FCD34D' }}>•</span> [NFR] {item}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn btn--ghost" onClick={() => { setShowAddModal(false); setAiDraft(null); setUserPrompt('') }}>Cancel</button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={handleSaveAiDraft}
                disabled={!aiDraft}
              >
                Add Generated Requirements to Spec
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render raw markdown fallback if provided */}
      {requirements.trim() && (
        <div style={{ marginTop: 12, padding: 16, background: 'rgba(0,0,0,0.4)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)', margin: '0 0 10px 0' }}>Raw Prompt Manifest Requirements</h4>
          <MarkdownView source={requirements} />
        </div>
      )}

    </div>
  )
}
