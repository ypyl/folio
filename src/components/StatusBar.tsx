import { Fragment } from 'react'
import type { DraftStatus } from '../editor/drafts'
import { stem } from '../vault/index'
import { StarIcon } from './StarIcon'
import styles from './StatusBar.module.css'

// App-level status frame (add-status-bar, ui-shell spec): one always-present
// thin bar below the workspace holding every piece of status — the open
// page's file path (left), save/indexing status (center), and the active
// vault's name and file count (right). The bar sits outside all pane scroll
// regions, so its content never scrolls. Groups empty when their content has
// no source. Its only control is the pin star (add-pinned-pages) in the
// leading corner; the status groups themselves are display-only. The
// question-mark help button and its modal lived here until
// move-help-to-right-panel moved the reference into the right panel.

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
      {/* Leading column (align-status-bar-pin-column): the rail's column
          continued into the bar, closed by the hairline that continues the
          rail's right border (continue-rail-border-in-status-bar). The cell
          is the rail's width whether or not the pin renders, so the bar's
          geometry never shifts. */}
      <div className={styles.lead}>
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
      </div>
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
    </footer>
  )
}
