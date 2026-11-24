import type { DraftStatus } from '../editor/drafts'

// The save-state copy shared by the wide status bar and the compact app bar
// (give-the-phone-a-navigation-bar, design D2): one source, so the two surfaces
// cannot drift. The folder's own phases outrank the save state: reopening a
// stored folder outranks indexing it (show-what-is-loading), which outranks the
// page's unsaved state; a page that has no file yet reads as a new page rather
// than a plain unsaved one.
const SAVE_LABELS: Record<Exclude<DraftStatus, 'clean'>, string> = {
  dirty: 'Unsaved changes',
  saving: 'Saving…',
  failed: 'Save failed',
}

export function saveStateLabel({
  saveState,
  newPage,
  indexing,
  restoring = false,
}: {
  saveState: DraftStatus
  newPage: boolean
  indexing: boolean
  /** The app is reopening its stored folder (show-what-is-loading): the step
   *  before the index builds, so it reads first. */
  restoring?: boolean
}): string | null {
  if (restoring) return 'Opening your notes…'
  if (indexing) return 'Indexing notes…'
  if (saveState === 'clean') return null
  if (saveState === 'dirty' && newPage) return 'New page: created on first save'
  return SAVE_LABELS[saveState]
}
