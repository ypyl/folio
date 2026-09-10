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

// Word form: what `REF` accepts between '#' and the caret. A name is only
// word-shaped if the same class accepts the whole name (referenceToken).
const WORD_FORM = /^[\w-]*$/
const WORD_NAME = /^[\w-]+$/
// `REF`'s trailing guards, mirrored: a reference ends where the next character
// cannot extend it. A closing bracket is the bracketed form's version of the
// same guard (see referenceTrigger).
const WORD_TAIL = /[\w/-]/
const CLOSING_BRACKET = /\]/

/**
 * The reference being typed at the caret, or null (add-reference-autocomplete,
 * design D1). `before`/`after` are the textblock's text on either side of the
 * caret; `from`/`to` are the token's offsets in `before`. The trigger is the
 * longest token prefix `REF` would accept, so the popup's replace range is
 * exactly the text the user is typing.
 */
export type ReferenceTrigger = {
  kind: 'word' | 'bracketed'
  /** Raw token text from '#' through the caret: `#rea`, `#[[read`. */
  text: string
  /** The typed name fragment: `rea`, `read`. Never empty. */
  query: string
  from: number
  to: number
}

/**
 * Detect an in-progress reference token ending at the caret. Returns null when
 * there is none, when the caret is not at the token's end (completing there
 * would leave the rest of the token behind), and for a bare `#` or `#[[` with
 * nothing typed yet (design D1: no empty query, so a Markdown heading being
 * typed never flashes a popup).
 */
export function referenceTrigger(before: string, after: string): ReferenceTrigger | null {
  // Backwards to the last '#', not forwards from the first: with two openers on
  // one line (`#[[a #[[b`) the one being typed is the last one.
  const hash = before.lastIndexOf('#')
  if (hash === -1) return null
  // `REF`'s lookbehind (?<![\w]): a '#tag' inside a word is not a reference.
  if (hash > 0 && /\w/.test(before[hash - 1])) return null
  const rest = before.slice(hash + 1)
  const text = before.slice(hash)
  if (rest.startsWith('[[')) {
    const query = rest.slice(2)
    // A ']' in the typed text means the token is closed or the caret sits
    // inside it; a ']' after the caret would be left behind by the
    // replacement. Both are debris, so neither is a trigger.
    if (query === '' || query.includes(']') || CLOSING_BRACKET.test(after)) return null
    return { kind: 'bracketed', text, query, from: hash, to: before.length }
  }
  if (rest === '' || !WORD_FORM.test(rest)) return null
  if (WORD_TAIL.test(after[0] ?? '')) return null
  return { kind: 'word', text, query: rest, from: hash, to: before.length }
}

/**
 * The reference token to write for `name` (add-reference-autocomplete, design
 * D3): the trigger's form decides, so a `#[[` trigger never loses its brackets,
 * and a `#` trigger falls back to brackets when the name is not a single word.
 * "Word" is exactly `REF`'s `[\w-]+` (ASCII letters, digits, `_`, `-`), so the
 * result always tokenizes back to this same name.
 */
export function referenceToken(name: string, form: 'word' | 'bracketed'): string {
  return form === 'word' && WORD_NAME.test(name) ? `#${name}` : `#[[${name}]]`
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
