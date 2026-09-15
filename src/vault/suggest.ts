// The reference-completion candidate pool and its ranking
// (add-reference-autocomplete, design D2). Pure: no IO, no DOM, no editor. The
// pool is the index's own resolution map, so the picker cannot offer a name the
// app would resolve differently, and it is rebuilt only when the graph changes.

import { orderPages, type Graph, type IndexPage } from './index'
import { findReferenceRanges, referenceToken } from './parse'

/** Per-keystroke launcher cap: the popup is a bounded aid, not a page list. */
export const SUGGESTION_LIMIT = 8

/** A page the picker can offer: the name to insert, and where it resolves. */
type PageName = {
  name: string
  path: string
}

/** A ranked row: the page, plus the matched span of its name to highlight. */
export type Suggestion = PageName & {
  match: [start: number, end: number]
}

/** A pool row: the seam's PageName plus what the matcher needs, precomputed once
 *  per graph change so a query neither allocates per candidate nor scans each
 *  name character by character: the lowercased name, and the offset of every
 *  word start in it (the second matching tier). */
export type PageCandidate = PageName & { lower: string; starts: number[] }

/**
 * Offsets of the words' first characters in `lower`, for the second matching
 * tier. Boundaries are space, `-`, and `_`; the `-` is what lets a query like
 * `09` reach the journal day `2026-09-10`. Computed once per pool build, never
 * per keystroke.
 */
export function wordStarts(lower: string): number[] {
  const starts: number[] = []
  for (let i = 0; i < lower.length; i++) {
    const ch = lower[i]
    if (ch === ' ' || ch === '-' || ch === '_') starts.push(i + 1)
  }
  return starts
}

/**
 * The picker's candidate pool: exactly the names the index can resolve (one row
 * per name, case collisions already resolved by `byName`'s first-by-path rule),
 * in the app's page order (pinned first, then last edited). Names that no
 * reference token can express are dropped, so every row is insertable as well
 * as resolvable (design D2).
 */
export function candidateNames(graph: Graph, pins: string[]): PageCandidate[] {
  const pages: IndexPage[] = []
  for (const path of graph.byName.values()) {
    const page = graph.pages.get(path)
    if (page) pages.push(page)
  }
  const rows: PageCandidate[] = []
  for (const page of orderPages(pages, pins)) {
    if (!insertable(page.title)) continue
    const lower = page.title.toLowerCase()
    rows.push({
      name: page.title,
      path: page.path,
      lower,
      starts: wordStarts(lower),
    })
  }
  return rows
}

/**
 * A name is offerable only when the token we would insert reads back as that
 * exact name. Names containing `]` have no token form at all, and surrounding
 * whitespace is trimmed by reference parsing, so both would resolve to
 * something else. Asking the canonical tokenizer keeps this honest (design D3).
 */
function insertable(name: string): boolean {
  return findReferenceRanges(referenceToken(name, 'word'))[0]?.target === name
}

/**
 * Rank `pool` for `query`, best first: names starting with the query, then
 * names one of whose words starts with it. Within a tier the pool's order is
 * preserved, so pins lead and recently edited pages follow, and tier 0 can
 * never be displaced by tier 1. Matching is case-insensitive; the rows carry the
 * name as it exists on disk. Each bucket stops accumulating at `limit` rows
 * while the scan still visits the whole pool.
 */
export function suggestPages(
  query: string,
  pool: PageCandidate[],
  limit = SUGGESTION_LIMIT,
): Suggestion[] {
  if (query === '') return []
  const q = query.toLowerCase()
  const prefix: Suggestion[] = []
  const word: Suggestion[] = []
  for (const row of pool) {
    const start = matchStart(row, q)
    if (start === null) continue
    const bucket = start === 0 ? prefix : word
    if (bucket.length >= limit) continue
    bucket.push({ name: row.name, path: row.path, match: [start, start + q.length] })
  }
  return [...prefix, ...word].slice(0, limit)
}

/**
 * Where `query` matches in a pool row, or null. `0` is the prefix tier; a word
 * start is the second tier. There is no substring tier: every row is a forward
 * completion of the typed text, which is also why the match offset is returned
 * rather than re-derived by the caller (`indexOf` disagrees with word-start
 * matching, e.g. `read` in `bread read`).
 *
 * The separator offsets arrive precomputed because this loop runs once per pool
 * row on every keystroke that has the popup open; the leading character
 * comparison is there for the same reason, since it is what fails for almost
 * every row.
 */
function matchStart(row: PageCandidate, query: string): number | null {
  const { lower, starts } = row
  if (lower.startsWith(query)) return 0
  const first = query[0]
  for (const at of starts) {
    if (lower[at] === first && lower.startsWith(query, at)) return at
  }
  return null
}
