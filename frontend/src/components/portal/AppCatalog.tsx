import { Package } from 'lucide-react'

// Placeholder — owned by Person 4 (IBM Cloud Infra & Skill Pack Orchestrator)
// Implements: BL-HUB-01 (Catalog API & UI), BL-HUB-02 (RBAC & Analytics UI)
export default function AppCatalog({ onOpenPlayground }: { onOpenPlayground: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: 32 }}>
      <Package size={28} color="var(--ibm-blue)" />
      <div style={{ fontWeight: 600, fontSize: 15 }}>xAppHub — Central App Catalog</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', maxWidth: 360 }}>
        Owned by Person 4 — App catalog grid, RBAC governance, and adoption analytics.<br />
        Backlog items: BL-HUB-01, BL-HUB-02
      </div>
      <button
        style={{ marginTop: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontSize: 13 }}
        onClick={onOpenPlayground}
      >
        Open Playground →
      </button>
    </div>
  )
}
