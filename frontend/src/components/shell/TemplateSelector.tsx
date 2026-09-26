import { Rocket, Zap } from 'lucide-react'

// Placeholder — owned by Person 1 (Lead Frontend & SDD Architect)
// Implements: BL-SDD-02, BL-SDD-03, BL-ARC-01
export default function TemplateSelector({ onGenerate }: { onGenerate: (t: any, p: string) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: 32 }}>
      <div><Rocket size={32} color="#0F62FE" /></div>
      <div style={{ fontWeight: 600, fontSize: 15 }}>Starter Template Selector</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', maxWidth: 360 }}>
        Owned by Person 1 — Template selector + prompt input UI.<br />
        Backlog items: BL-SDD-02, BL-SDD-03, BL-ARC-01
      </div>
      <button
        style={{ marginTop: 8, background: 'var(--ibm-blue)', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontSize: 13 }}
        onClick={() => onGenerate({ id: 'react-fastapi', name: 'React + FastAPI', icon: 'Zap', badge: 'POPULAR', description: '', ibmBindings: [] }, 'Demo prompt')}
      >
        Continue with demo spec →
      </button>
    </div>
  )
}

// Re-export types used by App.tsx
export const TEMPLATES = [
  { id: 'react-fastapi', name: 'React + FastAPI', icon: 'Zap', badge: 'POPULAR', description: 'Full-stack with IBM Cloud', ibmBindings: ['IBM Code Engine', 'Supabase', 'Cloudflare'] },
]
export type Template = typeof TEMPLATES[0]
