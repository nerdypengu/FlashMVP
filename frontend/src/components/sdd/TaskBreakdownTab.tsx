import type { CSSProperties } from 'react'
import { Check, CheckCheck, RotateCcw } from 'lucide-react'
import { InlineText } from './MarkdownView'
import type { SpecTask } from '../../types/spec'

/**
 * BL-SDD-02 · Tab 3 — task checklist.
 * Task content is read-only; the reviewer can only tick tasks off as "reviewed".
 */
export default function TaskBreakdownTab({ tasks, reviewedIds, isLocked, onToggle, onSetAll }: {
  tasks: SpecTask[]
  reviewedIds: string[]
  isLocked: boolean
  onToggle: (taskId: string) => void
  onSetAll: (reviewed: boolean) => void
}) {
  const reviewed = new Set(reviewedIds)
  const completedCount = tasks.filter(task => task.completed || reviewed.has(task.id)).length
  const total = tasks.length
  const percent = total ? Math.round((completedCount / total) * 100) : 0
  const allDone = total > 0 && completedCount === total

  if (!total) return <p className="sr-empty-note">IBM Bob has not broken this spec into tasks yet.</p>

  return (
    <div className="tb-root">
      <div className="tb-summary">
        <div>
          <p className="tb-summary-title">{allDone ? 'Every task reviewed' : 'Review the delivery plan'}</p>
          <p className="tb-summary-sub">
            <strong>{completedCount}/{total}</strong> tasks reviewed · tick each task once you agree with its scope.
          </p>
        </div>
        {!isLocked && (
          <button type="button" className="fx-btn fx-btn--secondary fx-btn--sm" onClick={() => onSetAll(!allDone)}>
            {allDone ? <><RotateCcw size={13} /> Reset</> : <><CheckCheck size={14} /> Mark all reviewed</>}
          </button>
        )}
        <div className="tb-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={completedCount}
          aria-label="Tasks reviewed">
          <span className="tb-progress-fill" style={{ width: `${percent}%` }} data-complete={allDone || undefined} />
          {tasks.map((task, index) => (
            <span key={task.id} className="tb-progress-tick" style={{ left: `${((index + 1) / total) * 100}%` }} />
          ))}
        </div>
      </div>

      <ol className="tb-list">
        {tasks.map((task, index) => {
          const done = task.completed || reviewed.has(task.id)
          return (
            <li key={task.id} className={`tb-task${done ? ' is-done' : ''}`} style={{ '--i': index } as CSSProperties}>
              <label className="tb-task-label">
                <input type="checkbox" className="fx-sr-only" checked={done}
                  disabled={isLocked || task.completed} onChange={() => onToggle(task.id)} />
                <span className="tb-check" aria-hidden="true"><Check size={12} strokeWidth={3.2} /></span>
                <span className="tb-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="tb-text"><InlineText text={task.description} /></span>
                <span className="tb-id">{task.id}</span>
              </label>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
