// Marks a located block (mark-search-matches-on-the-page): opening a search
// result scrolls the matched block into view and washes it for a moment. The
// mark is a decoration, not content — the page's Markdown and the file never
// change (ADR-0001, ADR-0009), and nothing reaches the serializer.
//
// A mark is cleared by the next document change, by a later request, or by the
// adapter's timer; the stylesheet's fade runs the same two seconds, so the
// removal is invisible.

import { $prose } from '@milkdown/utils'
import type { Node as ProseNode } from '@milkdown/prose/model'
import type { EditorState } from '@milkdown/prose/state'
import { Plugin, PluginKey } from '@milkdown/prose/state'
import { Decoration, DecorationSet } from '@milkdown/prose/view'
import type { EditorView } from '@milkdown/prose/view'

/** The mark's class, and how long it lasts. `HIGHLIGHT_MS` and the stylesheet's
 *  fade duration are the same interval and must not drift. */
export const SEARCH_HIT_CLASS = 'folio-search-hit'
export const HIGHLIGHT_MS = 2000

type HighlightState = {
  block: number | null
  decorations: DecorationSet
}

const highlightKey = new PluginKey<HighlightState>('folioSearchHighlight')

/** The document position of `block`'s first character, or null when the index
 *  names no block the document holds. */
export function blockStart(doc: ProseNode, block: number): number | null {
  if (block < 0 || block >= doc.childCount) return null
  let from = 0
  for (let i = 0; i < block; i++) from += doc.child(i).nodeSize
  return from
}

/** A decoration over the requested block, or an empty set. */
function decorationsFor(doc: ProseNode, block: number | null): DecorationSet {
  if (block === null) return DecorationSet.empty
  const from = blockStart(doc, block)
  if (from === null) return DecorationSet.empty
  return DecorationSet.create(doc, [
    Decoration.node(from, from + doc.child(block).nodeSize, { class: SEARCH_HIT_CLASS }),
  ])
}

/** Set the mark to `block`, or clear it with null. A meta-only transaction, so
 *  it is never a document edit and never an undo step. */
export function setHighlight(view: EditorView, block: number | null): void {
  view.dispatch(view.state.tr.setMeta(highlightKey, { block }))
}

/** Clear the mark. */
export function clearHighlight(view: EditorView): void {
  setHighlight(view, null)
}

/** The highlight plugin. */
export function createSearchHighlightPlugin(): Plugin<HighlightState> {
  return new Plugin<HighlightState>({
    key: highlightKey,
    state: {
      init: () => ({ block: null, decorations: DecorationSet.empty }),
      apply: (tr, prev, _old, newState) => {
        const meta = tr.getMeta(highlightKey) as { block?: number | null } | undefined
        if (meta !== undefined) {
          const block = meta.block ?? null
          return { block, decorations: decorationsFor(newState.doc, block) }
        }
        // An edit clears the mark; a selection-only transaction leaves it.
        if (!tr.docChanged || prev.block === null) return prev
        return { block: null, decorations: DecorationSet.empty }
      },
    },
    props: {
      decorations: (state: EditorState) => highlightKey.getState(state)?.decorations ?? null,
    },
  })
}

/** Milkdown wrapper for the adapter. */
export function searchHighlight() {
  return $prose(() => createSearchHighlightPlugin())
}
