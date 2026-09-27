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
    <div className="sr-tasks">
      <div className="sr-tasks-head">
        <div className="sr-progress-meta">
          <span className="sr-progress-label"><strong>{completedCount}/{total}</strong> tasks reviewed</span>
          <span className="sr-progress-percent">{percent}%</span>
        </div>
        {!isLocked && (
          <button type="button" className="sr-link-btn" onClick={() => onSetAll(!allDone)}>
            {allDone ? <><RotateCcw size={13} /> Reset review</> : <><CheckCheck size={14} /> Mark all reviewed</>}
          </button>
        )}
      </div>
      <div className="sr-progress" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={completedCount}
        aria-label="Tasks reviewed">
        <span className="sr-progress-fill" style={{ width: `${percent}%` }} data-complete={allDone || undefined} />
      </div>

      <ol className="sr-task-list">
        {tasks.map((task, index) => {
          const done = task.completed || reviewed.has(task.id)
          return (
            <li key={task.id} className={`sr-task${done ? ' is-done' : ''}`}>
              <label className="sr-task-label">
                <input type="checkbox" className="sr-visually-hidden" checked={done}
                  disabled={isLocked || task.completed} onChange={() => onToggle(task.id)} />
                <span className="sr-check" aria-hidden="true"><Check size={12} strokeWidth={3} /></span>
                <span className="sr-task-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="sr-task-text"><InlineText text={task.description} /></span>
                <span className="sr-task-id">{task.id}</span>
              </label>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
