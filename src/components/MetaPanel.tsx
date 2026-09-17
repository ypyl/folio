import type { ReactNode } from 'react'
import { Accordion } from './Accordion'
import styles from './MetaPanel.module.css'

// One link row in the meta panel (links-pane). `path` is the target's
// vault-relative path; `materialized` is false when the target has no file on
// disk yet — the row is dimmed but still navigable, opening a blank page that
// materializes on first save (static-navigation spec). `kind` decides what
// activating the row does: a page row navigates, and an asset row (vault-assets)
// opens the file it names and leaves the app where it is.
export type LinkRow = {
  title: string
  path: string
  materialized: boolean
  /** Defaults to a page row, which is all the backlinks list can hold. */
  kind?: 'page' | 'asset'
}

function LinkList({
  rows,
  activePath,
  onSelect,
  onOpenAsset,
  emptyCopy,
}: {
  rows: LinkRow[]
  activePath: string | null
  onSelect: (path: string) => void
  onOpenAsset: (path: string) => void
  emptyCopy: string
}) {
  // Alphabetical, case-insensitive (design D5): page names and file names sort
  // together, since a row's label is what the reader is scanning.
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
        const isAsset = row.kind === 'asset'
        // Only a page row can be dimmed: an asset row exists by definition,
        // because the row is built from the vault's own listing.
        const dimmed = !isAsset && !row.materialized
        return (
          <button
            key={row.path}
            type="button"
            className={dimmed ? `${styles.row} ${styles.dimmed}` : styles.row}
            data-active={!isAsset && row.path === activePath ? true : undefined}
            aria-current={!isAsset && row.path === activePath ? 'page' : undefined}
            onClick={() => (isAsset ? onOpenAsset(row.path) : onSelect(row.path))}
          >
            <span className={styles.rowText}>{row.title}</span>
          </button>
        )
      })}
    </div>
  )
}

// The right meta panel: Backlinks, Forwardlinks, and the keyboard-shortcuts
// reference. Placeholder copy while no page is open; real, navigable rows (or
// empty-state copy) once one is (ui-shell spec); skeleton rows while the
// active folder's index builds (indexing-loading-state). Components never
// import the vault — App supplies rows, and it supplies the shortcuts reference
// as a node too (apply-shortcuts-on-click), so the panel stays layout and knows
// nothing about what a key combination does. The shortcuts reference is
// content-only and renders in every state (move-help-to-right-panel).
export function MetaPanel({
  pageOpen,
  backlinks,
  forwardlinks,
  activePath,
  onSelect,
  onOpenAsset,
  loading = false,
  shortcuts,
}: {
  pageOpen: boolean
  backlinks: LinkRow[]
  forwardlinks: LinkRow[]
  activePath: string | null
  onSelect: (path: string) => void
  /** Open an asset row's file (vault-assets). Read by Forwardlinks only, which
   *  is the one list that carries asset rows. */
  onOpenAsset: (path: string) => void
  /** The active folder's index is building (indexing-loading-state). */
  loading?: boolean
  /** The keyboard-shortcuts reference body (apply-shortcuts-on-click). */
  shortcuts: ReactNode
}) {
  // One placeholder line per section (indexing-loading-state): replaces the
  // placeholder copy at the same height (13px text, 1.5 line-height) so the
  // panel doesn't jump when the copy renders.
  const skeletonLine = <span className={`skeleton ${styles.skeletonLine}`} aria-hidden="true" />

  return (
    <aside className={styles.panel} aria-label="Page sidebar">
      <Accordion title="Backlinks" defaultOpen>
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
      <Accordion title="Forwardlinks" defaultOpen>
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
          <p className="section-placeholder">Links from this page appear once a page is open.</p>
        )}
      </Accordion>
      {/* Keyboard-shortcuts reference (move-help-to-right-panel): the panel's
          last section. Its collapsed row is anchored to the panel's bottom
          edge (the `footer` class) so it stays reachable however long the
          link sections get. Opened, it expands in place — the panel keeps
          scrolling as a single region. It renders in every state, so it needs
          neither `pageOpen` nor `loading`. */}
      <Accordion title="Keyboard shortcuts" className={styles.footer}>
        {shortcuts}
      </Accordion>
    </aside>
  )
}
