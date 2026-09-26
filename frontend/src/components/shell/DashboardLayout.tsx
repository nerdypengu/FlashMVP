import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Crown, FileText, FlaskConical, History, LogOut, Radio, ShieldCheck, User, Monitor, BookOpen, Layers, Boxes } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import BinaryCanvasBackground from '../ui/BinaryCanvasBackground'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { projectId } = useParams()
  const { user, role, signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const isProjectView = location.pathname.startsWith('/project/') ||
    ['/qa', '/history', '/playground', '/telemetry', '/env-config', '/specs', '/starter', '/skill-pack'].includes(location.pathname)
  const items = [
    { path: `/project/${projectId || 'proj_8f92a'}/details`, label: 'Project Details', icon: FileText },
    { path: `/project/${projectId || 'proj_8f92a'}/telemetry`, label: 'Telemetry & Stats', icon: Radio },
    { path: '/telemetry', label: 'Container Telemetry', icon: Radio },
    { path: '/qa', label: 'QA Canvas', icon: FlaskConical },
    { path: '/history', label: 'Run History', icon: History },
    { path: '/playground', label: 'Playground', icon: Monitor },
    { path: '/specs', label: 'Specs Review', icon: BookOpen },
    { path: '/starter', label: 'Starter', icon: Layers },
    { path: '/skill-pack', label: 'Skill Pack', icon: Boxes },
    { path: '/hub', label: 'xAppHub', icon: Boxes },
    { path: '/env-config', label: 'Environment Config', icon: ShieldCheck },
  ]

  return <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>
    <BinaryCanvasBackground />
    {isProjectView && <>
      <button type="button" className="sidebar-toggle" style={{ left: collapsed ? 64 : 220 }}
        onClick={() => setCollapsed(value => !value)} aria-controls="dashboard-sidebar" aria-expanded={!collapsed}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        <ArrowLeft size={16} style={{ transform: collapsed ? 'rotate(180deg)' : undefined }} />
      </button>
      <aside id="dashboard-sidebar" className={`dashboard-sidebar${collapsed ? ' is-collapsed' : ''}`} style={{
        position: 'relative', zIndex: 20, width: collapsed ? 64 : 220, minWidth: collapsed ? 64 : 220,
        display: 'flex', flexDirection: 'column', background: 'rgba(8,8,14,.92)',
        borderRight: '1px solid rgba(255,255,255,.07)', overflow: 'hidden',
      }}>
        <div style={{ padding: '18px 14px', borderBottom: '1px solid rgba(255,255,255,.06)' }}>
          <button type="button" className="sidebar-brand" onClick={() => navigate('/dashboard')} aria-label="Back to Projects">
            <span className="sidebar-brand-mark" aria-hidden="true"><FileText size={22} /></span>
            <span className="sidebar-brand-name sidebar-label" aria-hidden={collapsed}>Flash<span>MVP</span></span>
          </button>
        </div>
        <nav aria-label="Project navigation" style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
          <button type="button" className="sidebar-brand" onClick={() => navigate('/dashboard')}
            title="Back to Projects" style={{ padding: '10px', color: '#60A5FA' }}>
            <ArrowLeft size={16} /><span className="sidebar-label" aria-hidden={collapsed}>Back to Projects</span>
          </button>
          {items.map(item => {
            const active = location.pathname === item.path ||
              (item.path.includes('/details') && location.pathname === `/project/${projectId}`)
            const Icon = item.icon
            return <button key={item.path} type="button" onClick={() => navigate(item.path)}
              title={collapsed ? item.label : undefined} aria-label={item.label} aria-current={active ? 'page' : undefined}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px',
                marginBottom: 3, border: 0, borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap',
                background: active ? 'rgba(15,98,254,.18)' : 'transparent', color: active ? '#fff' : 'rgba(255,255,255,.65)' }}>
              <Icon size={16} style={{ flexShrink: 0 }} />
              <span className="sidebar-label" aria-hidden={collapsed}>{item.label}</span>
            </button>
          })}
        </nav>
      </aside>
    </>}
    <main style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative', zIndex: 10 }}>
      <header style={{ height: 56, flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'rgba(8,8,14,.7)' }}>
        <button type="button" className="sidebar-brand" onClick={() => navigate('/dashboard')}>
          {!isProjectView && <span className="sidebar-brand-mark" aria-hidden="true"><FileText size={20} /></span>}
          <span>{isProjectView ? 'Project Console' : 'Projects Dashboard'}</span>
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {role === 'admin' ? <Crown size={14} /> : <User size={14} />}
          <span style={{ fontSize: 12 }}>{user?.email ?? ''}</span>
          <button type="button" className="btn btn--ghost" onClick={async () => { await signOut(); navigate('/') }}>
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </header>
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, scrollbarWidth: 'thin' }}>{children}</div>
    </main>
  </div>
}
