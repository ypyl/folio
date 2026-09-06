// Pure search math over the live index (search-notes): the Fuse config and
// AND-term model copied from openspec-viewer's production search, unit-tested
// without the DOM. Docs are pages with title weighted over content; results
// carry exact-match ranges for snippet highlighting.

import type Fuse from 'fuse.js'
import { type IFuseOptions } from 'fuse.js'
import type { Page } from '../page'

export type SearchDoc = {
  path: string
  title: string
  kind: Page['kind']
  text: string
}

/** Per-group result cap; groups beyond it are truncated with a note. */
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
  kind: Page['kind']
  score: number
  /** [start, end) offsets into `text` to highlight. */
  ranges: SearchRange[]
  text: string
}

/** Query terms: whitespace-split, terms under 3 characters are noise. */
export function termsOf(query: string): string[] {
  return query.trim().split(/\s+/).filter((t) => t.length >= 3)
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

/** AND-term search over a prepared Fuse: every query term must match; per
 *  term, ranges prefer exact occurrences and fall back to Fuse's fuzzy range
 *  only when a term has no exact match (a typo), dropping fragments under 3
 *  chars. Scores sum across terms; results sort best-first, capped per group. */
export function searchDocs(fuse: Fuse<SearchDoc>, query: string): SearchResult[] {
  const terms = termsOf(query)
  if (!terms.length) return []
  const acc = new Map<string, SearchResult & { _terms: number }>()
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
      }
      acc.set(item.path, rec)
      rec._terms += 1
      rec.score += hit.score ?? 1
      const textMatch = hit.matches?.find((m) => m.key === 'text')
      let ranges = exactRanges(item.text, term)
      if (!ranges.length && textMatch) {
        ranges = textMatch.indices
          .map(([s, e]) => [s, e + 1] as SearchRange)
          .filter(([s, e]) => e - s >= 3)
      }
      rec.ranges.push(...ranges)
    }
  }
  const results = [...acc.values()]
    .filter((r) => r._terms === terms.length)
    .sort((a, b) => a.score - b.score || a.path.localeCompare(b.path))
  const counts = new Map<Page['kind'], number>()
  const out: SearchResult[] = []
  for (const r of results) {
    if ((counts.get(r.kind) ?? 0) >= PER_GROUP) continue
    counts.set(r.kind, (counts.get(r.kind) ?? 0) + 1)
    const { _terms: _dropped, ...rest } = r
    out.push(rest)
  }
  return out
}

export type Segment = { text: string; hit: boolean }

/** A window (±2 lines) around the first match line, split into hit/non-hit
 *  segments. With no ranges (a title-only match) the page's first three lines
 *  serve as the snippet. Overlapping/adjacent ranges merge first. */
export function snippetSegments(text: string, ranges: SearchRange[]): Segment[] {
  const lines = text.split('\n')
  if (!ranges.length) {
    return [{ text: lines.slice(0, Math.min(3, lines.length)).join('\n'), hit: false }]
  }
  const merged: SearchRange[] = []
  for (const [a, b] of [...ranges].sort((x, y) => x[0] - y[0] || x[1] - y[1])) {
    if (b <= a) continue
    const last = merged[merged.length - 1]
    if (last && a <= last[1]) last[1] = Math.max(last[1], b)
    else merged.push([a, b])
  }
  if (!merged.length) return []
  const starts = [0]
  for (let i = 0; i < text.length; i++) if (text[i] === '\n') starts.push(i + 1)
  let line = 0
  while (line < starts.length - 1 && starts[line + 1] <= merged[0][0]) line++
  const winStartLine = Math.max(0, line - 2)
  const winEndLine = Math.min(lines.length - 1, line + 2)
  const winStart = starts[winStartLine]
  const winEnd = starts[winEndLine] + lines[winEndLine].length
  const winText = text.slice(winStart, winEnd)
  const winRanges = merged
    .map(([a, b]): SearchRange => [a - winStart, b - winStart])
    .filter(([a, b]) => b > 0 && a < winText.length)
    .map(([a, b]): SearchRange => [Math.max(0, a), Math.min(winText.length, b)])
  const segments: Segment[] = []
  let pos = 0
  for (const [a, b] of winRanges) {
    if (b <= a) continue
    if (a > pos) segments.push({ text: winText.slice(pos, a), hit: false })
    segments.push({ text: winText.slice(a, b), hit: true })
    pos = b
  }
  if (pos < winText.length) segments.push({ text: winText.slice(pos), hit: false })
  return segments
}