type ConnectorProps = {
  status: string
}

export default function QAConnector({ status }: ConnectorProps) {
  const isRunning = status === 'RUNNING'
  const isPassed  = status === 'PASSED'
  const isFailed  = status === 'FAILED'

  const strokeColor = isRunning ? '#60A5FA' : isPassed ? '#42BE65' : isFailed ? '#DA1E28' : '#FFFFFF'

  return (
    <div className="qa-connector">
      <svg width="48" height="24" viewBox="0 0 48 24" fill="none">
        <line
          x1="0" y1="12" x2="38" y2="12"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeDasharray={isRunning ? '5 3' : 'none'}
          style={{ opacity: isRunning ? 1 : 0.9 }}
        />
        <polygon points="36,6 48,12 36,18" fill="#FFFFFF" />
      </svg>
    </div>
  )
}
