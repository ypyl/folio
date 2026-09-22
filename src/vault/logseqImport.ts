// One-way Logseq import: reads a Logseq graph through the VaultStorage seam,
// translates its conventions into Folio's Markdown rules, and merges the result
// into a destination without overwriting (change add-logseq-import). The rules
// mirror scripts/migrate-logseq.mjs and MIGRATION_LOGSEQ_FOLIO.md; the pure
// functions here are their browser-side implementation and are unit-tested with
// strings, exactly like ./parse.
//
// The importer is input-only: it never teaches the index, editor, or parser to
// read Logseq conventions at runtime (ADR-0012, ADR-0024).

import type { VaultStorage } from './storage'

/** The characters Logseq percent-encodes that the importer decodes before
 *  mapping. Anything else stays a literal `%XX`: a lone `%` in prose is not an
 *  escape. */
const DECODABLE = new Set([...':"|?>.\\/#%<*'])

/**
 * Normalize a Logseq filename stem into a legal, visible, referenceable Folio
 * page name (MIGRATION_LOGSEQ_FOLIO.md §3, Option B): decode the known escapes,
 * then replace characters that Windows forbids, that Folio hides (a leading
 * `.`), or that break the `#[[...]]` token (`]`).
 */
export function normalizeLogseqName(raw: string): string {
  let name = String(raw).trim()
  name = name.replace(/%([0-9A-Fa-f]{2})/g, (match, hex: string) => {
    const ch = String.fromCharCode(parseInt(hex, 16))
    return DECODABLE.has(ch) ? ch : match
  })
  name = name.replace(/___/g, '-') // Logseq's namespace separator (was `/`)
  name = name.replace(/[\\/]/g, '-')
  name = name.replace(/:/g, '-')
  name = name.replace(/"/g, "'")
  name = name.replace(/\|/g, '-')
  name = name.replace(/\?/g, '')
  name = name.replace(/>/g, '-')
  name = name.replace(/</g, '(')
  name = name.replace(/\*/g, 'x')
  name = name.replace(/\[/g, '(')
  name = name.replace(/\]/g, ')')
  name = name.replace(/^\.+/, '') // a leading dot would hide the file
  name = name.replace(/[. ]+$/, '') // Windows forbids a trailing dot or space
  return name.trim()
}

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
}

/** `Apr 30th, 2025` -> `2025-04-30`, else null; validates the real calendar. */
export function humanDateToDay(name: string): string | null {
  const m = name.match(/^([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})$/)
  if (!m) return null
  const month = MONTHS[m[1].slice(0, 3).toLowerCase()]
  if (!month) return null
  const day = Number(m[2])
  const year = Number(m[3])
  const dt = new Date(Date.UTC(year, month - 1, day))
  if (dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) return null
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Journal stems become hyphens: `2024_07_02` -> `2024-07-02`. */
export function journalFileName(stem: string): string {
  return /^\d{4}_\d{2}_\d{2}$/.test(stem) ? stem.replace(/_/g, '-') : normalizeLogseqName(stem)
}

/** Per-run rewrite counters, surfaced in the result report. */
export type ImportStats = {
  plainWikilinks: number
  bracketedRefs: number
  aliasedLinks: number
  humanDates: number
  blockRefs: number
  taskRefs: number
  droppedProps: number
  droppedDrawer: number
  assetPathRewrites: number
}

export function emptyImportStats(): ImportStats {
  return {
    plainWikilinks: 0,
    bracketedRefs: 0,
    aliasedLinks: 0,
    humanDates: 0,
    blockRefs: 0,
    taskRefs: 0,
    droppedProps: 0,
    droppedDrawer: 0,
    assetPathRewrites: 0,
  }
}

const FENCE_OPEN = /^(\s*)(?:[-*]\s+)?(`{3,}|~{3,})/
const FENCE_CLOSE = /^(\s*)(`{3,}|~{3,})\s*$/

/**
 * Rewrite one file's content from Logseq forms to Folio forms
 * (MIGRATION_LOGSEQ_FOLIO.md §4–§7). Pure: the only state it carries is the
 * `uuid -> owning page` map and the running counters.
 */
export function rewriteLogseqContent(
  text: string,
  uuidToOwner: Map<string, string>,
  srcStem: string,
  stats: ImportStats,
): string {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  const out: string[] = []
  let fence: string | null = null

  for (const raw of lines) {
    // Indentation: Logseq nests with tabs, Folio writes two spaces per level.
    let line = raw.replace(/^\t+/, (m) => '  '.repeat(m.length))

    const fm = line.match(FENCE_OPEN)
    if (fence) {
      const cm = line.match(FENCE_CLOSE)
      if (cm && cm[2][0] === fence[0] && cm[2].length >= fence.length) fence = null
      out.push(line)
      continue
    }
    if (fm) {
      fence = fm[2]
      out.push(line)
      continue
    }

    // UI-only block properties are dropped; `collapsed::`/`query-table::` also
    // when Logseq wrote them as a bullet. A `title::` equal to the stem is
    // redundant. User data properties are kept as literal text.
    if (
      /^\s*(?:[-*]\s+)?(?:collapsed|query-table)::/.test(line) ||
      /^\s*(?:id|template)::/.test(line)
    ) {
      stats.droppedProps++
      continue
    }
    const titleProp = line.match(/^\s*title::\s*(.*)$/)
    if (titleProp && titleProp[1].trim() === srcStem) {
      stats.droppedProps++
      continue
    }
    if (/^\s*:LOGBOOK:\s*$/.test(line) || /^\s*:END:\s*$/.test(line)) {
      stats.droppedDrawer++
      continue
    }

    // Task state becomes a page reference: `- DONE x` -> `- #DONE x`.
    line = line.replace(
      /^(\s*[-*]\s+)(DONE|TODO|DOING|LATER|NOW)(?=\s|$)/,
      (_m, lead: string, key: string) => {
        stats.taskRefs++
        return `${lead}#${key}`
      },
    )

    // Asset destinations are vault-root-relative in Folio, in links, images,
    // and `file-path::` values alike.
    line = line.replace(/\]\((?:(\.\.\/))?(assets|draws|whiteboards)\//g, () => {
      stats.assetPathRewrites++
      return '](assets/'
    })
    line = line.replace(/\.\.\/(assets|draws|whiteboards)\//g, () => {
      stats.assetPathRewrites++
      return 'assets/'
    })

    // `[[X]]` -> `#[[X]]`; `#[[X]]` normalized; a `| alias` suffix is dropped.
    line = line.replace(/(#?)\[\[([^[\]]+)\]\]/g, (match, hash: string, inner: string) => {
      const hadAlias = inner.includes('|')
      let name = (hadAlias ? inner.split('|')[0] : inner).trim()
      if (name === '') return match
      if (hadAlias) stats.aliasedLinks++
      const day = humanDateToDay(name)
      if (day) {
        stats.humanDates++
        name = day
      } else {
        name = normalizeLogseqName(name)
      }
      if (hash === '#') stats.bracketedRefs++
      else stats.plainWikilinks++
      return `#[[${name}]]`
    })

    // A block reference flattens to the page that owns the block.
    line = line.replace(/\(\(([0-9a-fA-F-]{36})\)\)/g, (match, uuid: string) => {
      const owner = uuidToOwner.get(uuid.toLowerCase())
      if (!owner) return match
      stats.blockRefs++
      return `#[[${owner}]]`
    })

    out.push(line)
  }

  return out.join('\n')
}

// ------------------------------------------------------------- source layout

const isMarkdown = (path: string): boolean => path.toLowerCase().endsWith('.md')
const isHidden = (path: string): boolean => path.split('/').some((seg) => seg.startsWith('.'))
const stemOf = (path: string): string => path.slice(path.lastIndexOf('/') + 1).replace(/\.md$/i, '')

function isPageSource(path: string): boolean {
  return (
    isMarkdown(path) &&
    !isHidden(path) &&
    path.startsWith('pages/') &&
    !path.startsWith('pages/.folio/') &&
    !path.startsWith('pages/journals/')
  )
}

function isJournalSource(path: string): boolean {
  return (
    isMarkdown(path) &&
    !isHidden(path) &&
    (path.startsWith('journals/') || path.startsWith('pages/journals/'))
  )
}

function isAssetSource(path: string): boolean {
  return (
    !isHidden(path) &&
    (path.startsWith('assets/') || path.startsWith('draws/') || path.startsWith('whiteboards/'))
  )
}

const pageTarget = (path: string): string => `pages/${normalizeLogseqName(stemOf(path))}.md`
const journalTarget = (path: string): string => `journals/${journalFileName(stemOf(path))}.md`

function assetTarget(path: string): string {
  if (path.startsWith('assets/')) return `assets/${path.slice('assets/'.length)}`
  return `assets/${path.slice(path.lastIndexOf('/') + 1)}`
}

function outputNameFor(path: string): string {
  return isJournalSource(path) ? journalFileName(stemOf(path)) : normalizeLogseqName(stemOf(path))
}

// --------------------------------------------------------------- orchestration

export type ImportProgress = {
  phase: 'scanning' | 'writing'
  done: number
  total: number
}

export type ImportReport = {
  /** Markdown files written. */
  written: number
  /** Planned files skipped because the destination already held them. */
  skipped: number
  /** Assets copied. */
  assetsCopied: number
  /** Output paths two source files mapped to (first source wins). */
  collisions: string[]
  stats: ImportStats
}

export type ImportResult = { ok: true; report: ImportReport } | { ok: false; error: string }

type Planned = { path: string; content: string }

/**
 * Run a whole import. Scans the source (reads every page and journal to build
 * the block-reference map), plans the output, then writes only paths the
 * destination does not already hold. Never writes `.folio/`, never overwrites,
 * never deletes. Reports progress as `{ phase, done, total }`.
 */
export async function runLogseqImport(
  source: VaultStorage,
  dest: VaultStorage,
  onProgress?: (progress: ImportProgress) => void,
): Promise<ImportResult> {
  const stats = emptyImportStats()
  const collisions: string[] = []

  try {
    const files = await source.list('')
    const pagePaths = files.filter(isPageSource).sort()
    const journalPaths = files.filter(isJournalSource).sort()
    const assetPaths = files.filter(isAssetSource).sort()

    // Scanning: read every page and journal, and index block ids to owners.
    const contents = new Map<string, string>()
    const uuidToOwner = new Map<string, string>()
    const scanTotal = pagePaths.length + journalPaths.length
    onProgress?.({ phase: 'scanning', done: 0, total: scanTotal })
    let scanned = 0
    for (const path of [...pagePaths, ...journalPaths]) {
      const text = await source.read(path)
      contents.set(path, text)
      const owner = outputNameFor(path)
      for (const m of text.matchAll(/\bid::\s*([0-9a-fA-F-]{36})/g)) {
        uuidToOwner.set(m[1].toLowerCase(), owner)
      }
      scanned++
      onProgress?.({ phase: 'scanning', done: scanned, total: scanTotal })
    }

    // Planning: pages, with first-source-wins on a normalized-name collision.
    const planned: Planned[] = []
    const seen = new Set<string>()
    for (const path of pagePaths) {
      const target = pageTarget(path)
      const key = target.toLowerCase()
      if (seen.has(key)) {
        collisions.push(target)
        continue
      }
      seen.add(key)
      const content = rewriteLogseqContent(
        contents.get(path) ?? '',
        uuidToOwner,
        stemOf(path),
        stats,
      )
      planned.push({ path: target, content })
    }

    // Journals fold: two sources for one day concatenate into one file.
    const journalGroups = new Map<string, { path: string; parts: string[] }>()
    for (const path of journalPaths) {
      const target = journalTarget(path)
      const key = target.toLowerCase()
      const group = journalGroups.get(key) ?? { path: target, parts: [] }
      group.parts.push(
        rewriteLogseqContent(contents.get(path) ?? '', uuidToOwner, stemOf(path), stats),
      )
      journalGroups.set(key, group)
    }
    for (const group of journalGroups.values()) {
      planned.push({ path: group.path, content: group.parts.join('\n') })
    }

    // Writing: skip every path the destination already holds (case-insensitive,
    // for Windows), and never write the destination's `.folio/` meta.
    const existing = new Set((await dest.list('')).map((path) => path.toLowerCase()))
    let written = 0
    let skipped = 0
    let assetsCopied = 0
    const writeTotal = planned.length + assetPaths.length
    let done = 0
    onProgress?.({ phase: 'writing', done, total: writeTotal })

    for (const item of planned) {
      const key = item.path.toLowerCase()
      if (key.startsWith('.folio/') || existing.has(key)) {
        skipped++
      } else {
        const content = item.content.endsWith('\n') ? item.content : `${item.content}\n`
        await dest.write(item.path, content)
        existing.add(key)
        written++
      }
      done++
      onProgress?.({ phase: 'writing', done, total: writeTotal })
    }

    for (const path of assetPaths) {
      const target = assetTarget(path)
      const key = target.toLowerCase()
      if (key.startsWith('.folio/') || existing.has(key)) {
        skipped++
      } else {
        const blob = await source.readBinary(path)
        await dest.writeBinary(target, blob)
        existing.add(key)
        assetsCopied++
      }
      done++
      onProgress?.({ phase: 'writing', done, total: writeTotal })
    }

    return { ok: true, report: { written, skipped, assetsCopied, collisions, stats } }
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) }
  }
}
