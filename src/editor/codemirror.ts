// The CodeMirror 6 adapter (ADR-0008 supersession, ADR-0010 seam). The page's
// Markdown text is the editor's document: nothing serializes, nothing keeps a
// document model, and every rendering is a view-only decoration over the text
// (ADR-0001, ADR-0009).
//
// Two decorations do all the rendering:
//   - `![alt](path)` is replaced by an image element while the caret is outside
//     the reference, so the file's bytes show in place; the source comes back
//     when the caret enters it, so the destination stays editable.
//   - `#word` / `#[[Page]]` / `#!word` / `#![[Board]]` get the reference chip's
//     class over their literal text, so the source stays visible and editable.
//
// Everything else is the document's own text. Cost is bounded by the visible
// region: the syntax tree is read over `visibleRanges`, the reference scan runs
// over those lines, and the image pass (src/editor/assetImages.ts) resolves only
// what the pane's viewport observer asks for (ADR-0028).

import {
  autocompletion,
  completionKeymap,
  type CompletionContext,
  type CompletionResult,
} from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import { HighlightStyle, syntaxHighlighting, syntaxTree } from '@codemirror/language'
import { languages } from '@codemirror/language-data'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import {
  EditorState,
  StateEffect,
  StateField,
  type Extension,
  type Range,
  type Text,
} from '@codemirror/state'
import {
  Decoration,
  EditorView,
  ViewPlugin,
  WidgetType,
  drawSelection,
  dropCursor,
  highlightSpecialChars,
  keymap,
  type DecorationSet,
  type ViewUpdate,
} from '@codemirror/view'
import type { SyntaxNode } from '@lezer/common'
import { tags } from '@lezer/highlight'
import { blockLineRange, blockStartLines } from '../lineAnchors'
import {
  isBoardTarget,
  isVaultRelative,
  openExternal,
  openVaultTarget,
  vaultTarget,
} from '../vault/assetOpen'
import { markdownDestination } from '../vault/link'
import {
  boardReferenceTrigger,
  boardToken,
  findReferenceRanges,
  linkDestinationTrigger,
  referenceToken,
  referenceTrigger,
} from '../vault/parse'
import { chordToKeyEventInit } from './chord'
import { codeHighlightStyles } from './codeHighlight'
import type { DropPoint, EditorAdapter, SuggestionSources, StaticBlock } from './editor'

/** The located block's frame: the class every line of it carries, and the two
 *  roles that put the top and the bottom edge on its ends. The stylesheet draws
 *  the sides on the base class and the horizontal edges from the role classes,
 *  so a one-line block carries both roles and gets all four edges. */
const HIGHLIGHT_CLASS = 'folio-search-hit'
const HIGHLIGHT_FIRST_CLASS = 'folio-search-hit-first'
const HIGHLIGHT_LAST_CLASS = 'folio-search-hit-last'

/** The wrapper and control classes the pane's stylesheet already targets, so a
 *  vault image keeps its fit, its expand control, and its viewport-scoped
 *  resolution with no stylesheet change (ADR-0028). */
const IMAGE_WRAPPER_CLASS = 'folio-image'
const IMAGE_CONTROL_CLASS = 'folio-image-control'
const EXPANDED_ATTR = 'data-expanded'

/** The class the pane's stylesheet gives a reference chip. */
const REFERENCE_CLASS = 'ref'

/** A URL written bare in the text, which reads as a link (brand ink, no
 *  underline) without being a Markdown link. */
const URL_CLASS = 'folio-cm-url'

/** Decoration classes for the document's own Markdown syntax. */
const HEADING_CLASS = 'folio-cm-heading'
const FENCE_CLASS = 'folio-cm-fence'
const QUOTE_CLASS = 'folio-cm-quote'
const MARKER_CLASS = 'folio-cm-marker'

/** The effect that sets a located block's mark, and the field that holds it. The
 *  effect names the block's line range, which is what `blockLineRange` answers. */
const setHighlight = StateEffect.define<{ from: number; to: number } | null>()

/** A frame's line range in document positions, or null when nothing is located. */
type Framed = { from: number; to: number } | null

/** The field's value: the range the frame covers, and the decorations it drew.
 *  The range is carried so an edit can move it, rather than the decorations
 *  being mapped on their own: a line decoration moves with its line but is not
 *  created for a line an edit inserts, so mapping them alone would leave a gap
 *  in the sides wherever the user pressed Enter. */
type HighlightState = { range: Framed; decorations: DecorationSet }

/** The decorations for a frame: one line decoration per line of the range, the
 *  ends carrying the role that draws their horizontal edge. */
function frameDecorations(doc: Text, range: Framed): DecorationSet {
  if (range === null) return Decoration.none
  const first = doc.lineAt(range.from).number
  const last = doc.lineAt(Math.max(range.to, range.from)).number
  const ranges: Range<Decoration>[] = []
  for (let number = first; number <= last; number += 1) {
    const classes = [HIGHLIGHT_CLASS]
    if (number === first) classes.push(HIGHLIGHT_FIRST_CLASS)
    if (number === last) classes.push(HIGHLIGHT_LAST_CLASS)
    ranges.push(Decoration.line({ class: classes.join(' ') }).range(doc.line(number).from))
  }
  return Decoration.set(ranges, true)
}

/** The document positions a block's line range covers. */
function rangeOfLines(doc: Text, lines: { from: number; to: number }): Framed {
  const first = Math.min(Math.max(lines.from, 1), doc.lines)
  const last = Math.min(Math.max(lines.to, first), doc.lines)
  return { from: doc.line(first).from, to: doc.line(last).to }
}

const highlightField = StateField.define<HighlightState>({
  create: () => ({ range: null, decorations: Decoration.none }),

  update(value, tr) {
    let range = value.range
    let set = false
    for (const effect of tr.effects) {
      if (!effect.is(setHighlight)) continue
      set = true
      range = effect.value === null ? null : rangeOfLines(tr.state.doc, effect.value)
    }
    if (tr.docChanged && range !== null) {
      // The frame stays with the text it marks, so the block an edit splits or
      // extends is still the block it framed (page-editing: the mark is not
      // cleared by a document change). Mapping two positions is O(1); the
      // decorations are then redrawn for the range, which is bounded by the
      // framed block and not by the document.
      range = {
        from: tr.changes.mapPos(range.from, -1),
        to: tr.changes.mapPos(range.to, 1),
      }
    }
    // Nothing relevant moved: keep the value's identity, so a selection change
    // or a transaction that touches neither the frame nor the text rebuilds
    // nothing (AGENTS.md: hooks short-circuit on reference equality).
    if (!set && (!tr.docChanged || range === null)) return value
    return { range, decorations: frameDecorations(tr.state.doc, range) }
  },

  provide: (field) => EditorView.decorations.from(field, (value) => value.decorations),
})

/** A vault image reference: the wrapper and control the pane's stylesheet and
 *  asset pass already expect, so `syncAssetImages` finds the `<img>` by its
 *  vault-relative `src` exactly as it does today. */
class ImageWidget extends WidgetType {
  private readonly url: string
  private readonly alt: string

  constructor(url: string, alt: string) {
    super()
    this.url = url
    this.alt = alt
  }

  eq(other: ImageWidget): boolean {
    return other.url === this.url && other.alt === this.alt
  }

  toDOM(): HTMLElement {
    const img = document.createElement('img')
    img.setAttribute('decoding', 'async')
    img.setAttribute('src', this.url)
    img.setAttribute('alt', this.alt)
    if (!isVaultRelative(this.url)) return img
    const control = document.createElement('button')
    control.type = 'button'
    control.className = IMAGE_CONTROL_CLASS
    control.contentEditable = 'false'
    control.title = 'Expand image'
    control.setAttribute('aria-label', 'Expand image')
    control.setAttribute('aria-expanded', 'false')
    const wrapper = document.createElement('span')
    wrapper.className = IMAGE_WRAPPER_CLASS
    wrapper.append(img, control)
    let expanded = false
    control.addEventListener('mousedown', (event) => event.preventDefault())
    control.addEventListener('click', () => {
      expanded = !expanded
      if (expanded) wrapper.setAttribute(EXPANDED_ATTR, '')
      else wrapper.removeAttribute(EXPANDED_ATTR)
      control.setAttribute('aria-expanded', String(expanded))
      control.title = expanded ? 'Collapse image' : 'Expand image'
      control.setAttribute('aria-label', control.title)
    })
    return wrapper
  }

  ignoreEvent(): boolean {
    return false
  }
}

/** The inline constructs whose markers hide while the caret is away from them:
 *  the construct's node name, and the mark node it wraps its content in. Bold,
 *  italic, strikethrough, and inline code read as their formatted result at
 *  rest, and show their symbols as soon as the caret is inside the span, so the
 *  source is what an edit changes. */
const INLINE_MARKS: Record<string, string> = {
  StrongEmphasis: 'EmphasisMark',
  Emphasis: 'EmphasisMark',
  Strikethrough: 'StrikethroughMark',
  InlineCode: 'CodeMark',
}

/** A document range, as this module's own helpers pass it around. */
type DocRange = { from: number; to: number }

/** A table's parsed shape: the cells the syntax tree found, and the column
 *  alignment the delimiter row asks for. */ type ParsedTable = {
  header: string[]
  rows: string[][]
  align: (string | null)[]
}

/** A GFM table, rendered read-only while the caret is off it. The text is the
 *  table: putting the caret on it brings the pipes back, so a cell is edited as
 *  Markdown and the file keeps a pipe table.
 *
 *  It comes from a state field rather than the view plugin because it replaces
 *  line breaks, which CodeMirror only allows from a field (a plugin's
 *  decorations may not). The field stays cheap by recomputing only the lines an
 *  edit touched: see `tableField`. */
class TableWidget extends WidgetType {
  private readonly source: string
  private readonly table: ParsedTable

  constructor(source: string, table: ParsedTable) {
    super()
    this.source = source
    this.table = table
  }

  /** Compared by source, so a change elsewhere in the document reuses this
   *  element instead of rebuilding the table (the keystroke budget). */
  eq(other: TableWidget): boolean {
    return other.source === this.source
  }

  /** A table owns its lines, so it is a block widget: that is also what lets a
   *  state field replace the line breaks the table's ranges span. */
  get block(): boolean {
    return true
  }

  toDOM(): HTMLElement {
    const table = document.createElement('table')
    const head = document.createElement('thead')
    head.append(tableRow('th', this.table.header, this.table.align))
    const body = document.createElement('tbody')
    for (const cells of this.table.rows) body.append(tableRow('td', cells, this.table.align))
    table.append(head, body)
    return table
  }

  ignoreEvent(): boolean {
    // A press is the editor's: it places the caret on the table, which brings
    // the source back so the cell can be edited.
    return false
  }
}

/** One rendered row; a cell's alignment comes from the delimiter row. */
function tableRow(tag: 'th' | 'td', cells: string[], align: (string | null)[]): HTMLElement {
  const element = document.createElement('tr')
  cells.forEach((cell, column) => {
    const node = document.createElement(tag)
    const alignment = align[column]
    if (alignment) node.style.textAlign = alignment
    node.innerHTML = cellHtml(cell)
    element.append(node)
  })
  return element
}

/** The column alignment the delimiter row asks for, one entry per column. */
function alignment(delimiter: string): (string | null)[] {
  return delimiter
    .split('|')
    .map((cell) => cell.trim())
    .filter((cell) => cell !== '')
    .map((cell) =>
      /^:-+:$/.test(cell)
        ? 'center'
        : /^:-+$/.test(cell)
          ? 'left'
          : /^-+:$/.test(cell)
            ? 'right'
            : null,
    )
}

/** A table's cells and alignment, or null when the tree holds no header. */
function readTable(state: EditorState, table: SyntaxNode): ParsedTable | null {
  const header = table.getChild('TableHeader')
  if (!header) return null
  const delimiter = table.getChild('TableDelimiter')
  const cells = (line: SyntaxNode): string[] =>
    line.getChildren('TableCell').map((cell) => state.doc.sliceString(cell.from, cell.to))
  return {
    header: cells(header),
    rows: table.getChildren('TableRow').map(cells),
    align: delimiter ? alignment(state.doc.sliceString(delimiter.from, delimiter.to)) : [],
  }
}

/** A cell's inline markup as HTML. A small left-to-right walk rather than
 *  chained substitutions, so a code span cannot be re-read as emphasis and the
 *  reference offsets the scanner reports stay the ones used. Everything is
 *  escaped, so a cell can never inject markup into the pane. */
function cellHtml(raw: string): string {
  const refs = new Map(findReferenceRanges(raw).map((ref) => [ref.from, ref]))
  let out = ''
  let at = 0
  while (at < raw.length) {
    const ref = refs.get(at)
    if (ref) {
      out += chipHtml(raw.slice(ref.from, ref.to), ref.target, ref.kind)
      at = ref.to
      continue
    }
    const rest = raw.slice(at)
    const match =
      /^`([^`]*)`/.exec(rest) ??
      /^\[([^\]]*)\]\(([^)\s]+)\)/.exec(rest) ??
      /^(\*\*|__)(.+?)\1/.exec(rest) ??
      /^(\*|_)(.+?)\1/.exec(rest) ??
      /^~~(.+?)~~/.exec(rest)
    if (!match) {
      out += escapeHtml(raw[at])
      at += 1
      continue
    }
    const text = match[0]
    if (text.startsWith('`')) out += `<code>${escapeHtml(match[1])}</code>`
    else if (text.startsWith('['))
      out += `<a href="${escapeAttr(match[2])}" data-href="${escapeAttr(match[2])}">${escapeHtml(match[1])}</a>`
    else if (text.startsWith('~~')) out += `<del>${escapeHtml(match[1])}</del>`
    else if (text.startsWith('**') || text.startsWith('__'))
      out += `<strong>${escapeHtml(match[2])}</strong>`
    else out += `<em>${escapeHtml(match[2])}</em>`
    at += text.length
  }
  return out
}

/** A reference chip inside a rendered table. It carries the target, because the
 *  table is a widget: the document-level range lookup cannot see it. */
function chipHtml(text: string, target: string, kind: string): string {
  return `<span class="${REFERENCE_CLASS}" data-ref-target="${escapeAttr(target)}" data-ref-kind="${kind}">${escapeHtml(text)}</span>`
}

/** A table the field knows about: its document range and whether the caret is
 *  showing its source. Kept as plain data so an update can carry the untouched
 *  entries forward without rebuilding anything per table. */
type TableEntry = { from: number; to: number; shown: boolean }

/** The `Table` node starting at `from`, or null when the position no longer
 *  holds one (a mapped entry whose table the edit removed). */
function tableAt(state: EditorState, from: number): SyntaxNode | null {
  for (
    let node: SyntaxNode | null = syntaxTree(state).resolveInner(from, 1);
    node;
    node = node.parent
  ) {
    if (node.name === 'Table') return node.from === from ? node : null
  }
  return null
}

/** The field's value: which tables exist, and the decorations for the ones
 *  whose source is hidden. */
type TableState = { entries: TableEntry[]; decorations: DecorationSet }

/** Replace decorations for the entries that are hiding their source. */
function tableRanges(state: EditorState, entries: TableEntry[]): ReturnType<Decoration['range']>[] {
  const ranges: ReturnType<Decoration['range']>[] = []
  for (const entry of entries) {
    if (entry.shown) continue
    const table = tableAt(state, entry.from)
    if (!table) continue
    const parsed = readTable(state, table)
    if (!parsed) continue
    ranges.push(
      Decoration.replace({
        widget: new TableWidget(state.doc.sliceString(entry.from, entry.to), parsed),
        block: true,
      }).range(entry.from, entry.to),
    )
  }
  return ranges
}

/** Which tables exist, and which of them show their source.
 *
 *  Recomputation is scoped to what changed. A document change re-reads only the
 *  tables on the edited lines (plus one each way, so a delimiter row arriving on
 *  the next line is seen and a table the edit removed is dropped); a selection
 *  change re-decides only the tables the caret moved between, and returns the
 *  same value when no table's reveal state flipped, so an ordinary keystroke
 *  rebuilds nothing. */
const tableField = StateField.define<TableState>({
  create: (state) => {
    const entries = tablesIn(state, 0, state.doc.length, state.selection.main.head)
    return { entries, decorations: Decoration.set(tableRanges(state, entries), true) }
  },

  update(value, tr) {
    const caret = tr.state.selection.main.head

    if (!tr.docChanged) {
      const before = tr.startState.selection.main.head
      const flipped = value.entries.filter(
        (entry) => touches(entry, before) !== touches(entry, caret),
      )
      if (flipped.length === 0) return value
      return {
        entries: value.entries.map((entry) =>
          flipped.includes(entry) ? { ...entry, shown: !touches(entry, caret) } : entry,
        ),
        decorations: value.decorations.update({
          filter: (from) => !flipped.some((entry) => entry.from === from),
          add: tableRanges(
            tr.state,
            flipped.filter((entry) => !touches(entry, caret)),
          ),
          sort: true,
        }),
      }
    }

    let from = tr.state.doc.length
    let to = 0
    tr.changes.iterChangedRanges((_fromA, _toA, fromB, toB) => {
      from = Math.min(from, fromB)
      to = Math.max(to, toB)
    })
    const region = widen(tr.state, from, to)
    const kept = value.entries
      .map((entry) => ({
        ...entry,
        from: tr.changes.mapPos(entry.from, -1),
        to: tr.changes.mapPos(entry.to, 1),
      }))
      .filter((entry) => entry.to <= region.from || entry.from >= region.to)
    const rebuilt = tablesIn(tr.state, region.from, region.to, caret)
    return {
      entries: [...kept, ...rebuilt].sort((a, b) => a.from - b.from),
      decorations: value.decorations.map(tr.changes).update({
        filter: (rangeFrom) => rangeFrom < region.from || rangeFrom >= region.to,
        add: tableRanges(tr.state, rebuilt),
        sort: true,
      }),
    }
  },

  provide: (field) => EditorView.decorations.from(field, (value) => value.decorations),
})

/** Whether a caret position counts as "on" a table: either edge included, so a
 *  press on the rendered table brings its source back. */
function touches(entry: TableEntry, caret: number): boolean {
  return caret >= entry.from && caret <= entry.to
}

/** A line range widened by one line each way, clamped to the document. */
function widen(state: EditorState, from: number, to: number): { from: number; to: number } {
  const end = Math.min(Math.max(to, from), state.doc.length)
  const first = Math.max(1, state.doc.lineAt(Math.min(from, state.doc.length)).number - 1)
  const last = Math.min(state.doc.lines, state.doc.lineAt(end).number + 1)
  return { from: state.doc.line(first).from, to: state.doc.line(last).to }
}

/** Every table in `[from, to]`, with its current reveal state. */
function tablesIn(state: EditorState, from: number, to: number, caret: number): TableEntry[] {
  const entries: TableEntry[] = []
  syntaxTree(state).iterate({
    from,
    to,
    enter: (node) => {
      if (node.name !== 'Table') return
      entries.push({ from: node.from, to: node.to, shown: caret >= node.from && caret <= node.to })
    },
  })
  return entries
}

/** The decoration set for one document view, and the reference ranges it found
 *  (kept so a click is a lookup rather than a rescan). */
type Rendered = {
  decorations: DecorationSet
  atomic: DecorationSet
  refs: { from: number; to: number; target: string; kind: 'page' | 'board' }[]
}

/** The image reference's destination and alt text, or null when the text is not
 *  a plain image reference this widget can render. */
function imageReference(text: string): { url: string; alt: string } | null {
  // Both destination forms CommonMark allows: a bare destination (no spaces) and
  // an angle-bracketed one (which may hold spaces). A title, if any, is ignored:
  // it is not something the widget renders.
  const match = /^!\[([^\]]*)\]\(\s*(?:<([^>]*)>|([^)\s]*))\s*(?:"[^"]*"|'[^']*')?\s*\)$/.exec(text)
  if (!match) return null
  const url = match[2] ?? match[3] ?? ''
  if (url === '') return null
  return { url, alt: match[1] }
}

/** Whether a position sits inside something literal, where a reference is not a
 *  reference: code, or a link or image destination. A destination is a URL, not
 *  prose, so the `#section` of a fragment link is a fragment and never a page
 *  reference — in the previous editor a destination was a link attribute rather
 *  than text and was never scanned at all. */
function inLiteral(view: EditorView, pos: number): boolean {
  for (
    // Side 1: a reference that starts exactly at a destination's first character
    // is still inside that destination, and the boundary would otherwise be read
    // as the token to its left.
    let node: ReturnType<typeof syntaxTree>['topNode'] | null = syntaxTree(view.state).resolveInner(
      pos,
      1,
    );
    node;
    node = node.parent
  ) {
    if (
      node.name === 'FencedCode' ||
      node.name === 'CodeBlock' ||
      node.name === 'InlineCode' ||
      node.name === 'URL'
    )
      return true
  }
  return false
}

/** Build the decoration set for the visible region only. */
function render(view: EditorView): Rendered {
  const marks: { from: number; to: number; decoration: Decoration }[] = []
  const atomic: { from: number; to: number; decoration: Decoration }[] = []
  const refs: Rendered['refs'] = []
  const { state } = view
  const selection = state.selection.main
  const tree = syntaxTree(state)

  /** The two ranges a link hides at rest, or null when it is not safe to hide
   *  them: the opening mark, and everything from the closing mark on. The
   *  closing mark is found by name, because in `[![alt](img.png)](dest)` the
   *  node's second child is the image rather than the `]`. */
  const linkMarks = (node: SyntaxNode): { open: DocRange; tail: DocRange } | null => {
    const marks: SyntaxNode[] = []
    for (let child = node.firstChild; child; child = child.nextSibling) {
      if (child.name === 'LinkMark') marks.push(child)
    }
    const open = marks[0]
    if (!open) return null
    const closing =
      marks.find((mark) => state.doc.sliceString(mark.from, mark.to).startsWith(']')) ??
      // An autolink has no bracket pair: `<' then the URL then `>`.
      (node.name === 'Autolink' ? marks[marks.length - 1] : undefined)
    if (!closing || closing.from <= open.to) return null
    // Nothing to show if the label is empty: an invisible link can be neither
    // clicked nor found.
    if (state.doc.sliceString(open.to, closing.from).trim() === '') return null
    return { open, tail: { from: closing.from, to: node.to } }
  }

  /** Hide a range, if it is within one line: a view plugin's decorations may not
   *  replace a line break. */
  const hideRange = (range: DocRange): void => {
    if (range.to <= range.from) return
    if (state.doc.lineAt(range.from).number !== state.doc.lineAt(range.to).number) return
    hideMarker(range)
  }

  /** Drop a marker from the rendered text, and make it atomic so the caret
   *  steps over it instead of landing inside it. A marker spans no line break,
   *  which is what lets a view plugin hide it. */
  const hideMarker = (marker: DocRange): void => {
    if (marker.to <= marker.from) return
    const decoration = Decoration.replace({})
    marks.push({ from: marker.from, to: marker.to, decoration })
    atomic.push({ from: marker.from, to: marker.to, decoration: Decoration.replace({}) })
  }

  // Images: a replace decoration over the whole reference, skipped while the
  // caret is inside it so the source can be edited.
  for (const { from, to } of view.visibleRanges) {
    tree.iterate({
      from,
      to,
      enter: (node) => {
        // A table renders as a table while the caret is off it; the caret at
        // either edge counts as on it, so a press on the rendered table brings
        // the pipes back and a cell can be edited.
        if (node.name === 'Table') {
          if (selection.head < node.from || selection.head > node.to) {
            const parsed = readTable(state, node.node)
            if (parsed) {
              marks.push({
                from: node.from,
                to: node.to,
                decoration: Decoration.replace({
                  widget: new TableWidget(state.doc.sliceString(node.from, node.to), parsed),
                }),
              })
              atomic.push({ from: node.from, to: node.to, decoration: Decoration.replace({}) })
            }
          }
          return
        }
        if (node.name !== 'Image') return
        const start = node.from
        const end = node.to
        // Reveal the source only when the caret is inside the reference. A
        // caret at either edge renders the image, so a page that starts with an
        // image shows the image rather than the source it happens to sit on.
        const caret = selection.head
        if (caret > start && caret < end) return
        const parsed = imageReference(state.doc.sliceString(start, end))
        if (!parsed) return
        marks.push({
          from: start,
          to: end,
          decoration: Decoration.replace({ widget: new ImageWidget(parsed.url, parsed.alt) }),
        })
        atomic.push({ from: start, to: end, decoration: Decoration.replace({}) })
      },
    })
  }

  // References: the app's own scanner over the visible lines, so the two
  // lexical forms are exactly the ones `src/vault/parse.ts` defines (ADR-0012).
  const seen = new Set<number>()
  for (const { from, to } of view.visibleRanges) {
    const first = state.doc.lineAt(from).number
    const last = state.doc.lineAt(to).number
    for (let number = first; number <= last; number++) {
      const line = state.doc.line(number)
      for (const ref of findReferenceRanges(line.text)) {
        const start = line.from + ref.from
        if (seen.has(start) || inLiteral(view, start)) continue
        seen.add(start)
        marks.push({
          from: start,
          to: line.from + ref.to,
          decoration: Decoration.mark({ class: REFERENCE_CLASS }),
        })
        refs.push({
          from: start,
          to: line.from + ref.to,
          target: ref.target,
          kind: ref.kind as 'page' | 'board',
        })
      }
    }
  }

  // The document's own syntax. Emphasis, strong, strikethrough, and inline code
  // hide their markers while the caret is away from them, so prose reads as
  // prose; everything else keeps its markers, dimmed.
  const last = view.visibleRanges[view.visibleRanges.length - 1]
  tree.iterate({
    from: view.visibleRanges[0]?.from ?? 0,
    to: last?.to ?? state.doc.length,
    enter: (node) => {
      const name = node.name

      const markName = INLINE_MARKS[name]
      // A link reads as its own text: the opening mark and the tail from the
      // closing mark on are hidden, which leaves the label in the link style the
      // theme already gives it (DESIGN.md's one link behavior: brand ink, no
      // underline). The reveal rule is the inline runs' rule.
      //
      // Only a link that carries a destination counts. Brackets alone parse as a
      // shortcut reference link, so `[[Page]]` and Folio's own `#[[Page]]` would
      // otherwise lose their brackets and read as links: the first is not a link
      // at all (ADR-0012: unsupported conventions render as text) and the second
      // is the reference chip's, which the scan above already claimed.
      if ((name === 'Link' || name === 'Autolink') && node.node.getChild('URL')) {
        if (selection.from <= node.to && selection.to >= node.from) return
        const marks = linkMarks(node.node)
        if (!marks) return
        hideRange(marks.open)
        hideRange(marks.tail)
        return
      }

      if (markName) {
        const first = node.node.firstChild
        const lastChild = node.node.lastChild
        if (!first || !lastChild || first === lastChild || first.name !== markName) return
        // The selection touching the span means it is being edited, so its
        // symbols come back; otherwise they are syntax the user is not looking
        // at. A marker is a couple of characters, so hiding never spans a line
        // (which a plugin's decorations may not do).
        if (selection.from <= node.to && selection.to >= node.from) return
        hideMarker(first)
        if (lastChild.name === markName) hideMarker(lastChild)
        return
      }

      const decoration =
        name.startsWith('ATXHeading') || name.startsWith('SetextHeading')
          ? Decoration.mark({ class: HEADING_CLASS })
          : name === 'URL' &&
              node.node.parent?.name !== 'Link' &&
              node.node.parent?.name !== 'Image'
            ? // A URL outside a link is a bare URL: the text reads as a link. One
              // inside a link keeps the muted ink its destination has today.
              Decoration.mark({ class: URL_CLASS })
            : name === 'FencedCode' || name === 'CodeBlock'
              ? Decoration.mark({ class: FENCE_CLASS })
              : name === 'Blockquote'
                ? Decoration.mark({ class: QUOTE_CLASS })
                : name === 'HeaderMark' || name === 'QuoteMark'
                  ? Decoration.mark({ class: MARKER_CLASS })
                  : null
      if (!decoration) return
      marks.push({ from: node.from, to: node.to, decoration })
    },
  })

  const sorted = marks.sort((a, b) => a.from - b.from || a.to - b.to)
  const sortedAtomic = atomic.sort((a, b) => a.from - b.from || a.to - b.to)
  return {
    decorations: Decoration.set(
      sorted.map((mark) => mark.decoration.range(mark.from, mark.to)),
      true,
    ),
    atomic: Decoration.set(
      sortedAtomic.map((mark) => mark.decoration.range(mark.from, mark.to)),
      true,
    ),
    refs,
  }
}

/** The live-preview plugin: recomputes on a document change, a selection change
 *  (so an image's source reappears when the caret enters it), or a new viewport. */
const livePreview = ViewPlugin.fromClass(
  class {
    rendered: Rendered
    constructor(view: EditorView) {
      this.rendered = render(view)
    }

    update(update: ViewUpdate): void {
      if (update.docChanged || update.selectionSet || update.viewportChanged) {
        this.rendered = render(update.view)
      }
    }
  },
  {
    decorations: (plugin) => plugin.rendered.decorations,
    provide: (plugin) =>
      EditorView.atomicRanges.of((view) => view.plugin(plugin)?.rendered.atomic ?? Decoration.none),
  },
)

/** The Folio palette over the document's syntax (DESIGN.md tokens). Code tokens
 *  come from the shared mapping (`codeHighlight`), so a fence on this surface and
 *  a block in the component's embedded editor colour alike; the rest is prose. */
const folioHighlight = HighlightStyle.define([
  { tag: tags.heading, color: '#1B365D', fontWeight: '600' },
  { tag: tags.strong, color: '#141413', fontWeight: '600' },
  { tag: tags.emphasis, fontStyle: 'italic' },
  { tag: tags.strikethrough, textDecoration: 'line-through' },
  { tag: tags.monospace, background: '#f0efe8', color: '#3d3d3a', borderRadius: '3px' },
  { tag: tags.contentSeparator, color: '#141413', fontWeight: '600' },
  { tag: tags.link, color: '#1B365D' },
  { tag: tags.url, color: '#6b6a64' },
  { tag: tags.processingInstruction, color: '#6b6a64' },
  ...codeHighlightStyles,
])

const folioTheme = EditorView.theme({
  '&': { fontSize: '15px', color: '#141413', backgroundColor: 'transparent' },
  '&.cm-focused': { outline: 'none' },
  '.cm-scroller': {
    fontFamily: 'inherit',
    lineHeight: '1.6',
    overflow: 'visible',
  },
  '.cm-content': { padding: '0', caretColor: '#141413' },
  '.cm-line': { padding: '0' },
  '.cm-cursor': { borderLeftColor: '#141413' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { backgroundColor: '#dcdbd2' },
  '.folio-cm-heading': { fontSize: '1.15em', letterSpacing: '-0.01em' },
  '.folio-cm-url': { color: '#1B365D' }, // --brand: a bare URL reads as a link
  '.folio-cm-marker': { color: '#a8a7a0' },
  '.folio-cm-fence': { background: '#f5f4ed', color: '#3d3d3a' },
  '.folio-cm-quote': { color: '#6b6a64' },
})

/** The completion source, reading the app's pools through the seam and writing
 *  the two canonical token forms (ADR-0012). A file's destination is escaped
 *  with `markdownDestination`, which is what makes the written text a link at
 *  all: micromark ends a destination at the space. */
export function completionSource(sources: SuggestionSources) {
  return (context: CompletionContext): CompletionResult | null => {
    const { state, pos } = context
    const line = state.doc.lineAt(pos)
    const before = state.doc.sliceString(line.from, pos)
    const after = state.doc.sliceString(pos, line.to)

    const boards = boardReferenceTrigger(before, after)
    if (boards && sources.boards) {
      const options = sources.boards(boards.query).map((suggestion) => ({
        label: suggestion.name,
        apply: boardToken(suggestion.name, boards.kind),
      }))
      if (options.length === 0) return null
      return { from: pos - boards.text.length, to: pos, options }
    }

    const pages = referenceTrigger(before, after)
    if (pages) {
      const options = sources.pages(pages.query).map((suggestion) => ({
        label: suggestion.name,
        apply: referenceToken(suggestion.name, pages.kind),
      }))
      if (options.length === 0) return null
      return { from: pos - pages.text.length, to: pos, options }
    }

    const destination = linkDestinationTrigger(before, after)
    if (destination) {
      const options = sources.files(destination.text, destination.image).map((suggestion) => ({
        label: suggestion.name,
        apply: markdownDestination(suggestion.path),
      }))
      if (options.length === 0) return null
      return { from: pos - destination.text.length, to: pos, options }
    }

    return null
  }
}

/** The link node under a document position, or null. */
function linkAt(view: EditorView, pos: number): string | null {
  const text = (node: { from: number; to: number }): string =>
    view.state.doc.sliceString(node.from, node.to)
  for (
    let node: ReturnType<typeof syntaxTree>['topNode'] | null = syntaxTree(view.state).resolveInner(
      pos,
    );
    node;
    node = node.parent
  ) {
    const child = node.name === 'Link' || node.name === 'Image' ? node.getChild('URL') : null
    const url = node.name === 'URL' ? text(node) : child ? text(child) : null
    if (url === null) continue
    return url.startsWith('#') ? null : url
  }
  return null
}

export class CodeMirrorAdapter implements EditorAdapter {
  private view: EditorView | null = null
  private changeListener: ((markdown: string) => void) | null = null
  private referenceClickListener: ((target: string, kind: 'page' | 'board') => void) | null = null
  private boardLinkListener: ((path: string) => void) | null = null
  private assetReader: ((path: string) => Promise<Blob>) | null = null
  private sources: SuggestionSources = { pages: () => [], files: () => [] }
  /** The text a `setContent` seeded, so its echo is not reported as an edit. */
  private seed: string | null = null

  async mount(el: HTMLElement): Promise<void> {
    const extensions: Extension[] = [
      highlightSpecialChars(),
      drawSelection(),
      dropCursor(),
      history(),
      EditorView.lineWrapping,
      keymap.of([
        // Mod+Enter is the reference chord. The first entry opens the reference
        // the caret is in; the second claims the chord when there is none, so
        // the editor's default for it (insert a blank line, which would split a
        // paragraph with no sign of why) cannot act. The sheet lists the chord
        // for one action, and that action is a no-op when there is nothing to
        // open.
        { key: 'Mod-Enter', run: (view) => this.openReferenceAtCaret(view) },
        { key: 'Mod-Enter', run: () => true },
        ...defaultKeymap,
        ...historyKeymap,
        ...completionKeymap,
        indentWithTab,
      ]),
      markdown({ base: markdownLanguage, codeLanguages: languages }),
      syntaxHighlighting(folioHighlight),
      livePreview,
      tableField,
      highlightField,
      autocompletion({ override: [completionSource(this.sources)] }),
      folioTheme,
      EditorView.updateListener.of((update) => {
        if (!update.docChanged) return
        const text = update.state.doc.toString()
        if (this.seed !== null) {
          const echo = this.seed
          this.seed = null
          if (text === echo) return
        }
        this.changeListener?.(text)
      }),
      EditorView.domEventHandlers({
        mousedown: (event, view) => this.handleClick(event, view),
      }),
    ]
    this.view = new EditorView({ state: EditorState.create({ doc: '', extensions }), parent: el })
  }

  async destroy(): Promise<void> {
    this.view?.destroy()
    this.view = null
  }

  async setContent(markdown: string): Promise<void> {
    const view = this.view
    if (!view) return
    this.seed = markdown
    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: markdown },
      selection: { anchor: 0 },
    })
  }

  insertMarkdown(markdown: string, point?: DropPoint): void {
    const view = this.view
    if (!view) return
    let at = view.state.selection.main.head
    if (point) {
      const resolved = view.posAtCoords({ x: point.left, y: point.top })
      if (resolved !== null) at = resolved
    }
    view.dispatch({
      changes: { from: at, insert: markdown },
      selection: { anchor: at + markdown.length },
      scrollIntoView: true,
    })
  }

  /** Frame the `index`-th top-level block and scroll its first line into view,
   *  or clear the frame when `index` names no block. The frame covers the whole
   *  block, not its first line, and it stays until a later request replaces it:
   *  no timer, and no clearing on an edit (page-editing: the mark is not cleared
   *  by a document change). */
  highlightBlock(index: number | null): void {
    const view = this.view
    if (!view) return
    const text = view.state.doc.toString()
    const lines = index === null ? null : blockLineRange(text, index)
    view.dispatch({ effects: setHighlight.of(lines) })
    if (lines === null) return
    const line = view.state.doc.line(Math.min(lines.from, view.state.doc.lines))
    view.dispatch({ effects: EditorView.scrollIntoView(line.from, { y: 'center' }) })
  }

  staticBlocks(): StaticBlock[] {
    const text = this.view?.state.doc.toString() ?? ''
    if (text.trim() === '') return []
    const lines = text.split('\n')
    const anchors = blockStartLines(text)
    return anchors.map((start, i) => {
      const end = (anchors[i + 1] ?? lines.length + 1) - 1
      const body = lines
        .slice(start - 1, end)
        .join('\n')
        .trimEnd()
      return { type: blockType(body), html: blockHtml(body) }
    })
  }

  onChange(listener: (markdown: string) => void): void {
    this.changeListener = listener
  }

  onReferenceClick(listener: (target: string, kind: 'page' | 'board') => void): void {
    this.referenceClickListener = listener
  }

  onBoardLink(listener: (path: string) => void): void {
    this.boardLinkListener = listener
  }

  setAssetReader(reader: (path: string) => Promise<Blob>): void {
    this.assetReader = reader
  }

  setSuggestionSource(sources: SuggestionSources): void {
    this.sources = sources
  }

  applyChord(chord: string): boolean {
    const view = this.view
    if (!view) return false
    if (!view.hasFocus) view.focus()
    const event = new KeyboardEvent('keydown', chordToKeyEventInit(chord))
    view.contentDOM.dispatchEvent(event)
    return event.defaultPrevented
  }

  /** A press on a chip inside a rendered table opens its target; a press on a
   *  link or a URL opens that only with the platform modifier, because a plain
   *  press belongs to the editor (page-editing: a plain click places the caret
   *  and opens nothing). A reference chip is the exception: it opens on a plain
   *  press. */
  private handleClick(event: MouseEvent, view: EditorView): boolean {
    if (event.button !== 0) return false
    const opens = event.ctrlKey || event.metaKey

    // A widget's own elements are inside the editor's DOM but not in its
    // document, so they are read from the event target.
    if (event.target instanceof Element) {
      const chip = event.target.closest(`.${REFERENCE_CLASS}[data-ref-target]`)
      if (chip) {
        event.preventDefault()
        const kind = chip.getAttribute('data-ref-kind') === 'board' ? 'board' : 'page'
        this.referenceClickListener?.(chip.getAttribute('data-ref-target') ?? '', kind)
        return true
      }
      const anchor = event.target.closest('a[href]')
      if (anchor) {
        // Never let a real anchor navigate the app away, whether or not the
        // press opens: a plain press falls through so the caret lands on the
        // table and its source comes back.
        event.preventDefault()
        if (!opens) return false
        this.openDestination(anchor.getAttribute('data-href') ?? '')
        return true
      }
    }

    const pos = view.posAtCoords({ x: event.clientX, y: event.clientY })
    if (pos === null) return false

    const ref = view.plugin(livePreview)?.rendered.refs.find((r) => pos >= r.from && pos <= r.to)
    if (ref) {
      event.preventDefault()
      this.referenceClickListener?.(ref.target, ref.kind)
      return true
    }

    if (!opens) return false
    const href = linkAt(view, pos)
    if (href === null) return false
    event.preventDefault()
    this.openDestination(href)
    return true
  }

  /** `Mod+Enter` with the caret inside a reference opens it (page-editing: the
   *  editor opens a reference's target, and the shortcut is in the reference).
   *  Anything else leaves the chord to the editor. */
  private openReferenceAtCaret(view: EditorView): boolean {
    const pos = view.state.selection.main.head
    const ref = view.plugin(livePreview)?.rendered.refs.find((r) => pos >= r.from && pos <= r.to)
    if (!ref) return false
    this.referenceClickListener?.(ref.target, ref.kind)
    return true
  }

  /** A link's destination. The policy is the vault layer's, not this adapter's
   *  (ADR-0010): `vaultTarget` decides whether the target is a vault path at all
   *  and decodes it, `isBoardTarget` sends a board to the board view, and
   *  `openVaultTarget` reads the file and chooses a window for a type the browser
   *  shows from a download for the rest. Everything else goes through
   *  `openExternal`, which opens only a URL carrying a scheme the browser can
   *  open — so a fragment, an absolute path, or a relative one opens nothing. */
  private openDestination(href: string): void {
    const path = vaultTarget(href)
    if (path === null) {
      openExternal(href)
      return
    }
    if (isBoardTarget(path)) {
      this.boardLinkListener?.(path)
      return
    }
    const reader = this.assetReader
    if (!reader) return
    void openVaultTarget(href, reader)
  }
}

/** The block's node type name, as the presentation renderer reads it. */
function blockType(body: string): string {
  const first = body.split('\n')[0].trim()
  if (/^```/.test(first)) return 'code_block'
  if (/^#{1,6}\s/.test(first)) return 'heading'
  if (/^[-*+]\s/.test(first)) return 'bullet_list'
  if (/^\d+[.)]\s/.test(first)) return 'ordered_list'
  if (/^>/.test(first)) return 'blockquote'
  if (/^\|/.test(first)) return 'table'
  if (/^(---|\*\*\*|___)\s*$/.test(first)) return 'hr'
  return 'paragraph'
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function escapeAttr(text: string): string {
  return escapeHtml(text).replace(/'/g, '&#39;')
}

/** A block's static HTML: enough for the reading view, which owns its own
 *  rendering of the constructs it presents. */
function blockHtml(body: string): string {
  const type = blockType(body)
  if (type === 'code_block') {
    const fence = body.split('\n')
    const language = /^```(\S*)/.exec(fence[0] ?? '')?.[1] ?? ''
    const code = fence
      .slice(1, fence[fence.length - 1]?.trim() === '```' ? -1 : undefined)
      .join('\n')
    return `<pre><code${language ? ` class="language-${escapeHtml(language)}"` : ''}>${escapeHtml(code)}</code></pre>`
  }
  if (type === 'heading') {
    const depth = /^(#{1,6})/.exec(body.trim())?.[1].length ?? 1
    const text = body.trim().replace(/^#{1,6}\s*/, '')
    return `<h${depth}>${escapeHtml(text)}</h${depth}>`
  }
  return `<p>${escapeHtml(body).replace(/\n/g, '<br>')}</p>`
}
