// Pure search math over the live index (search-notes): the Fuse config and
// AND-term model copied from openspec-viewer's production search, unit-tested
// without the DOM. Docs are pages with title weighted over content; results
// carry exact-match ranges for snippet highlighting.

import type Fuse from 'fuse.js'
import { type IFuseOptions } from 'fuse.js'
import { assetName, boardName } from '../vault/index'
import { blockStartLines } from '../lineAnchors'

/** What a result can name (search-assets-by-name, add-whiteboards): a page, a
 *  journal day, a board under `boards/`, or a file under `assets/`. The
 *  surfaces group by this, so a new kind earns its own header and its own
 *  per-group cap without either surface knowing about it. */
export type SearchKind = 'page' | 'journal' | 'board' | 'asset'

export type SearchDoc = {
  path: string
  title: string
  kind: SearchKind
  text: string
}

/** One search document for a vault file (search-assets-by-name, design D1): the
 *  label is the rule the sidebar already uses, and `text` is empty because the
 *  app never reads a file's bytes (ADR-0022). The search layer's title-only path
 *  already handles empty text — no ranges, no line, no snippet — so an asset
 *  needs no branch of its own. */
export function assetSearchDoc(path: string): SearchDoc {
  return { path, title: assetName(path), kind: 'asset', text: '' }
}

/** One search document for a board (add-whiteboards, design D9): the label is
 *  the path inside `boards/`, the rule the sidebar uses, and `text` is empty
 *  because the app never reads a board's scene for search. Title-only, exactly
 *  like an asset. */
export function boardSearchDoc(path: string): SearchDoc {
  return { path, title: boardName(path), kind: 'board', text: '' }
}

/** Per-group launcher cap (search-results-view): the dropdown stays a bounded
 *  launcher; matches beyond the slice remain reachable through the see-all
 *  row and the full results view. */
export const PER_GROUP = 20

// Strict threshold: a term must be a near-exact match (still typo-tolerant,
// but a loose substring alignment no longer counts). ignoreLocation lets a
// term match anywhere in a field, not just near its start.
export const FUSE_OPTIONS: IFuseOptions<SearchDoc> = {
  keys: [
    { name: 'title', weight: 3 },
    { name: 'text', weight: 1 },
  ],
  includeMatches: true,
  includeScore: true,
  minMatchCharLength: 3,
  ignoreLocation: true,
  threshold: 0.25,
}

export type SearchRange = [start: number, end: number]

export type SearchResult = {
  path: string
  title: string
  kind: SearchKind
  score: number
  /** [start, end) offsets into `text` to highlight. */
  ranges: SearchRange[]
  text: string
  /** Every top-level block holding a text match, in document order, as the
   *  editor indexes them (frame-every-matching-block); empty when the match is
   *  only in the title or there is no content. The first is the one the editor
   *  scrolls to. */
  blocks: number[]
}

/** Rank fields tracked while accumulating a result (design D1): whether every
 *  term matched the title/body literally, and whether any term matched the
 *  title fuzzily. Stripped before a result leaves `searchDocs`. */
type AccFlags = {
  _terms: number
  _titleExact: boolean
  _bodyExact: boolean
  _titleFuzzy: boolean
}

/** Match tier, best first (design D1): exact title, exact body, fuzzy title,
 *  fuzzy body. "Exact" means every query term appears literally, so a page
 *  where all terms are literal outranks one that only matched fuzzily. */
function matchTier(r: AccFlags): number {
  if (r._titleExact) return 0
  if (r._bodyExact) return 1
  if (r._titleFuzzy) return 2
  return 3
}

/** Query terms: whitespace-split, terms under 3 characters are noise. */
export function termsOf(query: string): string[] {
  return query
    .trim()
    .split(/\s+/)
    .filter((t) => t.length >= 3)
}

/** Case-insensitive exact occurrences of a term in raw text. Used for
 *  highlighting because Fuse's fuzzy ranges are per-character and render as
 *  scattered 1-2 char marks; exact spans keep snippets clean. */
export function exactRanges(text: string, term: string): SearchRange[] {
  const hay = text.toLowerCase()
  const needle = term.toLowerCase()
  const ranges: SearchRange[] = []
  let from = 0
  let i: number
  while ((i = hay.indexOf(needle, from)) !== -1) {
    ranges.push([i, i + needle.length])
    from = i + needle.length
  }
  return ranges
}

/** Case-insensitive exact-substring test: the boolean form of `exactRanges`,
 *  used for ranking without building the range array. */
function hasExact(text: string, term: string): boolean {
  return text.toLowerCase().includes(term.toLowerCase())
}

/** AND-term search over a prepared Fuse: every query term must match; per
 *  term, ranges prefer exact occurrences and fall back to Fuse's fuzzy range
 *  only when a term has no exact match (a typo), dropping fragments under 3
 *  chars. Results sort by match tier before score — exact title, exact body,
 *  fuzzy title, fuzzy body — so literal matches lead their kind group, then by
 *  summed score, uncapped — the launcher dropdown slices per group via
 *  topPerGroup, the results view paginates the full list. */
export function searchDocs(fuse: Fuse<SearchDoc>, query: string): SearchResult[] {
  const terms = termsOf(query)
  if (!terms.length) return []
  const acc = new Map<string, Omit<SearchResult, 'blocks'> & AccFlags>()
  for (const term of terms) {
    const hits = fuse.search(term)
    for (const hit of hits) {
      const item = hit.item
      const rec = acc.get(item.path) ?? {
        path: item.path,
        title: item.title,
        kind: item.kind,
        text: item.text,
        score: 0,
        ranges: [],
        _terms: 0,
        _titleExact: true,
        _bodyExact: true,
        _titleFuzzy: false,
      }
      acc.set(item.path, rec)
      rec._terms += 1
      rec.score += hit.score ?? 1
      rec._titleExact &&= hasExact(item.title, term)
      const textMatch = hit.matches?.find((m) => m.key === 'text')
      let ranges = exactRanges(item.text, term)
      rec._bodyExact &&= ranges.length > 0
      if (!ranges.length && textMatch) {
        ranges = textMatch.indices
          .map(([s, e]) => [s, e + 1] as SearchRange)
          .filter(([s, e]) => e - s >= 3)
      }
      rec._titleFuzzy ||= !!hit.matches?.some((m) => m.key === 'title')
      rec.ranges.push(...ranges)
    }
  }
  const results = [...acc.values()]
    .filter((r) => r._terms === terms.length)
    .map((r) => ({ ...r, _tier: matchTier(r) }))
    .sort((a, b) => a._tier - b._tier || a.score - b.score || a.path.localeCompare(b.path))
  return results.map(
    ({ _terms: _a, _titleExact: _b, _bodyExact: _c, _titleFuzzy: _d, _tier: _e, ...rest }) => ({
      ...rest,
      blocks: matchBlocks(rest.text, rest.ranges),
    }),
  )
}

/** Per-group slice of a full result set (search-results-view): keeps the
 *  first PER_GROUP matches of each kind in relevance order. The launcher
 *  dropdown renders this; the full list powers the results view. */
export function topPerGroup(results: SearchResult[]): SearchResult[] {
  const counts = new Map<SearchKind, number>()
  const out: SearchResult[] = []
  for (const r of results) {
    if ((counts.get(r.kind) ?? 0) >= PER_GROUP) continue
    counts.set(r.kind, (counts.get(r.kind) ?? 0) + 1)
    out.push(r)
  }
  return out
}

export type Segment = { text: string; hit: boolean }

/** One snippet: the 1-based inclusive line span it covers, how many occurrences
 *  it holds, and its hit/non-hit segments. A row renders one of these per run of
 *  nearby matches (show-every-match-per-result). */
export type SnippetWindow = { from: number; to: number; hits: number; segments: Segment[] }

/** How close two matches must be to share a window: a match whose first line is
 *  within this many lines of the current window's last line joins it. */
const MERGE_GAP = 4
/** The most lines one window may cover, so a dense page walks forward in
 *  bounded windows instead of collapsing into one enormous excerpt. */
const WINDOW_MAX = 8
/** Lines of context shown on each side of the matches a window covers. */
const CONTEXT = 1

/** The 1-based line holding `offset` (binary search over the line starts). */
function lineAt(starts: number[], offset: number): number {
  let lo = 0
  let hi = starts.length - 1
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1
    if (starts[mid] <= offset) lo = mid
    else hi = mid - 1
  }
  return lo + 1
}

/** Sorted, non-overlapping ranges: a term that occurs twice in a row is one hit. */
function mergeRanges(ranges: SearchRange[]): SearchRange[] {
  const merged: SearchRange[] = []
  for (const [a, b] of [...ranges].sort((x, y) => x[0] - y[0] || x[1] - y[1])) {
    if (b <= a) continue
    const last = merged[merged.length - 1]
    if (last && a <= last[1]) last[1] = Math.max(last[1], b)
    else merged.push([a, b])
  }
  return merged
}

/** The segments of one window: its ranges mapped into its own text, then split
 *  into hit and non-hit runs. */
function windowOf(
  lines: string[],
  starts: number[],
  window: { from: number; to: number; ranges: SearchRange[] },
): SnippetWindow {
  const text = lines.slice(window.from - 1, window.to).join('\n')
  const start = starts[window.from - 1]
  const segments: Segment[] = []
  let pos = 0
  for (const [a, b] of window.ranges) {
    const from = Math.max(0, Math.min(text.length, a - start))
    const to = Math.max(0, Math.min(text.length, b - start))
    if (to <= from) continue
    if (from > pos) segments.push({ text: text.slice(pos, from), hit: false })
    segments.push({ text: text.slice(from, to), hit: true })
    pos = to
  }
  if (pos < text.length) segments.push({ text: text.slice(pos), hit: false })
  return { from: window.from, to: window.to, hits: window.ranges.length, segments }
}

/** One snippet per place the query occurs (show-every-match-per-result): matches
 *  within `MERGE_GAP` lines share a window, a window covers at most `WINDOW_MAX`
 *  lines with `CONTEXT` lines either side of its matches, and a fresh window
 *  starts past the last one so no two overlap. Every occurrence lands in exactly
 *  one window. With no ranges (a title-only match) the page's first three lines
 *  serve as the single snippet. */
export function snippetSegments(text: string, ranges: SearchRange[]): SnippetWindow[] {
  const lines = text.split('\n')
  // Each line's start offset, computed once: a window is then a slice of `lines`
  // and an offset, rather than a fresh scan of the whole text per window.
  const starts: number[] = new Array(lines.length)
  for (let i = 0, at = 0; i < lines.length; i += 1) {
    starts[i] = at
    at += lines[i].length + 1
  }
  if (!ranges.length) {
    const to = Math.min(3, lines.length)
    return [
      { from: 1, to, hits: 0, segments: [{ text: lines.slice(0, to).join('\n'), hit: false }] },
    ]
  }
  const merged = mergeRanges(ranges)
  if (!merged.length) return []
  // The lines each range starts and ends on: a match can span a newline, so
  // both ends matter for whether a window already covers it.
  const spans = merged.map((range) => ({
    range,
    from: lineAt(starts, range[0]),
    to: lineAt(starts, Math.max(range[0], range[1] - 1)),
  }))
  const windows: { from: number; to: number; ranges: SearchRange[] }[] = []
  for (const span of spans) {
    const current = windows[windows.length - 1]
    const from = Math.max(1, span.from - CONTEXT)
    const to = Math.min(lines.length, span.to + CONTEXT)
    if (current) {
      // Already inside the window: shown, so it is only highlighted, not grown.
      if (span.from >= current.from && span.to <= current.to) {
        current.ranges.push(span.range)
        continue
      }
      const grown = Math.max(current.to, to)
      if (from - current.to <= MERGE_GAP && grown - current.from + 1 <= WINDOW_MAX) {
        current.to = grown
        current.ranges.push(span.range)
        continue
      }
    }
    // A fresh window starts past the last one, so no two overlap, and never
    // past its own match, which is always covered.
    windows.push({
      from: current ? Math.max(current.to + 1, from) : from,
      to,
      ranges: [span.range],
    })
  }
  return windows.map((window) => windowOf(lines, starts, window))
}

/** The index of the top-level block holding the first text match
 *  (mark-search-matches-on-the-page): the block-start anchor at or above the
 *  first range, counted in document order, or null when there is no text match
 *  (a title-only result). The index survives Canonicalization, which can move a
 *  block's line but not which block it is. */
export function matchBlocks(text: string, ranges: SearchRange[]): number[] {
  if (!ranges.length) return []
  const anchors = blockStartLines(text)
  const blocks: number[] = []
  for (const [start] of [...ranges].sort((a, b) => a[0] - b[0])) {
    // 1-based, and one past the last line when the offset sits on a newline:
    // either way the anchor search below finds the block the match is in.
    const matchLine = text.slice(0, start).split('\n').length
    let block = 0
    for (let i = 0; i < anchors.length; i++) {
      if (anchors[i] > matchLine) break
      block = i
    }
    // Two matches in one block are one frame, and the ranges are sorted, so a
    // repeat can only be the previous entry.
    if (blocks[blocks.length - 1] !== block) blocks.push(block)
  }
  return blocks
}
