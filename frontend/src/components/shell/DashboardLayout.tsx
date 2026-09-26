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
  { path: '/dashboard',  icon: '⚡', label: 'Overview'     },
  { path: '/starter',    icon: '🚀', label: 'Starter'      },
  { path: '/specs',      icon: '📋', label: 'Specs Review' },
  { path: '/qa',         icon: '🧪', label: 'QA Canvas'    },
  { path: '/history',    icon: '📜', label: 'Run History'  },
  { path: '/playground', icon: '🖥️', label: 'Playground'   },
  { path: '/telemetry',  icon: '📡', label: 'Telemetry'    },
  { path: '/hub',        icon: '📦', label: 'xAppHub'      },
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

        {/* Logo + collapse toggle */}
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
              onClick={() => navigate('/')}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
              }}
            >
              <img src="/assets/logo.webp" alt="FlashMVP" width={32} height={32}
                style={{ borderRadius: 8, background: '#fff', padding: 2 }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: '#fff', letterSpacing: '-0.3px' }}>
                FlashMVP
              </span>
            </button>
          )}
          {collapsed && (
            <img src="/assets/logo.webp" alt="FlashMVP" width={32} height={32}
              style={{ borderRadius: 8, background: '#fff', padding: 2, cursor: 'pointer' }}
              onClick={() => navigate('/')}
            />
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
              transition: 'background 0.15s',
              marginLeft: collapsed ? 0 : 4,
            }}
          >
            {collapsed ? '›' : '‹'}
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
                <span style={{ fontSize: 16, lineHeight: 1, flexShrink: 0 }}>{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
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
