import { Accordion } from './Accordion'
import { JournalCalendar } from './JournalCalendar'
import type { Page } from '../page'
import styles from './Sidebar.module.css'

// Receives page data via props (design decision 3): components never import
// the vault directly, so the index can swap per folder at App only. Rows are
// keyed and tracked by vault-relative path (design D1/D6), not object
// identity - index pages are re-derived on every refresh.
export function Sidebar({
  pages,
  journalEntries,
  activePath,
  onSelect,
  pinnedPaths = [],
  hasVault,
  loading = false,
}: {
  pages: Page[]
  journalEntries: Page[]
  activePath: string | null
  onSelect: (path: string) => void
  /** Pinned page paths, in pin order (most recently pinned first); pinned
   *  rows render a non-interactive star marker (add-pinned-pages). */
  pinnedPaths?: string[]
  /** A folder is open and indexed; gates the journal calendar (D6). */
  hasVault: boolean
  /** The active folder's index is building (indexing-loading-state). */
  loading?: boolean
}) {
  const pinnedSet = new Set(pinnedPaths)

  // Pinned rows are marked by the row's own style (bolder title) — no icon
  // and no extra control; the toggle lives in the status bar (design D6).
  const renderRow = (page: Page) => {
    const isPinned = pinnedSet.has(page.path)
    return (
      <button
        key={page.path}
        type="button"
        className={`${styles.row}${isPinned ? ` ${styles.rowPinned}` : ''}`}
        data-pinned={isPinned || undefined}
        data-active={page.path === activePath || undefined}
        aria-current={page.path === activePath ? 'page' : undefined}
        onClick={() => onSelect(page.path)}
      >
        <span className={styles.rowText}>{page.title}</span>
      </button>
    )
  }

  // Placeholder rows (indexing-loading-state): decorative, never read as
  // content; sized to the real rows they replace (6px 8px padding + 14px
  // text) so the Pages section doesn't jump when the listing lands.
  const skeletonRows = [0, 1, 2].map((i) => (
    <span key={i} className={`skeleton ${styles.skeletonRow}`} />
  ))

  // Journal placeholder (indexing-loading-state): the calendar's shape at
  // its real geometry — month/year bar, weekday row, 6x7 day grid — all
  // decorative, so the section stays the same size when the calendar renders.
  const journalSkeleton = (
    <div className={styles.calSkeleton} aria-hidden="true">
      <span className={`skeleton ${styles.calMonthBar}`} />
      <div className={styles.calWeekdays}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>
      <div className={styles.calGrid}>
        {Array.from({ length: 42 }, (_, i) => (
          <span key={i} className={`skeleton ${styles.calDay}`} />
        ))}
      </div>
    </div>
  )

  return (
    <aside className={styles.sidebar} aria-label="Notes">
      <Accordion title="Journal" defaultOpen>
        {/* The journal calendar owns the section (journal-calendar D1); it
            stays hidden until a vault is open (no-inert-grid rule). */}
        {loading ? (
          journalSkeleton
        ) : (
          hasVault && (
            <JournalCalendar
              journalEntries={journalEntries}
              activePath={activePath}
              onSelect={onSelect}
            />
          )
        )}
      </Accordion>
      <Accordion title="Pages" defaultOpen>
        {loading ? (
          <div className={styles.list} aria-hidden="true">
            {skeletonRows}
          </div>
        ) : (
          <div className={styles.list}>{pages.map(renderRow)}</div>
        )}
      </Accordion>
    </aside>
  )
}
