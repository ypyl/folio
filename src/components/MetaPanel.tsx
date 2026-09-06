import { Accordion } from './Accordion'
import styles from './MetaPanel.module.css'

// One link row in the meta panel (links-pane). `path` is the target's
// vault-relative path; `materialized` is false when the target has no file on
// disk yet — the row is dimmed but still navigable, opening a blank page that
// materializes on first save (static-navigation spec).
export type LinkRow = {
  title: string
  path: string
  materialized: boolean
}

function LinkList({
  rows,
  activePath,
  onSelect,
  emptyCopy,
}: {
  rows: LinkRow[]
  activePath: string | null
  onSelect: (path: string) => void
  emptyCopy: string
}) {
  // Alphabetical, case-insensitive (design D5).
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
      {sorted.map((row) => (
        <button
          key={row.path}
          type="button"
          className={row.materialized ? styles.row : `${styles.row} ${styles.dimmed}`}
          data-active={row.path === activePath || undefined}
          aria-current={row.path === activePath ? 'page' : undefined}
          onClick={() => onSelect(row.path)}
        >
          <span className={styles.rowText}>{row.title}</span>
        </button>
      ))}
    </div>
  )
}

// The right meta panel: Backlinks and Forwardlinks. Placeholder copy while no
// page is open; real, navigable rows (or empty-state copy) once one is
// (ui-shell spec). Components never import the vault — App supplies rows.
export function MetaPanel({
  pageOpen,
  backlinks,
  forwardlinks,
  activePath,
  onSelect,
}: {
  pageOpen: boolean
  backlinks: LinkRow[]
  forwardlinks: LinkRow[]
  activePath: string | null
  onSelect: (path: string) => void
}) {
  return (
    <aside className={styles.panel} aria-label="Page links">
      <Accordion title="Backlinks" defaultOpen>
        {pageOpen ? (
          <LinkList
            rows={backlinks}
            activePath={activePath}
            onSelect={onSelect}
            emptyCopy="Nothing links here yet."
          />
        ) : (
          <p className="section-placeholder">
            Pages linking to this one appear once a page is open.
          </p>
        )}
      </Accordion>
      <Accordion title="Forwardlinks" defaultOpen>
        {pageOpen ? (
          <LinkList
            rows={forwardlinks}
            activePath={activePath}
            onSelect={onSelect}
            emptyCopy="This page links to nothing."
          />
        ) : (
          <p className="section-placeholder">
            Links from this page appear once a page is open.
          </p>
        )}
      </Accordion>
    </aside>
  )
}