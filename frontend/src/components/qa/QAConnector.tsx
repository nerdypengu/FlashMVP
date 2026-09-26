type ConnectorProps = {
  status: string
}

export default function QAConnector({ status }: ConnectorProps) {
  const isRunning = status === 'RUNNING'
  const color = isRunning ? 'var(--ibm-blue)' : 'rgba(255,255,255,0.15)'

  return (
    <div className="qa-connector">
      <svg width="48" height="24" viewBox="0 0 48 24" fill="none">
        <defs>
          <linearGradient id={`grad-${status}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} />
            <stop offset="100%" stopColor={isRunning ? 'var(--ibm-blue)' : 'rgba(255,255,255,0.1)'} />
          </linearGradient>
        </defs>
        <line
          x1="0" y1="12" x2="38" y2="12"
          stroke={`url(#grad-${status})`}
          strokeWidth="2"
          strokeDasharray={isRunning ? '4 3' : 'none'}
        />
        <polygon points="38,7 48,12 38,17" fill={color} />
      </svg>
    </div>
  )
}
