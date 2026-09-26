/**
 * DashboardLayout — Authenticated shell with sidebar navigation
 *
 * Replaces the top-bar nav for all logged-in routes.
 * Structure:
 *   ┌─────────┬──────────────────────────────┐
 *   │ Sidebar │        Main content          │
 *   │  nav    │    (children rendered here)  │
 *   └─────────┴──────────────────────────────┘
 */
import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import BinaryCanvasBackground from '../ui/BinaryCanvasBackground'

const NAV_ITEMS = [
  { path: '/dashboard',  icon: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z', label: 'Overview' },
  { path: '/starter',    icon: 'M14 3l7 7-10 10-7 1 1-7L15 4 M14 3l-1 6 6-1 M5 14l5 5 M3 21l2-2', label: 'Starter' },
  { path: '/specs',      icon: 'M9 4H5v17h14V4h-4 M9 3h6v4H9z M8 12h8 M8 16h5', label: 'Specs Review' },
  { path: '/qa',         icon: 'M3 3h6v6H3z M15 15h6v6h-6z M9 6h9v9 M6 9v9h9', label: 'QA Canvas' },
  { path: '/history',    icon: 'M3 11a9 9 0 1 1 2 7 M3 4v7h7 M12 7v5l3 2', label: 'Run History' },
  { path: '/playground', icon: 'M3 4h18v13H3z M8 21h8 M12 17v4 M8 8l-3 3 3 3 M16 8l3 3-3 3', label: 'Playground' },
  { path: '/telemetry',  icon: 'M3 3v18h18 M5 13h3l3-7 4 11 3-7h3', label: 'Telemetry' },
  { path: '/hub',        icon: 'M12 3l9 5v9l-9 5-9-5V8z M3 8l9 5 9-5 M12 13v9 M7.5 5.5l9 5', label: 'xAppHub' },
]

interface Props {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: Props) {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user, role, signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/')

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      <BinaryCanvasBackground />

      {/* ── Sidebar ────────────────────────────────────────────────── */}
      <button type="button" className="sidebar-toggle" style={{ left: collapsed ? 64 : 220 }}
        onClick={() => setCollapsed(v => !v)} aria-controls="dashboard-sidebar" aria-expanded={!collapsed}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)' }}>
          <path d="m14 6-6 6 6 6" />
        </svg>
      </button>
      <aside id="dashboard-sidebar" className={`dashboard-sidebar${collapsed ? ' is-collapsed' : ''}`} style={{
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
        overflow: 'hidden',
      }}>

        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '18px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}>
          <button type="button" className="sidebar-brand" onClick={() => navigate('/')}
            aria-label="FlashMVP home" title={collapsed ? 'FlashMVP' : undefined}>
            <span className="sidebar-brand-mark" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M14 2L5 13h6l-1 9 9-12h-6l1-8Z" fill="currentColor" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
              </svg>
            </span>
            <span className="sidebar-brand-name sidebar-label" aria-hidden={collapsed}>Flash<span>MVP</span></span>
          </button>
        </div>

        {/* Nav items */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '10px 8px' }}>
          {NAV_ITEMS.map(item => {
            const active = isActive(item.path)
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                title={collapsed ? item.label : undefined}
                aria-label={item.label}
                aria-current={active ? 'page' : undefined}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '9px 12px',
                  justifyContent: 'flex-start',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  marginBottom: 2,
                  fontSize: 13,
                  fontWeight: active ? 600 : 400,
                  background: active
                    ? 'rgba(15,98,254,0.15)'
                    : 'transparent',
                  color: active ? '#fff' : 'rgba(255,255,255,0.5)',
                  borderLeft: active ? '2px solid #0F62FE' : '2px solid transparent',
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                  style={{ flexShrink: 0, color: active ? '#78a9ff' : 'inherit' }}>
                  <path d={item.icon} />
                </svg>
                <span className="sidebar-label" aria-hidden={collapsed}>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* User info + logout */}
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: collapsed ? '12px 8px' : '12px 12px',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          {/* Role badge */}
          {!collapsed && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 10px',
              background: 'rgba(255,255,255,0.04)',
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.07)',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: role === 'admin' ? 'rgba(15,98,254,0.25)' : 'rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, flexShrink: 0,
              }}>
                {role === 'admin' ? '👑' : '👤'}
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{
                  fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {user?.email ?? ''}
                </div>
                <div style={{
                  fontSize: 10, color: role === 'admin' ? 'rgba(15,98,254,0.9)' : 'rgba(255,255,255,0.35)',
                  textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600,
                }}>
                  {role ?? 'user'}
                </div>
              </div>
            </div>
          )}

          {/* Sign out button */}
          <button
            type="button"
            onClick={handleSignOut}
            title="Sign out"
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              justifyContent: collapsed ? 'center' : 'flex-start',
              padding: collapsed ? '10px 0' : '9px 10px',
              borderRadius: 8,
              border: '1px solid rgba(218,30,40,0.25)',
              cursor: 'pointer',
              background: 'rgba(218,30,40,0.08)',
              color: 'rgba(218,30,40,0.85)',
              fontSize: 12,
              fontWeight: 600,
              transition: 'background 0.15s, border-color 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(218,30,40,0.16)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(218,30,40,0.08)'
            }}
          >
            <span style={{ fontSize: 14, flexShrink: 0 }}>↩</span>
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* ── Main content area ──────────────────────────────────────── */}
      <main style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 10,
      }}>
        {/* Top bar — just page title, no full nav */}
        <div style={{
          height: 54,
          flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          background: 'rgba(8,8,14,0.6)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}>
          <span style={{
            fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.6)',
            letterSpacing: '-0.01em',
          }}>
            {NAV_ITEMS.find(n => isActive(n.path))?.label ?? 'Dashboard'}
          </span>
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
