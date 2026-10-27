// Pure row builders for the app's lists: the open page's Backlinks and
// Forwardlinks, a board's referrers, and the sidebar's single listing. No React
// and no IO, so App's memos stay one-liners and the derivations can be
// exercised without mounting the app. The memoization stays in App, where the
// input identities are what keep this vault-sized work off the keystroke path
// (AGENTS.md).

import type { LinkRow } from './components/MetaPanel'
import type { SidebarRow } from './components/Sidebar'
import {
  assetName,
  boardName,
  boardReferrers,
  journalDayPath,
  orderPages,
  pageAssets,
  resolveBoardPath,
  resolveReferencePath,
  type Graph,
  type IndexPage,
} from './vault/index'
import { parseLinks } from './vault/parse'
import { matchingRules, type ReminderRule } from './vault/reminders'

/** Order a "who references this" list: the most recently edited page first,
 *  path ascending as the tiebreak — the sidebar's own rule (`orderPages`) minus
 *  pins. Returns a copy, because the index's arrays are shared. */
function orderByLastEdited(graph: Graph, paths: string[]): string[] {
  return [...paths].sort(
    (a, b) =>
      (graph.pages.get(b)?.lastModified ?? 0) - (graph.pages.get(a)?.lastModified ?? 0) ||
      a.localeCompare(b),
  )
}

/** The meta panel's Backlinks rows: the pages whose Markdown references the open
 *  page, most recently edited first. */
export function pageBacklinks(graph: Graph, page: IndexPage): LinkRow[] {
  return orderByLastEdited(graph, graph.backlinks.get(page.title.toLowerCase()) ?? []).map(
    (path) => {
      const p = graph.pages.get(path)
      return { kind: 'page', badge: 'in', title: p ? p.title : path, path, materialized: true }
    },
  )
}

/** The meta panel's Referenced-by rows for the open board: the pages that
 *  reference it, most recently edited first. A path with no page is
 *  unmaterialized. */
export function pagesReferencingBoard(graph: Graph, boardPath: string): LinkRow[] {
  return orderByLastEdited(graph, boardReferrers(graph, boardPath)).map((path) => {
    const p = graph.pages.get(path)
    return {
      kind: 'page',
      badge: 'in',
      title: p ? p.title : path,
      path,
      materialized: p !== undefined,
    }
  })
}

/** The rows the meta panel's Links list shows for the open page: one per file
 *  the page points at, plus one per board it references with a `#!` token,
 *  deduped by path — a board row wins, so a token and a path link to one board
 *  are one row, and the board's own view is what activating it opens. */
function pageReferenceRows(page: IndexPage, graph: Graph): LinkRow[] {
  const rows = new Map<string, LinkRow>()
  for (const path of pageAssets(page, graph)) {
    rows.set(path, { kind: 'asset', badge: 'a', title: assetName(path), path, materialized: true })
  }
  for (const ref of page.boards) {
    const path = resolveBoardPath(ref.target, graph.boardsByName)
    rows.set(path, {
      kind: 'board',
      badge: 'b',
      title: boardName(path),
      path,
      materialized: graph.files.has(path),
    })
  }
  return [...rows.values()]
}

/** The meta panel's Forwardlinks rows: the page references the open page makes
 *  (document order), then the files it points at (assets then boards). A
 *  reference with no matching page is unmaterialized, and a page's link to
 *  itself is dropped. */
export function pageForwardlinks(graph: Graph, page: IndexPage): LinkRow[] {
  return [
    ...page.links
      .map((l) => {
        const targetPath = resolveReferencePath(l.target, graph.byName)
        const p = graph.pages.get(targetPath)
        if (p) {
          return {
            kind: 'page' as const,
            badge: 'out' as const,
            title: p.title,
            path: targetPath,
            materialized: true,
          }
        }
        return {
          kind: 'page' as const,
          badge: 'out' as const,
          title: l.target,
          path: targetPath,
          materialized: false,
        }
      })
      .filter((r) => r.path !== page.path),
    ...pageReferenceRows(page, graph),
  ]
}

/** The sidebar's page rows: pinned first in pin order, then last-edited. */
export function orderedPageRows(graph: Graph, pins: string[]): IndexPage[] {
  return orderPages(graph.pages.values(), pins).filter((p) => p.kind === 'page')
}

/** The sidebar's journal entries, in the index's own order. */
export function journalRows(graph: Graph): IndexPage[] {
  return [...graph.pages.values()].filter((p) => p.kind === 'journal')
}

/** The sidebar's single listing: pages (pinned then recency), then boards, then
 *  assets, each labelled by kind. */
export function sidebarListing(
  pages: IndexPage[],
  boards: string[],
  assets: string[],
  pins: string[],
): SidebarRow[] {
  const pinned = new Set(pins)
  return [
    ...pages.map((p) => ({
      kind: 'page' as const,
      path: p.path,
      label: p.title,
      pinned: pinned.has(p.path),
    })),
    ...boards.map((path) => ({ kind: 'board' as const, path, label: boardName(path) })),
    ...assets.map((path) => ({ kind: 'asset' as const, path, label: assetName(path) })),
  ]
}

/** The rules that match `day` and whose page the day's note does not yet
 *  reference (add-reminders, the calendar-day change): exactly what opening the
 *  day should materialize. One rule per page, so a page appears at most once.
 *  Pure: the caller runs it when a journal day's editor mounts, never on a
 *  keystroke. */
export function unreferencedRules(
  graph: Graph,
  rules: readonly ReminderRule[],
  day: string,
  draft?: string,
): ReminderRule[] {
  const page = graph.pages.get(journalDayPath(day))
  const referenced = new Set<string>()
  if (page) {
    for (const link of page.links) {
      referenced.add(resolveReferencePath(link.target, graph.byName))
    }
  }
  // The open editor can hold a line the save has not written yet (the app
  // appends the day's occurrences on open): counting its references too is what
  // keeps closing and reopening the day inside the save debounce from adding a
  // second copy.
  for (const link of draft === undefined ? [] : parseLinks(draft)) {
    referenced.add(resolveReferencePath(link.target, graph.byName))
  }
  const out: ReminderRule[] = []
  const seen = new Set<string>()
  for (const rule of matchingRules(rules, day)) {
    const path = resolveReferencePath(rule.target, graph.byName)
    if (seen.has(path) || referenced.has(path)) continue
    seen.add(path)
    out.push(rule)
  }
  return out
}
