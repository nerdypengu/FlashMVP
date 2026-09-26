import { useState, useEffect } from 'react'

type Props = {
  line1Text?: string
  line2Text?: string
  onComplete?: () => void
}

export default function TypewriterHero({
  line1Text = 'FLASHMVP',
  line2Text = 'SPEC TO CONTAINER',
  onComplete,
}: Props) {
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const [displayedLine1, setDisplayedLine1] = useState(prefersReducedMotion ? line1Text : '')
  const [displayedLine2, setDisplayedLine2] = useState(prefersReducedMotion ? line2Text : '')
  const [currentLine, setCurrentLine] = useState<1 | 2 | 3>(prefersReducedMotion ? 3 : 1)

  useEffect(() => {
    if (prefersReducedMotion) {
      onComplete?.()
      return
    }

    let timeoutId: number

    // Step 1: Type Line 1 from top
    if (currentLine === 1) {
      if (displayedLine1.length < line1Text.length) {
        timeoutId = window.setTimeout(() => {
          setDisplayedLine1(line1Text.slice(0, displayedLine1.length + 1))
        }, 65) // 65ms per character
      } else {
        // Line 1 finished -> brief pause, then proceed to Line 2
        timeoutId = window.setTimeout(() => {
          setCurrentLine(2)
        }, 220)
      }
    }
    // Step 2: Type Line 2 downwards
    else if (currentLine === 2) {
      if (displayedLine2.length < line2Text.length) {
        timeoutId = window.setTimeout(() => {
          setDisplayedLine2(line2Text.slice(0, displayedLine2.length + 1))
        }, 50) // 50ms per character
      } else {
        // Line 2 finished -> complete sequential typing
        timeoutId = window.setTimeout(() => {
          setCurrentLine(3)
          onComplete?.()
        }, 200)
      }
    }

    return () => clearTimeout(timeoutId)
  }, [displayedLine1, displayedLine2, currentLine, line1Text, line2Text, onComplete, prefersReducedMotion])

  return (
    <h1 className="headline typewriter-headline" aria-label={`${line1Text} ${line2Text}`}>
      <span className="typewriter-line typewriter-line-1">
        {displayedLine1}
        {currentLine === 1 && <span className="typewriter-cursor" aria-hidden="true" />}
      </span>
      <span className="typewriter-line typewriter-line-2">
        {displayedLine2}
        {currentLine >= 2 && (
          <span
            className={`typewriter-cursor ${currentLine === 3 ? 'typewriter-cursor--done' : ''}`}
            aria-hidden="true"
          />
        )}
      </span>
    </h1>
  )
}
