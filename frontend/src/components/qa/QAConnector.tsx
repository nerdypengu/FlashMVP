type ConnectorProps = {
  status: string
}

export default function QAConnector({ status }: ConnectorProps) {
  const isRunning = status === 'RUNNING'
  const isPassed  = status === 'PASSED'
  const isFailed  = status === 'FAILED'

  const strokeColor = isRunning ? '#60A5FA' : isPassed ? '#42BE65' : isFailed ? '#DA1E28' : 'rgba(255, 255, 255, 0.4)'

  return (
    <div className="qa-connector" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="40" height="24" viewBox="0 0 40 24" fill="none">
        <line
          x1="0" y1="12" x2="28" y2="12"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeDasharray={isRunning ? '5 3' : 'none'}
          style={{ opacity: isRunning ? 1 : 0.85 }}
        />
        <polygon points="26,6 38,12 26,18" fill={strokeColor} />
      </svg>
    </div>
  )
}
