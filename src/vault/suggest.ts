// The reference-completion candidate pool and its ranking
// (add-reference-autocomplete, design D2). Pure: no IO, no DOM, no editor. The
// pool is the index's own resolution map, so the picker cannot offer a name the
// app would resolve differently, and it is rebuilt only when the graph changes.

import { assetName, boardStem, isPagePath, orderPages, type Graph, type IndexPage } from './index'
import { isImagePath } from './link'
import { isReferenceable } from './parse'

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

/** The pool row for either kind of completion: the label to show and insert, the
 *  vault path it stands for, and what the matcher needs, precomputed once per
 *  graph change so a query neither allocates per candidate nor scans each name
 *  character by character: the lowercased name, and the offset of every word
 *  start in it (the second matching tier). `image` is carried only by file rows,
 *  where the image-destination narrowing reads it. */
export type PageCandidate = PageName & { lower: string; starts: number[]; image?: boolean }

/** A file row: the same matcher columns, plus whether the path is an image. */
export type FileCandidate = PageCandidate & { image: boolean }

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
    if (!isReferenceable(page.title)) continue
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
 * The destination picker's candidate pool (add-asset-references, design D4):
 * every vault path that is not a page, one row per file, labelled by its path
 * inside `assets/` — the label the sidebar and the References section already
 * use. That set is exactly the paths a page's asset reference can name, so the
 * picker can only offer a reference the index would report (vault-index).
 * Built once per graph, never per keystroke.
 */
export function fileCandidates(graph: Graph): FileCandidate[] {
  const rows: FileCandidate[] = []
  for (const path of [...graph.files].sort()) {
    if (isPagePath(path)) continue
    const name = assetName(path)
    const lower = name.toLowerCase()
    rows.push({ name, path, lower, starts: wordStarts(lower), image: isImagePath(path) })
  }
  return rows
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
  return rank(query, pool, limit, false)
}

/**
 * Rank the vault's files for a destination being typed. `onlyImages` is the
 * narrowing the typed syntax asks for: an image's destination can only be
 * filled by a file the browser renders as an image, so a PDF is never offered
 * for `![](`, and an image node over a PDF is impossible. A boolean read per
 * visited row: no allocation, no second pass.
 */
export function suggestFiles(
  query: string,
  pool: FileCandidate[],
  onlyImages: boolean,
  limit = SUGGESTION_LIMIT,
): Suggestion[] {
  return rank(query, pool, limit, onlyImages)
}

/**
 * The board picker's candidate pool (add-whiteboards, design D2): one row per
 * resolvable board name, labelled — and inserted — by its filename stem, the
 * text a `#!` token carries. Built once per graph, never per keystroke.
 */
export function boardCandidates(graph: Graph): PageCandidate[] {
  const rows: PageCandidate[] = []
  for (const path of graph.boardsByName.values()) {
    const name = boardStem(path)
    const lower = name.toLowerCase()
    rows.push({ name, path, lower, starts: wordStarts(lower) })
  }
  return rows
}

/** Rank the vault's boards for a `#!` reference being typed. */
export function suggestBoards(
  query: string,
  pool: PageCandidate[],
  limit = SUGGESTION_LIMIT,
): Suggestion[] {
  return rank(query, pool, limit, false)
}

function rank(
  query: string,
  pool: PageCandidate[],
  limit: number,
  onlyImages: boolean,
): Suggestion[] {
  if (query === '') return []
  const q = query.toLowerCase()
  const prefix: Suggestion[] = []
  const word: Suggestion[] = []
  for (const row of pool) {
    if (onlyImages && row.image !== true) continue
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
