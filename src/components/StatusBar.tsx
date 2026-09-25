import { Fragment } from 'react'
import { version } from '../../package.json'
import type { DraftStatus } from '../editor/drafts'
import { stem } from '../vault/index'
import { StarIcon } from './StarIcon'
import styles from './StatusBar.module.css'

// App-level status frame (add-status-bar, ui-shell spec): one always-present
// thin bar below the workspace leading with the session navigation — Back,
// Forward, and Today (move-nav-controls-to-status-bar) — then the pin, then
// the open page's file path, the save/indexing status, and the active vault's
// name and file count (right). The bar sits outside all pane scroll regions,
// so its content never scrolls. Groups empty when their content has no source.
// Its controls are the three navigation controls and the pin star
// (add-pinned-pages); the status groups themselves are display-only. The
// question-mark help button and its modal lived here until
// move-help-to-right-panel moved the reference into the right panel.

// A 24-viewBox chevron. aria-hidden: the control's accessible name says which
// way it goes, so the glyph is decoration (the same rule the pin star follows).
function ChevronIcon({ direction }: { direction: 'back' | 'forward' }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={styles.controlIcon}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={direction === 'back' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
    </svg>
  )
}

// Save-state copy (moved from the pane's SaveIndicator, page-editing spec):
// muted text, never a badge.
const SAVE_LABELS: Record<Exclude<DraftStatus, 'clean'>, string> = {
  dirty: 'Unsaved changes',
  saving: 'Saving…',
  failed: 'Save failed',
}

// The pin toggle's label stem: the open page's filename without .md (the
// journal date reads naturally too); a placeholder when no page is open.
function pinName(pagePath: string | null): string {
  return pagePath === null ? 'page' : stem(pagePath)
}

export function StatusBar({
  pagePath,
  saveState = 'clean',
  newPage = false,
  indexing = false,
  vaultName,
  fileCount,
  pinned = false,
  canPin = false,
  onTogglePin,
  canBack = false,
  canForward = false,
  onBack,
  onForward,
  canToday = false,
  onToday,
}: {
  /** The open page's vault-relative path, or null when no page is open. */
  pagePath: string | null
  saveState?: DraftStatus
  /** The open page has no file yet; its first save creates it. */
  newPage?: boolean
  /** The active folder's index is building (indexing-loading-state). */
  indexing?: boolean
  vaultName?: string
  fileCount?: number
  /** The open page is pinned (add-pinned-pages). */
  pinned?: boolean
  /** The star is usable: a file-backed page is open — not a journal day, an
   *  unmaterialized page, or the results view. */
  canPin?: boolean
  /** Toggles the open page's pin from the bar's leading star. */
  onTogglePin?: () => void
  /** The trail has an entry before/after the open page; the Back and Forward
   *  controls lead the bar (move-nav-controls-to-status-bar). */
  canBack?: boolean
  canForward?: boolean
  onBack?: () => void
  onForward?: () => void
  /** The current day's journal can be opened (a usable vault). */
  canToday?: boolean
  /** Opens the current day's journal; the handler lives in App, so the open is
   *  an ordinary navigation. */
  onToday?: () => void
}) {
  const segments = pagePath?.split('/') ?? []
  const hasDirs = segments.length > 1
  // Indexing outranks save text while the index builds; otherwise the save
  // state shows, with a page that has no file yet reading as "new".
  const saveLabel =
    saveState === 'clean'
      ? null
      : saveState === 'dirty' && newPage
        ? 'New page: created on first save'
        : SAVE_LABELS[saveState]
  const statusText = indexing ? 'Indexing notes…' : saveLabel

  return (
    <footer className={styles.bar}>
      {/* Session navigation (move-nav-controls-to-status-bar): the trail's
          Back and Forward and the Today control lead the bar, ahead of the
          pin, so the sidebar can lead with its sections. */}
      {(onBack || onForward || onToday) && (
        <div className={styles.nav}>
          <button
            type="button"
            className={styles.control}
            aria-label="Back"
            disabled={!canBack}
            onClick={onBack}
          >
            <ChevronIcon direction="back" />
          </button>
          <button
            type="button"
            className={styles.control}
            aria-label="Forward"
            disabled={!canForward}
            onClick={onForward}
          >
            <ChevronIcon direction="forward" />
          </button>
          <button
            type="button"
            className={`${styles.control} ${styles.controlLabel}`}
            disabled={!canToday}
            onClick={onToday}
          >
            Today
          </button>
        </div>
      )}
      {onTogglePin && (
        <button
          type="button"
          className={`${styles.pin}${pinned ? ` ${styles.pinActive}` : ''}`}
          onClick={onTogglePin}
          disabled={!canPin}
          aria-pressed={pinned}
          aria-label={`${pinned ? 'Unpin' : 'Pin'} ${pinName(pagePath)}`}
          title={`${pinned ? 'Unpin' : 'Pin'} ${pinName(pagePath)}`}
        >
          <StarIcon filled={pinned} className={styles.pinIcon} />
        </button>
      )}
      <div className={styles.path} title={pagePath ?? undefined}>
        {hasDirs && (
          <>
            <span className={styles.crumbDirs}>
              {segments.slice(0, -1).map((segment, i) => (
                <Fragment key={`${i}-${segment}`}>
                  {i > 0 && (
                    <span className={styles.crumbSep} aria-hidden="true">
                      /
                    </span>
                  )}
                  {segment}
                </Fragment>
              ))}
            </span>
            <span className={styles.crumbSep} aria-hidden="true">
              /
            </span>
          </>
        )}
        {segments.length > 0 && (
          <span className={styles.crumbLast}>{segments[segments.length - 1]}</span>
        )}
      </div>
      <div className={styles.center}>
        {statusText !== null ? (
          <span className={styles.statusText} role="status">
            {statusText}
          </span>
        ) : null}
      </div>
      <div className={styles.vault}>
        {vaultName !== undefined && fileCount !== undefined ? (
          <span className={styles.vaultStatus} title={`${vaultName} (${fileCount} files)`}>
            <span className={styles.vaultName}>{vaultName}</span>
            <span className={styles.vaultCount}>· {fileCount}</span>
          </span>
        ) : null}
      </div>
      {/* The running version (version-in-status-bar): build identity at the
          bar's trailing edge, beside the vault's file count. A sibling of the
          vault group rather than a child, so the group stays empty when no
          folder is active. */}
      <span className={styles.version}>{`v${version}`}</span>
    </footer>
  )
}
