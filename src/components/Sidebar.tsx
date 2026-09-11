import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { Accordion } from './Accordion'
import { JournalCalendar } from './JournalCalendar'
import { ROW_STRIDE, windowPieces } from './pageWindow'
import type { Page } from '../page'
import styles from './Sidebar.module.css'

// A 24-viewBox chevron. aria-hidden: the control's accessible name says which
// way it goes, so the glyph is decoration (the same rule the pin star follows).
function ChevronIcon({
  direction,
  className,
}: {
  direction: 'back' | 'forward'
  className?: string
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={className}
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

// Receives page data via props (design decision 3): components never import the
// vault directly, so the index can swap per folder at App only. Rows are keyed
// and tracked by vault-relative path (design D1/D6), not object identity -
// index pages are re-derived on every refresh.
//
// Memoized so a keystroke in the open page does not re-create a row element per
// page (add-page-history, design D8, AGENTS.md: the keystroke budget). The memo
// only bails while every prop keeps its identity, so App must keep this
// inventory referentially stable:
//   pages / journalEntries - useMemo on graph identity
//   pinnedPaths            - useIndex's pins, a constant empty array while the
//                            graph is null
//   onSelect / onBack / onForward - useCallback reading only what they need
//   canBack / canForward, activePath, hasVault, loading - primitives
// A new prop that is rebuilt on every render silently disables this, so
// re-run the change's measurement when this list changes.
export const Sidebar = memo(function Sidebar({
  pages,
  journalEntries,
  activePath,
  onSelect,
  pinnedPaths = [],
  hasVault,
  loading = false,
  canBack = false,
  canForward = false,
  onBack,
  onForward,
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
  /** The trail has an entry before/after the open page (add-history-navigation). */
  canBack?: boolean
  canForward?: boolean
  onBack?: () => void
  onForward?: () => void
}) {
  const pinnedSet = new Set(pinnedPaths)

  // The listing is windowed (add-history-navigation, D5): the sidebar is the
  // scroll container, and only the rows near its viewport are in the document.
  // `view` holds the three measurements the range needs; pieces derive from
  // them, so a render never re-measures and a scroll never re-renders unless
  // the range actually changes.
  const scrollRef = useRef<HTMLElement | null>(null)
  const listRef = useRef<HTMLUListElement | null>(null)
  const [view, setView] = useState({ scrollTop: 0, viewportHeight: 0, listTop: 0 })

  const measure = useCallback(() => {
    const container = scrollRef.current
    const list = listRef.current
    if (!container || !list) return
    const containerTop = container.getBoundingClientRect().top
    const next = {
      scrollTop: container.scrollTop,
      viewportHeight: container.clientHeight,
      listTop: list.getBoundingClientRect().top - containerTop + container.scrollTop,
    }
    setView((prev) =>
      prev.scrollTop === next.scrollTop &&
      prev.viewportHeight === next.viewportHeight &&
      prev.listTop === next.listTop
        ? prev
        : next,
    )
  }, [])

  // One recompute per frame at most: a scroll fires far faster than the window
  // can meaningfully change, and the flag (rather than the frame id) survives a
  // synchronous `requestAnimationFrame` implementation such as a test's stub.
  const pending = useRef(false)
  const onScroll = useCallback(() => {
    if (pending.current) return
    pending.current = true
    requestAnimationFrame(() => {
      pending.current = false
      measure()
    })
  }, [measure])

  // Sections above the listing open, and the calendar changes month, without
  // re-rendering this component, so their boxes are watched rather than assumed.
  // The listing itself is watched too: its spacers keep its height constant, so
  // watching it cannot feed back into another measure.
  useEffect(() => {
    const container = scrollRef.current
    if (!container || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => measure())
    for (const child of container.children) observer.observe(child)
    return () => observer.disconnect()
  }, [measure])

  useLayoutEffect(() => {
    measure()
  }, [measure])

  const activeIndex = useMemo(
    () => pages.findIndex((page) => page.path === activePath),
    [pages, activePath],
  )

  const pieces = useMemo(
    () => windowPieces({ total: pages.length, ...view, keep: activeIndex }),
    [pages.length, view, activeIndex],
  )

  // Pinned rows are marked by the row's own style (bolder title) — no icon
  // and no extra control; the toggle lives in the status bar (design D6).
  const renderRow = (page: Page, index: number) => {
    const isPinned = pinnedSet.has(page.path)
    return (
      // The row sits in a list item so the windowed listing can still report its
      // position and the listing's total size to assistive technology
      // (add-history-navigation, D5): a `button` cannot carry either attribute.
      <li
        key={page.path}
        className={styles.item}
        aria-setsize={pages.length}
        aria-posinset={index + 1}
      >
        <button
          type="button"
          className={`${styles.row}${isPinned ? ` ${styles.rowPinned}` : ''}`}
          data-pinned={isPinned || undefined}
          data-active={page.path === activePath || undefined}
          aria-current={page.path === activePath ? 'page' : undefined}
          onClick={() => onSelect(page.path)}
        >
          <span className={styles.rowText}>{page.title}</span>
        </button>
      </li>
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
    <aside className={styles.sidebar} aria-label="Notes" ref={scrollRef} onScroll={onScroll}>
      {/* The trail's only UI (add-history-navigation, D4): sticky, so Back and
          Forward stay reachable however long the listing below them is. */}
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.control}
          aria-label="Back"
          disabled={!canBack}
          onClick={onBack}
        >
          <ChevronIcon direction="back" className={styles.controlIcon} />
        </button>
        <button
          type="button"
          className={styles.control}
          aria-label="Forward"
          disabled={!canForward}
          onClick={onForward}
        >
          <ChevronIcon direction="forward" className={styles.controlIcon} />
        </button>
      </div>
      <Accordion title="Journal" defaultOpen>
        {/* The journal calendar owns the section (journal-calendar D1); it
            stays hidden until a vault is open (no-inert-grid rule). */}
        {loading
          ? journalSkeleton
          : hasVault && (
              <JournalCalendar
                journalEntries={journalEntries}
                activePath={activePath}
                onSelect={onSelect}
              />
            )}
      </Accordion>
      <Accordion title="Pages" defaultOpen>
        {loading ? (
          <div className={styles.list} aria-hidden="true">
            {skeletonRows}
          </div>
        ) : (
          <ul className={styles.list} ref={listRef}>
            {pieces.map((piece, i) =>
              piece.kind === 'gap' ? (
                // Stands in for the rows outside the window, so the listing's
                // scroll extent is the whole listing (add-history-navigation, D5).
                <li
                  key={`gap-${i}`}
                  className={styles.gap}
                  role="presentation"
                  aria-hidden="true"
                  style={{ height: piece.rows * ROW_STRIDE }}
                />
              ) : (
                piece.indexes.map((index) => renderRow(pages[index], index))
              ),
            )}
          </ul>
        )}
      </Accordion>
    </aside>
  )
})
