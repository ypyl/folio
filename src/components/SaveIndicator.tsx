import type { DraftStatus } from '../editor/drafts'
import styles from './SaveIndicator.module.css'

// Fixed save-state line for the editor pane (design D4, page-editing spec):
// clean shows nothing; the three visible states are muted text, never a badge.

const LABELS: Record<Exclude<DraftStatus, 'clean'>, string> = {
  dirty: 'Unsaved changes',
  saving: 'Saving…',
  failed: 'Save failed',
}

export function SaveIndicator({ status }: { status: DraftStatus }) {
  if (status === 'clean') return null
  return (
    <div className={styles.indicator} role="status">
      {LABELS[status]}
    </div>
  )
}