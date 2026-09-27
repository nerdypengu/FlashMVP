import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Zap, Globe, Code2, Database, Plug, Radio, FlaskConical, Cpu, GitBranch, Check, ExternalLink, Copy, Layers } from 'lucide-react'
import projectsMock from '../../mocks/projects_mock.json'
import TemplateSelectorPage from '../shell/TemplateSelectorPage'
import './ProjectDetailsPage.css'

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
  const project = projectsMock.find(item => item.id === projectId) || projectsMock[0]
  const running = project.status === 'RUNNING'

  const fleet: Array<[string, React.ReactNode]> = [
    ['IBM Code Engine Status', <span className={`project-detail-status ${running ? 'is-running' : ''}`}>{running ? `RUNNING (${project.containers} Replicas)` : 'STOPPED'}</span>],
    ['IBM Cloud Region', project.region || 'us-south (Dallas)'],
    ['Allocated CPU Core', project.cpuAllocated || '0.5 vCPU'],
    ['Allocated RAM Memory', project.ramAllocated || '1024 MB'],
    ['PostgreSQL Schema', project.dbSchema || 'app_default'],
    ['Last Deployment', project.lastDeployed],
  ]

  const repository: Array<[string, React.ReactNode]> = [
    ['Repository', <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">{project.repo}</a>],
    ['Active Branch', project.branch],
    ['Latest Commit SHA', project.commit],
    ['Bob Manifest', '.bob/settings/ibm-environment.json'],
    ['watsonx QA Security Audit', 'PASSED (0 Leaks)'],
  ]

  return (
    <div className="project-details-page">
      {/* Hero Header */}
      <header className="project-details-hero">
        <div className="project-details-identity">
          <span className="project-details-mark" aria-hidden="true"><Zap size={20} /></span>
          <div>
            <div className="project-details-name">
              <h1>{project.name}</h1><span className="project-details-tag">{project.templateName}</span>
            </div>
            <p className="project-details-id">• ID: {project.id}</p>
            <p className="project-details-description">{project.description}</p>
          </div>
        </div>

        <div className="project-details-actions">
          <button type="button" onClick={() => navigate('/telemetry')}>
            <Radio size={14} aria-hidden="true" /> Telemetry &amp; Container Fleet
          </button>
          <button type="button" onClick={() => navigate('/qa-canvas')}>
            <FlaskConical size={14} aria-hidden="true" /> watsonx QA Canvas
          </button>
        </div>
      </header>

      {/* Application Endpoints & Connected Consoles */}
      <section className="project-details-section" aria-labelledby="project-endpoints-title">
        <div className="project-details-section-heading">
          <h2 id="project-endpoints-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ExternalLink size={18} color="#0F62FE" />
            <span>Application Endpoints &amp; Connected Consoles</span>
          </h2>
          <span>4 configured services</span>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 16
        }}>
          <EndpointCopyCard
            title="Public Egress Tunnel"
            icon={<Globe size={18} color="#60A5FA" />}
            badgeText={running ? 'HTTP 200' : 'STOPPED'}
            badgeClass={`badge ${running ? 'badge--passed' : ''}`}
            description="Cloudflare Quick SSL Tunnel mapping directly to IBM Code Engine container port 3001."
            url={project.containerUrl || project.previewUrl || 'https://flashmvp-app.us-south.codeengine.appdomain.cloud'}
          />

          <EndpointCopyCard
            title="FastAPI OpenAPI Docs"
            icon={<Code2 size={18} color="#A7F3D0" />}
            badgeText="Swagger UI"
            badgeColor="#A7F3D0"
            description="Interactive OpenAPI specification docs and live HTTP endpoint testing console."
            url={project.backendUrl || 'http://localhost:8001/docs'}
          />

          <EndpointCopyCard
            title="Database Console"
            icon={<Database size={18} color="#FCD34D" />}
            badgeText="PG 16.2"
            badgeColor="#FCD34D"
            description={`Isolated PostgreSQL schema ${project.dbSchema || 'app_default'} provisioned in 184ms.`}
            url={project.dbUrl || 'https://supabase.com/dashboard/project/db_schema_app'}
          />

          <EndpointCopyCard
            title="IBM MCP Server"
            icon={<Plug size={18} color="#E879F9" />}
            badgeText="v2.1"
            badgeColor="#E879F9"
            description="Model Context Protocol tool server providing Bob subagents real-time container control."
            url={project.mcpUrl || 'http://localhost:8001/mcp'}
          />
        </div>
      </section>

      {/* Panels: Container Fleet & GitHub Repo */}
      <div className="project-details-panels">
        <article className="project-detail-card project-detail-panel">
          <div className="project-detail-panel-heading">
            <Cpu size={16} aria-hidden="true" />
            <h2>Container Fleet &amp; Hardware Specs</h2>
            <span>IBM Code Engine</span>
          </div>
          <dl>
            {fleet.map(([label, val]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{val}</dd>
              </div>
            ))}
          </dl>
        </article>

        <article className="project-detail-card project-detail-panel">
          <div className="project-detail-panel-heading">
            <GitBranch size={16} aria-hidden="true" />
            <h2>GitHub Repository &amp; CI/CD Context</h2>
            <span>watsonx Pipeline</span>
          </div>
          <dl>
            {repository.map(([label, val]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{val}</dd>
              </div>
            ))}
          </dl>
        </article>
      </div>

      {/* IBM Bob Agent Skills */}
      <section className="project-details-section" aria-labelledby="project-skills-title">
        <div className="project-details-section-heading">
          <h2 id="project-skills-title">IBM Bob 2.0 Agent Skill Modules Loaded</h2>
          <span>{project.ibmServices.length} active runtime skills</span>
        </div>
        <div className="project-details-skills">
          {project.ibmServices.map(service => (
            <div className="project-detail-card project-detail-skill" key={service}>
              <span className="project-detail-skill-check" aria-hidden="true"><Check size={12} /></span>
              <div><strong>{service}</strong><small>Registered in .bob/skills/</small></div>
            </div>
          ))}
        </div>
      </section>

      {/* Project Starter Template Section (Bottom Section) */}
      <section className="project-details-section" aria-labelledby="project-starter-title">
        <div className="project-details-section-heading">
          <h2 id="project-starter-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Layers size={18} color="#0F62FE" />
            <span>Project Starter Template</span>
          </h2>
        </div>
        <TemplateSelectorPage />
      </section>
    </div>
  )
}



