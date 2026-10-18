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
import { ruleMatches, type ReminderRule } from './vault/reminders'

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

/** One reminder row on an open journal day (add-reminders). `target` is the
 *  page name as the rule writes it, which is what a removal matches; `title` is
 *  the page's own title when the vault holds it, else the target. */
export type ReminderRow = {
  target: string
  title: string
  path: string
  pending: boolean
}

/** The open journal day's reminders (add-reminders, design D4/D5). For each
 *  rule, a recorded row when the day's note already references the rule's page,
 *  else a pending row when the rule matches the day; a rule that neither
 *  matches nor is referenced produces no row. Pending rows lead, recorded rows
 *  follow, and a page appears once even if two rules name it. Pure: the caller
 *  memoizes it on the graph's identity and the open day, so it never reaches
 *  the keystroke path. */
export function dayReminders(
  graph: Graph,
  rules: readonly ReminderRule[],
  day: string,
): ReminderRow[] {
  const page = graph.pages.get(journalDayPath(day))
  const referenced = new Set<string>()
  if (page) {
    for (const link of page.links) {
      referenced.add(resolveReferencePath(link.target, graph.byName))
    }
  }
  const pending: ReminderRow[] = []
  const recorded: ReminderRow[] = []
  const seen = new Set<string>()
  for (const rule of rules) {
    const path = resolveReferencePath(rule.target, graph.byName)
    if (seen.has(path)) continue
    const isRecorded = referenced.has(path)
    if (!isRecorded && !ruleMatches(rule, day)) continue
    seen.add(path)
    const row: ReminderRow = {
      target: rule.target,
      title: graph.pages.get(path)?.title ?? rule.target,
      path,
      pending: !isRecorded,
    }
    if (isRecorded) recorded.push(row)
    else pending.push(row)
  }
  return [...pending, ...recorded]
}
