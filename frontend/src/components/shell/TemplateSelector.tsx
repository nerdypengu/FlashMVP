/**
 * Compatibility shim — the real implementation lives in TemplateSelectorPage.tsx (BL-ARC-01).
 * Kept so existing imports (`TEMPLATES`, `Template`) in other modules keep working.
 */
import { templates, type StarterTemplate } from '../../data/templates'

export { default } from './TemplateSelectorPage'
export const TEMPLATES = templates
export type Template = StarterTemplate
