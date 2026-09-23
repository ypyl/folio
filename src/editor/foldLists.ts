// List folding (add-collapsible-list-items, ADR-0026): a fold is a view over
// the Markdown list, never a change to it. The document keeps every line, so
// the serializer and the file do too; only the editor hides an item's nested
// content. State lives in this plugin, which the pane's per-page editor owns,
// so a page switch or a reload starts every item expanded and nothing is
// written to the vault.
//
// The fold set is a set of `list_item` start positions, carried forward through
// each transaction and validated against the document it produced — the same
// incremental shape as the reference-badge plugin, so a keystroke's folding cost
// is scoped to the top-level block it edited, not the page.

import { $prose } from '@milkdown/utils'
import type { Node as ProseNode } from '@milkdown/prose/model'
import type { EditorState } from '@milkdown/prose/state'
import { Plugin, PluginKey, TextSelection } from '@milkdown/prose/state'
import { Decoration, DecorationSet } from '@milkdown/prose/view'
import type { EditorView } from '@milkdown/prose/view'
import { affectedTopLevelBlocks, type BlockRange } from './inlineDecorations'

/** The node class on a list item that has a disclosure control and on one that
 *  is folded; the first child block's class; and the control's own class. Global
 *  names, like the badge and image classes the decorations write. */
export const FOLD_ITEM_CLASS = 'folio-fold-item'
export const FOLDED_CLASS = 'folio-folded'
export const FOLD_HEAD_CLASS = 'folio-fold-head'
export const FOLD_TOGGLE_CLASS = 'folio-fold-toggle'

/** The control's accessible name and tooltip, by state: it names the action it
 *  performs, not the state it is in. */
const COLLAPSE_LABEL = 'Collapse item'
const EXPAND_LABEL = 'Expand item'

const SVG_NS = 'http://www.w3.org/2000/svg'

/** Chevron pointing down when expanded (content below) and right when folded
 *  (content ahead), on the 24-unit viewBox the app's other controls use. */
const GLYPH_EXPANDED = 'M6 9l6 6 6-6'
const GLYPH_FOLDED = 'M9 6l6 6-6 6'

type FoldState = {
  /** Start positions of the folded `list_item` nodes, in this document. */
  folded: ReadonlySet<number>
  decorations: DecorationSet
}

const foldKey = new PluginKey<FoldState>('folioFoldLists')
const NO_FOLDS: ReadonlySet<number> = new Set()

/** A list item is foldable when it holds anything past its first block: a
 *  nested list, a code block, or any further block. A leaf item shows nothing. */
export function isFoldableItem(node: ProseNode): boolean {
  return node.type.name === 'list_item' && node.childCount > 1
}

/** The top-level block containing `pos`, as a range in `doc`. Used to scope a
 *  toggle's rebuild to the one tree it touched. */
function topLevelBlockAt(doc: ProseNode, pos: number): BlockRange {
  const $pos = doc.resolve(Math.max(0, Math.min(pos, doc.content.size)))
  return { from: $pos.before(1), to: $pos.after(1) }
}

/** The end of a folded item's visible first block, when `pos` sits inside that
 *  item's hidden content; null otherwise. The caret is allowed up to this
 *  boundary, which is the last visible position of the item. */
export function hiddenBoundary(
  doc: ProseNode,
  folded: ReadonlySet<number>,
  pos: number,
): number | null {
  for (const start of folded) {
    const node = doc.nodeAt(start)
    if (!node || !isFoldableItem(node)) continue
    const first = node.firstChild
    if (!first) continue
    const visibleEnd = start + 1 + first.nodeSize
    if (pos > visibleEnd && pos < start + node.nodeSize) return visibleEnd
  }
  return null
}

/** The chevron: one SVG whose path is swapped by state. */
function glyph(folded: boolean): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('aria-hidden', 'true')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '2')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  const path = document.createElementNS(SVG_NS, 'path')
  path.setAttribute('d', folded ? GLYPH_FOLDED : GLYPH_EXPANDED)
  svg.append(path)
  return svg
}

/** Whether an event bubbled out of a fold control, so the view ignores it
 *  rather than reading it as a document interaction. */
function isToggleEvent(event: Event): boolean {
  return event.target instanceof Element && event.target.closest(`.${FOLD_TOGGLE_CLASS}`) !== null
}

type Toggle = (view: EditorView, start: number) => void

/** The widget's DOM: a real button, so the control is in the accessibility tree
 *  and keyboard-reachable, built the way the image control is (ADR-0018). The
 *  caret stays in the document because the press is prevented; `getPos` reads
 *  the widget's current position, so a mapped widget toggles its own item. */
function foldToggle(folded: boolean, toggle: Toggle) {
  return (view: EditorView, getPos: () => number | undefined): HTMLElement => {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = FOLD_TOGGLE_CLASS
    button.contentEditable = 'false'
    const label = folded ? EXPAND_LABEL : COLLAPSE_LABEL
    button.setAttribute('aria-expanded', String(!folded))
    button.setAttribute('aria-label', label)
    button.title = label
    button.append(glyph(folded))
    button.addEventListener('mousedown', (event) => event.preventDefault())
    button.addEventListener('click', (event) => {
      event.preventDefault()
      const pos = getPos()
      if (typeof pos === 'number') toggle(view, pos - 1)
    })
    return button
  }
}

/** The fold decorations for `doc`, or for one range of whole top-level blocks:
 *  a class on every foldable item, a class on its first block (what stays
 *  visible), a folded class when it is folded, and one control widget at the
 *  item's content start. */
function foldDecorations(
  doc: ProseNode,
  folded: ReadonlySet<number>,
  toggle: Toggle,
  range?: BlockRange,
): Decoration[] {
  const decorations: Decoration[] = []
  const visit = (node: ProseNode, pos: number): void => {
    if (!isFoldableItem(node)) return
    const first = node.firstChild
    if (!first) return
    const isFolded = folded.has(pos)
    decorations.push(
      Decoration.node(pos, pos + node.nodeSize, {
        class: isFolded ? `${FOLD_ITEM_CLASS} ${FOLDED_CLASS}` : FOLD_ITEM_CLASS,
      }),
    )
    decorations.push(Decoration.node(pos + 1, pos + 1 + first.nodeSize, { class: FOLD_HEAD_CLASS }))
    decorations.push(
      Decoration.widget(pos + 1, foldToggle(isFolded, toggle), {
        side: -1,
        // Same state, same key: a mapped widget keeps its DOM across a text
        // keystroke, and only a fold/expand redraws it.
        key: isFolded ? 'folio-fold-toggle-folded' : 'folio-fold-toggle-expanded',
        stopEvent: isToggleEvent,
        ignoreSelection: true,
      }),
    )
  }
  if (range) doc.nodesBetween(range.from, range.to, visit)
  else doc.descendants(visit)
  return decorations
}

/** Replace this feature's decorations over `range` with ones rebuilt from the
 *  current document, so a structural edit that changed which items are foldable
 *  is reflected and an unchanged block's widgets are reused by key. */
function refreshRange(
  decorations: DecorationSet,
  doc: ProseNode,
  folded: ReadonlySet<number>,
  toggle: Toggle,
  range: BlockRange,
): DecorationSet {
  const found = decorations.find(range.from, range.to)
  if (found.length) decorations = decorations.remove(found)
  const rebuilt = foldDecorations(doc, folded, toggle, range)
  if (rebuilt.length) decorations = decorations.add(doc, rebuilt)
  return decorations
}

/**
 * The folding plugin (add-collapsible-list-items). `onLayout` is called after a
 * toggle, because a fold changes the rendered height without changing the
 * document and the pane's line-number gutter has to re-measure.
 */
export function createFoldPlugin(onLayout?: () => void): Plugin<FoldState> {
  const toggle: Toggle = (view, start) => {
    view.dispatch(view.state.tr.setMeta(foldKey, { toggle: start }))
    onLayout?.()
  }
  return new Plugin<FoldState>({
    key: foldKey,
    state: {
      init: (_config, state) => ({
        folded: NO_FOLDS,
        decorations: DecorationSet.create(state.doc, foldDecorations(state.doc, NO_FOLDS, toggle)),
      }),
      apply: (tr, prev, _old, newState) => {
        const meta = tr.getMeta(foldKey) as { toggle?: number } | undefined
        if (meta && typeof meta.toggle === 'number') {
          const node = newState.doc.nodeAt(meta.toggle)
          if (!node || !isFoldableItem(node)) return prev
          const folded = new Set(prev.folded)
          if (folded.has(meta.toggle)) folded.delete(meta.toggle)
          else folded.add(meta.toggle)
          const decorations = refreshRange(
            prev.decorations.map(tr.mapping, tr.doc),
            newState.doc,
            folded,
            toggle,
            topLevelBlockAt(newState.doc, meta.toggle),
          )
          return { folded, decorations }
        }
        if (!tr.docChanged) return prev
        // Carry the folds forward, dropping any whose item is no longer a
        // foldable list item (deleted, merged, or emptied of children).
        const folded = new Set<number>()
        prev.folded.forEach((pos) => {
          const mapped = tr.mapping.map(pos, -1)
          const node = newState.doc.nodeAt(mapped)
          if (node && isFoldableItem(node)) folded.add(mapped)
        })
        let decorations = prev.decorations.map(tr.mapping, tr.doc)
        for (const range of affectedTopLevelBlocks(tr)) {
          decorations = refreshRange(decorations, newState.doc, folded, toggle, range)
        }
        return { folded, decorations }
      },
    },
    props: {
      decorations: (state: EditorState) => foldKey.getState(state)?.decorations ?? null,
    },
    // Hidden content cannot hold the DOM's selection, so a selection that lands
    // inside a folded item's nested blocks is moved to the item's visible text.
    // A selection-only repair; no key is intercepted.
    appendTransaction: (_transactions, _oldState, newState) => {
      const folded = foldKey.getState(newState)?.folded
      if (!folded || folded.size === 0) return null
      const { from, to } = newState.selection
      const target =
        hiddenBoundary(newState.doc, folded, from) ?? hiddenBoundary(newState.doc, folded, to)
      if (target === null) return null
      return newState.tr.setSelection(TextSelection.near(newState.doc.resolve(target), -1))
    },
  })
}

/** Milkdown wrapper for the adapter. */
export function collapsibleLists(onLayout?: () => void) {
  return $prose(() => createFoldPlugin(onLayout))
}
