import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Zap } from 'lucide-react'
import QACanvas from './components/qa/QACanvas'
import RunHistoryTable, { type Run } from './components/qa/RunHistoryTable'
import PlaygroundWindow from './components/playground/PlaygroundWindow'
import TelemetryCharts from './components/telemetry/TelemetryCharts'
import TemplateSelectorPage from './components/shell/TemplateSelectorPage'
import SpecReviewPage from './components/sdd/SpecReviewPage'
import AppCatalog from './components/portal/AppCatalog'
import ProjectsDashboard from './components/dashboard/ProjectsDashboard'
import ProjectDetailsPage from './components/dashboard/ProjectDetailsPage'
import ProjectDetailsTelemetry from './components/dashboard/ProjectDetailsTelemetry'
import EnvironmentConfigPage from './components/config/EnvironmentConfigPage'
import SkillPackageInspector from './components/sdd/SkillPackageInspector'
import LandingHomePage from './components/home/LandingHomePage'
import LoginPage from './components/auth/LoginPage'
import RequireAuth from './components/auth/RequireAuth'
import DashboardLayout from './components/shell/DashboardLayout'
import BinaryCanvasBackground from './components/ui/BinaryCanvasBackground'
import { useAuth } from './context/AuthContext'
import mockData from './mocks/qa_mock.json'
import { DEMO_MODE, errorMessage, loadProjects, loadRuns, type Project } from './lib/person2Data'

function ProjectTelemetry({ project }: { project?: Project }) {
  const { projectId } = useParams()
  return DEMO_MODE ? <ProjectDetailsTelemetry /> : <TelemetryCharts project={project?.project_id === projectId ? project : undefined} />
}

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const [runs, setRuns] = useState<Run[]>(DEMO_MODE ? mockData.runs : [])
  const [projects, setProjects] = useState<Project[]>([])
  const [projectId, setProjectId] = useState('')
  const [dataLoading, setDataLoading] = useState(false)
  const [dataError, setDataError] = useState('')
  const [reload, setReload] = useState(0)
  const project = projects.find(item => item.id === projectId)
  const projectPage = ['/qa', '/history', '/playground', '/telemetry'].includes(location.pathname)

  useEffect(() => {
    if (DEMO_MODE) return
    let active = true
    setProjects([]); setProjectId(''); setRuns([]); setDataError('')
    if (!user) return
    setDataLoading(true)
    loadProjects().then(rows => {
      if (active) { setProjects(rows); setProjectId(rows[0]?.id ?? '') }
    }).catch(error => { if (active) setDataError(errorMessage(error)) })
      .finally(() => { if (active) setDataLoading(false) })
    return () => { active = false }
  }, [user?.id, reload])

  useEffect(() => {
    if (DEMO_MODE || !projectId) return
    let active = true
    setRuns([])
    loadRuns(projectId).then(rows => { if (active) setRuns(rows) })
      .catch(error => { if (active) setDataError(errorMessage(error)) })
    return () => { active = false }
  }, [projectId])

  const dashboard = (content: React.ReactNode) => <RequireAuth><DashboardLayout>
    {!DEMO_MODE && projectPage ? <>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16 }}>
        <label htmlFor="workspace-project">Project</label>
        <select id="workspace-project" className="modal-input" value={projectId} disabled={dataLoading || !projects.length}
          onChange={event => { setProjectId(event.target.value); setDataError('') }}>
          {!projects.length && <option value="">{dataLoading ? 'Loading…' : 'No accessible projects'}</option>}
          {projects.map(item => <option key={item.id} value={item.id}>{item.app_name}</option>)}
        </select>
        <button type="button" className="btn btn--ghost" onClick={() => setReload(value => value + 1)}>Refresh</button>
      </div>
      {dataError && <p role="alert">{dataError}</p>}
      {dataLoading ? <p role="status">Loading projects…</p> : project ? content :
        <p>No project data is available. Create a project or ask its owner to add you as a member.</p>}
    </> : content}
  </DashboardLayout></RequireAuth>

  const card = (content: React.ReactNode) => dashboard(<div className="workspace-card glass-card page-enter">{content}</div>)

  return <Routes>
    <Route path="/" element={user ? <Navigate to="/dashboard" replace /> :
      <div className="app-shell"><BinaryCanvasBackground /><div className="page">
        <header className="header">
          <button type="button" className="logo-btn" onClick={() => navigate('/')} title="FlashMVP — Home">
            <img src="/assets/logo.webp" alt="FlashMVP" width="52" height="52" />
          </button>
          <nav className="nav-pill" aria-label="Main Navigation"><button type="button" className="nav-link active">Home</button></nav>
          <button type="button" className="sign-in-btn" onClick={() => navigate('/login')}><Zap size={14} /> Sign In</button>
        </header>
        <main className="hero-workspace"><LandingHomePage /></main>
      </div></div>} />
    <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
    <Route path="/dashboard" element={card(<ProjectsDashboard />)} />
    <Route path="/project/:projectId/details" element={card(<ProjectDetailsPage />)} />
    <Route path="/project/:projectId/telemetry" element={card(<ProjectTelemetry project={projects.find(item => item.project_id === location.pathname.split('/')[2])} />)} />
    <Route path="/project/:projectId" element={card(<ProjectDetailsPage />)} />
    <Route path="/env-config" element={card(<EnvironmentConfigPage />)} />
    <Route path="/skill-pack" element={card(<SkillPackageInspector />)} />
    <Route path="/starter" element={card(<TemplateSelectorPage />)} />
    <Route path="/specs" element={card(<SpecReviewPage />)} />
    <Route path="/qa" element={card(<QACanvas key={projectId} runs={runs}
      nextRunNumber={Math.max(0, ...runs.map(run => run.run_number)) + 1}
      onRunComplete={run => setRuns(previous => [run, ...previous])} />)} />
    <Route path="/history" element={card(<RunHistoryTable runs={runs} />)} />
    <Route path="/playground" element={card(<PlaygroundWindow key={projectId} project={project} />)} />
    <Route path="/telemetry" element={card(<div className="telemetry-layout"><TelemetryCharts key={projectId} project={project} /></div>)} />
    <Route path="/hub" element={card(<AppCatalog onOpenPlayground={() => navigate('/playground')} />)} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}
