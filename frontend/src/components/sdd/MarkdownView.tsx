import { Children, Fragment, isValidElement, useState, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Check, Copy, Link2 } from 'lucide-react'

export type Heading = { id: string; text: string; level: 1 | 2 | 3 }

function textOf(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children)
  return ''
}

export function slugify(text: string, prefix: string) {
  const slug = text.toLowerCase().replace(/[`*_~]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return `${prefix}-${slug || 'section'}`
}

/** Extracts h1–h3 from markdown (ignoring fenced code) using the same slug rules as the renderer. */
export function extractHeadings(markdown: string, prefix: string): Heading[] {
  const headings: Heading[] = []
  let inFence = false
  for (const line of markdown.split('\n')) {
    if (/^\s*```/.test(line)) { inFence = !inFence; continue }
    if (inFence) continue
    const match = /^(#{1,3})\s+(.+?)\s*#*\s*$/.exec(line)
    if (!match) continue
    const text = match[2].replace(/[`*_]/g, '')
    headings.push({ id: slugify(text, prefix), text, level: match[1].length as 1 | 2 | 3 })
  }
  return headings
}

function CodeBlock({ children }: { children?: ReactNode }) {
  const [copied, setCopied] = useState(false)
  const child = Children.toArray(children)[0]
  const className = isValidElement(child) ? String((child.props as { className?: string }).className ?? '') : ''
  const language = /language-(\w+)/.exec(className)?.[1]
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(textOf(children).replace(/\n$/, ''))
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch { /* clipboard blocked */ }
  }
  return (
    <div className="md-code">
      <div className="md-code-bar">
        <span className="md-code-dots" aria-hidden="true"><i /><i /><i /></span>
        <span className="md-code-lang">{language ?? 'text'}</span>
        <button type="button" className="md-code-copy" onClick={copy} aria-label={copied ? 'Copied' : 'Copy code'}>
          {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
        </button>
      </div>
      <pre>{children}</pre>
    </div>
  )
}

function makeComponents(prefix: string): Components {
  const heading = (Tag: 'h1' | 'h2' | 'h3') => ({ children }: { children?: ReactNode }) => {
    const id = slugify(textOf(children), prefix)
    return (
      <Tag id={id} className="md-heading">
        {children}
        <a href={`#${id}`} className="md-anchor" aria-label="Link to this section" tabIndex={-1}
          onClick={event => { event.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>
          <Link2 size={13} />
        </a>
      </Tag>
    )
  }
  return {
    h1: heading('h1'),
    h2: heading('h2'),
    h3: heading('h3'),
    pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
    table: ({ children }) => <div className="md-table" tabIndex={0}><table>{children}</table></div>,
    a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
  }
}

/** Safe Markdown renderer (no raw HTML) with GFM tables/task lists, anchored headings and code chrome. */
export default function MarkdownView({ source, idPrefix = 'md' }: { source: string; idPrefix?: string }) {
  return (
    <div className="md">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={makeComponents(idPrefix)}>{source}</ReactMarkdown>
    </div>
  )
}

/** Renders `inline code` spans inside short plain-text strings (task titles, etc.). */
export function InlineText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g)
  return (
    <>
      {parts.map((part, index) =>
        part.startsWith('`') && part.endsWith('`') && part.length > 2
          ? <code key={index} className="md-inline-code">{part.slice(1, -1)}</code>
          : <Fragment key={index}>{part}</Fragment>,
      )}
    </>
  )
}
