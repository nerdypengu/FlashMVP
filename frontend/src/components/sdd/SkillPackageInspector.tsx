import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Package, Bot, FileText, Zap, Folder, Check } from 'lucide-react'

export default function SkillPackageInspector() {
  const navigate = useNavigate()
  const [selectedRepo, setSelectedRepo] = useState('ibmbob-dev/flashstore-api')
  const [isInjecting, setIsInjecting] = useState(false)
  const [injectStep, setInjectStep] = useState(0)
  const [isDownloaded, setIsDownloaded] = useState(false)

  const logs = [
    '[OAuth] Authorizing GitHub OAuth credentials...',
    '[Skills] Injecting 5 IBM Bob 2.0 Skills into .bob/skills/...',
    '[Docs] Generating SDD documentation structure (docs/prd.md, docs/architecture.md)...',
    '[Manifest] Writing flashmvp.json manifest & GitHub Actions workflow...',
    '[Complete] Injection complete! IBM Bob 2.0 Agent is onboarded and ready.'
  ]

  const handleInject = () => {
    setIsInjecting(true)
    setInjectStep(0)
    const interval = setInterval(() => {
      setInjectStep(prev => {
        if (prev >= logs.length - 1) {
          clearInterval(interval)
          setIsInjecting(false)
          return prev
        }
        return prev + 1
      })
    }, 600)
  }

  const handleDownloadZip = () => {
    // Generate a mock text file download to simulate zip package download
    const manifestContent = JSON.stringify({
      name: "ibm-bob-skill-package",
      version: "2.1.0",
      skills: [
        "bob-skill-code-engine",
        "bob-skill-cloud-db",
        "bob-skill-secrets-vault",
        "bob-skill-watsonx-qa",
        "bob-skill-manifest-parser"
      ],
      documentation: ["docs/prd.md", "docs/architecture-system-design.md", "flashmvp.json"],
      boilerplate: "React TypeScript + FastAPI Python"
    }, null, 2)

    const blob = new Blob([manifestContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ibm-bob-skill-package-v2.1.0.json'
    a.click()
    URL.revokeObjectURL(url)

    setIsDownloaded(true)
    setTimeout(() => setIsDownloaded(false), 3000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 32 }}>

      {/* ── Top Banner ──────────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        padding: '24px 28px',
        background: 'rgba(15, 98, 254, 0.06)',
        borderRadius: 16,
        border: '1px solid rgba(15, 98, 254, 0.2)',
        backdropFilter: 'blur(16px)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Package size={24} color="#0F62FE" />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>
              IBM Bob 2.0 Skill Pack &amp; Onboarding Package
            </h1>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 12,
              background: 'rgba(66, 190, 101, 0.2)', color: '#42BE65', border: '1px solid rgba(66, 190, 101, 0.4)'
            }}>
              v2.1.0 Ready
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0, maxWidth: 680 }}>
            Pre-packaged AI infrastructure skills, spec-driven documentation structures, and tech stack boilerplate designed to instantly onboard IBM Bob 2.0 into any GitHub repository.
          </p>
        </div>

        <button
          type="button"
          onClick={handleDownloadZip}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 20px',
            background: isDownloaded ? '#42BE65' : 'linear-gradient(135deg, #0F62FE 0%, #0043CE 100%)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 13,
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(15,98,254,0.3)',
            transition: 'all 0.2s',
          }}
        >
          {isDownloaded ? <Check size={16} /> : <Zap size={16} />}
          <span>{isDownloaded ? 'Package Downloaded!' : 'Download Skill Package (.zip)'}</span>
        </button>
      </div>

      {/* ── 3-Column Content Breakdown Grid ──────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 20
      }}>

        {/* Column 1: IBM Bob Skills */}
        <div style={{
          background: 'rgba(15, 17, 26, 0.75)',
          border: '1px solid rgba(15, 98, 254, 0.25)',
          borderRadius: 16,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Bot size={20} color="#0F62FE" />
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>
                IBM Bob 2.0 Skill Modules
              </h3>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Injected into `.bob/skills/`</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { name: 'bob-skill-code-engine', desc: 'Container builds & IBM Code Engine deployment' },
              { name: 'bob-skill-cloud-db', desc: 'Automated IBM PostgreSQL schema migrations' },
              { name: 'bob-skill-secrets-vault', desc: 'IBM Secrets Manager key & token proxy' },
              { name: 'bob-skill-watsonx-qa', desc: 'Watsonx AI security audit & pytest runner' },
              { name: 'bob-skill-manifest-parser', desc: 'Reads & parses repository flashmvp.json' }
            ].map(s => (
              <div key={s.name} style={{
                padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#60A5FA', fontFamily: 'monospace' }}>
                  {s.name}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: SDD Spec Documentation */}
        <div style={{
          background: 'rgba(15, 17, 26, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileText size={20} color="#A7F3D0" />
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>
                Spec-Driven Documentation
              </h3>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Structured context in `docs/`</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { file: 'docs/prd.md', desc: 'Product Requirements & User Story Matrix' },
              { file: 'docs/architecture-system-design.md', desc: 'Subagent Swarm & Container Network topology' },
              { file: 'docs/backlogs/README.md', desc: '4-Person Role Task Partitioning Guide' },
              { file: 'flashmvp.json', desc: 'Service ports, build commands & deploy manifest' }
            ].map(f => (
              <div key={f.file} style={{
                padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#A7F3D0', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileText size={13} />
                  <span>{f.file}</span>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: Tech Stack Starter */}
        <div style={{
          background: 'rgba(15, 17, 26, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 16,
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 14
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Zap size={20} color="#FDE047" />
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>
                Tech Stack Starter Boilerplate
              </h3>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>React 18 TypeScript + FastAPI</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { path: 'client/ (Frontend)', desc: 'React 18 + Vite + TypeScript + Dark Glassmorphism' },
              { path: 'server/ (Backend)', desc: 'FastAPI Python 3.11 + Pydantic + Uvicorn' },
              { path: 'Dockerfile.frontend', desc: 'Multi-stage Nginx container build' },
              { path: 'Dockerfile.backend', desc: 'Python 3.11 slim container build' },
              { path: '.github/workflows/deploy.yml', desc: 'GitHub Actions trigger for IBM Code Engine' }
            ].map(b => (
              <div key={b.path} style={{
                padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#FDE047', fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Folder size={13} />
                  <span>{b.path}</span>
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                  {b.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Interactive Injection Simulator Widget ──────────────────── */}
      <div style={{
        padding: 24, borderRadius: 16, background: 'rgba(15, 17, 26, 0.9)',
        border: '1px solid rgba(15, 98, 254, 0.3)', display: 'flex', flexDirection: 'column', gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 4px 0' }}>
              Direct GitHub Repository Package Injection Simulator
            </h3>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
              Simulate pushing this onboarding package directly to a target repository via GitHub API.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <input
              type="text"
              value={selectedRepo}
              onChange={e => setSelectedRepo(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)', color: '#fff', fontSize: 13,
                fontFamily: 'monospace', outline: 'none', width: 220
              }}
            />
            <button
              type="button"
              disabled={isInjecting}
              onClick={handleInject}
              style={{
                padding: '9px 18px', borderRadius: 8, border: 'none',
                background: isInjecting ? 'rgba(15,98,254,0.4)' : '#0F62FE',
                color: '#fff', fontSize: 13, fontWeight: 600, cursor: isInjecting ? 'wait' : 'pointer'
              }}
            >
              {isInjecting ? 'Injecting Package...' : 'Inject Package to Repo'}
            </button>
          </div>
        </div>

        {/* Log Window */}
        <div style={{
          padding: 16, borderRadius: 10, background: '#08090E',
          border: '1px solid rgba(255,255,255,0.1)', fontFamily: 'monospace', fontSize: 12,
          display: 'flex', flexDirection: 'column', gap: 6
        }}>
          {logs.slice(0, injectStep + 1).map((log, idx) => (
            <div key={idx} style={{
              color: idx === injectStep ? '#60A5FA' : idx === logs.length - 1 ? '#42BE65' : 'rgba(255,255,255,0.7)'
            }}>
              [{new Date().toLocaleTimeString()}] {log}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            style={{
              padding: '8px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent', color: 'rgba(255,255,255,0.7)', fontSize: 12, cursor: 'pointer'
            }}
          >
            ← Return to Dashboard
          </button>
          <button
            type="button"
            onClick={() => navigate('/qa')}
            style={{
              padding: '8px 16px', borderRadius: 8,
              background: 'rgba(66,190,101,0.2)', color: '#42BE65', fontSize: 12,
              fontWeight: 600, cursor: 'pointer', border: '1px solid rgba(66,190,101,0.4)'
            }}
          >
            Go to QA Canvas →
          </button>
        </div>
      </div>

    </div>
  )
}
