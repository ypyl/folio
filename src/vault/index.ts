// In-memory vault index (ADR-0004, amended by this change): scans a
// VaultStorage into a disposable Graph and refreshes it incrementally.
// Pages are keyed by vault-relative path (design D1); references resolve
// case-insensitively through a name map (ADR-0012).

import type { Page } from '../page'
import { parseLinks, type Link } from './parse'
import type { VaultStorage } from './storage'

export type IndexPage = Page & { links: Link[] }

export type Graph = {
  /** Pages keyed by vault-relative path (design D1). */
  pages: Map<string, IndexPage>
  /** Lowercased page name -> path; first-by-path wins case collisions. */
  byName: Map<string, string>
  /** Lowercased target name -> referring paths; self-references excluded. */
  backlinks: Map<string, string[]>
}

/** A built index plus the mtime snapshot it was derived from (design D3). */
export type VaultIndex = {
  graph: Graph
  /** path -> lastModified at scan time, for the next diff. */
  snapshot: Map<string, number>
}

/** Full or incremental scan (design D3): with `previous` given, only files
 *  whose mtime moved are re-read; unchanged pages carry over. */
export async function buildIndex(
  storage: VaultStorage,
  previous?: VaultIndex,
): Promise<VaultIndex> {
  const paths = (await storage.list('')).sort()
  const snapshot = new Map<string, number>()
  const pages = new Map<string, IndexPage>()
  for (const path of paths) {
    if (!isPagePath(path)) continue
    const lastModified = await storage.stat(path)
    snapshot.set(path, lastModified)
    if (previous) {
      const carried = carryOver(path, lastModified, previous)
      if (carried) {
        pages.set(path, carried)
        continue
      }
    }
    const content = await storage.read(path)
    pages.set(path, {
      path,
      title: stem(path),
      kind: kindOf(path),
      content,
      links: parseLinks(content),
    })
  }
  return { graph: fold(pages), snapshot }
}

/** Incremental rescan of the same folder (task 2.4): diffs against the
 *  current index's snapshot, re-reading only new or changed files. */
export function refreshIndex(storage: VaultStorage, current: VaultIndex): Promise<VaultIndex> {
  return buildIndex(storage, current)
}

function carryOver(path: string, lastModified: number, previous: VaultIndex): IndexPage | undefined {
  if (previous.snapshot.get(path) !== lastModified) return undefined
  return previous.graph.pages.get(path)
}

/** Scan scope (design D4): `.md` file, no hidden path segment. */
export function isPagePath(path: string): boolean {
  if (!path.toLowerCase().endsWith('.md')) return false
  for (const segment of path.split('/')) {
    if (segment.startsWith('.')) return false
  }
  return true
}

/** Title = filename with the final `.md` removed (design D1). */
function stem(path: string): string {
  const name = path.slice(path.lastIndexOf('/') + 1)
  return name.slice(0, -3) // removes '.md'/' .MD' regardless of extension case
}

/** Kind: journal iff the path starts with the journals directory (F1). */
function kindOf(path: string): 'journal' | 'page' {
  return path.startsWith('journals/') ? 'journal' : 'page'
}

/** Fold scanned pages into the graph: name resolution + backlinks (D5). */
function fold(pages: Map<string, IndexPage>): Graph {
  const byName = new Map<string, string>()
  const backlinks = new Map<string, string[]>()
  for (const [path, page] of pages) {
    const name = page.title.toLowerCase()
    if (!byName.has(name)) byName.set(name, path)
    for (const link of page.links) {
      const target = link.target.toLowerCase()
      // A page does not backlink itself; self-references stay outgoing only.
      if (byName.get(target) === path) continue
      const list = backlinks.get(target)
      if (list) list.push(path)
      else backlinks.set(target, [path])
    }
  }
  return { pages, byName, backlinks }
}