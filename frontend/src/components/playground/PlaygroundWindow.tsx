import { useState } from 'react'
import ServiceSwitcher from './ServiceSwitcher'
import DatabaseSchema from './DatabaseSchema'

type Viewport = 'desktop' | 'tablet' | 'mobile'

const VIEWPORTS: Record<Viewport, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '375px',
}

const SERVICE_URLS: Record<string, string> = {
  frontend: 'https://app-8f92a.trycloudflare.com',
  backend: 'http://localhost:8001/docs',
  db: 'https://supabase.com/dashboard/project/proj_8f92a',
}

export default function PlaygroundWindow() {
  const [service, setService] = useState('frontend')
  const [viewport, setViewport] = useState<Viewport>('desktop')
  const [useLiveIframe, setUseLiveIframe] = useState(false)
  const currentUrl = SERVICE_URLS[service]

  return (
    <div className="playground-container" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Service switcher tabs */}
      <ServiceSwitcher activeService={service} onSwitch={setService} />

      {/* Browser chrome header */}
      <div
        style={{
          background: '#1c1c28',
          border: '1px solid var(--glass-border)',
          borderBottom: 'none',
          borderRadius: '8px 8px 0 0',
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        {/* Traffic lights */}
        <div style={{ display: 'flex', gap: 6 }}>
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#da1e28' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#f1c21b' }} />
          <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#24a148' }} />
        </div>

        {/* URL bar */}
        <div
          style={{
            flex: 1,
            minWidth: 200,
            background: 'var(--glass-bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: 6,
            padding: '5px 12px',
            fontSize: 12,
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          🔒 <span style={{ color: 'var(--text-primary)' }}>{currentUrl}</span>
        </div>

        {/* Live Tunnel vs Interactive Sandbox Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => setUseLiveIframe(!useLiveIframe)}
            style={{
              background: useLiveIframe ? 'var(--ibm-blue)' : 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: 6,
              color: useLiveIframe ? '#fff' : 'var(--text-muted)',
              fontSize: 11,
              padding: '5px 10px',
              cursor: 'pointer',
            }}
            title="Toggle between Interactive Sandbox Simulation and Real Iframe Tunnel"
          >
            {useLiveIframe ? '🌐 Real Tunnel' : '⚡ Interactive Sandbox'}
          </button>
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
                borderRadius: 4,
                color: viewport === v ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: 11,
                padding: '4px 8px',
              }}
            >
              {v === 'desktop' ? '🖥' : v === 'tablet' ? '📱' : '📲'} {v}
            </button>
          ))}
        </div>
      </div>

      {/* Main Window Container */}
      <div
        style={{
          background: '#0a0a0f',
          border: '1px solid var(--glass-border)',
          borderRadius: '0 0 8px 8px',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          padding: 0,
          minHeight: 480,
        }}
      >
        <div style={{ width: VIEWPORTS[viewport], transition: 'width 0.3s', overflow: 'hidden' }}>
          {useLiveIframe ? (
            <iframe
              key={service}
              src={currentUrl}
              style={{ width: '100%', height: 480, border: 'none', display: 'block' }}
              title="App Preview"
            />
          ) : (
            <div style={{ padding: 24, minHeight: 480, background: '#0e0e16', color: '#f4f4f4', display: 'flex', flexDirection: 'column' }}>
              {service === 'frontend' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 18, color: '#fff', margin: 0 }}>🛍️ FlashStore — Preview</h3>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>Container: <code>app-8f92a_frontend:3001</code> · Host Port: 3001</p>
                    </div>
                    <span className="badge badge--passed">● Live (HTTP 200)</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    {[
                      { name: 'Quantum Mechanical Keyboard', price: '$189.00', stock: '24 in stock', cat: 'Hardware' },
                      { name: 'Cyberpunk OLED Terminal 4K', price: '$540.00', stock: '8 in stock', cat: 'Displays' },
                      { name: 'Neural Accelerator Pod v2', price: '$1,299.00', stock: '3 in stock', cat: 'AI Hardware' },
                    ].map((item, idx) => (
                      <div key={idx} className="glass-card" style={{ padding: 16, background: 'rgba(255,255,255,0.04)' }}>
                        <div style={{ fontSize: 11, color: 'var(--ibm-blue)', fontWeight: 600 }}>{item.cat}</div>
                        <div style={{ fontSize: 14, fontWeight: 600, margin: '6px 0' }}>{item.name}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#24a148' }}>{item.price}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{item.stock}</div>
                        <button className="btn btn--primary" style={{ width: '100%', marginTop: 12, fontSize: 11, padding: '6px 0' }}>
                          Add to Cart
                        </button>
                      </div>
                    ))}
                  </div>

                  <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', marginTop: 12 }}>
                    ⚡ Cloudflare Quick Tunnel Connected: <code>https://app-8f92a.trycloudflare.com</code>
                  </div>
                </div>
              )}

              {service === 'backend' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 18, color: '#fff', margin: 0 }}>⚙️ FastAPI Interactive OpenAPI Docs</h3>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>Container: <code>app-8f92a_backend:8001</code> · Host Port: 8001</p>
                    </div>
                    <span className="badge badge--passed">FastAPI v0.115.0</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {[
                      { method: 'POST', path: '/api/v1/specs/generate', desc: 'IBM Bob LLM prompt parser to 3-part SDD' },
                      { method: 'POST', path: '/api/v1/specs/approve', desc: 'Human sign-off approval lock' },
                      { method: 'GET',  path: '/api/v1/projects/{id}/runs', desc: 'Workflow QA and deployment run history' },
                      { method: 'POST', path: '/api/v1/projects/{id}/deploy', desc: 'Multi-container fleet deployment trigger' },
                      { method: 'GET',  path: '/api/v1/projects/{id}/containers/{cid}/logs', desc: 'Live SSE container terminal log streamer' },
                    ].map((api, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: 6, border: '1px solid var(--glass-border)' }}>
                        <span style={{ background: api.method === 'POST' ? '#198038' : '#0f62fe', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 4 }}>
                          {api.method}
                        </span>
                        <code style={{ fontSize: 13, color: '#f4f4f4' }}>{api.path}</code>
                        <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 'auto' }}>{api.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {service === 'db' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: 16 }}>
                    <div>
                      <h3 style={{ fontSize: 18, color: '#fff', margin: 0 }}>🛢️ Supabase Dynamic Schema Console</h3>
                      <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 0' }}>Schema: <code>app_8f92a</code> · Provisioned in <strong>184ms</strong> via Bob Subagent Alpha</p>
                    </div>
                    <span className="badge badge--passed">PostgreSQL 16.2</span>
                  </div>

                  <DatabaseSchema />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
