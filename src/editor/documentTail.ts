// The document's tail (edit-after-trailing-code-block): a code block that ends
// the page keeps an empty paragraph after it, and the serialized Markdown never
// ends with a blank line, so that paragraph stays out of the vault file.
//
// Why the paragraph exists at all: `Enter` inside a code block must add a code
// line, and the ways out of the block — ArrowDown at its last line, a click
// below it — both resolve to a text position after the block. With nothing
// after it there is no such position, so the gestures did nothing and typed
// text landed in the code. The place has to exist in the document.

import { $prose } from '@milkdown/utils'
import { Plugin, PluginKey } from '@milkdown/prose/state'

/** Appends the empty paragraph a trailing code block needs. Runs after every
 *  transaction, so the paragraph is there however the code block arrived
 *  (typed, pasted, or opened from a file); it stops firing as soon as the last
 *  child is a paragraph, so empty blocks never accumulate. */
export const documentTail = $prose(
  () =>
    new Plugin({
      key: new PluginKey('folio-document-tail'),
      appendTransaction: (transactions, _oldState, state) => {
        if (!transactions.some((tr) => tr.docChanged)) return null
        if (state.doc.lastChild?.type.name !== 'code_block') return null
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
