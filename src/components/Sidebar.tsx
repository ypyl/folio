import {
  memo,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { Accordion } from './Accordion'
import { JournalCalendar } from './JournalCalendar'
import { ROW_STRIDE, windowPieces } from './pageWindow'
import type { Page } from '../page'
import { assetName } from '../vault/index'
import { isReferenceable } from '../vault/parse'
import { writeDragRef } from './dragRefs'
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

/** One listing's scroll geometry (add-history-navigation D5): what
 *  `windowPieces` needs, and nothing about which listing it is. Each sidebar
 *  listing measures its own body, so a scroll in one never re-windows the
 *  other (add-asset-navigation D5). */
type ListView = { scrollTop: number; viewportHeight: number; listTop: number }

/** Before anything is measured — a collapsed section, or a first render — the
 *  head of a listing is drawn: a zero-height viewport is exactly that. */
const UNMEASURED: ListView = { scrollTop: 0, viewportHeight: 0, listTop: 0 }

/** Where a listing sits inside its own scroll body: the body scrolls, the list
 *  inside it does not. */
function measureList(body: HTMLElement | null, list: HTMLElement | null): ListView {
  if (!body || !list) return UNMEASURED
  return {
    scrollTop: body.scrollTop,
    viewportHeight: body.clientHeight,
    listTop: list.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop,
  }
}

/** The listing's own spacer convention, as a predicate: nothing to re-window
 *  when neither the scroll position nor the measurable box moved. */
function sameView(a: ListView, b: ListView): boolean {
  return (
    a.scrollTop === b.scrollTop && a.viewportHeight === b.viewportHeight && a.listTop === b.listTop
  )
}

// Receives page data via props (design decision 3): components never import the
// vault directly, so the index can swap per folder at App only. Rows are keyed
// and tracked by vault-relative path (design D1/D6), not object identity -
// index pages are re-derived on every refresh.
//
// The sidebar is a column of bands (add-asset-navigation, D5): the navigation
// controls, then Journal sized to its calendar, then the Pages and Assets
// sections, which share whatever height is left and each scroll inside their
// own body. Every section summary is always in the document, so nothing can be
// buried below a long listing the way the removed History section was.
//
// Memoized so a keystroke in the open page does not re-create a row element per
// page (add-page-history, design D8, AGENTS.md: the keystroke budget). The memo
// only bails while every prop keeps its identity, so App must keep this
// inventory referentially stable:
//   pages / journalEntries - useMemo on graph identity
//   assets                 - graph.assets, which changes only on a scan
//   pinnedPaths            - useIndex's pins, a constant empty array while the
//                            graph is null
//   onSelect / onOpenAsset / onBack / onForward / onToday - useCallback reading
//                            only what they need
//   canBack / canForward, activePath, hasVault, loading - primitives
// A new prop that is rebuilt on every render silently disables this, so
// re-run the change's measurement when this list changes.
export const Sidebar = memo(function Sidebar({
  pages,
  journalEntries,
  assets,
  activePath,
  onSelect,
  onOpenAsset,
  pinnedPaths = [],
  hasVault,
  loading = false,
  canBack = false,
  canForward = false,
  onBack,
  onForward,
  onToday,
}: {
  pages: Page[]
  journalEntries: Page[]
  /** The vault's assets, path-ordered (vault-assets). App passes the index's
   *  own array, so a scan is the only thing that changes it. */
  assets: string[]
  activePath: string | null
  onSelect: (path: string) => void
  /** Activate an asset row: open the file (ADR-0021). An asset row never
   *  navigates, so this is the whole of what a click does. */
  onOpenAsset: (path: string) => void
  /** Pinned page paths, in pin order (most recently pinned first); pinned
   *  rows render a non-interactive star marker (add-pinned-pages). */
  pinnedPaths?: string[]
  /** A folder is open and indexed; gates the journal calendar and the Assets
   *  section's empty state (D6). */
  hasVault: boolean
  /** The active folder's index is building (indexing-loading-state). */
  loading?: boolean
  /** The trail has an entry before/after the open page (add-history-navigation). */
  canBack?: boolean
  canForward?: boolean
  onBack?: () => void
  onForward?: () => void
  /** Open the current day's journal (move-today-into-nav-controls); the
   *  handler lives in App, so the open is an ordinary navigation. */
  onToday?: () => void
}) {
  const pinnedSet = new Set(pinnedPaths)

  // The calendar anchors to the open day, so it cannot notice a Today that
  // lands on the day already open. This row owns both the control and the
  // calendar, so it bumps the tick locally: one number, no prop through App
  // (move-today-into-nav-controls, design D3).
  const [todayTick, setTodayTick] = useState(0)

  // Two windowed listings, two measured bodies (add-asset-navigation, D5). The
  // aside is watched, not measured: its children are the bands whose height the
  // flex split changes when a section opens or closes.
  const asideRef = useRef<HTMLElement | null>(null)
  const pagesBodyRef = useRef<HTMLDivElement | null>(null)
  const pagesListRef = useRef<HTMLUListElement | null>(null)
  const assetsBodyRef = useRef<HTMLDivElement | null>(null)
  const assetsListRef = useRef<HTMLUListElement | null>(null)
  const [views, setViews] = useState<{ pages: ListView; assets: ListView }>({
    pages: UNMEASURED,
    assets: UNMEASURED,
  })

  const measure = useCallback(() => {
    const next = {
      pages: measureList(pagesBodyRef.current, pagesListRef.current),
      assets: measureList(assetsBodyRef.current, assetsListRef.current),
    }
    setViews((prev) =>
      sameView(prev.pages, next.pages) && sameView(prev.assets, next.assets) ? prev : next,
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

  // Sections above a listing open, and the calendar changes month, without
  // re-rendering this component, so the bands' boxes are watched rather than
  // assumed. A band's height comes from the flex split and never from its
  // content — the listing scrolls inside it — so watching it cannot feed back
  // into another measure.
  useEffect(() => {
    const container = asideRef.current
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

  const pagesPieces = useMemo(
    () => windowPieces({ total: pages.length, ...views.pages, keep: activeIndex }),
    [pages.length, views.pages, activeIndex],
  )

  const assetPieces = useMemo(
    () => windowPieces({ total: assets.length, ...views.assets }),
    [assets.length, views.assets],
  )

  // Pinned rows are marked by the row's own style (bolder title) — no icon
  // and no extra control; the toggle lives in the status bar (design D6).
  const renderRow = (page: Page, index: number) => {
    const isPinned = pinnedSet.has(page.path)
    // A page row is a drag source only when its name can be written as a token
    // that reads back to it (drag-references-into-editor, design D3) — the same
    // rule that keeps such a name out of the completion pool. Dragging writes
    // the reference into the open page; a drag is not an activation, so the
    // click below is untouched.
    const draggable = isReferenceable(page.title)
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
          draggable={draggable}
          onDragStart={
            draggable
              ? (e) => writeDragRef(e.dataTransfer, { kind: 'page', name: page.title })
              : undefined
          }
          onClick={() => onSelect(page.path)}
        >
          <span className={styles.rowText}>{page.title}</span>
        </button>
      </li>
    )
  }

  // An asset row (vault-assets): labelled by its path inside `assets/`, and a
  // single button that opens the file. It carries no active marking — the open
  // page is a page — and is never dimmed: a row exists only for a file the
  // vault holds. It is also a drag source (drag-references-into-editor): the
  // payload names the file's vault path, which the editor turns into a link.
  const renderAssetRow = (index: number) => {
    const path = assets[index]
    return (
      <li key={path} className={styles.item} aria-setsize={assets.length} aria-posinset={index + 1}>
        <button
          type="button"
          className={styles.row}
          draggable
          onDragStart={(e) => writeDragRef(e.dataTransfer, { kind: 'asset', path })}
          onClick={() => onOpenAsset(path)}
        >
          <span className={styles.rowText}>{assetName(path)}</span>
        </button>
      </li>
    )
  }

  // A windowed listing: the rows near the visible part of its body, plus the
  // spacers standing in for the rest, so the body's scroll extent is the whole
  // listing (add-history-navigation, D5).
  const renderListing = (
    pieces: ReturnType<typeof windowPieces>,
    row: (index: number) => ReactNode,
  ) =>
    pieces.map((piece, i) =>
      piece.kind === 'gap' ? (
        <li
          key={`gap-${i}`}
          className={styles.gap}
          role="presentation"
          aria-hidden="true"
          style={{ height: piece.rows * ROW_STRIDE }}
        />
      ) : (
        piece.indexes.map(row)
      ),
    )

  // Placeholder rows (indexing-loading-state): decorative, never read as
  // content; sized to the real rows they replace (6px 8px padding + 14px
  // text) so a section doesn't jump when its listing lands.
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
    <aside className={styles.sidebar} aria-label="Notes" ref={asideRef}>
      {/* The session controls (add-history-navigation D4, move-today-into-nav-
          controls): the first band, so Back, Forward, and Today stay in reach
          however long the listings below them get. */}
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
        {/* Today (move-today-into-nav-controls): the current day's journal is
            navigation, so it rides with Back and Forward instead of living in
            the calendar, where collapsing Journal took it away. */}
        <button
          type="button"
          className={`${styles.control} ${styles.controlLabel}`}
          disabled={!hasVault}
          onClick={() => {
            setTodayTick((t) => t + 1)
            onToday?.()
          }}
        >
          Today
        </button>
      </div>
      <Accordion title="Journal" defaultOpen className={styles.sectionFixed}>
        {/* The journal calendar owns the section (journal-calendar D1); it
            stays hidden until a vault is open (no-inert-grid rule). */}
        {loading
          ? journalSkeleton
          : hasVault && (
              <JournalCalendar
                journalEntries={journalEntries}
                activePath={activePath}
                onSelect={onSelect}
                todayTick={todayTick}
              />
            )}
      </Accordion>
      <Accordion
        title="Pages"
        defaultOpen
        className={styles.section}
        bodyClassName={styles.fillBody}
      >
        <div className={styles.scrollBody} ref={pagesBodyRef} onScroll={onScroll}>
          {loading ? (
            <div className={styles.list} aria-hidden="true">
              {skeletonRows}
            </div>
          ) : (
            <ul className={styles.list} ref={pagesListRef}>
              {renderListing(pagesPieces, (index) => renderRow(pages[index], index))}
            </ul>
          )}
        </div>
      </Accordion>
      {/* Assets (vault-assets) closes the sidebar, collapsed: its summary is
          always in the document, and opening it takes its height from Pages. */}
      <Accordion title="Assets" className={styles.section} bodyClassName={styles.fillBody}>
        <div className={styles.scrollBody} ref={assetsBodyRef} onScroll={onScroll}>
          {loading ? (
            <div className={styles.list} aria-hidden="true">
              {skeletonRows}
            </div>
          ) : assets.length === 0 ? (
            hasVault ? (
              <p className="section-placeholder">No assets yet.</p>
            ) : null
          ) : (
            <ul className={styles.list} ref={assetsListRef}>
              {renderListing(assetPieces, renderAssetRow)}
            </ul>
          )}
        </div>
      </Accordion>
    </aside>
  )
})
