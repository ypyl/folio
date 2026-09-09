// Pure Markdown page-reference extraction (ADR-0012, page-references spec).
// No IO. The canonical token regex lives here so the vault index tokenizes
// references exactly as the editor preserves them (design D6).

export type Link = {
  target: string // page name, exactly as referenced (trimmed)
  via: 'word' | 'bracketed' // lexical form, display only (ADR-0012)
}

// One reference token covers both forms. The lookbehind keeps '#tag' inside
// 'word#tag' (URL fragments etc.) from being read as a reference; the
// lookahead keeps other tools' '#tag/word' conventions out (ADR-0012). The
// `\\?` tolerates the commonmark escape the editor's serializer applies to
// `[[` on save (`#\[[Page]]`), so an editor-authored reference tokenizes
// exactly as it lies on disk (design D6).
export const REF = /(?<![\w])#\\?\[\\?\[([^\]]+)\]\]|(?<![\w])#([\w-]+)(?![\w/-])/g

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
