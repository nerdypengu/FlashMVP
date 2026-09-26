import MarkdownView from './MarkdownView'

/** BL-SDD-02 · Tab 1 — user stories & business rules drafted by IBM Bob. */
export default function RequirementsTab({ requirements }: { requirements: string }) {
  if (!requirements.trim()) {
    return <p className="sr-empty-note">IBM Bob has not drafted any requirements for this spec.</p>
  }
  return <MarkdownView source={requirements} idPrefix="req" />
}
