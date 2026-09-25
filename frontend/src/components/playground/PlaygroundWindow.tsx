import { useState } from 'react'
import ServiceSwitcher from './ServiceSwitcher'

type Viewport = 'desktop' | 'tablet' | 'mobile'

const VIEWPORTS: Record<Viewport, string> = {
  desktop: '100%',
  tablet:  '768px',
  mobile:  '375px',
}

const SERVICE_URLS: Record<string, string> = {
  frontend: 'https://app-demo.trycloudflare.com',
  backend:  'http://localhost:8001/docs',
  db:       'https://supabase.com/dashboard',
}

export default function PlaygroundWindow() {
  const [service, setService] = useState('frontend')
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const currentUrl = SERVICE_URLS[service]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <ServiceSwitcher activeService={service} onSwitch={setService} />

      {/* Browser chrome header */}
      <div style={{
        background: '#1c1c28', border: '1px solid var(--glass-border)',
        borderBottom: 'none', borderRadius: '8px 8px 0 0',
        padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12,
      }}>
        {/* Traffic lights */}
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#da1e28' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f1c21b' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#24a148' }} />
        </div>
        {/* URL bar */}
        <div style={{
          flex: 1, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
          borderRadius: 6, padding: '5px 12px', fontSize: 12, color: 'var(--text-muted)',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          🔒 <span style={{ color: 'var(--text-primary)' }}>{currentUrl}</span>
        </div>
        {/* Viewport toggles */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(Object.keys(VIEWPORTS) as Viewport[]).map(v => (
            <button
              key={v}
              onClick={() => setViewport(v)}
              style={{
                background: viewport === v ? 'var(--ibm-blue)' : 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: 4, color: viewport === v ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer', fontSize: 11, padding: '4px 8px',
              }}
            >
              {v === 'desktop' ? '🖥' : v === 'tablet' ? '📱' : '📲'} {v}
            </button>
          ))}
        </div>
      </div>

      {/* Iframe container */}
      <div style={{
        background: '#0a0a0f', border: '1px solid var(--glass-border)',
        borderRadius: '0 0 8px 8px', overflow: 'hidden',
        display: 'flex', justifyContent: 'center', padding: '0',
        minHeight: 480,
      }}>
        <div style={{ width: VIEWPORTS[viewport], transition: 'width 0.3s', overflow: 'hidden' }}>
          <iframe
            key={service}
            src={currentUrl}
            style={{ width: '100%', height: 480, border: 'none', display: 'block' }}
            title="App Preview"
          />
        </div>
      </div>
    </div>
  )
}
