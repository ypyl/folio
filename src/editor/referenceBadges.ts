// Reference badges (add-reference-badges, design D1/D2/D5): a ProseMirror
// inline decoration over every page reference token in the open page, plus the
// click/keyboard path that opens the target. The badge is presentational —
// the document keeps the literal `#word` / `#[[Page]]` text — so Markdown stays
// canonical (ADR-0001, ADR-0009) and no serializer or second tokenizer exists.
// The canonical `REF` regex is shared with the index (design D6), so what the
// editor badges is exactly what the vault counts.

import { $prose } from '@milkdown/utils'
import type { Node as ProseNode } from '@milkdown/prose/model'
import type { EditorState } from '@milkdown/prose/state'
import { Plugin, PluginKey } from '@milkdown/prose/state'
import type { EditorView } from '@milkdown/prose/view'
import { Decoration, DecorationSet } from '@milkdown/prose/view'
import { findReferenceRanges } from '../vault/parse'

/** The chord that opens the reference at the caret (design D3). */
export const REFERENCE_OPEN_SHORTCUT = 'Mod-Enter'

/** One reference token's document positions and its page-name target. */
export type ReferenceRef = {
  from: number
  to: number
  target: string
}

type ReferenceState = {
  decorations: DecorationSet
  refs: ReferenceRef[]
}

const referenceKey = new PluginKey<ReferenceState>('folioReferenceBadges')

/** Build the badge decorations and clickable spans for a document. Skips
 *  inline code (the `code` mark) and fenced code (`code_block` subtrees): a
 *  reference token inside code is code, not a link. */
export function buildReferenceState(doc: ProseNode): ReferenceState {
  const refs: ReferenceRef[] = []
  const marks: Decoration[] = []
  doc.descendants((node, pos) => {
    if (node.type.name === 'code_block') return false
    if (!node.isText || node.text == null) return
    // Milkdown's commonmark preset names the inline-code mark `inlineCode`.
    if (node.marks.some((mark) => mark.type.name === 'inlineCode')) return
    for (const range of findReferenceRanges(node.text)) {
      const from = pos + range.from
      const to = pos + range.to
      refs.push({ from, to, target: range.target })
      marks.push(Decoration.inline(from, to, { class: 'ref' }))
    }
    return
  })
  return { decorations: DecorationSet.create(doc, marks), refs }
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

export type ReferencePluginOptions = {
  /** Called with the target when a badge is clicked or Mod+Enter is pressed. */
  onActivate?: (target: string) => void
  /** Document scan, injectable for tests. Defaults to buildReferenceState. */
  scan?: (doc: ProseNode) => ReferenceState
}

/** The plain ProseMirror plugin: decorations from document content only, plus
 *  the click and Mod+Enter activations. Decorations never depend on the
 *  selection or focus, so caret moves recompute nothing and repaint nothing
 *  (design D2/D4). */
export function createReferencePlugin(
  options: ReferencePluginOptions = {},
): Plugin<ReferenceState> {
  const scan = options.scan ?? buildReferenceState
  return new Plugin<ReferenceState>({
    key: referenceKey,
    state: {
      init: (_config, state) => scan(state.doc),
      // The badge is a function of the document: a selection-only or focus
      // transaction leaves the set untouched (no rescan, same object).
      apply: (tr, value) => (tr.docChanged ? scan(tr.doc) : value),
    },
    props: {
      decorations: (state: EditorState) => referenceKey.getState(state)?.decorations ?? null,
      handleClick: (view: EditorView, pos: number) => {
        const ref = referenceAt(referenceKey.getState(view.state)?.refs ?? [], pos)
        if (!ref) return false
        options.onActivate?.(ref.target)
        return true
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
export function referenceBadges(onActivate: (target: string) => void) {
  return $prose(() => createReferencePlugin({ onActivate }))
}
