import type { DraftStatus } from '../editor/drafts'

// The save-state copy shared by the wide status bar and the compact app bar
// (give-the-phone-a-navigation-bar, design D2): one source, so the two surfaces
// cannot drift. Indexing outranks the save state while the index builds; a page
// that has no file yet reads as a new page rather than a plain unsaved one.
const SAVE_LABELS: Record<Exclude<DraftStatus, 'clean'>, string> = {
  dirty: 'Unsaved changes',
  saving: 'Saving…',
  failed: 'Save failed',
}

export function saveStateLabel({
  saveState,
  newPage,
  indexing,
}: {
  saveState: DraftStatus
  newPage: boolean
  indexing: boolean
}): string | null {
  if (indexing) return 'Indexing notes…'
  if (saveState === 'clean') return null
  if (saveState === 'dirty' && newPage) return 'New page: created on first save'
  return SAVE_LABELS[saveState]
}
