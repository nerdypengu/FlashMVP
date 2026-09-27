import { useState } from 'react'
import { FileCode, FileText, FolderOpen, Settings2 } from 'lucide-react'

type TrackedFile = { path: string; name: string; folder: string; size: string; status: string; content: string }

const FILES: TrackedFile[] = [
  {
    path: 'package/docs/prd.md', name: 'prd.md', folder: 'package/docs/', size: '4.2 KB', status: 'VERIFIED',
    content: `# Product Requirement Document (PRD) v2.4\n\n## Overview\nFlashMVP provides autonomous spec-to-container pipeline deployment on IBM Cloud Code Engine.\n\n## Core Architecture Requirements\n- Fast prompt parsing into 3-part SDD specs (Requirements, Design, Tasks)\n- Automated PostgreSQL schema creation in under 200ms\n- watsonx automated QA test suite runner\n- Live SSE container log streamer and metric telemetry`,
  },
  {
    path: 'package/docs/requirements/FR-001_Authentication.md', name: 'FR-001_Authentication.md', folder: 'package/docs/requirements/', size: '1.8 KB', status: 'TRACKED',
    content: `# FR-001: JWT Authentication & Role-Based Access Control\n\n- Scope: User login, token issuance, and protected API endpoints\n- Auth Provider: Supabase Auth / Local JWT Strategy\n- Verification: 100% test coverage passed in Watsonx QA`,
  },
  {
    path: 'package/docs/requirements/FR-002_ContainerTelemetry.md', name: 'FR-002_ContainerTelemetry.md', folder: 'package/docs/requirements/', size: '2.4 KB', status: 'TRACKED',
    content: `# FR-002: Real-time Container Telemetry & Log Streaming\n\n- Scope: CPU, Memory, Network I/O, API Endpoint metrics, SSE log streamer\n- Provider: IBM Code Engine & Docker Runtime\n- Telemetry Window: Live 2.5s polling with 1h session retention`,
  },
  {
    path: 'package/docs/requirements/FR-003_QACanvas.md', name: 'FR-003_QACanvas.md', folder: 'package/docs/requirements/', size: '2.1 KB', status: 'TRACKED',
    content: `# FR-003: Interactive watsonx QA Canvas & Integrated History\n\n- Scope: Drag-and-drop test node canvas, step editor, integrated run execution history table\n- Verification: ESLint, Pytest, CVE audit, Secret leak detector`,
  },
  {
    path: 'package/docs/decisions/ADR-001_IBM_CodeEngine.md', name: 'ADR-001_IBM_CodeEngine.md', folder: 'package/docs/decisions/', size: '3.1 KB', status: 'APPROVED',
    content: `# ADR-001: Serverless Microservices on IBM Code Engine\n\n- Decision: Deploy containerized backend microservices to IBM Code Engine\n- Rationale: Scale to zero capability, instant subsecond container startup, native Cloudflare SSL egress binding`,
  },
  {
    path: '.bob/templates/feature_spec_template.md', name: 'feature_spec_template.md', folder: '.bob/templates/', size: '1.2 KB', status: 'TEMPLATE',
    content: `# IBM Bob 2.0 Feature Spec Template\n\n## 1. Requirement Specs\n## 2. Technical Design & Schemas\n## 3. Subagent Execution Tasks`,
  },
  {
    path: '.bob/settings/ibm-environment.json', name: 'ibm-environment.json', folder: '.bob/settings/', size: '0.8 KB', status: 'CONFIG',
    content: `{\n  "region": "us-south",\n  "codeEngineProject": "flashmvp-prod",\n  "secretsVault": "ibm-secrets-manager-v2",\n  "mcpPort": 8001\n}`,
  },
]

const iconFor = (name: string) => (name.endsWith('.json') ? Settings2 : name.endsWith('.md') ? FileText : FileCode)

/** Tracked `.bob` / `package/docs` explorer shown alongside the 3-part spec. */
export default function PackageDocsTab() {
  const [selected, setSelected] = useState(FILES[0].path)
  const active = FILES.find(file => file.path === selected) ?? FILES[0]
  const folders = [...new Set(FILES.map(file => file.folder))]
  const lines = active.content.split('\n')

  return (
    <div className="pk-root">
      <nav className="pk-tree" aria-label="Tracked package files">
        <p className="pk-tree-title"><FolderOpen size={13} /> Tracked package</p>
        {folders.map(folder => (
          <div key={folder} className="pk-folder">
            <p className="pk-folder-name">{folder}</p>
            <ul>
              {FILES.filter(file => file.folder === folder).map(file => {
                const Icon = iconFor(file.name)
                const on = file.path === selected
                return (
                  <li key={file.path}>
                    <button type="button" className={`pk-file${on ? ' is-on' : ''}`} aria-current={on ? 'true' : undefined}
                      onClick={() => setSelected(file.path)}>
                      <Icon size={13} aria-hidden="true" />
                      <span className="pk-file-name">{file.name}</span>
                      <span className={`pk-status pk-status--${file.status.toLowerCase()}`}>{file.status}</span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      <section className="pk-viewer" aria-label={active.path}>
        <header className="pk-viewer-head">
          <div>
            <p className="pk-path">{active.path}</p>
            <p className="pk-meta">{active.size} · {lines.length} lines</p>
          </div>
          <span className={`pk-status pk-status--${active.status.toLowerCase()}`}>{active.status}</span>
        </header>
        <pre className="pk-code">
          {lines.map((line, index) => (
            <span key={index} className="pk-line"><span className="pk-ln" aria-hidden="true">{index + 1}</span>{line || ' '}</span>
          ))}
        </pre>
      </section>
    </div>
  )
}
