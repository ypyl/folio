// On-demand JSON formatting for the component-backed code block
// (format-json-code-block, design D1-D6).
//
// The format itself is a ProseMirror command over the code block node: it reads
// the fence's language attribute, reindents the block's text, and replaces that
// text in one transaction. Markdown stays canonical — the block's content is
// what serializes between its fence marks (ADR-0001).
//
// The command is *invoked* by the adapter's capture-phase key handler rather
// than by a keymap, because no keymap can own the chord cleanly: ProseMirror
// never sees a key pressed inside the block (the node view stops every event),
// and CodeMirror's search keymap owns `Mod-f` in the editor scope, which is
// where a character chord like `Mod-Shift-f` resolves first. The adapter claims
// the chord before either surface sees it (design D1).

import type { Command } from '@milkdown/prose/state'
import { type EditorState, TextSelection } from '@milkdown/prose/state'

/** The chord the adapter claims for this command, as the shortcuts reference
 *  spells it. */
export const FORMAT_JSON_CHORD = 'Mod-Shift-f'

/** The language whose blocks the chord acts on. The fence may spell it `json`
 *  or the picker may have written `JSON`; the attribute is compared
 *  case-insensitively. */
const JSON_LANGUAGE = 'json'

/** The indent the formatter writes. Two spaces is `JSON.stringify`'s
 *  conventional step and what the user means by readable (design D6). */
const INDENT = 2

/** Reindent `text` as JSON, or return `null` when it is not valid JSON or is
 *  already in that exact form. Pure: the same text always yields the same
 *  answer. `JSON.parse` then `JSON.stringify` preserves every key, every value,
 *  and their order — only the whitespace between tokens can change. */
export function formatJsonText(text: string): string | null {
  try {
    const formatted = JSON.stringify(JSON.parse(text), null, INDENT)
    return formatted === text ? null : formatted
  } catch {
    return null
  }
}

/** Whether the caret sits in a code block, whatever its language. The adapter
 *  claims the format chord only here: inside a block, an attempted reformat
 *  that cannot apply (a non-JSON language, invalid JSON, already-formatted
 *  text) must leave the surface alone rather than fall through to CodeMirror's
 *  search binding, which shares the chord's base key. */
export function isInCodeBlock(state: EditorState): boolean {
  return state.selection.$from.parent.type.name === 'code_block'
}

/** The code block's format command (design D5): it runs only with the caret in
 *  a JSON code block whose text the formatter can actually change. Anywhere
 *  else — a paragraph, a block whose language is not JSON, invalid JSON, or
 *  already-formatted text — it declines, so a press writes nothing and records
 *  no undo step. */
export const formatJsonBlock: Command = (state, dispatch) => {
  const { $from } = state.selection
  const node = $from.parent
  if (node.type.name !== 'code_block') return false
  const language = node.attrs.language
  if (typeof language !== 'string' || language.toLowerCase() !== JSON_LANGUAGE) return false
  const formatted = formatJsonText(node.textContent)
  if (formatted === null) return false
  if (dispatch) {
    const from = $from.start()
    const to = from + node.content.size
    const tr = state.tr.replaceWith(from, to, state.schema.text(formatted))
    // The whole block is replaced, so the caret goes back to its start where
    // the result can be read from the top.
    tr.setSelection(TextSelection.near(tr.doc.resolve(from)))
    dispatch(tr)
  }
  return true
}
