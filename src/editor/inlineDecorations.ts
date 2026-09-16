// Inline decorations over literal text (add-reference-badges; render-struck-text
// adds the second kind; incremental invalidation from
// bound-editor-per-keystroke-work, design D1). Two decorations share one walk
// over the changed blocks:
//
//   - Reference badges: a chip over every page reference token, plus the
//     click/keyboard path that opens the target. The canonical `REF` regex is
//     shared with the index (design D6), so what the editor badges is exactly
//     what the vault counts.
//   - Struck runs: a line through `~~text~~`.
//
// Both are presentational — the document keeps the literal characters — so
// Markdown stays canonical (ADR-0001, ADR-0009) and no serializer or second
// tokenizer exists. Neither creates a formatting mark, so neither round-trips
// anything and neither can be toggled: the text is the state.

import { $prose } from '@milkdown/utils'
import type { Node as ProseNode } from '@milkdown/prose/model'
import type { EditorState, Transaction } from '@milkdown/prose/state'
import { Plugin, PluginKey } from '@milkdown/prose/state'
import {
  AddMarkStep,
  RemoveMarkStep,
  ReplaceAroundStep,
  ReplaceStep,
} from '@milkdown/prose/transform'
import type { Step } from '@milkdown/prose/transform'
import type { EditorView } from '@milkdown/prose/view'
import { Decoration, DecorationSet } from '@milkdown/prose/view'
import { findReferenceRanges } from '../vault/parse'

/** One reference token's document positions and its page-name target. */
export type ReferenceRef = {
  from: number
  to: number
  target: string
}

/** A range of whole top-level blocks (design D1). */
export type BlockRange = {
  from: number
  to: number
}

type ReferenceState = {
  decorations: DecorationSet
  refs: ReferenceRef[]
}

/** What a scan produced: the decorations to add, and the refs they cover. */
type ScanResult = {
  marks: Decoration[]
  refs: ReferenceRef[]
}

const referenceKey = new PluginKey<ReferenceState>('folioReferenceBadges')

/**
 * A struck run (render-struck-text): `~~`, then content that carries no tilde
 * and starts and ends with a non-space, then `~~`. Deliberately narrower than
 * GFM's grammar — the app does not parse GFM — and wide enough for the runs a
 * writer types: `~~done~~`, `~~two words~~`. The empty pair, a padded pair, a
 * single tilde, and a tilde inside the run all stay plain, and a longer tilde
 * run cannot be half-matched into one (`[^~\s]` keeps a tilde out of the
 * content's ends as well as its middle).
 */
const STRUCK_RUN = /~~([^~\s](?:[^~]*?[^~\s])?)~~/g

/**
 * A bare URL (open-links-on-ctrl-click): `http://…`, `https://…`, or the
 * `www.…` form writers use. The match stops at whitespace and at brackets, and
 * the trailing punctuation of a sentence is trimmed off it, so
 * `see https://example.com/path.` links the URL and not the full stop.
 */
const BARE_URL = /(?:https?:\/\/|www\.)[^\s<>()[\]]+/g

/** Sentence punctuation that ends a URL rather than belonging to it. */
const TRAILING_PUNCTUATION = /[.,;:!?'"]+$/

/** Schemes the browser can open; anything else (a vault path, a fragment) is
 *  not a target this app can open. */
const EXTERNAL_SCHEMES = new Set(['http:', 'https:', 'mailto:'])

/** Whether this click is the open gesture: Ctrl+Click, or Cmd+Click on macOS. */
function opensInBrowser(event: MouseEvent): boolean {
  return event.ctrlKey || event.metaKey
}

/**
 * Open `href` in the browser: a new tab, or the system browser when the app runs
 * installed. `noopener` keeps the opened page out of this window. Only a URL
 * that already carries a scheme the browser can open is ever opened — a vault
 * path or a fragment would otherwise resolve against the app's own origin and
 * open a tab showing a 404. The `www.` form a writer types counts as https.
 */
export function openExternal(href: string | null | undefined): boolean {
  if (!href) return false
  const candidate = /^www\./i.test(href) ? `https://${href}` : href
  let url: URL
  try {
    // No base: a relative href throws here rather than resolving to the app's
    // own origin, which is what makes it recognisable as not-external.
    url = new URL(candidate)
  } catch {
    return false
  }
  if (!EXTERNAL_SCHEMES.has(url.protocol)) return false
  window.open(url.href, '_blank', 'noopener,noreferrer')
  return true
}

/** The URL text under `pos` in the decoration's own terms: the scan trims
 *  sentence punctuation, so the position is looked up against the same run. */
function urlAt(doc: ProseNode, pos: number): string | null {
  const node = doc.resolve(pos).parent
  const offset = pos - doc.resolve(pos).start()
  for (const found of node.textBetween(0, node.content.size).matchAll(BARE_URL)) {
    const url = found[0].replace(TRAILING_PUNCTUATION, '')
    if (found.index <= offset && offset <= found.index + url.length) return url
  }
  return null
}

/**
 * The decorations for `doc`, or for one range of whole top-level blocks (design
 * D1): reference badges, struck runs, and bare URLs, in one walk. Skips inline
 * code (the `code` mark) and fenced code (`code_block` subtrees): a reference
 * token, a pair of tildes, or a URL inside code is code, not a link.
 */
export function scanInline(doc: ProseNode, range?: BlockRange): ScanResult {
  const refs: ReferenceRef[] = []
  const marks: Decoration[] = []
  const visit = (node: ProseNode, pos: number): boolean | undefined => {
    if (node.type.name === 'code_block') return false
    if (!node.isText || node.text == null) return
    // Milkdown's commonmark preset names the inline-code mark `inlineCode`.
    if (node.marks.some((mark) => mark.type.name === 'inlineCode')) return
    for (const found of findReferenceRanges(node.text)) {
      const from = pos + found.from
      const to = pos + found.to
      refs.push({ from, to, target: found.target })
      marks.push(Decoration.inline(from, to, { class: 'ref' }))
    }
    for (const found of node.text.matchAll(STRUCK_RUN)) {
      const from = pos + found.index
      marks.push(Decoration.inline(from, from + found[0].length, { class: 'strike' }))
    }
    // A link's own text is already under an anchor: decorating it would add a
    // second way to open the same URL for no gain.
    const linked = node.marks.some((mark) => mark.type.name === 'link')
    if (!linked) {
      for (const found of node.text.matchAll(BARE_URL)) {
        const url = found[0].replace(TRAILING_PUNCTUATION, '')
        if (url === '') continue
        const from = pos + found.index
        marks.push(Decoration.inline(from, from + url.length, { class: 'url' }))
      }
    }
    return
  }
  if (range) doc.nodesBetween(range.from, range.to, visit)
  else doc.descendants(visit)
  return { marks, refs }
}

/** A scan's decorations and refs, as the plugin's state. */
function stateFromScan(
  scan: (doc: ProseNode, range?: BlockRange) => ScanResult,
  doc: ProseNode,
): ReferenceState {
  const { marks, refs } = scan(doc)
  return { decorations: DecorationSet.create(doc, marks), refs }
}

/** The decorations and clickable spans for a whole document (the non-incremental
 *  reference the plugin's incremental rescan is tested against). */
export function buildReferenceState(doc: ProseNode): ReferenceState {
  return stateFromScan(scanInline, doc)
}

/**
 * The whole top-level block containing `pos`, or both neighbours when `pos`
 * sits between blocks: an inserted boundary changes the text on either side.
 */
function blockRangeAt(doc: ProseNode, pos: number): BlockRange {
  const at = doc.resolve(Math.max(0, Math.min(pos, doc.content.size)))
  if (at.depth >= 1) return { from: at.before(1), to: at.after(1) }
  const before = at.nodeBefore
  const after = at.nodeAfter
  return {
    from: before ? at.pos - before.nodeSize : at.pos,
    to: after ? at.pos + after.nodeSize : at.pos,
  }
}

function spanning(a: BlockRange, b: BlockRange): BlockRange {
  return { from: Math.min(a.from, b.from), to: Math.max(a.to, b.to) }
}

function overlapping(a: BlockRange, b: BlockRange): boolean {
  return a.from < b.to && b.from < a.to
}

/**
 * The positions a step rewrote, or null for a step that cannot move or retype
 * text. Mark steps count: toggling inline code changes whether a token is a
 * reference without changing a single character (design D1).
 */
function stepRange(step: Step): { from: number; to: number } | null {
  if (step instanceof ReplaceStep || step instanceof ReplaceAroundStep) {
    return { from: step.from, to: step.to }
  }
  if (step instanceof AddMarkStep || step instanceof RemoveMarkStep) {
    return { from: step.from, to: step.to }
  }
  return null
}

/**
 * The whole top-level blocks a transaction touched, as ranges in the document
 * it produced. Expanding each step to whole blocks is what makes structural
 * edits safe: a split or a join rewrites the text nodes on both sides of the
 * boundary, and a reference can move between blocks (design D1).
 */
function affectedRanges(tr: Transaction): BlockRange[] {
  const ranges: BlockRange[] = []
  tr.steps.forEach((step, index) => {
    const touched = stepRange(step)
    if (!touched) return
    // A step's positions are in the coordinates of the document before it ran,
    // so map them forward through the rest of the transaction (including the
    // step's own map, which turns the replaced range into the inserted one).
    const rest = tr.mapping.slice(index)
    ranges.push(
      spanning(
        blockRangeAt(tr.doc, rest.map(touched.from, -1)),
        blockRangeAt(tr.doc, rest.map(touched.to, 1)),
      ),
    )
  })
  // Merge overlaps so a block is never scanned twice in one transaction.
  const merged: BlockRange[] = []
  for (const range of ranges.sort((a, b) => a.from - b.from)) {
    const last = merged[merged.length - 1]
    if (last && range.from <= last.to) merged[merged.length - 1] = spanning(last, range)
    else merged.push(range)
  }
  return merged
}

/**
 * Carry the badges forward and rescan only what the edit touched: map the
 * existing set and refs through the transaction, drop the ones inside the
 * affected ranges, and rescan those blocks (design D1). A keystroke inside one
 * paragraph therefore costs one paragraph, not the document.
 */
function rescan(
  tr: Transaction,
  prev: ReferenceState,
  scan: (doc: ProseNode, range?: BlockRange) => ScanResult,
): ReferenceState {
  const ranges = affectedRanges(tr)
  let decorations = prev.decorations.map(tr.mapping, tr.doc)
  const refs = prev.refs
    .map((ref) => ({
      from: tr.mapping.map(ref.from, -1),
      to: tr.mapping.map(ref.to, 1),
      target: ref.target,
    }))
    .filter((ref) => !ranges.some((range) => overlapping(ref, range)))
  for (const range of ranges) {
    const found = decorations.find(range.from, range.to)
    if (found.length) decorations = decorations.remove(found)
    const { marks, refs: scanned } = scan(tr.doc, range)
    if (marks.length) decorations = decorations.add(tr.doc, marks)
    refs.push(...scanned)
  }
  return { decorations, refs }
}

/** The reference whose range contains a document position, if any. */
export function referenceAt(refs: ReferenceRef[], pos: number): ReferenceRef | undefined {
  return refs.find((ref) => pos >= ref.from && pos <= ref.to)
}

function isOpenChord(event: KeyboardEvent): boolean {
  return (
    event.key === 'Enter' && (event.metaKey || event.ctrlKey) && !event.shiftKey && !event.altKey
  )
}

type ReferencePluginOptions = {
  /** Called with the target when a badge is clicked or Mod+Enter is pressed. */
  onActivate?: (target: string) => void
  /** Document scan, injectable for tests. Called with a block range for an
   *  incremental rescan, or without one for the whole document. */
  scan?: (doc: ProseNode, range?: BlockRange) => ScanResult
}

/** The plain ProseMirror plugin: decorations from document content only, plus
 *  the click and Mod+Enter activations. Decorations never depend on the
 *  selection or focus, so caret moves recompute nothing and repaint nothing
 *  (design D2/D4). A document change rescans only the blocks it touched
 *  (bound-editor-per-keystroke-work, design D1). */
export function createInlineDecorationPlugin(
  options: ReferencePluginOptions = {},
): Plugin<ReferenceState> {
  const scan = options.scan ?? scanInline
  const build = (doc: ProseNode): ReferenceState => stateFromScan(scan, doc)
  return new Plugin<ReferenceState>({
    key: referenceKey,
    state: {
      init: (_config, state) => build(state.doc),
      // A selection-only or focus transaction leaves the set untouched (no
      // rescan, same object); a document change rescans what it touched.
      apply: (tr, value) => (tr.docChanged ? rescan(tr, value, scan) : value),
    },
    props: {
      decorations: (state: EditorState) => referenceKey.getState(state)?.decorations ?? null,
      handleClick: (view: EditorView, pos: number, event: MouseEvent) => {
        // Only a click on the badge itself opens the reference
        // (add-reference-badges: "plain-clicks the reference's badge"). The
        // document position cannot tell the two apart: a click in the space
        // past a reference — the end of a line that holds nothing else, which
        // is where a user clicks to continue the page — lands on the same
        // position as the token's last character, so asking the position alone
        // navigated away instead of placing the caret.
        const onBadge = event.target instanceof Element && event.target.closest('.ref') !== null
        if (!onBadge) return false
        const ref = referenceAt(referenceKey.getState(view.state)?.refs ?? [], pos)
        if (!ref) return false
        options.onActivate?.(ref.target)
        return true
      },
      handleDOMEvents: {
        // Links (open-links-on-ctrl-click) are handled on the click event, not
        // in handleClick: that hook runs while the press is being handled, and
        // preventing there does not stop the browser's own activation of an
        // anchor — a Ctrl+Click on a markdown link would open two tabs. The
        // click event is the one that activates a link, so it is the one worth
        // preventing. A modifier-less click is left entirely alone: it places
        // the caret, and a contenteditable does not follow an anchor on its own.
        click: (view: EditorView, event: MouseEvent) => {
          if (!opensInBrowser(event)) return false
          const at = view.posAtCoords({ left: event.clientX, top: event.clientY })
          if (!at) return false
          const target = event.target instanceof Element ? event.target : null
          // An anchor carries its own target; a bare URL is read from the
          // position, so a span another decoration split still resolves.
          const href = target?.closest('a')?.getAttribute('href') ?? urlAt(view.state.doc, at.pos)
          if (!href) return false
          // A link is never opened by the browser itself: a plain click edits,
          // and a vault path has nothing served at it, so its tab would only
          // show a 404. Only an external URL is opened, and only by this code.
          event.preventDefault()
          return openExternal(href)
        },
      },
      handleKeyDown: (view: EditorView, event: KeyboardEvent) => {
        if (!isOpenChord(event)) return false
        const ref = referenceAt(
          referenceKey.getState(view.state)?.refs ?? [],
          view.state.selection.from,
        )
        if (!ref) return false
        options.onActivate?.(ref.target)
        return true
      },
    },
  })
}

/** Milkdown wrapper for the adapter (design D7): the activation callback reads
 *  through a getter so the listener can be attached after mount. */
export function inlineDecorations(onActivate: (target: string) => void) {
  return $prose(() => createInlineDecorationPlugin({ onActivate }))
}
