import { firstMatchLine, snippetSegments, type SearchResult } from '../search/core'
import { rowLabel } from './months'
import styles from './MatchBody.module.css'

/** The inside of a search-result row, shared by both search surfaces: the label
 *  with its match line, then the snippet with highlighted hits. Only the type
 *  scale differs between the dropdown and the full view, so `compact` picks the
 *  dropdown's smaller one. The surrounding button stays with the surface: its
 *  class, role, and click behavior are not shared. */
export function MatchBody({
  result,
  compact = false,
}: {
  result: SearchResult
  compact?: boolean
}) {
  const segments = snippetSegments(result.text, result.ranges)
  const line = firstMatchLine(result.text, result.ranges)
  return (
    <>
      <span className={`${styles.label}${compact ? ` ${styles.labelCompact}` : ''}`}>
        {rowLabel(result)}
        {line !== null && <span className={styles.line}>{` \u00B7 line ${line}`}</span>}
      </span>
      {segments.length > 0 && (
        <span className={`${styles.snip}${compact ? ` ${styles.snipCompact}` : ''}`}>
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
    </>
  )
}
