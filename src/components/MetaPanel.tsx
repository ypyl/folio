import { useId, useMemo, useState, type ReactNode } from 'react'
import { buildContentTree, type ContentEntry, type ContentNode } from '../vault/contents'
import type { ReminderRow } from '../rows'
import type { Recurrence } from '../vault/reminders'
import { Accordion } from './Accordion'
import { RowContextMenu } from './RowContextMenu'
import styles from './MetaPanel.module.css'

// Stable empty inputs: a defaulted prop must not be a fresh array each render,
// so the Contents tree memo rebuilds only when the caller's rows change.
const EMPTY_CONTENTS: ContentEntry[] = []
const EMPTY_BLOCKS: ReadonlySet<number> = new Set()
// Stable empty inputs for the reminders section, for the same reason.
const EMPTY_REMINDERS: ReminderRow[] = []
const EMPTY_CANDIDATES: string[] = []

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

// The right meta panel: Reminders (journal days only), Contents, Links, and the
// keyboard-shortcuts reference (add-page-contents, merge-link-sections,
// add-reminders). Reminders lists the open journal day's scheduled reminders,
// taken or pending, and offers the control that sets one. Contents lists the
// open page's headings (page-contents capability); Links holds the open page's
// links in one list — the pages that reference it, then the pages it references,
// then its files (assets then boards) — each row badged by direction or kind.
// While a board is open the panel shows the board's Referenced by rows instead.
// Placeholder copy while no page is open; real, navigable rows (or empty-state
// copy) once one is (ui-shell spec); skeleton rows while the active folder's
// index builds (indexing-loading-state). Components never import the vault —
// App supplies rows, and it supplies the shortcuts reference as a node too
// (apply-shortcuts-on-click), so the panel stays layout and knows nothing about
// what a key combination does. The shortcuts reference is content-only and
// renders in every state (move-help-to-right-panel).

/** The recurrences the reminder form offers, in daily-use order (add-reminders,
 *  design D6). The value is the rule's own token. */
const RECURRENCE_OPTIONS: { value: Recurrence; label: string }[] = [
  { value: 'yearly', label: 'Every year' },
  { value: 'monthly', label: 'Every month' },
  { value: 'weekly', label: 'Every week' },
  { value: 'daily', label: 'Every day' },
  { value: 'once', label: 'Once' },
]

// The open journal day's reminders (add-reminders, design D5/D6/D10): the day's
// reminder rows and the control that sets one. A pending row records the
// reminder on the day; a recorded row opens its page. A row's menu removes the
// reminder's rule, never the written line (ADR-0031).
function RemindersBody({
  rows,
  candidates,
  onSelect,
  onRecord,
  onAdd,
  onRemove,
}: {
  rows: ReminderRow[]
  /** Page names the form's field offers, the reference candidate pool. */
  candidates: string[]
  onSelect: (path: string) => void
  onRecord: (row: ReminderRow) => void
  onAdd: (target: string, recurrence: Recurrence) => void
  onRemove: (target: string) => void
}) {
  const [target, setTarget] = useState('')
  const [recurrence, setRecurrence] = useState<Recurrence>('yearly')
  const [menu, setMenu] = useState<{
    x: number
    y: number
    target: string
    row: HTMLElement
  } | null>(null)
  const listId = useId()
  const name = target.trim()

  return (
    <>
      {rows.length === 0 ? (
        <p className="section-placeholder">No reminders for this day.</p>
      ) : (
        <div className={styles.list}>
          {rows.map((row) => (
            <button
              key={row.path}
              type="button"
              className={styles.row}
              aria-label={row.pending ? `Add ${row.title} to this day` : `Open ${row.title}`}
              onClick={() => (row.pending ? onRecord(row) : onSelect(row.path))}
              onContextMenu={(e) => {
                e.preventDefault()
                setMenu({ x: e.clientX, y: e.clientY, target: row.target, row: e.currentTarget })
              }}
            >
              <span className={styles.badge} aria-hidden="true">
                {row.pending ? 'due' : 'ok'}
              </span>
              <span className={styles.rowText}>{row.title}</span>
            </button>
          ))}
        </div>
      )}
      <form
        className={styles.reminderForm}
        onSubmit={(e) => {
          e.preventDefault()
          if (name === '') return
          onAdd(name, recurrence)
          setTarget('')
        }}
      >
        <input
          className={styles.reminderInput}
          type="text"
          list={listId}
          value={target}
          placeholder="Page to remind about"
          aria-label="Reminder page"
          onChange={(e) => setTarget(e.target.value)}
        />
        <datalist id={listId}>
          {candidates.map((candidate) => (
            // Presentational: the list is the field's own completion pool, not
            // a widget of its own, so it must not add `option` roles beside the
            // search dropdown's (design D6).
            <option key={candidate} value={candidate} role="presentation" />
          ))}
        </datalist>
        <div className={styles.reminderActions}>
          <select
            className={styles.reminderSelect}
            aria-label="Repeat"
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value as Recurrence)}
          >
            {RECURRENCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button type="submit" className={styles.reminderAdd} disabled={name === ''}>
            Add
          </button>
        </div>
      </form>
      {menu !== null && (
        <RowContextMenu
          x={menu.x}
          y={menu.y}
          items={[{ label: 'Remove reminder', onSelect: () => onRemove(menu.target) }]}
          restoreFocusTo={menu.row}
          onClose={() => setMenu(null)}
        />
      )}
    </>
  )
}
export function MetaPanel({
  pageOpen,
  contents = EMPTY_CONTENTS,
  links,
  activePath,
  journalDay = null,
  reminders = EMPTY_REMINDERS,
  reminderCandidates = EMPTY_CANDIDATES,
  onRecordReminder = () => {},
  onAddReminder = () => {},
  onRemoveReminder = () => {},
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
  /** The open journal day's date, or null when the open page is not a journal
   *  day (add-reminders). Never null makes the Reminders section absent. */
  journalDay?: string | null
  /** The open journal day's reminder rows (add-reminders). */
  reminders?: ReminderRow[]
  /** Page names the reminder form offers (add-reminders). */
  reminderCandidates?: string[]
  /** Record a pending reminder on the open day (add-reminders). */
  onRecordReminder?: (row: ReminderRow) => void
  /** Set a reminder for `target` with `recurrence`, anchored on the open day. */
  onAddReminder?: (target: string, recurrence: Recurrence) => void
  /** Remove the reminder rule for `target` (add-reminders). */
  onRemoveReminder?: (target: string) => void
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
          {/* Reminders (add-reminders): the open journal day's schedule, above
              its own shape and links. It sizes to its rows up to a cap, like
              Contents, and is absent on a page that is not a journal day. */}
          {journalDay !== null && (
            <Accordion
              title="Reminders"
              defaultOpen
              className={styles.reminders}
              bodyClassName={styles.remindersBody}
            >
              {loading ? (
                skeletonLine
              ) : (
                <RemindersBody
                  rows={reminders}
                  candidates={reminderCandidates}
                  onSelect={onSelect}
                  onRecord={onRecordReminder}
                  onAdd={onAddReminder}
                  onRemove={onRemoveReminder}
                />
              )}
            </Accordion>
          )}
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
