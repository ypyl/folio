import type { ReactNode } from 'react'
import { Accordion } from './Accordion'
import styles from './MetaPanel.module.css'

// One link row in the meta panel. `path` is the target's vault-relative path;
// `materialized` is false when the target page has no file on disk yet — the
// row is dimmed but still navigable, opening a blank page that materializes on
// first save (static-navigation spec). What activating a row does belongs to
// the section holding it, not to the row: a page row navigates and an asset row
// (References, vault-assets) opens the file it names and leaves the app where
// it is.
export type LinkRow = {
  title: string
  path: string
  materialized: boolean
}

function LinkList({
  rows,
  activePath,
  onActivate,
  dim,
  emptyCopy,
}: {
  rows: LinkRow[]
  /** The open page's path, for the active-row marking; null when the section's
   *  rows are not pages (References), which no row can then mark. */
  activePath: string | null
  onActivate: (path: string) => void
  /** Whether an unmaterialized row is dimmed. Only a page row can be: an asset
   *  row exists by definition, because the row is built from the vault's own
   *  listing. */
  dim: boolean
  emptyCopy: string
}) {
  // Alphabetical, case-insensitive (design D5): page names and file names sort
  // by the label the reader is scanning.
  const sorted = [...rows].sort((a, b) => {
    const x = a.title.toLowerCase()
    const y = b.title.toLowerCase()
    return x < y ? -1 : x > y ? 1 : 0
  })
  if (sorted.length === 0) {
    return <p className="section-placeholder">{emptyCopy}</p>
  }
  return (
    <div className={styles.list}>
      {sorted.map((row) => {
        const isActive = activePath !== null && row.path === activePath
        const dimmed = dim && !row.materialized
        return (
          <button
            key={row.path}
            type="button"
            className={dimmed ? `${styles.row} ${styles.dimmed}` : styles.row}
            data-active={isActive || undefined}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => onActivate(row.path)}
          >
            <span className={styles.rowText}>{row.title}</span>
          </button>
        )
      })}
    </div>
  )
}

// The right meta panel: Backlinks, Forwardlinks, References, and the
// keyboard-shortcuts reference. Forwardlinks holds page rows; the page's files
// live in their own section (References), one kind per list. Placeholder copy
// while no page is open; real, navigable rows (or empty-state copy) once one is
// (ui-shell spec); skeleton rows while the active folder's index builds
// (indexing-loading-state). Components never import the vault — App supplies
// rows, and it supplies the shortcuts reference as a node too
// (apply-shortcuts-on-click), so the panel stays layout and knows nothing about
// what a key combination does. The shortcuts reference is content-only and
// renders in every state (move-help-to-right-panel).
export function MetaPanel({
  pageOpen,
  backlinks,
  forwardlinks,
  references,
  activePath,
  boardOpen = false,
  boardReferrers = [],
  onSelect,
  onOpenAsset,
  loading = false,
  shortcuts,
  collapsed = false,
}: {
  pageOpen: boolean
  backlinks: LinkRow[]
  forwardlinks: LinkRow[]
  /** The open page's files (vault-assets); its own section, collapsed by
   *  default, so no page row and asset row share a list. */
  references: LinkRow[]
  activePath: string | null
  /** A board is open (add-whiteboards): the panel shows the pages that
   *  reference it instead of the page-metadata sections. */
  boardOpen?: boolean
  /** The pages that reference the open board (add-whiteboards). */
  boardReferrers?: LinkRow[]
  onSelect: (path: string) => void
  /** Open an asset row's file (vault-assets). Read by References only, which
   *  is the one list that carries asset rows. */
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
              onActivate={onSelect}
              dim
              emptyCopy="No pages reference this board."
            />
          )}
        </Accordion>
      ) : (
        <>
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
                onActivate={onSelect}
                dim
                emptyCopy="Nothing links here yet."
              />
            ) : (
              <p className="section-placeholder">
                Pages linking to this one appear once a page is open.
              </p>
            )}
          </Accordion>
          <Accordion
            title="Forwardlinks"
            defaultOpen
            className={styles.section}
            bodyClassName={styles.fillBody}
          >
            {loading ? (
              skeletonLine
            ) : pageOpen ? (
              <LinkList
                rows={forwardlinks}
                activePath={activePath}
                onActivate={onSelect}
                dim
                emptyCopy="This page links to nothing."
              />
            ) : (
              <p className="section-placeholder">
                Links from this page appear once a page is open.
              </p>
            )}
          </Accordion>
          {/* References (vault-assets, board-references-in-panel): the open
          page's files — its assets and the boards it references — collapsed by
          default like the sidebar's Assets section, so the panel looks as it did
          before this section existed until the reader asks for it. Asset rows
          never dim (a row exists only for a file the vault holds); a board row
          for a board with no file yet dims but stays activatable. No row carries
          the open page's marking — activating one opens the file or the board. */}
          <Accordion title="References" className={styles.section} bodyClassName={styles.fillBody}>
            {loading ? (
              skeletonLine
            ) : pageOpen ? (
              <LinkList
                rows={references}
                activePath={null}
                onActivate={onOpenAsset}
                dim
                emptyCopy="No files on this page."
              />
            ) : (
              <p className="section-placeholder">
                Files this page points at appear once a page is open.
              </p>
            )}
          </Accordion>
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
