import type { DraftStatus } from '../editor/drafts'
import styles from './SaveIndicator.module.css'

// Fixed save-state line for the editor pane (design D4, page-editing spec):
// clean shows nothing; the three visible states are muted text, never a badge.

const LABELS: Record<Exclude<DraftStatus, 'clean'>, string> = {
  dirty: 'Unsaved changes',
  saving: 'Saving…',
  failed: 'Save failed',
}

export function SaveIndicator({ status, newPage = false }: { status: DraftStatus; newPage?: boolean }) {
  if (status === 'clean') return null
  // A page with no file yet creates itself on its first save: say so instead
  // of implying an edit to an existing file (static-navigation spec).
  const label = status === 'dirty' && newPage ? 'New page: created on first save' : LABELS[status]
  return (
    <div className={styles.indicator} role="status">
      {label}
    </div>
  )
}