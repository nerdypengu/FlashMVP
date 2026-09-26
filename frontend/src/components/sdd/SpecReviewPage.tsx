/**
 * /specs route — connects the SDD session store + IBM Bob actions to the
 * presentational <SpecReviewer/>. Handles empty, generating and error states.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, FilePlus2, Layers, RefreshCw, RotateCcw, Sparkles } from 'lucide-react'
import SpecReviewer from './SpecReviewer'
import SpecGenerating from './SpecGenerating'
import WorkflowStepper from '../shell/WorkflowStepper'
import SecretsModal from '../infra/SecretsModal'
import { useToast } from '../ui/Toast'
import { useSpecSession } from '../../context/SpecSessionContext'
import { useSpecActions } from '../../hooks/useSpecActions'
import { findTemplate } from '../../data/templates'
import { isDemoMode } from '../../config'
import type { SpecSection } from '../../types/spec'
import '../../styles/flash-ui.css'
import './SpecReviewer.css'

export default function SpecReviewPage({ onApproved }: { onApproved?: () => void }) {
  const navigate = useNavigate()
  const toast = useToast()
  const { session, isLocked, toggleReviewed, setAllReviewed, resetSession } = useSpecSession()
  const { generate, revise, approve, cancel, pending, error, clearError } = useSpecActions()
  const [secretsOpen, setSecretsOpen] = useState(false)
  const needsSpec = !!session && !session.spec

  useEffect(() => {
    if (needsSpec) void generate()
  }, [needsSpec, session?.prompt, session?.templateId, generate])

  const startOver = () => {
    cancel()
    resetSession()
    navigate('/starter')
  }

  const handleRevise = async (feedback: string, sections: SpecSection[]) => {
    const result = await revise(feedback, sections)
    if (result) {
      const scope = sections.includes('all') ? 'all sections' : sections.join(', ')
      toast.success('Spec revised', `IBM Bob updated ${scope}. Updated tabs are marked with a dot.`)
    }
    return result
  }

  const handleApprove = async () => {
    const ok = await approve()
    if (ok) {
      toast.success('Spec approved & locked', 'The QA pipeline is now unlocked.')
      onApproved?.()
    }
    return ok
  }

  const topbar = (step: number, actions = true) => (
    <div className="sr-topbar">
      <WorkflowStepper current={step} />
      {actions && (
        <div className="sr-topbar-actions">
          {isDemoMode && <span className="sr-demo-pill" title="VITE_DEMO_MODE=true — responses are simulated"><span className="sr-demo-dot" />Demo mode</span>}
          <button type="button" className="fx-btn fx-btn--ghost fx-btn--sm" onClick={startOver} disabled={pending === 'approve'}>
            <FilePlus2 size={14} /> New spec
          </button>
        </div>
      )}
    </div>
  )

  if (!session) {
    return (
      <div className="sr-page">
        {topbar(0, false)}
        <div className="sr-empty fx-panel fx-enter">
          <div className="sr-empty-art" aria-hidden="true">
            <span className="sr-empty-card sr-empty-card--1" />
            <span className="sr-empty-card sr-empty-card--2" />
            <span className="sr-empty-card sr-empty-card--3"><Sparkles size={18} /></span>
          </div>
          <h2>No spec is waiting for review</h2>
          <p>Pick an IBM-ready foundation and describe your product. IBM Bob 2.0 drafts requirements, a technical design and a task plan for you to approve.</p>
          <button type="button" className="fx-btn fx-btn--primary fx-btn--lg" onClick={() => navigate('/starter')}>
            <Layers size={16} /> Choose a foundation
          </button>
        </div>
      </div>
    )
  }

  const template = findTemplate(session.templateId)

  if (!session.spec) {
    if (error?.action === 'generate' && pending !== 'generate') {
      return (
        <div className="sr-page">
          {topbar(1, false)}
          <div className="sr-empty sr-empty--error fx-panel fx-enter" role="alert">
            <div className="sr-empty-icon"><AlertTriangle size={24} /></div>
            <h2>IBM Bob couldn’t draft this spec</h2>
            <p>{error.message}</p>
            <div className="sr-empty-actions">
              <button type="button" className="fx-btn fx-btn--ghost" onClick={startOver}><RotateCcw size={15} /> Change template</button>
              <button type="button" className="fx-btn fx-btn--primary" onClick={() => void generate()}><RefreshCw size={15} /> Try again</button>
            </div>
          </div>
        </div>
      )
    }
    return (
      <div className="sr-page">
        {topbar(1, false)}
        <SpecGenerating templateName={template.name} prompt={session.prompt} onCancel={startOver} />
      </div>
    )
  }

  return (
    <div className="sr-page">
      {topbar(isLocked ? 2 : 1)}

      <SpecReviewer
        spec={session.spec}
        isLocked={isLocked}
        pending={pending}
        error={error && error.action !== 'generate' ? error.message : null}
        onDismissError={clearError}
        onRevise={handleRevise}
        onApprove={handleApprove}
        reviewedTaskIds={session.reviewedTaskIds}
        onToggleReviewed={toggleReviewed}
        onSetAllReviewed={setAllReviewed}
        revisions={session.revisions}
        templateName={template.name}
        prompt={session.prompt}
        approvedAt={session.approvedAt}
        onOpenSecrets={() => setSecretsOpen(true)}
        onContinue={() => navigate('/qa')}
      />

      <SecretsModal open={secretsOpen} projectId={session.projectId} onClose={() => setSecretsOpen(false)}
        onConfirm={secrets => toast.success('Vault locked', `${secrets.length} secret${secrets.length === 1 ? '' : 's'} ready to inject at deploy time.`)} />
    </div>
  )
}
