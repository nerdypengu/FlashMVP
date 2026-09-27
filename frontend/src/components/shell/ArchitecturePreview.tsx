import { useId } from 'react'
import type { StarterTemplate } from '../../data/templates'

/**
 * Miniature, animated topology of a starter template:
 * users → frontend → backend → { IBM Cloud DB, IBM Secrets Manager }.
 * Pure SVG; packet animation is disabled under prefers-reduced-motion via CSS.
 */
export default function ArchitecturePreview({ template, active }: { template: StarterTemplate; active: boolean }) {
  const uid = useId().replace(/:/g, '')
  const [frontend, backend] = template.services
  const accent = template.accent
  const runtime = (value?: string) => (value ? value.split(' / ').pop() ?? value : '')

  const node = (x: number, y: number, w: number, label: string, sub: string, highlight = false) => (
    <g transform={`translate(${x} ${y})`}>
      <rect width={w} height="36" rx="9" fill={highlight ? `url(#${uid}-node)` : 'rgba(255,255,255,0.035)'}
        stroke={highlight ? accent : 'rgba(255,255,255,0.13)'} strokeOpacity={highlight ? 0.75 : 1} />
      <text x="10" y="15.5" className="ap-label">{label}</text>
      <text x="10" y="28" className="ap-sub">{sub}</text>
    </g>
  )

  const wires = [
    { d: 'M56 56 H70', dur: '2.2s', begin: '0s', color: '#fff' },
    { d: 'M154 56 H170', dur: '2.2s', begin: '0.5s', color: accent },
    { d: 'M254 56 C263 56 263 23 272 23', dur: '2.6s', begin: '1s', color: accent },
    { d: 'M254 56 C263 56 263 89 272 89', dur: '2.9s', begin: '1.4s', color: '#be95ff' },
  ]

  return (
    <svg className={`ap-root${active ? ' is-active' : ''}`} viewBox="0 0 360 112" role="img"
      aria-label={`${template.name} topology: ${frontend?.name} :${frontend?.port}, ${backend?.name} :${backend?.port}, IBM Cloud DB and IBM Secrets Manager`}>
      <defs>
        <linearGradient id={`${uid}-node`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor={accent} stopOpacity="0.32" />
          <stop offset="1" stopColor={accent} stopOpacity="0.06" />
        </linearGradient>
        <linearGradient id={`${uid}-wire`} x1="0" x2="1">
          <stop offset="0" stopColor={accent} stopOpacity="0.25" />
          <stop offset="1" stopColor="#be95ff" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      <g fill="none" strokeWidth="1.25">
        {wires.map(wire => <path key={wire.d} d={wire.d} stroke="rgba(255,255,255,0.12)" />)}
        {wires.map(wire => <path key={`${wire.d}-f`} className="ap-flow" d={wire.d} stroke={`url(#${uid}-wire)`} />)}
      </g>

      <g transform="translate(4 38)">
        <rect width="52" height="36" rx="9" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.12)" strokeDasharray="3 3" />
        <circle cx="12" cy="12" r="2" fill="#fa4d56" opacity="0.75" />
        <circle cx="19" cy="12" r="2" fill="#f1c21b" opacity="0.75" />
        <circle cx="26" cy="12" r="2" fill="#42be65" opacity="0.75" />
        <text x="10" y="28" className="ap-sub">users</text>
      </g>

      {node(70, 38, 84, frontend?.name ?? 'frontend', `${runtime(frontend?.runtime)} :${frontend?.port ?? ''}`, true)}
      {node(170, 38, 84, backend?.name ?? 'backend', `${runtime(backend?.runtime)} :${backend?.port ?? ''}`, true)}
      {node(272, 5, 84, 'Cloud DB', 'PostgreSQL')}
      {node(272, 71, 84, 'Secrets', 'IBM Vault')}

      {wires.map(wire => (
        <circle key={`${wire.d}-p`} r="2.3" fill={wire.color} className="ap-packet">
          <animateMotion dur={wire.dur} begin={wire.begin} repeatCount="indefinite" path={wire.d} />
        </circle>
      ))}
    </svg>
  )
}
