import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Plus, Search, Radio, FlaskConical, Square, Play, Trash2, Bot, Rocket, CheckCircle2, XCircle, X } from 'lucide-react'
import initialProjects from '../../mocks/projects_mock.json'
import { TEMPLATES } from '../shell/TemplateSelector'

export interface Project {
  id: string
  name: string
  description: string
  repo: string
  repoUrl: string
  status: 'RUNNING' | 'STOPPED' | 'DEPLOYING'
  templateId: string
  templateName: string
  containers: number
  previewUrl: string
  containerUrl?: string
  backendUrl?: string
  dbUrl?: string
  mcpUrl?: string
  region?: string
  cpuAllocated?: string
  ramAllocated?: string
  dbSchema?: string
  lastDeployed: string
  commit: string
  branch: string
  ibmServices: string[]
}

export default function ProjectsDashboard() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>(initialProjects as Project[])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'RUNNING' | 'STOPPED'>('ALL')
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [newRepoName, setNewRepoName] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState(TEMPLATES[0].id)
  const [isPrivateRepo, setIsPrivateRepo] = useState(true)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deployStep, setDeployStep] = useState(0)

  const deployStepsText = [
    'Initializing GitHub repository via OAuth...',
    'Injecting starter template & flashmvp.json manifest...',
    'Registering IBM Bob 2.0 Environment Skills...',
    'Provisioning IBM Cloud DB & Code Engine container fleet...'
  ]

  // Filter projects
  const filteredProjects = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.repo.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Toggle project status (Start/Stop container fleet)
  const handleToggleStatus = (id: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id === id) {
        const nextStatus = p.status === 'RUNNING' ? 'STOPPED' : 'RUNNING'
        return { ...p, status: nextStatus }
      }
      return p
    }))
  }

  // Delete project
  const handleDeleteProject = (id: string) => {
    if (confirm('Are you sure you want to delete this project and stop its IBM Code Engine container fleet?')) {
      setProjects(prev => prev.filter(p => p.id !== id))
    }
  }

  // Handle project creation
  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectName.trim()) return

    setIsDeploying(true)
    setDeployStep(0)

    // Simulate multi-step injection & deployment
    const stepInterval = setInterval(() => {
      setDeployStep(step => {
        if (step >= deployStepsText.length - 1) {
          clearInterval(stepInterval)
          
          // Finish creation
          const chosenTemplate = TEMPLATES.find(t => t.id === selectedTemplateId) || TEMPLATES[0]
          const createdRepo = newRepoName.trim() || `ibmbob-dev/${newProjectName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
          const id = `proj_${Math.random().toString(36).substring(2, 7)}`
          
          const newProj: Project = {
            id,
            name: newProjectName,
            description: newProjectDesc || 'Created with IBM Bob 2.0 Environment Skills.',
            repo: createdRepo,
            repoUrl: `https://github.com/${createdRepo}`,
            status: 'RUNNING',
            templateId: chosenTemplate.id,
            templateName: `${chosenTemplate.name} (${chosenTemplate.description})`,
            containers: 2,
            previewUrl: `https://app-${id}.trycloudflare.com`,
            containerUrl: `https://app-${id}.trycloudflare.com`,
            backendUrl: `http://localhost:8001/docs`,
            dbUrl: `https://supabase.com/dashboard/project/${id}`,
            mcpUrl: `http://localhost:8001/mcp`,
            region: 'us-south (Dallas)',
            cpuAllocated: '0.5 vCPU',
            ramAllocated: '1024 MB',
            dbSchema: `app_${id}`,
            lastDeployed: 'Just now',
            commit: 'c9f8e7d',
            branch: 'main',
            ibmServices: ['IBM Code Engine', 'IBM Cloud DB', 'watsonx QA', 'Secrets Manager']
          }

          setProjects(prev => [newProj, ...prev])
          setIsDeploying(false)
          setIsModalOpen(false)
          setNewProjectName('')
          setNewProjectDesc('')
          setNewRepoName('')
          return 0
        }
        return step + 1
      })
    }, 700)
  }

  const runningCount = projects.filter(p => p.status === 'RUNNING').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 32 }}>
      
      {/* ── Top Header Banner ───────────────────────────────────────── */}
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
            <Zap size={22} color="#0F62FE" />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
              Projects Dashboard
            </h1>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 12,
              background: 'rgba(15,98,254,0.25)', color: '#4589FF', border: '1px solid rgba(15,98,254,0.4)'
            }}>
              IBM Bob 2.0 Connected
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0, maxWidth: 620 }}>
            Manage active container fleets, connected GitHub repositories, application endpoint links, and IBM Cloud deployment pipelines.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 20px',
            background: 'linear-gradient(135deg, #0F62FE 0%, #0043CE 100%)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 14,
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(15,98,254,0.4)',
            transition: 'transform 0.15s, box-shadow 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
        >
          <Plus size={16} />
          <span>Create New Project</span>
        </button>
      </div>

      {/* ── Summary Cards Bar ────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16
      }}>
        <div style={{
          padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 4
        }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Total Projects</span>
          <span style={{ fontSize: 24, fontWeight: 700, color: '#fff' }}>{projects.length}</span>
        </div>

        <div style={{
          padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 4
        }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>Running Container Fleets</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#42BE65' }}>{runningCount}</span>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#42BE65', boxShadow: '0 0 8px #42BE65' }} />
          </div>
        </div>

        <div style={{
          padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: 4
        }}>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>IBM Code Engine Status</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
            <i className="fa-brands fa-ibm" style={{ color: '#0F62FE', fontSize: 18 }} />
            <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>Operational (us-south)</span>
          </div>
        </div>
      </div>

      {/* ── Toolbar / Filter Bar ────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
      }}>
        {/* Search */}
        <div style={{ position: 'relative', minWidth: 260, flex: 1, maxWidth: 400 }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }}>
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Search projects, repositories, or endpoints..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: 13,
              outline: 'none',
            }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.03)', padding: 3, borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
          {(['ALL', 'RUNNING', 'STOPPED'] as const).map(st => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 14px',
                borderRadius: 6,
                border: 'none',
                background: statusFilter === st ? 'rgba(255,255,255,0.12)' : 'transparent',
                color: statusFilter === st ? '#fff' : 'rgba(255,255,255,0.5)',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {st === 'ALL' ? 'All Projects' : st === 'RUNNING' ? <><CheckCircle2 size={12} color="#42BE65" /> Running</> : <><XCircle size={12} color="#DA1E28" /> Stopped</>}
            </button>
          ))}
        </div>
      </div>

      {/* ── Project Cards Grid ───────────────────────────────────────── */}
      {filteredProjects.length === 0 ? (
        <div style={{
          padding: 48, textAlign: 'center', background: 'rgba(255,255,255,0.02)',
          borderRadius: 16, border: '1px border-dashed rgba(255,255,255,0.1)'
        }}>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '0 0 16px 0' }}>
            No projects found matching your search.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            style={{
              padding: '10px 18px', background: '#0F62FE', color: '#fff',
              border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer'
            }}
          >
            Create New Project
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
          gap: 20
        }}>
          {filteredProjects.map(project => {
            const isRunning = project.status === 'RUNNING'

            return (
              <div
                key={project.id}
                onClick={() => navigate(`/project/${project.id}/details`)}
                style={{
                  background: 'rgba(15, 17, 26, 0.85)',
                  backdropFilter: 'blur(20px)',
                  border: isRunning ? '1px solid rgba(15, 98, 254, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 16,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 16,
                  cursor: 'pointer',
                  transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
                  boxShadow: isRunning ? '0 4px 24px rgba(15, 98, 254, 0.1)' : 'none',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'rgba(15, 98, 254, 0.55)'
                  e.currentTarget.style.transform = 'translateY(-2px)'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = isRunning ? 'rgba(15, 98, 254, 0.35)' : 'rgba(255, 255, 255, 0.08)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                {/* Card Header */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
                    <div>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: '0 0 4px 0' }}>
                        {project.name}
                      </h3>
                      <span style={{ fontSize: 11, color: '#A7F3D0', fontWeight: 500 }}>
                        {project.templateName}
                      </span>
                    </div>

                    {/* Status Pill */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20,
                      background: isRunning ? 'rgba(66, 190, 101, 0.12)' : 'rgba(218, 30, 40, 0.12)',
                      border: isRunning ? '1px solid rgba(66, 190, 101, 0.3)' : '1px solid rgba(218, 30, 40, 0.3)',
                    }}>
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%',
                        background: isRunning ? '#42BE65' : '#DA1E28',
                        boxShadow: isRunning ? '0 0 6px #42BE65' : 'none'
                      }} />
                      <span style={{
                        fontSize: 11, fontWeight: 700,
                        color: isRunning ? '#42BE65' : '#DA1E28',
                        letterSpacing: '0.4px'
                      }}>
                        {project.status}
                      </span>
                    </div>
                  </div>

                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', margin: '0 0 14px 0', lineHeight: 1.4 }}>
                    {project.description}
                  </p>

                  {/* Linked GitHub Repo Badge */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    marginBottom: 12,
                  }}>
                    <a
                      href={project.repoUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={e => e.stopPropagation()}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        color: '#60A5FA', fontSize: 12, fontWeight: 500, textDecoration: 'none'
                      }}
                      onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
                      onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
                    >
                      <i className="fa-brands fa-github" style={{ fontSize: 14, color: '#fff' }} />
                      <span>{project.repo}</span>
                    </a>
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                      {project.branch} @ {project.commit}
                    </span>
                  </div>

                  {/* Project Specs & Allocation Detail Row */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: 11, color: 'rgba(255,255,255,0.5)', padding: '0 4px'
                  }}>
                    <span>Hardware: <strong style={{ color: '#fff' }}>{project.cpuAllocated || '0.5 vCPU'} / {project.ramAllocated || '1024 MB'}</strong></span>
                    <span>Schema: <strong style={{ color: '#4589FF' }}>{project.dbSchema || 'app_default'}</strong></span>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div style={{
                  paddingTop: 12,
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); navigate(`/project/${project.id}/details`) }}
                      title="View Complete Project Details & Architecture"
                      style={{
                        padding: '6px 12px', borderRadius: 6, border: '1px solid rgba(15, 98, 254, 0.4)',
                        background: '#0F62FE', color: '#fff', fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      <Zap size={13} />
                      <span>Project Details</span>
                    </button>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); navigate(`/project/${project.id}/telemetry`) }}
                      title="View Container Hardware Telemetry & Web Traffic Stats"
                      style={{
                        padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 12, fontWeight: 600,
                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                      }}
                    >
                      <Radio size={13} />
                      <span>Telemetry</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); handleToggleStatus(project.id) }}
                      title={isRunning ? 'Stop Container Fleet' : 'Start Container Fleet'}
                      style={{
                        padding: '6px 10px', borderRadius: 6,
                        border: isRunning ? '1px solid rgba(218, 30, 40, 0.4)' : '1px solid rgba(66, 190, 101, 0.4)',
                        background: isRunning ? 'rgba(218, 30, 40, 0.1)' : 'rgba(66, 190, 101, 0.1)',
                        color: isRunning ? '#DA1E28' : '#42BE65',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      {isRunning ? <><Square size={12} /> Stop</> : <><Play size={12} /> Start</>}
                    </button>

                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); handleDeleteProject(project.id) }}
                      title="Delete Project"
                      style={{
                        padding: '6px 8px', borderRadius: 6, border: 'none',
                        background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)',
                        fontSize: 12, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

              </div>
            )
          })}
        </div>
      )}

      {/* ── Create New Project Modal ─────────────────────────────────── */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            width: '100%', maxWidth: 540,
            background: '#0D0F17',
            border: '1px solid rgba(15, 98, 254, 0.3)',
            borderRadius: 20,
            padding: 28,
            boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 30px rgba(15, 98, 254, 0.2)',
          }}>
            {isDeploying ? (
              /* Deployment Progress View */
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{
                  width: 56, height: 56, margin: '0 auto 20px auto', borderRadius: '50%',
                  background: 'rgba(15, 98, 254, 0.15)', border: '2px solid #0F62FE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Bot size={28} color="#0F62FE" />
                </div>
                <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: '0 0 8px 0' }}>
                  IBM Bob 2.0 Provisioning Fleet
                </h3>
                <p style={{ color: '#60A5FA', fontSize: 13, margin: '0 0 24px 0', minHeight: 20 }}>
                  {deployStepsText[deployStep]}
                </p>

                {/* Progress bar */}
                <div style={{
                  height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 4,
                  overflow: 'hidden', maxWidth: 360, margin: '0 auto'
                }}>
                  <div style={{
                    height: '100%', background: '#0F62FE',
                    width: `${((deployStep + 1) / deployStepsText.length) * 100}%`,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>
            ) : (
              /* Input Form View */
              <form onSubmit={handleCreateProject} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Rocket size={20} color="#0F62FE" />
                    <h2 style={{ fontSize: 18, fontWeight: 700, color: '#fff', margin: 0 }}>
                      Create New Project
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: 4 }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>
                    Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Payments Microservice"
                    value={newProjectName}
                    onChange={e => setNewProjectName(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff', fontSize: 13, outline: 'none',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>
                    Target GitHub Repository (OAuth Linked)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
                      github.com/ibmbob-dev/
                    </span>
                    <input
                      type="text"
                      placeholder={newProjectName ? newProjectName.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'repo-name'}
                      value={newRepoName}
                      onChange={e => setNewRepoName(e.target.value)}
                      style={{
                        flex: 1, padding: '10px 12px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                        color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'monospace'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>
                    Starter Template
                  </label>
                  <select
                    value={selectedTemplateId}
                    onChange={e => setSelectedTemplateId(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 8,
                      background: '#161922', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff', fontSize: 13, outline: 'none',
                    }}
                  >
                    {TEMPLATES.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} — {t.description}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>
                    Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Brief summary of your application..."
                    value={newProjectDesc}
                    onChange={e => setNewProjectDesc(e.target.value)}
                    style={{
                      width: '100%', padding: '10px 12px', borderRadius: 8,
                      background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                      color: '#fff', fontSize: 13, outline: 'none', resize: 'vertical'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="checkbox"
                    id="private-repo-check"
                    checked={isPrivateRepo}
                    onChange={e => setIsPrivateRepo(e.target.checked)}
                    style={{ accentColor: '#0F62FE', width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <label htmlFor="private-repo-check" style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', cursor: 'pointer' }}>
                    Create as Private GitHub Repository
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    style={{
                      padding: '10px 16px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)',
                      background: 'transparent', color: 'rgba(255,255,255,0.7)', fontSize: 13, cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '10px 20px', borderRadius: 8, border: 'none',
                      background: '#0F62FE', color: '#fff', fontWeight: 600, fontSize: 13,
                      cursor: 'pointer', boxShadow: '0 4px 14px rgba(15,98,254,0.4)'
                    }}
                  >
                    Create &amp; Inject Repo
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  )
}
