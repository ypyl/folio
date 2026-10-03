import {
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ForwardedRef,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react'
import { Accordion } from './Accordion'
import { JournalCalendar } from './JournalCalendar'
import { RowContextMenu } from './RowContextMenu'
import { ROW_STRIDE, windowPieces } from './pageWindow'
import type { Page } from '../page'
import { isReferenceable } from '../vault/parse'
import { writeDragRef } from './dragRefs'
import styles from './Sidebar.module.css'

/** One row in the sidebar's single Files listing (merge-sidebar-sections).
 *  The kind is the row's contract: a page row navigates, a board row opens the
 *  board editor, and an asset row opens the file (ADR-0021, ADR-0024). `pinned`
 *  is page-only; App bakes it in from the index's pins. Labels are precomputed
 *  by App (page title, board path inside `boards/`, asset path inside
 *  `assets/`), so the sidebar stays a renderer. */
export type SidebarRow = {
  kind: 'page' | 'board' | 'asset'
  path: string
  label: string
  pinned?: boolean
}

/** The sidebar's imperative surface (the status-bar reveal requirement): App
 *  asks the listing to bring the open item's row into view and focus it, so the
 *  request reaches the pane without a prop that would re-render it. */
export type SidebarHandle = {
  revealActive: () => void
}

/** One listing's scroll geometry (add-history-navigation D5): what
 *  `windowPieces` needs, and nothing about which listing it is. */
type ListView = { scrollTop: number; viewportHeight: number; listTop: number }

/** Before anything is measured — a collapsed section, or a first render — the
 *  head of a listing is drawn: a zero-height viewport is exactly that. */
const UNMEASURED: ListView = { scrollTop: 0, viewportHeight: 0, listTop: 0 }

/** Where the listing sits inside its own scroll body: the body scrolls, the
 *  list inside it does not. */
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

// Receives row data via props (design decision 3): components never import the
// vault directly, so the index can swap per folder at App only. Rows are keyed
// and tracked by vault-relative path, not object identity - the index re-derives
// them on every refresh.
//
// The sidebar is two bands (merge-sidebar-sections): the Journal calendar, sized
// to its content, and the Files section, one listing of the vault's pages,
// boards, and assets that scrolls inside its own body. Every section summary is
// always in the document, so nothing can be buried below a long listing.
//
// Memoized so a keystroke in the open page does not re-create a row element per
// row (add-page-history, design D8, AGENTS.md: the keystroke budget). The memo
// only bails while every prop keeps its identity, so App must keep this
// inventory referentially stable:
//   rows           - useMemo on graph/pins identity (App builds and orders it)
//   journalEntries - useMemo on graph identity
//   onSelect / onOpenAsset / onOpenBoard - useCallback reading only what they need
//   activePath, hasVault, loading, todayTick, collapsed - primitives
// A new prop that is rebuilt on every render silently disables this, so
// re-run the change's measurement when this list changes.
/**
 * Whether a page row offers Presenting. Off for now
 * (swap-editor-to-codemirror-live-preview): the deck derives from the page's
 * Markdown, and the reading view's rendering of that text is not yet at parity,
 * so the row would open a deck that reads worse than the page it presents. The
 * `onPresent` seam and the view behind it are kept, so re-enabling Presenting is
 * flipping this.
 */
const PRESENT_ENABLED = false

export const Sidebar = memo(
  forwardRef(function Sidebar(
    {
      rows,
      journalEntries,
      activePath,
      onSelect,
      onOpenAsset,
      onOpenBoard,
      onFavorite,
      onPresent,
      hasVault,
      loading = false,
      todayTick = 0,
      collapsed = false,
    }: {
      /** The vault's non-journal files in listing order: pages (pinned then
       *  recency), then boards, then assets (merge-sidebar-sections). App orders
       *  and memoizes this array; the sidebar renders it as given. */
      rows: SidebarRow[]
      journalEntries: Page[]
      activePath: string | null
      onSelect: (path: string) => void
      /** Activate an asset row: open the file (ADR-0021). An asset row never
       *  navigates, so this is the whole of what a click does. */
      onOpenAsset: (path: string) => void
      /** Activate a board row: open the board editor in the main pane
       *  (add-whiteboards). */
      onOpenBoard?: (path: string) => void
      /** Favorite or unfavorite a page (add-row-context-menu): the row menu's
       *  first item, acting on the row's own path. App owns the favorite store. */
      onFavorite?: (path: string) => void
      /** Present a page (add-row-context-menu): the row menu's second item. App
       *  opens the page first when it is not already open. */
      onPresent?: (path: string) => void
      /** A folder is open and indexed; gates the journal calendar and the Files
       *  section's empty state. */
      hasVault: boolean
      /** The active folder's index is building (indexing-loading-state). */
      loading?: boolean
      /** Bumped by App when Today is activated, so the calendar re-anchors even
       *  when today is already the open day (move-nav-controls-to-status-bar).
       *  The control lives in the status bar now; the calendar stays here. */
      todayTick?: number
      /** The sidebar is folded away (add-collapsible-sidebars). The pane stays
       *  mounted so its accordion state survives, and `display: none` takes its
       *  box (and its descendants' focusability) out of the layout. */
      collapsed?: boolean
    },
    ref: ForwardedRef<SidebarHandle>,
  ) {
    // One windowed listing, one measured body (merge-sidebar-sections). The aside
    // is watched, not measured: its children are the bands whose height the flex
    // split changes when a section opens or closes.
    const asideRef = useRef<HTMLElement | null>(null)
    const bodyRef = useRef<HTMLDivElement | null>(null)
    const listRef = useRef<HTMLUListElement | null>(null)
    const [view, setView] = useState<ListView>(UNMEASURED)

    const measure = useCallback(() => {
      const next = measureList(bodyRef.current, listRef.current)
      setView((prev) => (sameView(prev, next) ? prev : next))
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

    // The band above the listing opens, and the calendar changes month, without
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

    // The open item's row — page or board — must stay rendered and marked, so the
    // single window is given the active index across all kinds (design D5). An
    // asset is never active. `findIndex` is a linear pass over the already-built
    // array, off the keystroke path.
    const activeIndex = useMemo(
      () => rows.findIndex((row) => row.path === activePath),
      [rows, activePath],
    )

    const pieces = useMemo(
      () => windowPieces({ total: rows.length, ...view, keep: activeIndex }),
      [rows.length, view, activeIndex],
    )

    // The page-row context menu (add-row-context-menu, row-context-menu spec):
    // which row it belongs to, where it was invoked, and the row element focus
    // returns to. Local, and it changes only when the menu opens or closes, never
    // on a keystroke, so it cannot reach the typing path.
    const [menu, setMenu] = useState<{
      path: string
      x: number
      y: number
      trigger: HTMLElement
    } | null>(null)
    const menuRow = menu === null ? undefined : rows.find((r) => r.path === menu.path)

    // Open the menu at the invocation point. Chromium fires `contextmenu` for a
    // right-click and for `Shift+F10`/the Menu key; the keyboard invocation
    // reports zero coordinates, so it anchors at the focused row instead.
    const openMenu = (e: ReactMouseEvent<HTMLButtonElement>, path: string) => {
      e.preventDefault()
      const trigger = e.currentTarget
      const rect = trigger.getBoundingClientRect()
      const keyboard = e.clientX === 0 && e.clientY === 0
      setMenu({
        path,
        x: keyboard ? rect.left : e.clientX,
        y: keyboard ? rect.bottom : e.clientY,
        trigger,
      })
    }

    // A kind badge (merge-sidebar-sections): the page is the default kind and
    // carries none; a board and an asset are marked with a leading letter. The
    // badge is presentational only, so the row stays one button.
    const badge = (kind: 'board' | 'asset') => (
      <span className={styles.badge} aria-hidden="true">
        {kind === 'board' ? 'b' : 'a'}
      </span>
    )

    // Rows are keyed by vault-relative path. A row's click does what its kind
    // says: a page navigates, a board opens the board editor, an asset opens the
    // file and changes nothing else (ADR-0021).
    const renderRow = (row: SidebarRow, index: number) => {
      const isActive = row.path === activePath
      if (row.kind === 'page') {
        // A page row is a drag source only when its name can be written as a
        // token that reads back to it (drag-references-into-editor, design D3) —
        // the same rule that keeps such a name out of the completion pool.
        const draggable = isReferenceable(row.label)
        return (
          <li
            key={row.path}
            className={styles.item}
            aria-setsize={rows.length}
            aria-posinset={index + 1}
          >
            <button
              type="button"
              className={`${styles.row}${row.pinned ? ` ${styles.rowPinned}` : ''}`}
              data-pinned={row.pinned || undefined}
              data-active={isActive || undefined}
              aria-current={isActive ? 'page' : undefined}
              aria-haspopup="menu"
              draggable={draggable}
              onDragStart={
                draggable
                  ? (e) => writeDragRef(e.dataTransfer, { kind: 'page', name: row.label })
                  : undefined
              }
              onContextMenu={(e) => openMenu(e, row.path)}
              onClick={() => onSelect(row.path)}
            >
              <span className={styles.rowText}>{row.label}</span>
            </button>
          </li>
        )
      }
      if (row.kind === 'board') {
        return (
          <li
            key={row.path}
            className={styles.item}
            aria-setsize={rows.length}
            aria-posinset={index + 1}
          >
            <button
              type="button"
              className={styles.row}
              data-active={isActive || undefined}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onOpenBoard?.(row.path)}
            >
              {badge('board')}
              <span className={styles.rowText}>{row.label}</span>
            </button>
          </li>
        )
      }
      // Asset row (vault-assets): labelled by its path inside `assets/`, and a
      // single button that opens the file. It carries no active marking — the
      // open page is a page — and is never dimmed: a row exists only for a file
      // the vault holds. It is also a drag source (drag-references-into-editor).
      return (
        <li
          key={row.path}
          className={styles.item}
          aria-setsize={rows.length}
          aria-posinset={index + 1}
        >
          <button
            type="button"
            className={styles.row}
            draggable
            onDragStart={(e) => writeDragRef(e.dataTransfer, { kind: 'asset', path: row.path })}
            onClick={() => onOpenAsset(row.path)}
          >
            {badge('asset')}
            <span className={styles.rowText}>{row.label}</span>
          </button>
        </li>
      )
    }

    // A windowed listing: the rows near the visible part of its body, plus the
    // spacers standing in for the rest, so the body's scroll extent is the whole
    // listing (add-history-navigation, D5).
    const renderListing = (
      listingPieces: ReturnType<typeof windowPieces>,
      row: (index: number) => ReactNode,
    ) =>
      listingPieces.map((piece, i) =>
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

    // Reveal the open item's row (the status-bar reveal requirement): open the
    // Files section when it is closed, bring the row into view, and put keyboard
    // focus on it. The row is already rendered and marked — `windowPieces` keeps
    // the active index — so this reads the DOM the listing already produces and
    // never re-windows, re-measures, or touches the vault. A view operation that
    // changes nothing else, and a no-op when there is no listing or no row.
    const revealActive = useCallback(() => {
      const list = listRef.current
      const row = list?.querySelector<HTMLElement>('[data-active]')
      if (!list || !row) return
      const section = list.closest('details')
      if (section && !section.open) section.open = true
      // jsdom has no scrollIntoView; the browser does, and focus works in both.
      row.scrollIntoView?.({ block: 'nearest' })
      row.focus()
    }, [])

    useImperativeHandle(ref, () => ({ revealActive }), [revealActive])

    return (
      <aside
        id="sidebar-pane"
        className={collapsed ? `${styles.sidebar} ${styles.collapsed}` : styles.sidebar}
        aria-label="Notes"
        ref={asideRef}
      >
        {/* The session controls moved to the status bar
          (move-nav-controls-to-status-bar); the sidebar now leads with the
          Journal section. */}
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
        {/* The Files section (merge-sidebar-sections) owns the single listing:
          pages lead (pinned, then recency), boards and assets trail by path.
          It is open by default and takes the sidebar's remaining height. */}
        <Accordion
          title="Files"
          defaultOpen
          className={styles.section}
          bodyClassName={styles.fillBody}
        >
          <div className={styles.scrollBody} ref={bodyRef} onScroll={onScroll}>
            {loading ? (
              <div className={styles.list} aria-hidden="true">
                {skeletonRows}
              </div>
            ) : rows.length === 0 ? (
              hasVault ? (
                <p className="section-placeholder">No notes yet.</p>
              ) : null
            ) : (
              <ul className={styles.list} ref={listRef}>
                {renderListing(pieces, (index) => renderRow(rows[index], index))}
              </ul>
            )}
          </div>
        </Accordion>
        {/* The page-row context menu: fixed-positioned at the invocation point,
          so where it sits in this tree does not matter. Only page rows open
          it; board and asset rows carry no handler. */}
        {menu !== null ? (
          <RowContextMenu
            x={menu.x}
            y={menu.y}
            restoreFocusTo={menu.trigger}
            onClose={() => setMenu(null)}
            items={[
              {
                label: menuRow?.pinned ? 'Unfavorite' : 'Favorite',
                onSelect: () => onFavorite?.(menu.path),
              },
              ...(PRESENT_ENABLED
                ? [{ label: 'Present', onSelect: () => onPresent?.(menu.path) }]
                : []),
            ]}
          />
        ) : null}
      </aside>
    )
  }),
)
