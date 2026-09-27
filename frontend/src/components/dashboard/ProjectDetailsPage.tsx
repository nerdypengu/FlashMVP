import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Zap, Globe, Code2, Database, Plug, Radio, FlaskConical, ShieldCheck, Cpu, HardDrive, GitBranch, CheckCircle2, Server, Terminal, ExternalLink, Copy, Check, Layers } from 'lucide-react'
import projectsMock from '../../mocks/projects_mock.json'
import TemplateSelectorPage from '../shell/TemplateSelectorPage'

function EndpointCopyCard({
  title, icon, badgeText, badgeClass, badgeColor, description, url
}: {
  title: string
  icon: React.ReactNode
  badgeText?: string
  badgeClass?: string
  badgeColor?: string
  description: string
  url: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* fallback if clipboard fails */
    }
  }

  return (
    <div className="glass-card" style={{ padding: 18, background: 'rgba(15,17,26,0.85)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {icon}
          <span style={{ fontWeight: 600, fontSize: 13, color: '#fff' }}>{title}</span>
        </div>
        {badgeText && (
          badgeClass ? (
            <span className={badgeClass}>{badgeText}</span>
          ) : (
            <span style={{ fontSize: 11, color: badgeColor || '#60A5FA', fontFamily: 'monospace' }}>{badgeText}</span>
          )
        )}
      </div>
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '0 0 12px 0' }}>
        {description}
      </p>

      {/* Copyable Text Box */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(0, 0, 0, 0.4)', padding: '6px 10px', borderRadius: 8,
        border: '1px solid rgba(255, 255, 255, 0.12)'
      }}>
        <input
          type="text"
          readOnly
          value={url}
          style={{
            flex: 1, background: 'none', border: 'none', color: '#60A5FA',
            fontFamily: 'monospace', fontSize: 12, outline: 'none', textOverflow: 'ellipsis'
          }}
          onClick={e => e.currentTarget.select()}
        />
        <button
          type="button"
          onClick={handleCopy}
          style={{
            background: copied ? 'rgba(66, 190, 101, 0.2)' : 'rgba(255, 255, 255, 0.1)',
            border: copied ? '1px solid #42BE65' : '1px solid rgba(255, 255, 255, 0.2)',
            color: copied ? '#42BE65' : '#fff',
            borderRadius: 6, padding: '4px 8px', fontSize: 11, fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0
          }}
          title="Copy URL to Clipboard"
        >
          {copied ? <Check size={13} color="#42BE65" /> : <Copy size={13} />}
          <span>{copied ? 'Copied!' : 'Copy'}</span>
        </button>
      </div>
    </div>
  )
}

export default function ProjectDetailsPage() {
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId?: string }>()

  // Find project or fallback to first
  const project = projectsMock.find(p => p.id === projectId) || projectsMock[0]
  const isRunning = project.status === 'RUNNING'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 32 }}>

      {/* ── Header Navigation & Title ───────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          style={{
            alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 6,
            background: 'none', border: 'none', color: '#60A5FA', fontSize: 13,
            fontWeight: 600, cursor: 'pointer', padding: 0
          }}
        >
          <ArrowLeft size={14} /> <span>Back to Projects</span>
        </button>

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
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <Zap size={26} color="#0F62FE" />
              <div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
                  {project.name}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <span style={{ fontSize: 12, color: '#A7F3D0', fontWeight: 600 }}>
                    {project.templateName}
                  </span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>•</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', fontFamily: 'monospace' }}>
                    ID: {project.id}
                  </span>
                </div>
              </div>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: '6px 0 0 0', maxWidth: 650 }}>
              {project.description}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => navigate(`/project/${project.id}/telemetry`)}
              style={{
                padding: '10px 18px', borderRadius: 8, border: '1px solid rgba(15, 98, 254, 0.4)',
                background: 'rgba(15, 98, 254, 0.15)', color: '#60A5FA', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <Radio size={15} />
              <span>View Telemetry &amp; Logs</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/qa')}
              style={{
                padding: '10px 18px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)',
                background: 'rgba(255,255,255,0.06)', color: '#fff', fontSize: 13, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <FlaskConical size={15} />
              <span>Open QA Canvas</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Primary Links Grid Section ─────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ExternalLink size={18} color="#0F62FE" />
          <span>Application Endpoints &amp; Connected Consoles</span>
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16
        }}>
          {/* Container Public Tunnel */}
          <EndpointCopyCard
            title="Public Egress Tunnel"
            icon={<Globe size={18} color="#60A5FA" />}
            badgeText="HTTP 200"
            badgeClass="badge badge--passed"
            description="Cloudflare Quick SSL Tunnel mapping directly to IBM Code Engine container port 3001."
            url={project.containerUrl || project.previewUrl || 'https://flashmvp-app.us-south.codeengine.appdomain.cloud'}
          />

          {/* Backend API Docs */}
          <EndpointCopyCard
            title="FastAPI OpenAPI Docs"
            icon={<Code2 size={18} color="#A7F3D0" />}
            badgeText="Swagger UI"
            badgeColor="#A7F3D0"
            description="Interactive OpenAPI specification docs and live HTTP endpoint testing console."
            url={project.backendUrl || 'http://localhost:8001/docs'}
          />

          {/* Supabase DB Console */}
          <EndpointCopyCard
            title="Database Console"
            icon={<Database size={18} color="#FCD34D" />}
            badgeText="PG 16.2"
            badgeColor="#FCD34D"
            description={`Isolated PostgreSQL schema ${project.dbSchema || 'app_default'} provisioned in 184ms.`}
            url={project.dbUrl || 'https://supabase.com/dashboard/project/db_schema_app'}
          />

          {/* IBM MCP Server */}
          <EndpointCopyCard
            title="IBM MCP Server"
            icon={<Plug size={18} color="#E879F9" />}
            badgeText="v2.1"
            badgeColor="#E879F9"
            description="Model Context Protocol tool server providing Bob subagents real-time container control."
            url={project.mcpUrl || 'http://localhost:8001/mcp'}
          />
        </div>
      </div>

      {/* ── Comprehensive Project Details & Infrastructure Specs ──── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: 20
      }}>
        {/* Container & Hardware Fleet Details */}
        <div style={{
          padding: 22, borderRadius: 16, background: 'rgba(15, 17, 26, 0.85)',
          border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
          display: 'flex', flexDirection: 'column', gap: 16
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Server size={18} color="#0F62FE" />
            <span>Container Fleet &amp; Hardware Specs</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>IBM Code Engine Status</span>
              <span style={{ color: isRunning ? '#42BE65' : '#DA1E28', fontWeight: 700 }}>
                {isRunning ? '● RUNNING (2 Replicas)' : '● STOPPED'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>IBM Cloud Region</span>
              <span style={{ color: '#fff', fontWeight: 600 }}>{project.region || 'us-south (Dallas)'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Allocated CPU Core</span>
              <span style={{ color: '#60A5FA', fontWeight: 600 }}>{project.cpuAllocated || '0.5 vCPU'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Allocated RAM Memory</span>
              <span style={{ color: '#A7F3D0', fontWeight: 600 }}>{project.ramAllocated || '1024 MB'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>PostgreSQL Schema</span>
              <span style={{ color: '#FCD34D', fontFamily: 'monospace', fontWeight: 600 }}>{project.dbSchema || 'app_default'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Last Deployment</span>
              <span style={{ color: 'rgba(255,255,255,0.8)' }}>{project.lastDeployed}</span>
            </div>
          </div>
        </div>

        {/* GitHub Repository & Branch Details */}
        <div style={{
          padding: 22, borderRadius: 16, background: 'rgba(15, 17, 26, 0.85)',
          border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
          display: 'flex', flexDirection: 'column', gap: 16
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <GitBranch size={18} color="#60A5FA" />
            <span>GitHub Repository &amp; CI/CD Context</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Repository</span>
              <a href={project.repoUrl} target="_blank" rel="noreferrer" style={{ color: '#60A5FA', textDecoration: 'none', fontWeight: 600 }}>
                {project.repo}
              </a>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Active Branch</span>
              <span style={{ color: '#fff', fontFamily: 'monospace' }}>{project.branch}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Latest Commit SHA</span>
              <span style={{ color: '#A7F3D0', fontFamily: 'monospace' }}>{project.commit}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>Bob Manifest</span>
              <span style={{ color: '#4589FF', fontFamily: 'monospace' }}>.bob/settings/ibm-environment.json</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>watsonx QA Security Audit</span>
              <span style={{ color: '#42BE65', fontWeight: 700 }}>PASSED (0 Leaks)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Active IBM Skills & Agent Modules ──────────────────────── */}
      <div style={{
        padding: 22, borderRadius: 16, background: 'rgba(15, 17, 26, 0.85)',
        border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
        display: 'flex', flexDirection: 'column', gap: 16
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={18} color="#A7F3D0" />
          <span>IBM Bob 2.0 Agent Skill Modules Loaded</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
          {project.ibmServices.map(svc => (
            <div key={svc} style={{
              padding: 12, borderRadius: 10, background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(15,98,254,0.2)', display: 'flex', alignItems: 'center', gap: 10
            }}>
              <CheckCircle2 size={16} color="#42BE65" />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{svc}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Registered in .bob/skills/</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Starter Template Section (Bottom Section) ── */}
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Layers size={18} color="#0F62FE" />
          <span>Project Starter Template</span>
        </h3>
        <TemplateSelectorPage />
      </div>


    </div>
  )
}


