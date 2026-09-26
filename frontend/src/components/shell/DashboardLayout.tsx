import { useState } from 'react'
import { useNavigate, useLocation, useParams } from 'react-router-dom'
import { Zap, Radio, FlaskConical, Crown, User, LogOut, ChevronLeft, ChevronRight, FileText, ShieldCheck, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import BinaryCanvasBackground from '../ui/BinaryCanvasBackground'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { projectId } = useParams<{ projectId?: string }>()
  const { user, role, signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  // Show sidebar ONLY when viewing a project context (details, telemetry, qa, env-config)
  const isProjectView = location.pathname.startsWith('/project/') ||
                        location.pathname === '/qa' ||
                        location.pathname === '/env-config'

  // Extract active project id for sidebar navigation links
  const activeProjectId = projectId || 'proj_8f92a'

  const NAV_ITEMS = [
    { path: `/project/${activeProjectId}/details`,   icon: FileText,     label: 'Project Details'   },
    { path: `/project/${activeProjectId}/telemetry`, icon: Radio,        label: 'Telemetry & Stats' },
    { path: '/qa',                                  icon: FlaskConical, label: 'QA Canvas'         },
    { path: '/env-config',                          icon: ShieldCheck,  label: 'Environment Config'},
  ]

  const isActive = (path: string) => {
    if (path.includes('/details')) return location.pathname.includes('/details')
    if (path.includes('/telemetry')) return location.pathname.includes('/telemetry')
    return location.pathname === path
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <BinaryCanvasBackground />

      {/* ── Sidebar (ONLY shown when inside project detail/context) ──── */}
      {isProjectView && (
        <aside style={{
          position: 'relative',
          zIndex: 20,
          width: collapsed ? 64 : 220,
          minWidth: collapsed ? 64 : 220,
          display: 'flex',
          flexDirection: 'column',
          background: 'rgba(8, 8, 14, 0.92)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          transition: 'width 0.22s cubic-bezier(0.22,1,0.36,1), min-width 0.22s cubic-bezier(0.22,1,0.36,1)',
          overflow: 'hidden',
        }}>

          {/* Sidebar Top Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: collapsed ? '18px 0' : '18px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            flexShrink: 0,
          }}>
            {!collapsed && (
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                }}
              >
                <img src="/assets/logo.webp" alt="FlashMVP" width={28} height={28}
                  style={{ borderRadius: 6, background: '#fff', padding: 2 }} />
                <span style={{ fontWeight: 700, fontSize: 13, color: '#fff', letterSpacing: '-0.3px' }}>
                  FlashMVP
                </span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setCollapsed(v => !v)}
              title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 6,
                color: 'rgba(255,255,255,0.5)',
                width: 26, height: 26,
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11,
                flexShrink: 0,
                marginLeft: collapsed ? 0 : 4,
              }}
            >
              {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>

          {/* Back to Projects button inside sidebar */}
          <div style={{ padding: '10px 8px 6px 8px' }}>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              title={collapsed ? 'Back to Projects' : undefined}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: collapsed ? '8px 0' : '8px 10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: 8,
                border: '1px solid rgba(15,98,254,0.35)',
                background: 'rgba(15,98,254,0.12)',
                color: '#60A5FA',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <ArrowLeft size={14} />
              {!collapsed && <span>Back to Projects</span>}
            </button>
          </div>

          {/* Nav items */}
          <nav style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
            {NAV_ITEMS.map(item => {
              const active = isActive(item.path)
              const IconComponent = item.icon
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  title={collapsed ? item.label : undefined}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: collapsed ? '10px 0' : '9px 12px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    marginBottom: 3,
                    fontSize: 13,
                    fontWeight: active ? 600 : 400,
                    background: active
                      ? 'rgba(15,98,254,0.18)'
                      : 'transparent',
                    color: active ? '#fff' : 'rgba(255,255,255,0.6)',
                    borderLeft: active ? '3px solid #0F62FE' : '3px solid transparent',
                    transition: 'background 0.15s, color 0.15s',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                  }}
                  onMouseEnter={e => {
                    if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)'
                  }}
                  onMouseLeave={e => {
                    if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  }}
                >
                  <IconComponent size={16} style={{ flexShrink: 0 }} />
                  {!collapsed && <span>{item.label}</span>}
                </button>
              )
            })}
          </nav>
        </aside>
      )}

      {/* ── Main content area ──────────────────────────────────────── */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Top bar — Logo/Title + User Profile & Logout at Top Right */}
        <div style={{
          height: 56,
          flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: 'rgba(8,8,14,0.7)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {!isProjectView && (
              <button
                type="button"
                onClick={() => navigate('/')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                }}
              >
                <img src="/assets/logo.webp" alt="FlashMVP" width={28} height={28}
                  style={{ borderRadius: 6, background: '#fff', padding: 2 }} />
                <span style={{ fontWeight: 700, fontSize: 15, color: '#fff', letterSpacing: '-0.3px' }}>
                  FlashMVP
                </span>
              </button>
            )}
            <span style={{
              fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)',
              letterSpacing: '-0.01em',
            }}>
              {isProjectView ? 'Project Console' : 'Projects Dashboard'}
            </span>
          </div>

          {/* Top Right Logout & User Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 10px',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 20,
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                background: role === 'admin' ? 'rgba(15,98,254,0.25)' : 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {role === 'admin' ? <Crown size={12} color="#0F62FE" /> : <User size={12} />}
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                {user?.email ?? ''}
              </span>
              <span style={{
                fontSize: 10, color: role === 'admin' ? '#4589FF' : 'rgba(255,255,255,0.4)',
                textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.4px'
              }}>
                {role ?? 'user'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleSignOut}
              title="Sign out"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid rgba(218,30,40,0.3)',
                cursor: 'pointer',
                background: 'rgba(218,30,40,0.1)',
                color: 'rgba(218,30,40,0.9)',
                fontSize: 12,
                fontWeight: 600,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(218,30,40,0.2)'
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.background = 'rgba(218,30,40,0.1)'
              }}
            >
              <LogOut size={13} />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Scrollable page content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          scrollbarWidth: 'thin',
          scrollbarColor: '#424652 transparent',
        }}>
          {children}
        </div>
      </main>
    </div>
  )
}
