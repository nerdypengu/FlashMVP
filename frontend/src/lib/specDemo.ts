/**
 * DEMO_MODE simulation of the IBM Bob 2.0 SDD engine (BL-SDD-01 / BL-SDD-03).
 * Pure functions — no network, deterministic output for a given input.
 */
import sddMock from '../mocks/sdd_mock.json'
import { findTemplate } from '../data/templates'
import type { SpecResponse, SpecSection } from '../types/spec'

const shortId = () => Math.random().toString(36).slice(2, 7)

function titleFromPrompt(prompt: string) {
  const clean = prompt.trim().replace(/\s+/g, ' ')
  const firstClause = clean.split(/[.!?\n]/)[0] ?? clean
  return firstClause.length > 64 ? `${firstClause.slice(0, 61)}…` : firstClause
}

export function demoGenerate(prompt: string, templateId: string): SpecResponse {
  const template = findTemplate(templateId)
  const featureId = `feat_demo_${shortId()}`
  const base = sddMock as SpecResponse
  const intro = [
    `> **Prompt:** ${prompt.trim()}`,
    '>',
    `> **Starter template:** ${template.name} · services: ${template.services.map(s => `\`${s.name}:${s.port}\``).join(', ')}`,
    '',
  ].join('\n')

  return {
    ...base,
    feature_id: featureId,
    status: 'AWAITING_APPROVAL',
    requirements: base.requirements
      .replace('# Requirements', `# Requirements — ${titleFromPrompt(prompt)}\n\n${intro}`)
      .replaceAll('app_feat_demo_8f92a', `app_${featureId}`),
    design: base.design.replaceAll('app_feat_demo_8f92a', `app_${featureId}`),
    tasks: base.tasks.map(task => ({ ...task, completed: false })),
  }
}

export function demoRevise(spec: SpecResponse, feedback: string, sections: SpecSection[], revisionNumber: number): SpecResponse {
  const touches = (section: Exclude<SpecSection, 'all'>) => sections.includes('all') || sections.includes(section)
  const note = (label: string) => [
    '',
    `## Revision ${revisionNumber} — ${label}`,
    `> _Feedback applied by IBM Bob 2.0:_ ${feedback.trim()}`,
    '',
    '- Updated affected sections to reflect the requested change.',
    '- Re-validated IBM tool bindings against the new constraints.',
  ].join('\n')

  const nextTasks = touches('tasks')
    ? [
        ...spec.tasks,
        {
          id: `task-r${revisionNumber}-${shortId()}`,
          description: `Apply revision ${revisionNumber}: ${feedback.trim().slice(0, 120)}`,
          completed: false,
        },
      ]
    : spec.tasks

  return {
    ...spec,
    status: 'CHANGES_REQUESTED',
    requirements: touches('requirements') ? `${spec.requirements}\n${note('Requirements')}` : spec.requirements,
    design: touches('design') ? `${spec.design}\n${note('Technical Design')}` : spec.design,
    tasks: nextTasks,
  }
}
