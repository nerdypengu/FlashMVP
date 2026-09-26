/** Circular progress indicator for "tasks reviewed". */
export default function ReviewRing({ value, total, size = 44 }: { value: number; total: number; size?: number }) {
  const ratio = total ? value / total : 0
  const stroke = 4
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const complete = total > 0 && value >= total
  return (
    <div className={`rr-root${complete ? ' is-complete' : ''}`} style={{ width: size, height: size }}
      role="img" aria-label={`${value} of ${total} tasks reviewed`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <defs>
          <linearGradient id="rr-grad" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stopColor={complete ? '#6fdc8c' : '#4589ff'} />
            <stop offset="1" stopColor={complete ? '#24a148' : '#be95ff'} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <circle className="rr-arc" cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="url(#rr-grad)"
          strokeWidth={stroke} strokeLinecap="round" strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - ratio)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </svg>
      <span className="rr-label">{Math.round(ratio * 100)}<small>%</small></span>
    </div>
  )
}
