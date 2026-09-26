import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, ShieldCheck, Server, Database, Code2, Cpu, Rocket, ArrowRight, CheckCircle2, Bot, Plug, Globe, Terminal } from 'lucide-react'
import TypewriterHero from '../ui/TypewriterHero'

export default function LandingHomePage() {
  const navigate = useNavigate()
  const [typingComplete, setTypingComplete] = useState(false)

  const FEATURES = [
    {
      icon: Code2,
      color: '#0F62FE',
      title: 'Prompt to 3-Part SDD Specs',
      desc: 'Transforms high-level prompts into precise PRD requirements, PostgreSQL DDL schemas, and IBM Cloud service bindings.'
    },
    {
      icon: Server,
      color: '#60A5FA',
      title: 'IBM Code Engine Container Fleet',
      desc: 'Deploys multi-container microservice fleets with automatic scaling from 0 to 10 replicas in seconds.'
    },
    {
      icon: ShieldCheck,
      color: '#42BE65',
      title: 'watsonx Automated QA Inspector',
      desc: 'Executes ESLint static code analysis, Pytest unit tests, secret leak auditing, and dependency CVE checks.'
    },
    {
      icon: Database,
      color: '#FCD34D',
      title: 'Instant Database Provisioning',
      desc: 'Provisions isolated PostgreSQL multi-tenant schemas on IBM Cloud DB & Supabase in under 200ms.'
    },
    {
      icon: Plug,
      color: '#E879F9',
      title: 'Model Context Protocol (MCP)',
      desc: 'Provides standardized MCP tool endpoints enabling IBM Bob 2.0 subagents to inspect and control container state.'
    },
    {
      icon: Globe,
      color: '#A7F3D0',
      title: 'Cloudflare Quick SSL Tunnel',
      desc: 'Generates instant public HTTPS egress URLs for container endpoints without manual DNS configuration.'
    }
  ]

  const WORKFLOW_STEPS = [
    { step: '01', title: 'Natural Language Prompt', desc: 'Describe your application MVP in natural language.' },
    { step: '02', title: 'Bob Spec Synthesis', desc: 'IBM Bob 2.0 generates the 3-part SDD spec & architecture.' },
    { step: '03', title: 'Subagent Execution', desc: 'Parallel subagents synthesize code, database & QA audits.' },
    { step: '04', title: 'Live Container Egress', desc: 'Container fleet deployed with live Cloudflare tunnel URL.' }
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 48, paddingBottom: 64, width: '100%', maxWidth: 1100, margin: '0 auto' }}>
      
      {/* ── Hero Section ────────────────────────────────────────────── */}
      <div className="hero-overview" style={{ padding: '24px 0 0 0' }}>
        <div className="trust-row anim" style={{ '--d': '0.05s' } as React.CSSProperties}>
          <div className="avatar-ring avatar-ring-1" title="IBM Cloud & Bob 2.0">
            <div className="avatar-inner">
              <i className="fa-brands fa-ibm" style={{ fontSize: '16px' }} />
            </div>
          </div>
          <div className="avatar-ring avatar-ring-2" title="Docker Container Fleet">
            <div className="avatar-inner">
              <i className="fa-brands fa-docker" style={{ fontSize: '15px' }} />
            </div>
          </div>
          <div className="avatar-ring avatar-ring-3" title="Cloudflare Quick Tunnel">
            <div className="avatar-inner">
              <i className="fa-brands fa-cloudflare" style={{ fontSize: '15px' }} />
            </div>
          </div>
          <div className="trust-pill">
            <span className="trust-text">Powered by IBM Bob 2.0 &amp; Cloud Fleet</span>
          </div>
        </div>

        <TypewriterHero
          line1Text="FLASHMVP"
          line2Text="SPEC TO CONTAINER"
          onComplete={() => setTypingComplete(true)}
        />

        <p className={`subhead sequential-reveal ${typingComplete ? 'sequential-reveal--visible' : ''}`}
          style={{ transitionDelay: '0.05s', maxWidth: 680, margin: '0 auto' }}>
          Autonomous agentic middleware proxy. Transform natural prompts into production-grade
          container fleets with automated 3-part SDD specs, instant IBM Cloud DB provisioning,
          and watsonx QA observability.
        </p>

        <div
          className={`sequential-reveal ${typingComplete ? 'sequential-reveal--visible' : ''}`}
          style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', transitionDelay: '0.18s', marginTop: 20 }}
        >
          <button type="button" className="cta-btn" onClick={() => navigate('/login')}>
            <Zap size={16} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 6 }} /> Get Started Now
          </button>
          <button
            type="button" className="cta-btn"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
            onClick={() => navigate('/login')}
          >
            Sign In to Dashboard →
          </button>
        </div>

        {/* Platform Stats Row */}
        <footer
          className={`stats sequential-reveal ${typingComplete ? 'sequential-reveal--visible' : ''}`}
          aria-label="Platform Statistics"
          style={{ marginTop: 'clamp(28px, 4vh, 48px)', transitionDelay: '0.32s' }}
        >
          {[
            { icon: '<', value: '200', suffix: 'ms',     label: 'DB Provisioning'            },
            { icon: '%', value: '99.9', suffix: '%',     label: 'watsonx QA Reliability'     },
            { icon: '*', value: '24',   suffix: '/7',    label: 'Autonomous Container Fleet' },
            { icon: '#', value: '1',    suffix: '-Click', label: 'Spec-to-Deploy Cycle'      },
          ].map(s => (
            <div key={s.label} className="stat-item">
              <div className="stat-top">
                <span className="stat-icon">{s.icon}</span>
                <div className="stat-value-group">
                  <span className="stat-value">{s.value}</span>
                  <span className="stat-suffix">{s.suffix}</span>
                </div>
              </div>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </footer>
      </div>

      {/* ── Feature Capabilities Grid ───────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: '#fff', margin: '0 0 8px 0', letterSpacing: '-0.02em' }}>
            Built for Autonomous Agentic Development
          </h2>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', maxWidth: 580, margin: '0 auto' }}>
            FlashMVP bridges IBM Bob 2.0 subagent intelligence directly with IBM Cloud container infrastructure.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20
        }}>
          {FEATURES.map(feat => {
            const IconComponent = feat.icon
            return (
              <div
                key={feat.title}
                style={{
                  background: 'rgba(15, 17, 26, 0.75)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 16,
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  transition: 'border-color 0.2s, transform 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(15, 98, 254, 0.4)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <IconComponent size={22} color={feat.color} />
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>
                  {feat.title}
                </h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0, lineHeight: 1.5 }}>
                  {feat.desc}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Workflow Architecture Pipeline ─────────────────────────── */}
      <div style={{
        padding: 32, borderRadius: 20,
        background: 'rgba(15, 98, 254, 0.05)',
        border: '1px solid rgba(15, 98, 254, 0.2)',
        display: 'flex', flexDirection: 'column', gap: 24
      }}>
        <div style={{ textAlign: 'center' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#4589FF', textTransform: 'uppercase', letterSpacing: '1px' }}>
            AGENTIC PIPELINE ARCHITECTURE
          </span>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: '4px 0 0 0' }}>
            How FlashMVP Executes Prompts to Container Fleets
          </h2>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16
        }}>
          {WORKFLOW_STEPS.map((ws, idx) => (
            <div key={ws.step} style={{
              background: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 12, padding: 20,
              display: 'flex', flexDirection: 'column', gap: 10, position: 'relative'
            }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#0F62FE', fontFamily: 'monospace' }}>
                STEP {ws.step}
              </span>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>
                {ws.title}
              </h4>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0, lineHeight: 1.4 }}>
                {ws.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA Banner ──────────────────────────────────────────────── */}
      <div style={{
        padding: 36, borderRadius: 20,
        background: 'linear-gradient(135deg, rgba(15, 98, 254, 0.25) 0%, rgba(0, 67, 206, 0.25) 100%)',
        border: '1px solid rgba(15, 98, 254, 0.4)',
        textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16
      }}>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0 }}>
          Ready to Deploy Your Autonomous MVP?
        </h2>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', margin: 0, maxWidth: 520 }}>
          Sign in to access your active container fleets, live telemetry stats, and watsonx QA canvas.
        </p>
        <button
          type="button"
          onClick={() => navigate('/login')}
          style={{
            padding: '12px 28px', borderRadius: 10, border: 'none',
            background: '#0F62FE', color: '#fff', fontWeight: 600, fontSize: 14,
            cursor: 'pointer', boxShadow: '0 4px 20px rgba(15,98,254,0.5)',
            display: 'inline-flex', alignItems: 'center', gap: 8
          }}
        >
          <Zap size={16} />
          <span>Launch Dashboard</span>
          <ArrowRight size={16} />
        </button>
      </div>

    </div>
  )
}
