import { useEffect, useMemo, useRef, useState } from 'react'
import { firstMatchLine, snippetSegments, type SearchResult } from '../search/core'
import { journalLabel } from './months'
import styles from './SearchResultsView.module.css'

/** Match-list page size (search-results-view): bounded DOM per page instead
 *  of virtualization; short match sets get a single page and no pager. */
export const RESULTS_PER_PAGE = 50

function rowLabel(r: SearchResult): string {
  return r.kind === 'journal' ? journalLabel(r.path) : r.title
}

// The full, uncapped match list in the main pane (search-results-view):
// Pages then Journal groups with sticky headers, match snippets, and a
// numbered pager. Transient UI — opening, paging, and closing never touch
// the vault; App owns the query and supplies the results.
export function SearchResultsView({
  query,
  results,
  onOpen,
  onClose,
}: {
  query: string
  results: SearchResult[]
  onOpen: (path: string) => void
  /** Escape or the Back affordance: return to the previously open page. */
  onClose: () => void
}) {
  const [page, setPage] = useState(0)
  const [active, setActive] = useState(-1)
  const rootRef = useRef<HTMLElement>(null)

  // Focus the pane on open so the keyboard controls it immediately (the
  // see-all click unmounts the button that held focus).
  useEffect(() => {
    rootRef.current?.focus()
  }, [])

  // Pages then journal days, each keeping its relevance order (spec: same
  // grouping as the dropdown, no cap).
  const flat = useMemo(
    () => [
      ...results
        .filter((r) => r.kind === 'page')
        .map((item) => ({ item, group: 'pages' as const })),
      ...results
        .filter((r) => r.kind === 'journal')
        .map((item) => ({ item, group: 'journal' as const })),
    ],
    [results],
  )
  const total = flat.length
  const pageCount = Math.max(1, Math.ceil(total / RESULTS_PER_PAGE))
  const current = Math.min(page, pageCount - 1)
  const from = current * RESULTS_PER_PAGE
  const slice = flat.slice(from, from + RESULTS_PER_PAGE)
  // A group header renders where a group begins on the current page; the
  // headers stick to the pane's top while rows scroll under them.
  const rows = slice.map((entry, i) => ({
    ...entry,
    header: i === 0 || slice[i - 1].group !== entry.group,
  }))

  const onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key === 'Escape') {
      onClose()
      return
    }
    if (!slice.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (i + 1) % slice.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (i - 1 + slice.length) % slice.length)
    } else if (e.key === 'Enter') {
      const idx = active >= 0 ? active : 0
      onOpen(slice[idx].item.path)
    }
  }

  if (total === 0) {
    // Unreachable from the see-all row (it needs matches); defensive rest
    // state in case App ever renders the view empty.
    return (
      <main ref={rootRef} tabIndex={-1} className={styles.pane} onKeyDown={onKeyDown}>
        <p className={styles.empty}>{`No matches for \u201C${query.trim()}\u201D.`}</p>
      </main>
    )
  }

  return (
    <main
      ref={rootRef}
      tabIndex={-1}
      aria-label="Search results"
      className={styles.pane}
      onKeyDown={onKeyDown}
    >
      <div className={styles.summary}>
        <span className={styles.query}>{query.trim()}</span>
        <span className={styles.counts}>
          {`${total} ${total === 1 ? 'match' : 'matches'}`}
          {pageCount > 1
            ? ` \u00B7 showing ${from + 1}\u2013${Math.min(from + RESULTS_PER_PAGE, total)}`
            : ''}
        </span>
        <button type="button" className={`btn-secondary ${styles.back}`} onClick={onClose}>
          Back to notes
        </button>
      </div>
      {rows.map(({ item, group, header }, i) => {
        const segments = snippetSegments(item.text, item.ranges)
        const line = firstMatchLine(item.text, item.ranges)
        return (
          <div key={item.path}>
            {header && (
              <div className={styles.groupHead}>{group === 'pages' ? 'Pages' : 'Journal'}</div>
            )}
            <button
              type="button"
              className={`${styles.row}${i === active ? ` ${styles.active}` : ''}`}
              onClick={() => onOpen(item.path)}
              onMouseEnter={() => setActive(i)}
            >
              <span className={styles.label}>
                {rowLabel(item)}
                {line !== null && <span className={styles.line}>{` \u00B7 line ${line}`}</span>}
              </span>
              {segments.length > 0 && (
                <span className={styles.snip}>
                  {segments.map((s, j) =>
                    s.hit ? (
                      <mark key={j} className={styles.hit}>
                        {s.text}
                      </mark>
                    ) : (
                      <span key={j}>{s.text}</span>
                    ),
                  )}
                </span>
              )}
            </button>
          </div>
        )
      })}
      {pageCount > 1 && (
        <div className={styles.pager}>
          <button
            type="button"
            className={styles.pageBtn}
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            {'\u2039'} Prev
          </button>
          {Array.from({ length: pageCount }, (_, n) => (
            <button
              key={n}
              type="button"
              className={`${styles.pageBtn}${n === current ? ` ${styles.current}` : ''}`}
              aria-current={n === current ? 'page' : undefined}
              onClick={() => setPage(n)}
            >
              {n + 1}
            </button>
          ))}
          <button
            type="button"
            className={styles.pageBtn}
            disabled={current === pageCount - 1}
            onClick={() => setPage(current + 1)}
          >
            Next {'\u203A'}
          </button>
        </div>
      )}
    </main>
  )
}
