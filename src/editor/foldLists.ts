// List folding (add-collapsible-list-items, ADR-0026): a fold is a view over
// the Markdown list, never a change to it. The document keeps every line, so
// the serializer and the file do too; only the editor hides an item's nested
// content. State lives in this plugin, which the pane's per-page editor owns,
// so a page switch or a reload starts every item expanded and nothing is
// written to the vault.
//
// The control itself is not drawn here: move-list-folds-to-the-left-rail puts
// the arrows in the pane's left rail, beside the line numbers. This plugin
// marks the items, carries the folded set, and repairs a selection that lands
// in hidden content; the rail reads the marks and asks the adapter to toggle.

import { $prose } from '@milkdown/utils'
import type { Node as ProseNode } from '@milkdown/prose/model'
import type { EditorState } from '@milkdown/prose/state'
import { Plugin, PluginKey, TextSelection } from '@milkdown/prose/state'
import { Decoration, DecorationSet } from '@milkdown/prose/view'
import type { EditorView } from '@milkdown/prose/view'
import { affectedTopLevelBlocks, type BlockRange } from './inlineDecorations'
import type { FoldTarget } from './editor'

/** The node class on a list item that has a fold control and on one that is
 *  folded, and on its first (visible) block. Global names, like the badge and
 *  image classes the decorations write, and the handle the rail reads. */
export const FOLD_ITEM_CLASS = 'folio-fold-item'
export const FOLDED_CLASS = 'folio-folded'
export const FOLD_HEAD_CLASS = 'folio-fold-head'

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

/** The fold decorations for `doc`, or for one range of whole top-level blocks:
 *  a class on every foldable item and a class on its first block (what stays
 *  visible), plus a folded class when the item is folded. */
function foldDecorations(
  doc: ProseNode,
  folded: ReadonlySet<number>,
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
  }
  if (range) doc.nodesBetween(range.from, range.to, visit)
  else doc.descendants(visit)
  return decorations
}

/** Replace this feature's decorations over `range` with ones rebuilt from the
 *  current document, so a structural edit that changed which items are foldable
 *  is reflected. */
function refreshRange(
  decorations: DecorationSet,
  doc: ProseNode,
  folded: ReadonlySet<number>,
  range: BlockRange,
): DecorationSet {
  const found = decorations.find(range.from, range.to)
  if (found.length) decorations = decorations.remove(found)
  const rebuilt = foldDecorations(doc, folded, range)
  if (rebuilt.length) decorations = decorations.add(doc, rebuilt)
  return decorations
}

/**
 * The folding plugin (add-collapsible-list-items). View-only: the document is
 * never changed, and the folded set is carried forward across edits.
 */
export function createFoldPlugin(): Plugin<FoldState> {
  return new Plugin<FoldState>({
    key: foldKey,
    state: {
      init: (_config, state) => ({
        folded: NO_FOLDS,
        decorations: DecorationSet.create(state.doc, foldDecorations(state.doc, NO_FOLDS)),
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
          decorations = refreshRange(decorations, newState.doc, folded, range)
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

/** How deeply a list item nests: 1 for a first-level item, +1 per ancestor. */
function listDepth(item: Element): number {
  let depth = 1
  let parent = item.parentElement?.closest('li') ?? null
  while (parent) {
    depth += 1
    parent = parent.parentElement?.closest('li') ?? null
  }
  return depth
}

/** The foldable items inside `root`, with their current state and nesting, in
 *  document order — what the pane's left rail places its controls with. */
export function foldTargetsIn(root: HTMLElement): FoldTarget[] {
  return [...root.querySelectorAll<HTMLElement>(`li.${FOLD_ITEM_CLASS}`)].map((element) => ({
    element,
    folded: element.classList.contains(FOLDED_CLASS),
    depth: listDepth(element),
  }))
}

/** Fold or expand the list item `element` belongs to, reporting whether the
 *  element resolved to one. The element is mapped back to its document
 *  position here, so no position crosses the editor seam. */
export function toggleFoldElement(view: EditorView, element: HTMLElement): boolean {
  const item = element.closest(`li.${FOLD_ITEM_CLASS}`)
  if (!item) return false
  let inside: number
  try {
    inside = view.posAtDOM(item, 0)
  } catch {
    return false
  }
  const $pos = view.state.doc.resolve(inside)
  for (let depth = $pos.depth; depth > 0; depth--) {
    if ($pos.node(depth).type.name === 'list_item') {
      view.dispatch(view.state.tr.setMeta(foldKey, { toggle: $pos.before(depth) }))
      return true
    }
  }
  return false
}

/** Milkdown wrapper for the adapter. */
export function collapsibleLists() {
  return $prose(() => createFoldPlugin())
}
