import { useMemo, useState, type ReactNode } from 'react'
import { buildContentTree, type ContentEntry, type ContentNode } from '../vault/contents'
import { Accordion } from './Accordion'
import styles from './MetaPanel.module.css'

// Stable empty inputs: a defaulted prop must not be a fresh array each render,
// so the Contents tree memo rebuilds only when the caller's rows change.
const EMPTY_CONTENTS: ContentEntry[] = []
const EMPTY_BLOCKS: ReadonlySet<number> = new Set()

// One link row in the meta panel. `path` is the target's vault-relative path;
// `kind` is what the row points at, which decides what activating it does: a
// page row navigates, a file row opens the file or board it names and leaves the
// app where it is. `badge` is what the row reads: a backlink page `in`, a
// forwardlink page `out`, an asset `a`, a board `b` (merge-link-sections).
// `materialized` is false when the target has no file on disk yet — a page or
// board row is dimmed but still activatable, opening a blank page or board that
// materializes on first save (static-navigation spec); an asset row is never
// dimmed, because it exists only for a file the vault holds.
export type LinkRow = {
  kind: 'page' | 'board' | 'asset'
  badge: 'in' | 'out' | 'a' | 'b'
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
            <span className={styles.badge} aria-hidden="true">
              {row.badge}
            </span>
            <span className={styles.rowText}>{row.title}</span>
          </button>
        )
      })}
    </div>
  )
}

// The Contents list (add-page-contents, add-contents-tree): the page's
// headings as a tree, one row per heading indented by level. A heading with a
// subtree carries a disclosure control that collapses or expands that subtree
// — a view operation that changes only what is shown — while activating the
// row's label locates the heading's block (never the other way around).
function ContentNodes({
  nodes,
  collapsed,
  onToggle,
  onLocate,
}: {
  nodes: ContentNode[]
  collapsed: ReadonlySet<number>
  onToggle: (block: number) => void
  onLocate: (block: number) => void
}) {
  return (
    <>
      {nodes.map((node) => {
        const isCollapsed = collapsed.has(node.block)
        const hasChildren = node.children.length > 0
        return (
          <div key={`${node.block}:${node.text}`}>
            <div
              className={styles.contentRow}
              // One indent step per level below the top heading, so nesting
              // changes which rows show, not how far they are indented.
              style={{ paddingLeft: 8 + (node.level - 1) * 12 }}
            >
              {hasChildren ? (
                <button
                  type="button"
                  className={styles.disclosure}
                  aria-expanded={!isCollapsed}
                  aria-label={`${isCollapsed ? 'Expand' : 'Collapse'} ${node.text}`}
                  onClick={() => onToggle(node.block)}
                />
              ) : (
                <span className={styles.disclosureSpacer} aria-hidden="true" />
              )}
              <button type="button" className={styles.row} onClick={() => onLocate(node.block)}>
                <span className={styles.rowText}>{node.text}</span>
              </button>
            </div>
            {hasChildren && !isCollapsed && (
              <div className={styles.contentChildren}>
                <ContentNodes
                  nodes={node.children}
                  collapsed={collapsed}
                  onToggle={onToggle}
                  onLocate={onLocate}
                />
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

function ContentList({
  tree,
  collapsed,
  onToggle,
  onLocate,
}: {
  tree: ContentNode[]
  collapsed: ReadonlySet<number>
  onToggle: (block: number) => void
  onLocate: (block: number) => void
}) {
  if (tree.length === 0) {
    return <p className="section-placeholder">No headings on this page.</p>
  }
  return (
    <div className={styles.list}>
      <ContentNodes nodes={tree} collapsed={collapsed} onToggle={onToggle} onLocate={onLocate} />
    </div>
  )
}

// The right meta panel: Contents, Links, and the keyboard-shortcuts reference
// (add-page-contents, merge-link-sections). Contents lists the open page's
// headings (page-contents capability); Links holds the open page's links in one
// list — the pages that reference it, then the pages it references, then its
// files (assets then boards) — each row badged by direction or kind. While a
// board is open the panel shows the board's Referenced by rows instead.
// Placeholder copy while no page is open; real, navigable rows (or empty-state
// copy) once one is (ui-shell spec); skeleton rows while the active folder's
// index builds (indexing-loading-state). Components never import the vault —
// App supplies rows, and it supplies the shortcuts reference as a node too
// (apply-shortcuts-on-click), so the panel stays layout and knows nothing about
// what a key combination does. The shortcuts reference is content-only and
// renders in every state (move-help-to-right-panel).
export function MetaPanel({
  pageOpen,
  contents = EMPTY_CONTENTS,
  links,
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
  /** The open page's links in one list: the pages that reference it (`in`), the
   *  pages it references (`out`), then its files (assets `a`, boards `b`). App
   *  orders and memoizes it (merge-link-sections). */
  links: LinkRow[]
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

  // The heading tree (add-contents-tree), built from the rows App memoizes on
  // the saved content, so it is built once per save and never per keystroke.
  const tree = useMemo(() => buildContentTree(contents), [contents])

  // Collapse state is session-scoped and per open page (design D2): a `block`
  // index set that resets when a different page opens. Adjust-during-render,
  // so the reset lands before the new page's rows are shown; the guard keeps
  // the previous page's set from applying to the new page's rows meanwhile.
  const [collapse, setCollapse] = useState<{ path: string | null; blocks: ReadonlySet<number> }>(
    () => ({ path: activePath, blocks: EMPTY_BLOCKS }),
  )
  if (collapse.path !== activePath) {
    setCollapse({ path: activePath, blocks: EMPTY_BLOCKS })
  }
  const collapsedBlocks = collapse.path === activePath ? collapse.blocks : EMPTY_BLOCKS
  const toggleSubtree = (block: number) => {
    setCollapse((prev) => {
      const blocks = new Set(prev.blocks)
      if (blocks.has(block)) blocks.delete(block)
      else blocks.add(block)
      return { path: prev.path, blocks }
    })
  }

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
              <ContentList
                tree={tree}
                collapsed={collapsedBlocks}
                onToggle={toggleSubtree}
                onLocate={onLocate}
              />
            ) : (
              <p className="section-placeholder">Headings appear once a page is open.</p>
            )}
          </Accordion>
          {/* The Links section (merge-link-sections): the page's incoming and
              outgoing links in one list, badged by direction or file kind. Open
              by default, and it takes the panel's remaining height. */}
          <div className={styles.links}>
            <Accordion
              title="Links"
              defaultOpen
              className={styles.section}
              bodyClassName={styles.fillBody}
            >
              {loading ? (
                skeletonLine
              ) : pageOpen ? (
                <LinkList
                  rows={links}
                  activePath={activePath}
                  onSelect={onSelect}
                  onOpenAsset={onOpenAsset}
                  emptyCopy="No links yet."
                />
              ) : (
                <p className="section-placeholder">Links appear once a page is open.</p>
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
