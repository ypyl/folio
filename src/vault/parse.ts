// Pure Markdown page-reference extraction (ADR-0012, page-references spec).
// No IO. The canonical token regex lives here so the vault index tokenizes
// references exactly as the editor preserves them (design D6).

export type Link = {
  target: string // page name, exactly as referenced (trimmed)
  via: 'word' | 'bracketed' // lexical form, display only (ADR-0012)
}

/** A reference token's source range in a string, plus its target (badge
 *  rendering). `from`/`to` are string offsets: the editor shifts them by the
 *  text node's document position. */
export type ReferenceRange = {
  from: number
  to: number
  target: string
}

// One reference token covers both forms. The lookbehind keeps '#tag' inside
// 'word#tag' (URL fragments etc.) from being read as a reference; the
// lookahead keeps other tools' '#tag/word' conventions out (ADR-0012). The
// `\\?` tolerates the commonmark escape the editor's serializer applies to
// `[[` on save (`#\[[Page]]`), so an editor-authored reference tokenizes
// exactly as it lies on disk (design D6).
const REF = /(?<![\w])#\\?\[\\?\[([^\]]+)\]\]|(?<![\w])#([\w-]+)(?![\w/-])/g

/**
 * Every reference token in `content` with its source range, in order of
 * appearance. Unlike `parseLinks`, repeats are not collapsed: the editor
 * badges each occurrence, and the two share the same `REF` regex so a token
 * the index counts is exactly a token the editor marks (design D6).
 */
export function findReferenceRanges(content: string): ReferenceRange[] {
  const ranges: ReferenceRange[] = []
  for (const match of content.matchAll(REF)) {
    const from = match.index ?? 0
    const bracketed = match[1]
    const target = (bracketed ?? match[2]).trim()
    if (target === '') continue
    ranges.push({ from, to: from + match[0].length, target })
  }
  return ranges
}

/**
 * Extract every page reference in `content`, in order of appearance.
 * Repeated references to the same page (case-insensitive, per the
 * resolution rules of the vault-index spec) collapse to the first occurrence.
 */
export function parseLinks(content: string): Link[] {
  const links: Link[] = []
  const seen = new Set<string>()
  for (const match of content.matchAll(REF)) {
    const bracketed = match[1]
    const target = (bracketed ?? match[2]).trim()
    if (target === '') continue
    const key = target.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    links.push({ target, via: bracketed !== undefined ? 'bracketed' : 'word' })
  }
  return links
}
