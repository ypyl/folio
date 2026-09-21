// In-memory vault index (ADR-0004, amended by this change): scans a
// VaultStorage into a disposable Graph and refreshes it incrementally.
// Pages are keyed by vault-relative path (design D1); references resolve
// case-insensitively through a name map (ADR-0012).

import type { Page } from '../page'
import { parseAssetPaths, parseBoardRefs, parseLinks, type BoardRef, type Link } from './parse'
import type { VaultStorage } from './storage'

export type IndexPage = Page & {
  links: Link[]
  /** Vault-relative paths this page's Markdown links and images name, in order
   *  and deduped (add-asset-navigation, design D1). Candidates: whether the
   *  file exists is the folder's answer, checked against `Graph.files` where
   *  the rows are built. */
  assets: string[]
  /** Board references this page's Markdown writes, in order and deduped
   *  (add-whiteboards, design D9). */
  boards: BoardRef[]
  lastModified: number
}

export type Graph = {
  /** Pages keyed by vault-relative path (design D1). */
  pages: Map<string, IndexPage>
  /** Lowercased page name -> path; first-by-path wins case collisions. */
  byName: Map<string, string>
  /** Lowercased target name -> referring paths; self-references excluded. */
  backlinks: Map<string, string[]>
  /** Every non-hidden file path in the vault, from the same listing the pages
   *  came from (design D2). It is what a page's asset references are matched
   *  against, so a file deleted outside the app drops out on the next scan
   *  while the page that named it is still carried over unchanged. */
  files: Set<string>
  /** The vault's `assets/` files, path-ordered: the sidebar's Assets listing. */
  assets: string[]
  /** The vault's `boards/` files, path-ordered: the sidebar's Boards listing
   *  (add-whiteboards, design D1/D9). */
  boards: string[]
  /** Lowercased board name -> path; first-by-path wins case collisions, like
   *  `byName` for pages. */
  boardsByName: Map<string, string>
  /** Lowercased board path -> referring page paths, in scan order. A board is
   *  referenced only by its `#!` token (add-whiteboards, design D9). */
  boardReferrers: Map<string, string[]>
}

/** The vault's hidden pin meta file (design D1): an ordered list of page
 *  paths, most recently pinned first. Its dot-directory keeps it out of the
 *  page index and search (isPagePath excludes hidden segments). */
const PINS_PATH = '.folio/pins.md'

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
  const files = new Set(paths.filter((path) => !hasHiddenSegment(path)))
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
      assets: parseAssetPaths(content),
      boards: parseBoardRefs(content),
      lastModified,
    })
  }
  const pins = await readPins(storage, previous, snapshot)
  return { graph: fold(pages, files), snapshot, pins }
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
    assets: parseAssetPaths(content),
    boards: parseBoardRefs(content),
    lastModified,
  })
  const snapshot = new Map(current.snapshot)
  snapshot.set(path, lastModified)
  // A page the app just wrote is a file the vault now holds, so the listing the
  // asset check reads includes it (design D2).
  const files = new Set(current.graph.files)
  files.add(path)
  return { graph: fold(pages, files), snapshot, pins: current.pins }
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

function carryOver(
  path: string,
  lastModified: number,
  previous: VaultIndex,
): IndexPage | undefined {
  if (previous.snapshot.get(path) !== lastModified) return undefined
  return previous.graph.pages.get(path)
}

/** Scan scope (pages-folder-layout, design D2): `.md` file under `pages/` or
 *  `journals/`, no hidden path segment. Root-level and other-directory
 *  Markdown files are not pages, so `assets/` is unreachable by construction.
 *  A date-shaped name belongs to the journal, so a date-named file under
 *  `pages/` is excluded too, at any depth (design D3): `byName` must never
 *  hand a date name to a `pages/` path. */
export function isPagePath(path: string): boolean {
  const lower = path.toLowerCase()
  if (!lower.startsWith('pages/') && !lower.startsWith('journals/')) return false
  if (!lower.endsWith('.md')) return false
  if (hasHiddenSegment(path)) return false
  if (lower.startsWith('pages/') && journalDayName(stem(path)) !== null) return false
  return true
}

/** Board scan scope (add-whiteboards, design D1): a `.excalidraw` file under
 *  `boards/`, no hidden path segment. A `.excalidraw` elsewhere is an ordinary
 *  vault file: it opens (the extension decides the view), but it is not listed
 *  as a board. */
export function isBoardPath(path: string): boolean {
  const lower = path.toLowerCase()
  if (!lower.startsWith(BOARDS_DIR)) return false
  if (!lower.endsWith('.excalidraw')) return false
  return !hasHiddenSegment(path)
}

/** The vault's boards, path-ordered: `Graph.boards`, and the Boards listing
 *  (add-whiteboards, design D1/D9) — a filter over the files the scan already
 *  fetched, exactly like `listAssets`. */
export function listBoards(files: Iterable<string>): string[] {
  return [...files].filter(isBoardPath).sort()
}

/** A listed board's row label: its path inside `boards/`, so two boards with
 *  the same name in different folders read differently. */
export function boardName(path: string): string {
  return path.startsWith(BOARDS_DIR) ? path.slice(BOARDS_DIR.length) : path
}

/** A board's name — the token text, its filename without `.excalidraw`. */
export function boardStem(path: string): string {
  const name = path.slice(path.lastIndexOf('/') + 1)
  return name.slice(0, -BOARD_EXT.length)
}

/** Where a board named `name` lives (add-whiteboards, design D2/D3). */
export function boardPathForName(name: string): string {
  return `${BOARDS_DIR}${name}${BOARD_EXT}`
}

/** Whether any path segment begins with `.`: the one rule that keeps hidden
 *  files — and `.folio/`, the app's own meta directory — out of both the page
 *  set and the asset listing (design D2). */
export function hasHiddenSegment(path: string): boolean {
  for (const segment of path.split('/')) {
    if (segment.startsWith('.')) return true
  }
  return false
}

/** The vault's assets, path-ordered (ADR-0022): every non-hidden file under
 *  `assets/`, whatever its extension. `Graph.assets` is this, and the Assets
 *  section renders it — the rule lives here so the sidebar stays a renderer. */
export function listAssets(files: Iterable<string>): string[] {
  return [...files].filter((path) => path.startsWith(ASSETS_DIR)).sort()
}

/** Where the app writes dropped and pasted files (asset-drag-drop). */
const ASSETS_DIR = 'assets/'

/** Where boards live (add-whiteboards); the board token's name resolves here. */
export const BOARDS_DIR = 'boards/'

/** The extension that makes a file under `boards/` a board. */
export const BOARD_EXT = '.excalidraw'

/** A listed asset's row label: its path inside `assets/`, so two files with the
 *  same name in different folders read differently (vault-assets spec). A file
 *  referenced from outside `assets/` has no such form and keeps its path. */
export function assetName(path: string): string {
  return path.startsWith(ASSETS_DIR) ? path.slice(ASSETS_DIR.length) : path
}

/** The asset rows an open page shows (add-asset-navigation, design D1): the
 *  destinations its Markdown names, kept when the vault holds the file and it
 *  is not a page. Existence is read from `Graph.files` — the current listing —
 *  rather than from the page's own record, so a file deleted outside the app
 *  drops out on the next scan even though the page itself is carried over. */
export function pageAssets(page: IndexPage, graph: Graph): string[] {
  return page.assets.filter((path) => graph.files.has(path) && !isPagePath(path))
}

/** Resolve a board token's name to the board it names (add-whiteboards, design
 *  D2/D3): the existing board, else the path a board of that name would take,
 *  so a reference to a board that does not exist can still open and create it. */
export function resolveBoardPath(name: string, boardsByName: Map<string, string>): string {
  return boardsByName.get(name.toLowerCase()) ?? boardPathForName(name)
}

/** The pages whose Markdown writes a board reference to `path`
 *  (add-whiteboards: Referenced by), in scan order. */
export function boardReferrers(graph: Graph, path: string): string[] {
  return graph.boardReferrers.get(path) ?? []
}

/** Write-through for a board save (add-whiteboards, design D7/D9), mirroring
 *  `upsertPage`: persist the scene, make the file part of the listing the
 *  Boards section and the referrer map read, and leave the page scan untouched.
 *  Non-optimistic: the graph changes only after the write resolves, so a
 *  failed save leaves the index consistent with disk. */
export async function upsertBoard(
  storage: VaultStorage,
  current: VaultIndex,
  path: string,
  scene: string,
): Promise<VaultIndex> {
  await storage.write(path, scene)
  const files = new Set(current.graph.files)
  files.add(path)
  return { graph: fold(current.graph.pages, files), snapshot: current.snapshot, pins: current.pins }
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
  const pinnedRows: IndexPage[] = []
  const shown = new Set<string>()
  for (const path of pins) {
    const page = byPath.get(path)
    if (page && !shown.has(page.path)) {
      pinnedRows.push(page)
      shown.add(page.path)
    }
  }
  const rest = [...byPath.values()].filter((page) => !shown.has(page.path))
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

/** The zero-padded date-name shape the journal directory and the calendar
 *  agree on. Shape alone is not enough: see `journalDayName`. */
const DATE_NAME = /^(\d{4})-(\d{2})-(\d{2})$/

const MONTH_LENGTHS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]

function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/** The date string when `name` is a real calendar day in zero-padded
 *  `YYYY-MM-DD` form, else null (design D1). Checked by component, never by
 *  `Date`: `new Date('2026-09-16')` parses as UTC and `new Date(y, m, d)` maps
 *  years 0-99 to 1900+, so both would answer a different question than "is this
 *  a day the journal calendar can show". A name that is not a real day is not
 *  a journal day and keeps the ordinary page rule. */
export function journalDayName(name: string): string | null {
  const match = DATE_NAME.exec(name)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  if (month < 1 || month > 12 || day < 1) return null
  const length = month === 2 && isLeapYear(year) ? 29 : MONTH_LENGTHS[month - 1]
  return day <= length ? name : null
}

/** The journal day's vault path for a date name (design D1). */
export function journalDayPath(name: string): string {
  return `journals/${name}.md`
}

/** The path a reference navigates to (design D2): a date name is the journal
 *  day, every other name is the page it matches, else a page under `pages/`
 *  that materializes on first save. No normalization — an unpadded date stays
 *  a page name, so it still matches its own reference text and backlinks. */
export function resolveReferencePath(name: string, byName: Map<string, string>): string {
  return journalDayName(name) !== null
    ? journalDayPath(name)
    : (byName.get(name.toLowerCase()) ?? `pages/${name}.md`)
}

/** Fold scanned pages into the graph: name resolution + backlinks (D5). */
function fold(pages: Map<string, IndexPage>, files: Set<string>): Graph {
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
  // Boards resolve in their own namespace (add-whiteboards, design D1/D9): a
  // board name never collides with a page name, and only a `#!` token feeds
  // the reverse set.
  const boards = listBoards(files)
  const boardsByName = new Map<string, string>()
  for (const path of boards) {
    const name = boardStem(path).toLowerCase()
    if (!boardsByName.has(name)) boardsByName.set(name, path)
  }
  const boardReferrers = new Map<string, string[]>()
  for (const [path, page] of pages) {
    for (const ref of page.boards) {
      const boardPath = boardsByName.get(ref.target.toLowerCase())
      if (boardPath === undefined) continue
      const list = boardReferrers.get(boardPath)
      if (list) list.push(path)
      else boardReferrers.set(boardPath, [path])
    }
  }
  return {
    pages,
    byName,
    backlinks,
    files,
    assets: listAssets(files),
    boards,
    boardsByName,
    boardReferrers,
  }
}
