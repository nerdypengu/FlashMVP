/**
 * /specs route — connects the SDD session store + IBM Bob actions to the
 * presentational <SpecReviewer/>. Handles empty, generating and error states.
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, FilePlus2, Layers, RefreshCw, RotateCcw } from 'lucide-react'
import SpecReviewer from './SpecReviewer'
import SpecGenerating from './SpecGenerating'
import WorkflowStepper from '../shell/WorkflowStepper'
import SecretsModal from '../infra/SecretsModal'
import { useSpecSession } from '../../context/SpecSessionContext'
import { useSpecActions } from '../../hooks/useSpecActions'
import { findTemplate } from '../../data/templates'
import { isDemoMode } from '../../config'
import './SpecReviewer.css'

export default function SpecReviewPage({ onApproved }: { onApproved?: () => void }) {
  const navigate = useNavigate()
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
    navigate('/project/proj-001')
  }

  if (!session) {
    return (
      <div className="sr-root">
        <WorkflowStepper current={0} />
        <div className="sr-empty">
          <div className="sr-empty-icon"><FilePlus2 size={26} /></div>
          <h2>No spec is waiting for review</h2>
          <p>Pick an IBM-ready starter template and describe your app. IBM Bob 2.0 will draft requirements, a technical design and a task breakdown for you to approve.</p>
          <button type="button" className="sr-btn sr-btn--primary" onClick={() => navigate('/project/proj-001')}>
            <Layers size={15} /> View Starter Template in Project Details
          </button>
        </div>
      </div>
    )
  }


  const template = findTemplate(session.templateId)

  if (!session.spec) {
    if (error?.action === 'generate' && pending !== 'generate') {
      return (
        <div className="sr-root">
          <WorkflowStepper current={1} />
          <div className="sr-empty sr-empty--error" role="alert">
            <div className="sr-empty-icon"><AlertTriangle size={26} /></div>
            <h2>IBM Bob could not draft this spec</h2>
            <p>{error.message}</p>
            <div className="sr-confirm-actions">
              <button type="button" className="sr-btn sr-btn--ghost" onClick={startOver}><RotateCcw size={15} /> Change template</button>
              <button type="button" className="sr-btn sr-btn--primary" onClick={() => void generate()}><RefreshCw size={15} /> Try again</button>
            </div>
          </div>
        </div>
      )
    }
    return (
      <div className="sr-root">
        <WorkflowStepper current={1} />
        <SpecGenerating templateName={template.name} prompt={session.prompt} onCancel={startOver} />
      </div>
    )
  }

  return (
    <>
      <div className="sr-topbar">
        <WorkflowStepper current={isLocked ? 2 : 1} />
        <div className="sr-topbar-actions">
          {isDemoMode && <span className="sr-demo-pill" title="VITE_DEMO_MODE=true — responses are simulated">Demo mode</span>}
          <button type="button" className="sr-btn sr-btn--ghost" onClick={startOver} disabled={pending === 'approve'}>
            <FilePlus2 size={15} /> New spec
          </button>
        </div>
      </div>

      <SpecReviewer
        spec={session.spec}
        isLocked={isLocked}
        pending={pending}
        error={error && error.action !== 'generate' ? error.message : null}
        onDismissError={clearError}
        onRevise={(feedback, sections) => revise(feedback, sections)}
        onApprove={async () => {
          const ok = await approve()
          if (ok) onApproved?.()
          return ok
        }}
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

      <SecretsModal open={secretsOpen} projectId={session.projectId} onClose={() => setSecretsOpen(false)} />
    </>
  )
}
