import { useState } from 'react'
import { ShieldCheck, Server, Database, Key, Check, Save, Lock, RefreshCw, Layers } from 'lucide-react'

export default function EnvironmentConfigPage() {
  const [ibmApiKey, setIbmApiKey] = useState('●●●●●●●●●●●●●●●●-w9XkQ8Z-IBMCloudKey')
  const [secretsToken, setSecretsToken] = useState('●●●●●●●●●●●●-sec_mgr_live_v2_proxy_token')
  const [region, setRegion] = useState('us-south (Dallas)')
  const [minReplicas, setMinReplicas] = useState(1)
  const [maxReplicas, setMaxReplicas] = useState(5)
  const [dbSchema, setDbSchema] = useState('app_8f92a')
  const [saved, setSaved] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 32 }}>

      {/* Header Banner */}
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
            <ShieldCheck size={24} color="#0F62FE" />
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>
              Environment &amp; Infrastructure Config
            </h1>
          </div>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', margin: 0, maxWidth: 620 }}>
            Manage IBM Secrets Manager credentials, IBM Code Engine container fleet scaling limits, and Supabase PostgreSQL schema bindings.
          </p>
        </div>

        {saved && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8,
            background: 'rgba(66, 190, 101, 0.2)', border: '1px solid rgba(66, 190, 101, 0.4)',
            color: '#42BE65', fontSize: 13, fontWeight: 600
          }}>
            <Check size={16} /> Saved to .bob/settings/ibm-environment.json
          </div>
        )}
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* IBM Cloud & Secrets Manager Section */}
        <div style={{
          padding: 22, borderRadius: 16, background: 'rgba(15, 17, 26, 0.85)',
          border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
          display: 'flex', flexDirection: 'column', gap: 16
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lock size={18} color="#0F62FE" />
            <span>IBM Secrets Manager &amp; Cloud IAM Credentials</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>
                IBM Cloud API Key
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  value={ibmApiKey}
                  onChange={e => setIbmApiKey(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'monospace'
                  }}
                />
                <Key size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>
                IBM Secrets Manager Proxy Token
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="password"
                  value={secretsToken}
                  onChange={e => setSecretsToken(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 12px 10px 36px', borderRadius: 8,
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                    color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'monospace'
                  }}
                />
                <ShieldCheck size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Container Scaling & Code Engine Fleet Section */}
        <div style={{
          padding: 22, borderRadius: 16, background: 'rgba(15, 17, 26, 0.85)',
          border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
          display: 'flex', flexDirection: 'column', gap: 16
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Server size={18} color="#60A5FA" />
            <span>IBM Code Engine Container Fleet Settings</span>
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>
                IBM Cloud Region
              </label>
              <select
                value={region}
                onChange={e => setRegion(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  background: '#161922', border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff', fontSize: 13, outline: 'none'
                }}
              >
                <option value="us-south (Dallas)">us-south (Dallas)</option>
                <option value="us-east (Washington DC)">us-east (Washington DC)</option>
                <option value="eu-gb (London)">eu-gb (London)</option>
                <option value="eu-de (Frankfurt)">eu-de (Frankfurt)</option>
                <option value="jp-tok (Tokyo)">jp-tok (Tokyo)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>
                Min Container Replicas
              </label>
              <input
                type="number"
                min={0} max={10}
                value={minReplicas}
                onChange={e => setMinReplicas(Number(e.target.value))}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff', fontSize: 13, outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>
                Max Container Replicas
              </label>
              <input
                type="number"
                min={1} max={20}
                value={maxReplicas}
                onChange={e => setMaxReplicas(Number(e.target.value))}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: 8,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                  color: '#fff', fontSize: 13, outline: 'none'
                }}
              />
            </div>
          </div>
        </div>

        {/* Database & Schema Isolation Section */}
        <div style={{
          padding: 22, borderRadius: 16, background: 'rgba(15, 17, 26, 0.85)',
          border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)',
          display: 'flex', flexDirection: 'column', gap: 16
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Database size={18} color="#A7F3D0" />
            <span>Database &amp; Multi-Tenant Schema Binding</span>
          </h2>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginBottom: 6 }}>
              Target PostgreSQL Schema Name
            </label>
            <input
              type="text"
              value={dbSchema}
              onChange={e => setDbSchema(e.target.value)}
              style={{
                width: '100%', maxWidth: 400, padding: '10px 12px', borderRadius: 8,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff', fontSize: 13, outline: 'none', fontFamily: 'monospace'
              }}
            />
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', borderRadius: 10, border: 'none',
              background: '#0F62FE', color: '#fff', fontWeight: 600, fontSize: 14,
              cursor: 'pointer', boxShadow: '0 4px 16px rgba(15,98,254,0.4)'
            }}
          >
            <Save size={16} />
            <span>Save Infrastructure Configuration</span>
          </button>
        </div>

      </form>

    </div>
  )
}
