// Placeholder — owned by Person 1 + Person 3
// Implements: BL-SDD-02, BL-SDD-03 (UI) + BL-SDD-01, BL-SDD-03 (API)
export type SpecData = {
  projectId: string
  template: any
  prompt: string
  status: 'DRAFT' | 'CHANGES_REQUESTED' | 'APPROVED'
  requirements: string
  architecture: string
  ibmBindings: { tool: string; purpose: string; status: string }[]
  tasks: { id: string; title: string; subagent: string; estimate: string }[]
}

export default function SpecReviewer({ spec, onApprove, onRevise }: {
  spec: SpecData
  onApprove: () => void
  onRevise: (feedback: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16, padding: 32 }}>
      <div style={{ fontSize: 28 }}>📋</div>
      <div style={{ fontWeight: 600, fontSize: 15 }}>Specs Review & Approval Gate</div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center', maxWidth: 360 }}>
        Owned by Person 1 + Person 3 — 3-part SDD reviewer with human sign-off.<br />
        Backlog items: BL-SDD-02, BL-SDD-03
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        <button
          style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontSize: 13 }}
          onClick={() => onRevise('Demo revision')}
        >
          Request Changes
        </button>
        <button
          style={{ background: 'var(--green-pass)', border: 'none', color: '#fff', borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontSize: 13 }}
          onClick={onApprove}
        >
          ✓ Approve & Deploy →
        </button>
      </div>
    </div>
  )
}
