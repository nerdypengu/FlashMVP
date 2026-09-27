import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Code2, Database, ExternalLink, FlaskConical, GitBranch, Globe, Plug, Radio, Server, Zap } from 'lucide-react'
import projectsMock from '../../mocks/projects_mock.json'
import './ProjectDetailsPage.css'

export default function ProjectDetailsPage() {
  const navigate = useNavigate()
  const { projectId } = useParams<{ projectId?: string }>()
  const project = projectsMock.find(item => item.id === projectId) || projectsMock[0]
  const running = project.status === 'RUNNING'

  const endpoints = [
    {
      title: 'Public Egress Tunnel', icon: Globe, meta: running ? 'HTTP 200' : 'STOPPED',
      description: 'Cloudflare Quick SSL tunnel mapping directly to IBM Code Engine container port 3001.',
      action: 'Launch Live App', url: project.containerUrl || project.previewUrl, featured: true,
    },
    {
      title: 'FastAPI OpenAPI Docs', icon: Code2, meta: 'Swagger UI',
      description: 'Interactive OpenAPI docs and live HTTP endpoint testing console.',
      action: 'Explore /docs', url: project.backendUrl || 'http://localhost:8001/docs',
    },
    {
      title: 'Database Console', icon: Database, meta: 'PG 16.2',
      description: `Isolated PostgreSQL schema ${project.dbSchema || 'app_default'}.`,
      action: 'Supabase Dashboard', url: project.dbUrl || 'https://supabase.com',
    },
    {
      title: 'IBM MCP Server', icon: Plug, meta: 'v2.1',
      description: 'Model Context Protocol tool server for Bob subagents and container control.',
      action: 'MCP Protocol Endpoint', url: project.mcpUrl || 'http://localhost:8001/mcp',
    },
  ]

  const fleet = [
    ['IBM Code Engine Status', <span className={`project-detail-status ${running ? 'is-running' : ''}`}>{running ? `RUNNING (${project.containers} Replicas)` : 'STOPPED'}</span>],
    ['IBM Cloud Region', project.region || 'us-south (Dallas)'],
    ['Allocated CPU Core', project.cpuAllocated || '0.5 vCPU'],
    ['Allocated RAM Memory', project.ramAllocated || '1024 MB'],
    ['PostgreSQL Schema', project.dbSchema || 'app_default'],
    ['Last Deployment', project.lastDeployed],
  ]

  const repository = [
    ['Repository', <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">{project.repo}</a>],
    ['Active Branch', project.branch],
    ['Latest Commit SHA', project.commit],
    ['Bob Manifest', '.bob/settings/ibm-environment.json'],
    ['watsonx QA Security Audit', 'PASSED (0 Leaks)'],
  ]

  return <div className="project-details-page">
    <button type="button" className="project-details-back" onClick={() => navigate('/dashboard')}>
      <ArrowLeft size={14} aria-hidden="true" /> Back to Projects
    </button>

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
        <button type="button" onClick={() => navigate(`/project/${projectId ?? project.id}/telemetry`)}><Radio size={14} aria-hidden="true" /> View Telemetry &amp; Logs</button>
        <button type="button" onClick={() => navigate(`/project/${projectId ?? project.id}/qa`)}><FlaskConical size={14} aria-hidden="true" /> Open QA Canvas</button>
      </div>
    </header>

    <section className="project-details-section" aria-labelledby="project-endpoints-title">
      <div className="project-details-section-heading">
        <h2 id="project-endpoints-title">Application Endpoints &amp; Connected Consoles</h2>
        <span>{endpoints.length} {running ? 'active' : 'configured'} services</span>
      </div>
      <div className="project-details-endpoints">
        {endpoints.map(({ title, icon: Icon, meta, description, action, url, featured }) =>
          <article className="project-detail-card project-detail-endpoint" key={title}>
            <div className="project-detail-endpoint-heading">
              <Icon size={16} aria-hidden="true" /><h3>{title}</h3><span className="project-details-tag">{meta}</span>
            </div>
            <p>{description}</p>
            <a className={featured ? 'is-featured' : ''} href={url} target="_blank" rel="noopener noreferrer">
              {action}<ExternalLink size={12} aria-hidden="true" />
            </a>
          </article>
        )}
      </div>
    </section>

    <div className="project-details-panels">
      <section className="project-detail-card project-detail-panel" aria-labelledby="project-fleet-title">
        <div className="project-detail-panel-heading"><Server size={15} aria-hidden="true" /><h2 id="project-fleet-title">Container Fleet &amp; Hardware Specs</h2><span>Node cluster</span></div>
        <dl>{fleet.map(([label, value]) => <div key={String(label)}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      </section>
      <section className="project-detail-card project-detail-panel" aria-labelledby="project-repo-title">
        <div className="project-detail-panel-heading"><GitBranch size={15} aria-hidden="true" /><h2 id="project-repo-title">GitHub Repository &amp; CI/CD Context</h2><span>git-v2</span></div>
        <dl>{repository.map(([label, value]) => <div key={String(label)}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      </section>
    </div>

    <section className="project-details-section" aria-labelledby="project-skills-title">
      <div className="project-details-section-heading">
        <h2 id="project-skills-title">IBM Bob 2.0 Agent Skill Modules Loaded</h2>
        <span>{project.ibmServices.length} active runtime skills</span>
      </div>
      <div className="project-details-skills">
        {project.ibmServices.map(service => <div className="project-detail-card project-detail-skill" key={service}>
          <span className="project-detail-skill-check" aria-hidden="true"><Check size={12} /></span>
          <div><strong>{service}</strong><small>Registered in .bob/skills/</small></div>
        </div>)}
      </div>
    </section>
  </div>
}
