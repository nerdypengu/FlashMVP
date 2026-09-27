import { useEffect, useId, useState } from 'react'
import { Check, LoaderCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'
import { API_URL } from '../../lib/person2Data'
import { templates } from '../../data/templates'
import './GitHubStarter.css'

type Connection = { configured: boolean; connected: boolean; login?: string; configuration_error?: string }
type Published = { repo_url: string; branch: string; commit_sha: string }
type Draft = { name: string; description: string; private: boolean; template: string }
const DRAFT_KEY = 'flashmvp.github-starter-draft'
const emptyDraft: Draft = { name: '', description: '', private: true, template: 'react-fastapi' }
const oauthErrors: Record<string, string> = {
  session_missing: 'GitHub sign-in session is missing or expired. Use the same browser and hostname (localhost or 127.0.0.1) throughout, then connect again.',
  state_mismatch: 'This GitHub sign-in belongs to a different attempt. Close older sign-in tabs and connect again.',
  access_denied: 'GitHub permission was declined. Connect again and authorize FlashMVP to continue.',
  application_suspended: 'GitHub has suspended this OAuth app. Contact the app administrator.',
  redirect_uri_mismatch: 'The GitHub callback URL does not match the OAuth app settings. Match GITHUB_CALLBACK_URL with the registered callback URL.',
  incorrect_client_credentials: 'GitHub rejected the app credentials. Check that the backend Client ID and Client Secret belong to the same OAuth app, then restart the backend.',
  bad_verification_code: 'GitHub rejected an expired or already-used authorization code. Click Connect GitHub to start a new attempt.',
  unverified_user_email: 'Verify your primary email address on GitHub, then connect again.',
  code_missing: 'GitHub did not return an authorization code. Start a new connection attempt.',
  network_error: 'The backend could not reach GitHub. Check the server connection and try again.',
  token_exchange_failed: 'GitHub could not exchange the authorization code. Check the OAuth app configuration and reconnect.',
  profile_failed: 'Authorization completed, but the backend could not read your GitHub account. Please reconnect.',
}

function restoreDraft(): Draft {
  try { return { ...emptyDraft, ...JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? '{}') } }
  catch { return emptyDraft }
}

export default function GitHubStarter({ templateId, onBusyChange }: {
  templateId?: string; onBusyChange?: (busy: boolean) => void
}) {
  const { user } = useAuth()
  const id = useId()
  const [connection, setConnection] = useState<Connection | null>(null)
  const [draft, setDraft] = useState(restoreDraft)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<Published | null>(null)
  const [partialUrl, setPartialUrl] = useState('')

  async function api(path: string, method = 'GET', body?: unknown, signal?: AbortSignal) {
    const token = (await supabase?.auth.getSession())?.data.session?.access_token
    const response = await fetch(`${API_URL}/api/v1/github${path}`, {
      method, credentials: 'include', signal,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    const payload = await response.json()
    if (!response.ok) {
      if (response.status === 401) setConnection(previous => previous ? { ...previous, connected: false } : previous)
      if (typeof payload.detail?.repo_url === 'string' && payload.detail.repo_url.startsWith('https://github.com/'))
        setPartialUrl(payload.detail.repo_url)
      throw new Error(typeof payload.detail === 'string' ? payload.detail :
        payload.detail?.message ?? `GitHub request failed (${response.status}).`)
    }
    return payload
  }

  useEffect(() => {
    const controller = new AbortController()
    setConnection(null); setResult(null); setError(''); setPartialUrl('')
    const params = new URLSearchParams(window.location.search)
    api('/connection', 'GET', undefined, controller.signal).then(status => {
      if (controller.signal.aborted) return
      setConnection(status)
      if (!status.connected && params.get('github') === 'error')
        setError(oauthErrors[params.get('github_error') ?? ''] ?? 'GitHub connection failed. Click Connect GitHub again to get the specific error.')
    }).catch(error => {
      if (!controller.signal.aborted) setError(error instanceof Error ? error.message : 'Could not load GitHub connection.')
    })
    return () => controller.abort()
  }, [user?.id])

  async function run(action: () => Promise<void>) {
    setBusy(true); onBusyChange?.(true); setError(''); setPartialUrl('')
    try { await action() }
    catch (error) { setError(error instanceof Error ? error.message : 'GitHub request failed.') }
    finally { setBusy(false); onBusyChange?.(false) }
  }

  const connect = async () => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, template: templateId ?? draft.template }))
    const { url } = await api('/connect', 'POST', {
      return_to: window.location.pathname === '/dashboard' ? '/dashboard' : '/starter',
      template: templateId ?? draft.template,
    })
    window.location.assign(url)
  }

  return <section className="github-starter" aria-labelledby={`${id}-title`} aria-busy={busy}>
    <h2 id={`${id}-title`}>Create project</h2>
    <p>Choose your starter, authorize GitHub, then create your project with the starter files in your repository.</p>
    {!connection && !error && <p role="status">Loading GitHub connection…</p>}
      <form onSubmit={event => { event.preventDefault(); void run(async () => {
        if (!connection?.connected) return
        setResult(null)
        const published = await api('/repositories', 'POST', { ...draft, template: templateId ?? draft.template })
        setResult(published)
        sessionStorage.removeItem(DRAFT_KEY)
      }) }}>
        <fieldset disabled={busy}>
          <label htmlFor={`${id}-name`}>Project / repository name</label>
          <input id={`${id}-name`} required maxLength={100} pattern="[A-Za-z0-9][A-Za-z0-9._\-]*"
            placeholder="my-app" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })} />
          {!templateId && <><label htmlFor={`${id}-template`}>Starter template</label>
            <select id={`${id}-template`} value={draft.template} onChange={e => setDraft({ ...draft, template: e.target.value })}>
              {templates.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}
            </select></>}
          {templateId && <p>Starter: {templates.find(template => template.id === templateId)?.name}</p>}
          <label htmlFor={`${id}-description`}>Description</label>
          <textarea id={`${id}-description`} rows={2} maxLength={350} value={draft.description}
            onChange={e => setDraft({ ...draft, description: e.target.value })} />
          <label className="github-private"><input type="checkbox" checked={draft.private}
            onChange={e => setDraft({ ...draft, private: e.target.checked })} /> Private repository</label>
          <div className="github-integration">
            <h3><i className="fa-brands fa-github" aria-hidden="true" /> GitHub</h3>
            {connection?.connected ? <div className="github-account">
              <span className="github-connected"><Check size={16} aria-hidden="true" /> Connected as <strong>{connection.login}</strong></span>
              <button className="btn btn--ghost" type="button" onClick={() => run(async () => {
                await api('/connection', 'DELETE')
                setConnection({ configured: true, connected: false }); setResult(null)
              })}>Disconnect</button>
            </div> : <>
              <p>Connect your account to authorize FlashMVP to create a repository and publish your starter files.</p>
              <button className="btn btn--secondary github-connect-button" type="button" disabled={busy || !connection}
                onClick={() => run(connect)}>
                {busy ? <LoaderCircle size={18} aria-hidden="true" /> : <i className="fa-brands fa-github" aria-hidden="true" />}
                {busy ? 'Connecting…' : 'Connect GitHub'}
              </button>
            </>}
            {connection && !connection.configured && <p role="status">GitHub sign-in is not ready on this server. Your project details can still be filled in.</p>}
            {(!connection || !connection.configured) && <button type="button" className="btn btn--ghost" onClick={() => run(async () => {
              setConnection(await api('/connection'))
            })}>Check connection again</button>}
          </div>
          <button type="submit" className="btn btn--primary" disabled={busy || !connection?.connected || !!result || !!partialUrl}>
            {busy && connection?.connected ? 'Creating project…' : 'Create project & publish starter'}
          </button>
        </fieldset>
      </form>
    {error && <p role="alert">{error}</p>}
    {partialUrl && <a href={partialUrl} target="_blank" rel="noopener noreferrer">Inspect repository on GitHub</a>}
    {result && <div role="status"><a href={result.repo_url} target="_blank" rel="noopener noreferrer">Open created repository</a>
      <p>Starter committed to {result.branch} · {result.commit_sha.slice(0, 7)}</p>
      <button type="button" className="btn btn--ghost" onClick={() => { setResult(null); setDraft({ ...draft, name: '' }) }}>Create another repository</button>
    </div>}
  </section>
}
