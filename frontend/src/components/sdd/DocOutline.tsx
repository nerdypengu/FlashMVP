import { useEffect, useState } from 'react'
import type { Heading } from './MarkdownView'

/**
 * Sticky "On this page" outline with scroll-spy.
 * `scrollRoot` is the scrolling panel that contains the headings.
 */
export default function DocOutline({ headings, scrollRoot }: { headings: Heading[]; scrollRoot: HTMLElement | null }) {
  const [activeId, setActiveId] = useState<string | null>(headings[0]?.id ?? null)

  useEffect(() => {
    setActiveId(headings[0]?.id ?? null)
    if (!scrollRoot || !headings.length) return
    const elements = headings
      .map(heading => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => !!element)
    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
      if (visible[0]) setActiveId(visible[0].target.id)
    }, { root: scrollRoot, rootMargin: '0px 0px -70% 0px', threshold: [0, 1] })
    elements.forEach(element => observer.observe(element))
    return () => observer.disconnect()
  }, [headings, scrollRoot])

  if (headings.length < 2) return null
  const minLevel = Math.min(...headings.map(heading => heading.level))

  return (
    <nav className="do-root" aria-label="On this page">
      <p className="do-title">On this page</p>
      <ul>
        {headings.map(heading => (
          <li key={heading.id} style={{ paddingLeft: (heading.level - minLevel) * 12 }}>
            <a href={`#${heading.id}`} className={activeId === heading.id ? 'is-active' : undefined}
              aria-current={activeId === heading.id ? 'location' : undefined}
              onClick={event => {
                event.preventDefault()
                setActiveId(heading.id)
                document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }}>
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
