import type { ReactNode } from 'react'
import type { ContentEntry } from '../vault/contents'
import { Accordion } from './Accordion'
import styles from './MetaPanel.module.css'

// One link row in the meta panel. `path` is the target's vault-relative path;
// `kind` is what the row points at, which decides both its badge (a board `b`,
// an asset `a`; a page none) and what activating it does: a page row navigates,
// a file row opens the file or board it names and leaves the app where it is.
// `materialized` is false when the target has no file on disk yet — a page or
// board row is dimmed but still activatable, opening a blank page or board that
// materializes on first save (static-navigation spec); an asset row is never
// dimmed, because it exists only for a file the vault holds.
export type LinkRow = {
  kind: 'page' | 'board' | 'asset'
  title: string
  path: string
  materialized: boolean
}

function LinkList({
  rows,
  activePath,
  onSelect,
  onOpenAsset,
  emptyCopy,
}: {
  rows: LinkRow[]
  /** The open page's path, for the active-row marking; null where no row can
   *  be the open page (the board Referenced-by list). */
  activePath: string | null
  /** Activate a page row: navigate to the page it names. */
  onSelect: (path: string) => void
  /** Activate a file row: open the file or board it names (vault-assets). */
  onOpenAsset: (path: string) => void
  emptyCopy: string
}) {
  // Rows arrive already ordered by the caller (reorder-meta-panel-lists,
  // merge-forwardlinks-groups): the list renders them as given and never
  // re-sorts.
  if (rows.length === 0) {
    return <p className="section-placeholder">{emptyCopy}</p>
  }
  return (
    <div className={styles.list}>
      {rows.map((row) => {
        const isActive = activePath !== null && row.path === activePath
        // Only an asset row is never dimmed: it exists only for a file the
        // vault holds, while a page or a board may not exist on disk yet.
        const dimmed = row.kind !== 'asset' && !row.materialized
        return (
          <button
            key={row.path}
            type="button"
            className={dimmed ? `${styles.row} ${styles.dimmed}` : styles.row}
            data-active={isActive || undefined}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => (row.kind === 'page' ? onSelect(row.path) : onOpenAsset(row.path))}
          >
            {row.kind !== 'page' && (
              <span className={styles.badge} aria-hidden="true">
                {row.kind === 'board' ? 'b' : 'a'}
              </span>
            )}
            <span className={styles.rowText}>{row.title}</span>
          </button>
        )
      })}
    </div>
  )
}

// The Contents list (add-page-contents): one row per heading, indented by
// level. Activating a row asks the app to locate that heading's block, which
// is a view operation — it never opens a page or edits anything.
function ContentList({
  entries,
  onLocate,
}: {
  entries: ContentEntry[]
  onLocate: (block: number) => void
}) {
  if (entries.length === 0) {
    return <p className="section-placeholder">No headings on this page.</p>
  }
  return (
    <div className={styles.list}>
      {entries.map((entry) => (
        <button
          key={`${entry.block}:${entry.text}`}
          type="button"
          className={styles.row}
          // One indent step per level below the top heading.
          style={{ paddingLeft: 8 + (entry.level - 1) * 12 }}
          onClick={() => onLocate(entry.block)}
        >
          <span className={styles.rowText}>{entry.text}</span>
        </button>
      ))}
    </div>
  )
}

// The right meta panel: Contents, Backlinks, Forwardlinks, and the
// keyboard-shortcuts reference (add-page-contents). Contents lists the open
// page's headings (page-contents capability); Forwardlinks holds every outgoing
// reference in one list — the pages it names, then the files it points at,
// assets and boards — each row badged by kind (merge-forwardlinks-groups).
// Backlinks stays its own page-only section.
// Placeholder copy while no page is open; real, navigable rows (or empty-state
// copy) once one is (ui-shell spec); skeleton rows while the active folder's
// index builds (indexing-loading-state). Components never import the vault —
// App supplies rows, and it supplies the shortcuts reference as a node too
// (apply-shortcuts-on-click), so the panel stays layout and knows nothing about
// what a key combination does. The shortcuts reference is content-only and
// renders in every state (move-help-to-right-panel).
export function MetaPanel({
  pageOpen,
  contents = [],
  backlinks,
  forwardlinks,
  activePath,
  boardOpen = false,
  boardReferrers = [],
  onSelect,
  onLocate = () => {},
  onOpenAsset,
  loading = false,
  shortcuts,
  collapsed = false,
}: {
  pageOpen: boolean
  /** The open page's headings, above Backlinks (add-page-contents). */
  contents?: ContentEntry[]
  backlinks: LinkRow[]
  /** The open page's outgoing references — its page references, then its files
   *  (assets and boards) — in one badged list (merge-forwardlinks-groups). */
  forwardlinks: LinkRow[]
  activePath: string | null
  /** A board is open (add-whiteboards): the panel shows the pages that
   *  reference it instead of the page-metadata sections. */
  boardOpen?: boolean
  /** The pages that reference the open board (add-whiteboards). */
  boardReferrers?: LinkRow[]
  onSelect: (path: string) => void
  /** Locate a heading's block on the open page (add-page-contents). View-only. */
  onLocate?: (block: number) => void
  /** Open a file or board row's target (vault-assets). Read by every list that
   *  carries a file row. */
  onOpenAsset: (path: string) => void
  /** The active folder's index is building (indexing-loading-state). */
  loading?: boolean
  /** The keyboard-shortcuts reference body (apply-shortcuts-on-click). */
  shortcuts: ReactNode
  /** The meta panel is folded away (add-collapsible-sidebars). The pane stays
   *  mounted so its section state survives, and `display: none` takes its box
   *  (and its descendants' focusability) out of the layout. */
  collapsed?: boolean
}) {
  // One placeholder line per section (indexing-loading-state): replaces the
  // placeholder copy at the same height (13px text, 1.5 line-height) so the
  // panel doesn't jump when the copy renders.
  const skeletonLine = <span className={`skeleton ${styles.skeletonLine}`} aria-hidden="true" />

  return (
    <aside
      id="meta-panel"
      className={collapsed ? `${styles.panel} ${styles.collapsed}` : styles.panel}
      aria-label="Page sidebar"
    >
      {boardOpen ? (
        // Board mode (add-whiteboards): the page-metadata sections have no
        // subject, so the panel shows the board's referrers instead — the
        // payoff of giving a board a reference token.
        <Accordion
          title="Referenced by"
          defaultOpen
          className={styles.section}
          bodyClassName={styles.fillBody}
        >
          {loading ? (
            skeletonLine
          ) : (
            <LinkList
              rows={boardReferrers}
              activePath={null}
              onSelect={onSelect}
              onOpenAsset={onOpenAsset}
              emptyCopy="No pages reference this board."
            />
          )}
        </Accordion>
      ) : (
        <>
          {/* Contents (add-page-contents): the page's own shape, above its
              links. It sizes to its list up to a cap, so a short outline never
              claims a share of the panel's height. */}
          <Accordion
            title="Contents"
            defaultOpen
            className={styles.contents}
            bodyClassName={styles.contentsBody}
          >
            {loading ? (
              skeletonLine
            ) : pageOpen ? (
              <ContentList entries={contents} onLocate={onLocate} />
            ) : (
              <p className="section-placeholder">Headings appear once a page is open.</p>
            )}
          </Accordion>
          {/* The link sections (bottom-align-collapsed-links): one group that
              takes the panel's remaining height and bottom-aligns its collapsed
              rows, so a collapsed Backlinks or Forwardlinks sits directly above
              the keyboard-shortcuts row rather than under Contents with a gap
              below it. */}
          <div className={styles.links}>
            <Accordion
              title="Backlinks"
              defaultOpen
              className={styles.section}
              bodyClassName={styles.fillBody}
            >
              {loading ? (
                skeletonLine
              ) : pageOpen ? (
                <LinkList
                  rows={backlinks}
                  activePath={activePath}
                  onSelect={onSelect}
                  onOpenAsset={onOpenAsset}
                  emptyCopy="Nothing links here yet."
                />
              ) : (
                <p className="section-placeholder">
                  Pages linking to this one appear once a page is open.
                </p>
              )}
            </Accordion>
            {/* Forwardlinks (add-page-contents, merge-forwardlinks-groups):
              every outgoing reference in one list — the pages it names, then
              the files it points at (assets, then boards), each row badged by
              kind. Collapsed by default, so the panel opens on the page's shape
              and what links here. */}
            <Accordion
              title="Forwardlinks"
              className={styles.section}
              bodyClassName={styles.fillBody}
            >
              {loading ? (
                skeletonLine
              ) : pageOpen ? (
                <LinkList
                  rows={forwardlinks}
                  activePath={activePath}
                  onSelect={onSelect}
                  onOpenAsset={onOpenAsset}
                  emptyCopy="This page links to nothing."
                />
              ) : (
                <p className="section-placeholder">
                  Links from this page appear once a page is open.
                </p>
              )}
            </Accordion>
          </div>
        </>
      )}
      {/* Keyboard-shortcuts reference (move-help-to-right-panel): the panel's
          last section. Its collapsed row is anchored to the panel's bottom
          edge (the `footer` class) so it stays reachable however long the link
          sections get. Opened, it expands in place — the reference itself never
          gets a scroll region or a height cap. It renders in every state, so it
          needs neither `pageOpen` nor `loading`. */}
      <Accordion title="Keyboard shortcuts" className={styles.footer}>
        {shortcuts}
      </Accordion>
    </aside>
  )
}
