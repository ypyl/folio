// The document's tail: an open page always keeps an empty paragraph after its
// last block, so a blank line to continue on is always visible at the end, and
// the serialized Markdown never ends with a blank line, so that paragraph stays
// out of the vault file.
//
// Why the paragraph exists at all: a block that holds the caret inside itself
// (a code block, a table) needs a text position after it, or `ArrowDown` at its
// last line and a click below it resolve back inside it and do nothing. A page
// ending with a paragraph, a list, or a quote has the same need met by the
// invariant rather than by block type: the visible empty line is always there.

import { $prose } from '@milkdown/utils'
import { Plugin, PluginKey } from '@milkdown/prose/state'

/** Appends the empty paragraph the page ends with. Runs after every
 *  transaction, so the paragraph is there however the last block arrived
 *  (typed, pasted, or opened from a file); it stops firing as soon as the last
 *  child is an empty paragraph, so empty blocks never accumulate. */
export const documentTail = $prose(
  () =>
    new Plugin({
      key: new PluginKey('folio-document-tail'),
      appendTransaction: (transactions, _oldState, state) => {
        if (!transactions.some((tr) => tr.docChanged)) return null
        const last = state.doc.lastChild
        if (last && last.type.name === 'paragraph' && last.content.size === 0) return null
        const paragraph = state.schema.nodes.paragraph.createAndFill()
        if (!paragraph) return null
        return state.tr.insert(state.doc.content.size, paragraph)
      },
    }),
)

/** Markdown ends with one newline and no blank lines: the maintained trailing
 *  paragraph must not reach the file, and neither must a stray blank line the
 *  user left at the end. Interior blank lines are untouched — only the file's
 *  tail is normalized. */
export function trimTrailingBlankLines(markdown: string): string {
  return markdown.replace(/\n+$/, '\n')
}
