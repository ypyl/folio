import { useMemo } from 'react'
import { snippetSegments, type SearchResult } from '../search/core'
import { rowLabel } from './months'
import styles from './MatchBody.module.css'

/** The inside of a search-result row, shared by both search surfaces: the label,
 *  then a snippet for every place the query occurs, up to `limit` of them, then
 *  a note counting the rest. Only the type scale and the snippet budget differ
 *  between the surfaces, so `compact` and `limit` are the two knobs. The
 *  surrounding button stays with the surface: its class, role, and click
 *  behavior are not shared. */
export function MatchBody({
  result,
  compact = false,
  limit,
}: {
  result: SearchResult
  compact?: boolean
  /** How many snippets the row shows; the rest become a `+N more` note. The
   *  dropdown passes 2, the results view 5 (show-every-match-per-result). */
  limit: number
}) {
  // Memoized on the result's own identity fields: the list re-renders on every
  // active-row move, and a move changes neither the text nor the ranges, so the
  // walk is not repeated (AGENTS.md: hooks short-circuit on reference equality).
  const windows = useMemo(
    () => snippetSegments(result.text, result.ranges),
    [result.text, result.ranges],
  )
  const shown = windows.slice(0, limit)
  // The note counts occurrences, not windows: it answers "how often does the
  // page say it", which is the question the row is being read for.
  const more = windows.slice(limit).reduce((n, window) => n + window.hits, 0)
  return (
    <>
      <span className={`${styles.label}${compact ? ` ${styles.labelCompact}` : ''}`}>
        {rowLabel(result)}
      </span>
      {/* A snippet needs text to quote: an asset has none, and always carries a
          title. Gating on the text (rather than on whether segments exist) also
          keeps an empty document from rendering one empty segment. */}
      {result.text !== '' && (
        <span className={`${styles.snip}${compact ? ` ${styles.snipCompact}` : ''}`}>
          {shown.map((window, i) => (
            <span key={i} className={styles.window}>
              {window.segments.map((s, j) =>
                s.hit ? (
                  <mark key={j} className={styles.hit}>
                    {s.text}
                  </mark>
                ) : (
                  <span key={j}>{s.text}</span>
                ),
              )}
            </span>
          ))}
          {more > 0 && <span className={styles.more}>{`+${more} more on this page`}</span>}
        </span>
      )}
    </>
  )
}
