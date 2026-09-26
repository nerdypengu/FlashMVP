import { Fragment, useState, type ReactNode } from 'react'
import ReactMarkdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Check, Copy } from 'lucide-react'

function textOf(node: ReactNode): string {
  if (node == null || typeof node === 'boolean') return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (typeof node === 'object' && 'props' in node) return textOf((node.props as { children?: ReactNode }).children)
  return ''
}

function CodeBlock({ children }: { children?: ReactNode }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(textOf(children).replace(/\n$/, ''))
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard blocked — ignore */
    }
  }
  return (
    <div className="sr-md-pre-wrap">
      <button type="button" className="sr-md-copy" onClick={copy} aria-label={copied ? 'Copied' : 'Copy code'}>
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
      <pre className="sr-md-pre">{children}</pre>
    </div>
  )
}

const components: Components = {
  pre: ({ children }) => <CodeBlock>{children}</CodeBlock>,
  table: ({ children }) => <div className="sr-md-table-wrap" tabIndex={0}><table>{children}</table></div>,
  a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>,
}

/** Safe Markdown renderer (no raw HTML) with GitHub-flavoured tables and task lists. */
export default function MarkdownView({ source }: { source: string }) {
  return (
    <div className="sr-md">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{source}</ReactMarkdown>
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
          ? <code key={index} className="sr-inline-code">{part.slice(1, -1)}</code>
          : <Fragment key={index}>{part}</Fragment>,
      )}
    </>
  )
}
