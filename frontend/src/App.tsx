import { useState } from 'react'
import QACanvas from './components/qa/QACanvas'

type Tab = 'qa' | 'history' | 'playground' | 'telemetry'

const TABS: { id: Tab; label: string }[] = [
  { id: 'qa', label: '🧪 QA Pipeline' },
  { id: 'history', label: '📋 Run History' },
  { id: 'playground', label: '🖥️ Playground' },
  { id: 'telemetry', label: '📊 Telemetry' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('qa')

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          <span className="app-logo">⚡ FlashMVP</span>
          <span className="app-subtitle">IBM Bob 2.0 Middleware Proxy — Person 2 Dashboard</span>
        </div>
      </header>
      <nav className="tab-bar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn${activeTab === tab.id ? ' tab-btn--active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <main className="app-content" aria-live="polite">
        {activeTab === 'qa' ? <QACanvas /> : <h1>{TABS.find(tab => tab.id === activeTab)?.label}</h1>}
      </main>
    </div>
  )
}
