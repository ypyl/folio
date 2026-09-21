// Pure Markdown extraction, no IO. The canonical token regex lives here so the
// vault index tokenizes references exactly as the editor preserves them (design
// D6), and the inline-link scanner lives here so the index reads a page's asset
// destinations by the same syntax the editor writes them with.

import { isVaultRelative } from './assetOpen'

export type Link = {
  target: string // page name, exactly as referenced (trimmed)
  via: 'word' | 'bracketed' // lexical form, display only (ADR-0012)
}

/** A board reference in page content (add-whiteboards, ADR-0012 amendment):
 *  the same two lexical forms as a page reference, marked with `!`. */
export type BoardRef = {
  target: string // board name, exactly as referenced (trimmed)
  via: 'word' | 'bracketed'
}

/** Which namespace a reference token names (add-whiteboards, design D2). */
export type ReferenceKind = 'page' | 'board'

/** A reference token's source range in a string, plus its target (badge
 *  rendering). `from`/`to` are string offsets: the editor shifts them by the
 *  text node's document position. */
type ReferenceRange = {
  from: number
  to: number
  target: string
  kind: ReferenceKind
}

// One reference token covers all four forms: the page forms (`#word`,
// `#[[Page]]`) and the board forms (`#!word`, `#![[Board name]]`). The
// lookbehind keeps '#tag' inside 'word#tag' (URL fragments etc.) from being
// read as a reference; the lookahead keeps other tools' '#tag/word'
// conventions out (ADR-0012). The `\\?` tolerates the commonmark escape the
// editor's serializer applies to `[[` on save (`#\[[Page]]`), so an
// editor-authored reference tokenizes exactly as it lies on disk (design D6).
// The board alternatives sit first; `!` is not a page-name character, so the
// page forms can never claim them.
const REF =
  /(?<![\w])#!\\?\[\\?\[([^\]]+)\]\]|(?<![\w])#!([\w-]+)(?![\w/-])|(?<![\w])#\\?\[\\?\[([^\]]+)\]\]|(?<![\w])#([\w-]+)(?![\w/-])/g

/**
 * Every reference token in `content` with its source range, in order of
 * appearance. Unlike `parseLinks`, repeats are not collapsed: the editor
 * badges each occurrence, and the two share the same `REF` regex so a token
 * the index counts is exactly a token the editor marks (design D6).
 */
export function findReferenceRanges(content: string): ReferenceRange[] {
  const ranges: ReferenceRange[] = []
  for (const ref of matchRefs(content)) {
    ranges.push({ from: ref.from, to: ref.to, target: ref.target, kind: ref.kind })
  }
  return ranges
}

/** One reference token, its source range, its kind, and its lexical form: the
 *  shared read of `REF`, so the badge pass and the two index extractors cannot
 *  disagree about what is a token. */
type RefMatch = ReferenceRange & { via: 'word' | 'bracketed' }

function* matchRefs(content: string): Generator<RefMatch> {
  for (const match of content.matchAll(REF)) {
    const from = match.index ?? 0
    const board = match[1] !== undefined || match[2] !== undefined
    const bracketed = match[1] ?? match[3]
    const target = (bracketed ?? match[2] ?? match[4]).trim()
    if (target === '') continue
    yield {
      from,
      to: from + match[0].length,
      target,
      kind: board ? 'board' : 'page',
      via: bracketed !== undefined ? 'bracketed' : 'word',
    }
  }
}

/** Extract every board reference in `content`, in order of appearance.
 *  Repeated references to the same board collapse to the first occurrence, the
 *  same rule `parseLinks` applies to pages. `#!migration` and `#![[Migration]]`
 *  are the same board, unlike the page forms' two spellings of one name. */
export function parseBoardRefs(content: string): BoardRef[] {
  const refs: BoardRef[] = []
  const seen = new Set<string>()
  for (const ref of matchRefs(content)) {
    if (ref.kind !== 'board') continue
    const key = ref.target.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    refs.push({ target: ref.target, via: ref.via })
  }
  return refs
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
 * caret. The trigger is the longest token prefix `REF` would accept, so the
 * popup's replace range is exactly the text the user is typing.
 */
export type ReferenceTrigger = {
  kind: 'word' | 'bracketed'
  /** Raw token text from '#' through the caret: `#rea`, `#[[read`. */
  text: string
  /** The typed name fragment: `rea`, `read`. Never empty. */
  query: string
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
    return { kind: 'bracketed', text, query }
  }
  if (rest === '' || !WORD_FORM.test(rest)) return null
  if (WORD_TAIL.test(after[0] ?? '')) return null
  return { kind: 'word', text, query: rest }
}

/** The board-reference token being typed at the caret (`#!` / `#![[`): the
 *  page trigger with the board sigil (add-whiteboards, design D2). */
export type BoardTrigger = {
  board: true
  kind: 'word' | 'bracketed'
  /** Raw token text from `#!` through the caret: `#!Mig`, `#![[Mig`. */
  text: string
  /** The typed name fragment: `Mig`. Never empty. */
  query: string
}

/**
 * Detect an in-progress board-reference token ending at the caret. The same
 * guards as `referenceTrigger`: no empty query, no interior `]`, no closing
 * bracket after the caret, and no word character extending the token. Tried
 * before the page trigger, since `#!` is not a page form at all.
 */
export function boardReferenceTrigger(before: string, after: string): BoardTrigger | null {
  const bang = before.lastIndexOf('#!')
  if (bang === -1) return null
  if (bang > 0 && /\w/.test(before[bang - 1])) return null
  const text = before.slice(bang)
  const rest = before.slice(bang + 2)
  if (rest.startsWith('[[')) {
    const query = rest.slice(2)
    if (query === '' || query.includes(']') || CLOSING_BRACKET.test(after)) return null
    return { board: true, kind: 'bracketed', text, query }
  }
  if (rest === '' || !WORD_FORM.test(rest)) return null
  if (WORD_TAIL.test(after[0] ?? '')) return null
  return { board: true, kind: 'word', text, query: rest }
}

/**
 * The link destination being typed at the caret (add-asset-references, design
 * D1/D5): the vault-file completion's trigger. `text` is the typed destination,
 * `label` the text already written between '[' and ']' (empty when none), and
 * `image` whether the construct is an image's. All three are needed by the
 * accept step, which replaces the whole construct.
 */
export type DestinationTrigger = {
  kind: 'destination'
  /** The typed destination after `](`: `q3`, `assets/q3`. Never empty. */
  text: string
  /** The typed label between '[' and ']'. May be empty. */
  label: string
  /** Whether the character before '[' is '!', so an image is being written. */
  image: boolean
}

/**
 * Detect an in-progress link destination ending at the caret. Returns null when
 * there is none, so an ordinary Markdown link behaves exactly as it did before
 * (design D2): a bare `](`, a destination the caret is not at the end of, a
 * fragment, a scheme, an absolute path, or a `](` with no `[` to open a label.
 */
export function linkDestinationTrigger(before: string, after: string): DestinationTrigger | null {
  // Backwards to the last `](`, not forwards from the first: with two links on
  // one line the one being typed is the last one.
  const open = before.lastIndexOf('](')
  if (open === -1) return null
  const text = before.slice(open + 2)
  // Nothing typed yet is the moment before a destination exists. Offering the
  // whole vault there would flash a popup on every link, so the empty
  // destination is not a trigger (design D2).
  if (text === '') return null
  // A ')' in the typed text is the destination closing, and one right after
  // the caret is the same thing read from the other side: completing either
  // would leave the rest of a closed destination behind.
  if (text.includes(')') || after.startsWith(')')) return null
  // A newline is a hard break: a destination is one line.
  if (text.includes('\n')) return null
  // The label must be opened and closed around the `](`: a stray `](` with no
  // `[` before it, or a nested label (`[a [b]](q`), has no construct to
  // replace, so neither is a trigger.
  const label = before.lastIndexOf('[', open)
  if (label === -1 || before.slice(label + 1, open).includes(']')) return null
  // A fragment names a place in this document, and a scheme or a leading '/'
  // is not a vault path — the reference picker and the open gesture apply the
  // same two rules.
  if (text.startsWith('#') || !isVaultRelative(text)) return null
  return {
    kind: 'destination',
    text,
    label: before.slice(label + 1, open),
    image: before[label - 1] === '!',
  }
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

/** The board-reference token for `name` (add-whiteboards, design D2): the page
 *  token with a `!`, so `#!word` / `#![[Many Words]]`. */
export function boardToken(name: string, form: 'word' | 'bracketed'): string {
  return form === 'word' && WORD_NAME.test(name) ? `#!${name}` : `#![[${name}]]`
}

/**
 * Whether `name` can be written as a board token that reads back as that exact
 * name. The board rule is the page rule (`isReferenceable`): a name containing
 * `]` has no token form, and surrounding whitespace is trimmed by parsing, so
 * both would resolve to something else.
 */
export function isBoardReferenceable(name: string): boolean {
  return findReferenceRanges(boardToken(name, 'word')).some(
    (range) => range.kind === 'board' && range.target === name,
  )
}

/**
 * Whether `name` can be written as a reference token that reads back as that
 * exact name (add-reference-autocomplete D3, drag-references-into-editor).
 * Names containing `]` have no token form at all, and surrounding whitespace is
 * trimmed by reference parsing, so both would resolve to something else. Asking
 * the canonical tokenizer keeps this honest. Two consumers: the completion pool
 * never offers such a name, and a page row with such a name is not a drag
 * source.
 */
export function isReferenceable(name: string): boolean {
  return findReferenceRanges(referenceToken(name, 'word'))[0]?.target === name
}

/**
 * Extract every page reference in `content`, in order of appearance.
 * Repeated references to the same page (case-insensitive, per the
 * resolution rules of the vault-index spec) collapse to the first occurrence.
 */
export function parseLinks(content: string): Link[] {
  const links: Link[] = []
  const seen = new Set<string>()
  for (const ref of matchRefs(content)) {
    if (ref.kind !== 'page') continue
    const key = ref.target.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    links.push({ target: ref.target, via: ref.via })
  }
  return links
}

/**
 * Every vault-relative path a page's inline links and images target, in order
 * of appearance and deduplicated (add-asset-navigation, design D3). The index
 * keeps the ones that name a file it holds; this function only reads the
 * document, so it stays a pure function of content — the property that lets a
 * page's candidates be carried over on refresh exactly like its references.
 *
 * A destination is a URL, so it is percent-decoded before it is returned
 * (`assets/my%20report.pdf` names the file with a space); a destination whose
 * escapes cannot be decoded is kept as the literal path it spells, so a file
 * named `100% done.pdf` still resolves. Angle brackets and a quoted title are
 * Markdown's own syntax, not part of the path, and are removed. Destinations
 * are read per line: an inline link cannot span one, and not bounding the scan
 * would let an unmatched `](` swallow the rest of the document.
 */
export function parseAssetPaths(content: string): string[] {
  const paths: string[] = []
  const seen = new Set<string>()
  for (const body of inlineDestinations(content)) {
    const path = assetPath(body)
    if (path === null || seen.has(path)) continue
    seen.add(path)
    paths.push(path)
  }
  return paths
}

/** The body of every `](` … `)` on each line, in order (the destination of an
 *  inline link or image; the `!` of an image never changes it). */
function* inlineDestinations(content: string): Generator<string> {
  let lineStart = 0
  while (lineStart <= content.length) {
    const lineEnd = content.indexOf('\n', lineStart)
    const line = lineEnd === -1 ? content.slice(lineStart) : content.slice(lineStart, lineEnd)
    let opened = line.indexOf('](')
    while (opened !== -1) {
      const close = matchingParen(line, opened + 1)
      if (close === -1) break
      yield line.slice(opened + 2, close)
      opened = line.indexOf('](', close + 1)
    }
    if (lineEnd === -1) return
    lineStart = lineEnd + 1
  }
}

/** The index of the `)` matching the `(` at `open`, counting nesting so a
 *  destination may contain its own parentheses (`assets/a (draft).pdf`); -1
 *  when the line has no matching close. */
function matchingParen(line: string, open: number): number {
  let depth = 0
  for (let i = open; i < line.length; i++) {
    const char = line[i]
    if (char === '(') depth++
    else if (char === ')' && --depth === 0) return i
  }
  return -1
}

/** A link destination as a vault path, or null when it is not one. */
function assetPath(body: string): string | null {
  let path = body.trim()
  // A fragment names a place in this document, not a file — the same rule the
  // open gesture applies to an href.
  if (path.startsWith('#')) return null
  if (path.startsWith('<') && path.endsWith('>')) path = path.slice(1, -1)
  // A title is followed by more of the link, not by its close, so only a
  // *trailing* quoted string can be one. The parenthesized title form is left
  // alone: it is indistinguishable from a filename ending in ` (something)`.
  const titled = /^(.*?)\s+("[^"]*"|'[^']*')$/.exec(path)
  if (titled) path = titled[1]
  const decoded = decodePath(path)
  return isVaultRelative(decoded) ? decoded : null
}

/** Percent-decoding, with the literal path as the fallback for a destination
 *  that carries a `%` the browser cannot decode. */
function decodePath(path: string): string {
  try {
    return decodeURIComponent(path)
  } catch {
    return path
  }
}
