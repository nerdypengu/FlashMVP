import { Globe, Settings, Database } from 'lucide-react'

type ServiceSwitcherProps = {
  activeService: string
  onSwitch: (service: string) => void
}

const SERVICES = [
  { id: 'frontend', label: 'Frontend App', icon: Globe },
  { id: 'backend',  label: 'Backend API (/docs)', icon: Settings },
  { id: 'db',       label: 'Supabase DB', icon: Database },
]

export default function ServiceSwitcher({ activeService, onSwitch }: ServiceSwitcherProps) {
  return (
    <div style={{
      display: 'flex', gap: 2,
      background: '#1c1c28', border: '1px solid var(--glass-border)',
      borderBottom: 'none', borderRadius: '8px 8px 0 0',
      padding: '8px 12px',
    }}>
      {SERVICES.map(s => {
        const Icon = s.icon
        return (
          <button
            key={s.id}
            onClick={() => onSwitch(s.id)}
            style={{
              background: activeService === s.id ? 'var(--ibm-blue)' : 'transparent',
              border: '1px solid',
              borderColor: activeService === s.id ? 'var(--ibm-blue)' : 'var(--glass-border)',
              borderRadius: 6,
              color: activeService === s.id ? '#fff' : 'var(--text-muted)',
              cursor: 'pointer', fontSize: 13, padding: '6px 14px',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              transition: 'all 0.15s',
            }}
          >
            <Icon size={14} />
            {s.label}
          </button>
        )
      })}
    </div>
  )
}
