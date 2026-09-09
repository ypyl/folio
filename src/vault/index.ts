// In-memory vault index (ADR-0004, amended by this change): scans a
// VaultStorage into a disposable Graph and refreshes it incrementally.
// Pages are keyed by vault-relative path (design D1); references resolve
// case-insensitively through a name map (ADR-0012).

import type { Page } from '../page'
import { parseLinks, type Link } from './parse'
import type { VaultStorage } from './storage'

export type IndexPage = Page & { links: Link[]; lastModified: number }

export type Graph = {
  /** Pages keyed by vault-relative path (design D1). */
  pages: Map<string, IndexPage>
  /** Lowercased page name -> path; first-by-path wins case collisions. */
  byName: Map<string, string>
  /** Lowercased target name -> referring paths; self-references excluded. */
  backlinks: Map<string, string[]>
}

/** The vault's hidden pin meta file (design D1): an ordered list of page
 *  paths, most recently pinned first. Its dot-directory keeps it out of the
 *  page index and search (isPagePath excludes hidden segments). */
export const PINS_PATH = '.folio/pins.md'

/** A built index plus the mtime snapshot it was derived from (design D3). */
export type VaultIndex = {
  graph: Graph
  /** path -> lastModified at scan time, for the next diff. */
  snapshot: Map<string, number>
  /** Ordered pinned page paths from the meta file, most recently pinned first. */
  pins: string[]
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
      lastModified,
    })
  }
  const pins = await readPins(storage, previous, snapshot)
  return { graph: fold(pages), snapshot, pins }
}

/** Read the pins meta file into the index (design D1/D3). A missing file is
 *  the empty list — `VaultStorage.read`/`stat` reject on missing paths
 *  (ADR-0013), so absence must be caught, not propagated. The file's mtime
 *  joins the snapshot, so refresh re-reads pins only when the file changed
 *  (external edits reach the index on the app's scan, like page changes). */
async function readPins(
  storage: VaultStorage,
  previous: VaultIndex | undefined,
  snapshot: Map<string, number>,
): Promise<string[]> {
  let mtime: number
  try {
    mtime = await storage.stat(PINS_PATH)
  } catch {
    return [] // no meta file: nothing pinned
  }
  snapshot.set(PINS_PATH, mtime)
  if (previous && previous.snapshot.get(PINS_PATH) === mtime) {
    return previous.pins
  }
  return parsePins(await storage.read(PINS_PATH))
}

/** Incremental rescan of the same folder (task 2.4): diffs against the
 *  current index's snapshot, re-reading only new or changed files. */
export function refreshIndex(storage: VaultStorage, current: VaultIndex): Promise<VaultIndex> {
  return buildIndex(storage, current)
}

/** Write-through path for the app's own saves (ADR-0004, design B1): persist
 *  the page, re-parse it in memory, and heal the mtime snapshot so the next
 *  diff-rescan skips the file. Non-optimistic by construction — the page
 *  object changes only after the write resolves, so a failed write leaves
 *  the index consistent with disk. */
export async function upsertPage(
  storage: VaultStorage,
  current: VaultIndex,
  path: string,
  content: string,
): Promise<VaultIndex> {
  await storage.write(path, content)
  const lastModified = await storage.stat(path)
  const pages = new Map(current.graph.pages)
  pages.set(path, {
    path,
    title: stem(path),
    kind: kindOf(path),
    content,
    links: parseLinks(content),
    lastModified,
  })
  const snapshot = new Map(current.snapshot)
  snapshot.set(path, lastModified)
  return { graph: fold(pages), snapshot, pins: current.pins }
}

/** Write-through for pin edits (design D1/D3), mirroring upsertPage: write
 *  the meta file, re-read its mtime, and heal the snapshot so the next
 *  diff-rescan skips it. Non-optimistic by construction — the pins change in
 *  memory only after the write resolves, so a failed write leaves the index
 *  consistent with disk. */
export async function upsertPins(
  storage: VaultStorage,
  current: VaultIndex,
  pins: string[],
): Promise<VaultIndex> {
  await storage.write(PINS_PATH, renderPins(pins))
  const lastModified = await storage.stat(PINS_PATH)
  const snapshot = new Map(current.snapshot)
  snapshot.set(PINS_PATH, lastModified)
  return { graph: current.graph, snapshot, pins }
}

const PINS_HEADER = '# Pinned pages - order is pin order, most recent first'

/** The on-disk form of the pins list (design D1): a markdown header, then
 *  one `- <path>` line per pin. An empty list still writes the header so the
 *  file is a stable, parseable artifact (parsePins ignores it). */
function renderPins(pins: string[]): string {
  const body = pins.map((pin) => `- ${pin}`).join('\n')
  return body === '' ? `${PINS_HEADER}\n` : `${PINS_HEADER}\n\n${body}\n`
}

function carryOver(path: string, lastModified: number, previous: VaultIndex): IndexPage | undefined {
  if (previous.snapshot.get(path) !== lastModified) return undefined
  return previous.graph.pages.get(path)
}

/** Scan scope (design D4): `.md` file, no hidden path segment; the assets
 *  folder is referenced, never navigated (asset-drag-drop, design D6). */
export function isPagePath(path: string): boolean {
  const lower = path.toLowerCase()
  if (lower.startsWith('assets/')) return false
  if (!lower.endsWith('.md')) return false
  for (const segment of path.split('/')) {
    if (segment.startsWith('.')) return false
  }
  return true
}

/** Parse the pins meta file: an ordered list of page paths (design D1).
 *  Header comments (`# ...`), blank lines, and lines that are not valid page
 *  paths are ignored; a leading `- ` list marker is stripped. Order is
 *  preserved — the file's line order IS the pin order (most recent first). */
export function parsePins(content: string): string[] {
  const pins: string[] = []
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (line === '' || line.startsWith('#')) continue
    const candidate = line.startsWith('-') ? line.slice(1).trim() : line
    if (isPagePath(candidate)) pins.push(candidate)
  }
  return pins
}

/** Order the sidebar Pages list (design D5, static-navigation delta): pinned
 *  pages first in pin order (most recently pinned first), then the remaining
 *  pages by last-modified descending — path-ascending tiebreak for a stable
 *  listing. Pins naming no page in the set are skipped (self-healing: a
 *  deleted page's pin stays in the file but renders nowhere). */
export function orderPages(pages: Iterable<IndexPage>, pins: string[]): IndexPage[] {
  const byPath = new Map<string, IndexPage>()
  for (const page of pages) byPath.set(page.path, page)
  const pinned = new Set(pins)
  const pinnedRows: IndexPage[] = []
  const shown = new Set<string>()
  for (const path of pins) {
    const page = byPath.get(path)
    if (page && !shown.has(page.path)) {
      pinnedRows.push(page)
      shown.add(page.path)
    }
  }
  const rest = [...byPath.values()].filter((page) => !pinned.has(page.path))
  rest.sort((a, b) => b.lastModified - a.lastModified || a.path.localeCompare(b.path))
  return [...pinnedRows, ...rest]
}

/** Title = filename with the final `.md` removed (design D1). */
export function stem(path: string): string {
  const name = path.slice(path.lastIndexOf('/') + 1)
  return name.slice(0, -3) // removes '.md'/' .MD' regardless of extension case
}

/** Kind: journal iff the path starts with the journals directory (F1). */
export function kindOf(path: string): 'journal' | 'page' {
  return path.startsWith('journals/') ? 'journal' : 'page'
}

const JOURNAL_DATE = /^journals\/(\d{4}-\d{2}-\d{2})\.md$/

/** The calendar date ('YYYY-MM-DD') of a journal day path, else null
 *  (journal-calendar D5). Non-date files under `journals/` have no cell. */
export function journalDate(path: string): string | null {
  return JOURNAL_DATE.exec(path)?.[1] ?? null
}

/** Local 'YYYY-MM-DD' for a Date — built from local year/month/day parts,
 *  never toISOString(), which shifts the day at local midnight boundaries
 *  (journal-calendar D5). */
export function localDayString(date: Date): string {
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${mm}-${dd}`
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