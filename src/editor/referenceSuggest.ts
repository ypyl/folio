// Reference and vault-file completion (add-reference-autocomplete, design
// D1/D4/D5/D6/D7; add-asset-references, design D3): one ProseMirror plugin that
// offers existing pages while a reference is being typed, and the vault's files
// while a link destination is being typed, and writes the canonical text when a
// row is accepted. The document keeps literal `#word` / `#[[Page]]` text and
// consumes the Markdown link it is given (ADR-0001), so nothing here serializes
// or parses Markdown: completion is an edit like typing.
//
// One plugin and one popup for both kinds, because the two triggers are
// lexically exclusive — a destination is not a reference token, and a `#`
// destination falls through to the reference trigger — so a second plugin would
// duplicate the whole view hook, key handler, and dismissal rules to gain
// nothing but the possibility of two popups at once.
//
// The plugin is deliberately separate from `inlineDecorations`. Badges must not
// depend on the caret, so their `apply` ignores selection-only transactions;
// this popup is entirely caret-driven. Two plugins, two keys, no shared state.

import { $prose } from '@milkdown/utils'
import type { Node as ProseNode } from '@milkdown/prose/model'
import type { PluginView, Selection } from '@milkdown/prose/state'
import { Plugin, PluginKey } from '@milkdown/prose/state'
import type { EditorView } from '@milkdown/prose/view'
import { linkLabel, markdownDestination } from '../vault/link'
import {
  boardReferenceTrigger,
  boardToken,
  linkDestinationTrigger,
  referenceToken,
  referenceTrigger,
  type BoardTrigger,
  type DestinationTrigger,
  type ReferenceTrigger,
} from '../vault/parse'
import type { Suggestion } from '../vault/suggest'
import { popupPlacement } from './popupPlacement'
import styles from './referenceSuggest.module.css'

/** Non-text inline nodes stand in as one character, matching their position
 *  size, so a hard break cannot join a '#' on one line to text on the next and
 *  offsets still map 1:1 to positions. */
const LEAF_TEXT = '\n'

/** Meta for the two state changes that are not derived from the document:
 *  `suppress` closes the popup for one exact token text, `move` steps the
 *  active row. */
type Meta = { suppress?: string; move?: 1 | -1 }

export type SuggestionState = {
  /** Which picker is open: page references, board references, or a link
   *  destination's files. */
  kind: 'page' | 'board' | 'file' | null
  /** The reference token or link destination being typed at the caret. */
  trigger: ReferenceTrigger | BoardTrigger | DestinationTrigger | null
  suggestions: Suggestion[]
  /** Row `Enter` or `Tab` would accept. */
  active: number
  /** Token text the user accepted or dismissed. The popup stays closed for that
   *  exact text until it changes, which is also what closes it after a pick
   *  (the completed text is itself a trigger). */
  suppressed: string | null
}

export const suggestionKey = new PluginKey<SuggestionState>('folioReferenceSuggest')

const EMPTY: SuggestionState = {
  kind: null,
  trigger: null,
  suggestions: [],
  active: 0,
  suppressed: null,
}

/** Whether the popup should be on screen, derived so the key handler and the
 *  view hook cannot disagree. */
export function popupVisible(state: SuggestionState): boolean {
  return (
    state.trigger !== null &&
    state.suggestions.length > 0 &&
    state.trigger.text !== state.suppressed
  )
}

/**
 * The reference token or link destination ending at the caret, or null. Fenced
 * code and inline code never complete, matching the badges (page-editing: code
 * is never badged), and a non-collapsed selection has no caret to anchor to.
 * Takes anything carrying a document and a selection, so it works on a state or
 * a transaction. The destination is asked first: it is the narrower position,
 * and a `#` after `](` is the reference trigger's business, never a file's.
 */
export function triggerAt(source: {
  doc: ProseNode
  selection: Selection
}): ReferenceTrigger | BoardTrigger | DestinationTrigger | null {
  const { selection } = source
  if (!selection.empty) return null
  const $from = selection.$from
  const parent = $from.parent
  if (!parent.isTextblock || parent.type.name === 'code_block') return null
  // The node before the caret is the text being typed; `$from.marks()` reports
  // the marks of the wrong node at a text boundary.
  const typed = $from.nodeBefore
  if (typed && typed.marks.some((mark) => mark.type.name === 'inlineCode')) return null
  const before = parent.textBetween(0, $from.parentOffset, undefined, LEAF_TEXT)
  const after = parent.textBetween($from.parentOffset, parent.content.size, undefined, LEAF_TEXT)
  // The destination is asked first: it is the narrower position, and a `#`
  // after `](` is the reference trigger's business, never a file's. The board
  // trigger is tried before the page trigger because `#!` is its own sigil.
  return (
    linkDestinationTrigger(before, after) ??
    boardReferenceTrigger(before, after) ??
    referenceTrigger(before, after)
  )
}

type ReferenceSuggestOptions = {
  /** Page-name candidates for the reference being typed. Read at query time, so
   *  a source bound to the live vault index stays current without
   *  re-registering. */
  pages: (query: string) => Suggestion[]
  /** Board-name candidates for a `#!` reference being typed (add-whiteboards).
   *  Absent means no board suggestions. */
  boards?: (query: string) => Suggestion[]
  /** Vault-file candidates for a link destination. `onlyImages` is the
   *  narrowing the typed syntax asks for (add-asset-references, design D4). */
  files: (query: string, onlyImages: boolean) => Suggestion[]
}

/**
 * The plugin: state from the document and the caret, DOM from the view hook,
 * keys from a DOM event handler. Nothing else.
 */
export function createReferenceSuggestPlugin(
  options: ReferenceSuggestOptions,
): Plugin<SuggestionState> {
  return new Plugin<SuggestionState>({
    key: suggestionKey,
    state: {
      init: (_config, state) => derive(EMPTY, state, options, null),
      apply: (tr, prev) => {
        const meta = tr.getMeta(suggestionKey) as Meta | undefined
        // Nothing relevant changed: hand back the same object so the view hook's
        // reference-equality check skips the DOM work. ProseMirror and Milkdown
        // emit plenty of transactions that touch neither document nor selection.
        if (!tr.docChanged && !tr.selectionSet && !meta) return prev
        return derive(prev, tr, options, meta ?? null)
      },
    },
    props: {
      handleDOMEvents: {
        keydown: (view, event) => suggestionKeyDown(view, event),
      },
    },
    view: (view) => popupView(view),
  })
}

/** Milkdown wrapper, so the adapter can register the plugin with its sources. */
export function referenceSuggest(sources: ReferenceSuggestOptions) {
  return $prose(() => createReferenceSuggestPlugin(sources))
}

function derive(
  prev: SuggestionState,
  source: { doc: ProseNode; selection: Selection },
  options: ReferenceSuggestOptions,
  meta: Meta | null,
): SuggestionState {
  const suppressed = meta?.suppress ?? prev.suppressed
  const trigger = triggerAt(source)
  if (!trigger) return { ...EMPTY, suppressed }
  const kind = trigger.kind === 'destination' ? 'file' : 'board' in trigger ? 'board' : 'page'
  const suggestions =
    trigger.kind === 'destination'
      ? options.files(trigger.text, trigger.image)
      : 'board' in trigger
        ? (options.boards?.(trigger.query) ?? [])
        : options.pages(trigger.query)
  // The active row survives while the same text is being edited, resets when
  // the typed text changes, and clamps if the list shrank under it.
  const sameToken = prev.trigger?.text === trigger.text
  const last = Math.max(0, suggestions.length - 1)
  const active =
    meta?.move != null && sameToken
      ? wrap(prev.active + meta.move, suggestions.length)
      : sameToken
        ? Math.min(prev.active, last)
        : 0
  return { kind, trigger, suggestions, active, suppressed }
}

function wrap(index: number, length: number): number {
  if (length <= 0) return 0
  return ((index % length) + length) % length
}

/**
 * The keys the popup claims while it is visible (design D6). Registered as a
 * DOM event handler so it runs before ProseMirror's keymaps regardless of plugin
 * order, and so it prevents the browser default itself: a claimed key
 * short-circuits `editHandlers.keydown`, which is where that normally happens.
 */
export function suggestionKeyDown(view: EditorView, event: KeyboardEvent): boolean {
  const state = suggestionKey.getState(view.state)
  const trigger = state?.trigger
  if (!state || !trigger || !popupVisible(state)) return false
  // This path bypasses the editor's own composition check, so it makes its own.
  if (event.isComposing || view.composing) return false
  // A key inside the code block's CodeMirror surface belongs to it (the same
  // guard the markdown-aware paste uses).
  if (event.target instanceof HTMLElement && event.target.closest('.cm-editor')) return false
  // Never claim a modified key: `Mod+Enter` keeps activating the reference at
  // the caret, and `Mod+]` / `Mod+[` keep indenting lists.
  if (event.altKey || event.ctrlKey || event.metaKey) return false

  const { key } = event
  if (key === 'ArrowDown' || key === 'ArrowUp') {
    view.dispatch(view.state.tr.setMeta(suggestionKey, { move: key === 'ArrowDown' ? 1 : -1 }))
  } else if (key === 'Enter' || (key === 'Tab' && !event.shiftKey)) {
    const row = state.suggestions[state.active]
    if (!row) return false
    accept(view, row)
  } else if (key === 'Escape') {
    view.dispatch(view.state.tr.setMeta(suggestionKey, { suppress: trigger.text }))
  } else {
    return false
  }
  // Without this, `Tab` moves focus out of the editor and `Enter` inserts a
  // newline on top of the accept.
  event.preventDefault()
  return true
}

/**
 * Accepting is one transaction (design D4): for a reference, replace the
 * in-progress token with the canonical one; for a link destination, replace the
 * whole construct with the link or image it was naming. Either way the popup is
 * suppressed for the exact text written, in the same step. ProseMirror maps the
 * selection, so the caret lands after what was inserted; the edit then reaches
 * the draft and the debounced save like any other keystroke.
 */
function accept(view: EditorView, row: Suggestion): void {
  const trigger = suggestionKey.getState(view.state)?.trigger
  if (!trigger) return
  if (trigger.kind === 'destination') return acceptDestination(view, row, trigger)
  const to = view.state.selection.from
  // Every character before the caret is one position, so the token's start is
  // exactly its length back.
  const from = to - trigger.text.length
  if (from < 0) return
  const token =
    'board' in trigger ? boardToken(row.name, trigger.kind) : referenceToken(row.name, trigger.kind)
  view.dispatch(
    view.state.tr.insertText(token, from, to).setMeta(suggestionKey, { suppress: token }),
  )
}

/**
 * Write the picked file as the reference the user was already writing (design
 * D5): replace `[label](typed` — brackets, destination and, for an image, the
 * `!` — with the label as a text node carrying the link mark, or with an image
 * node. The brackets have to go: the document holds a link as marked text, and
 * the serializer adds the syntax back, which is why an insertion of plain text
 * would not be a link (the preset has no link input rule).
 */
function acceptDestination(view: EditorView, row: Suggestion, trigger: DestinationTrigger): void {
  const { schema } = view.state
  const to = view.state.selection.from
  // `](` sits immediately before the typed destination, and the label before it.
  const destinationFrom = to - trigger.text.length
  const labelFrom = destinationFrom - 2 - trigger.label.length
  const from = trigger.image ? labelFrom - 2 : labelFrom - 1
  if (from < 0) return
  // The typed label is the user's own text; an empty one takes the file's name,
  // the same label a drop or a paste writes.
  const label = trigger.label === '' ? linkLabel(row.path) : trigger.label
  if (label === '') return
  const destination = markdownDestination(row.path)
  const linkType = schema.marks.link
  const imageType = schema.nodes.image
  const insert =
    trigger.image && imageType
      ? imageType.create({ src: destination, alt: label })
      : !trigger.image && linkType
        ? schema.text(label, [linkType.create({ href: destination })])
        : null
  if (!insert) return
  view.dispatch(
    view.state.tr.replaceWith(from, to, insert).setMeta(suggestionKey, { suppress: trigger.text }),
  )
}

/**
 * The popup element (design D5/D7): created once, appended as a sibling of the
 * editable root (never inside it, which ProseMirror owns), and driven entirely
 * from plugin state. Removed on destroy, because the pane remounts the editor
 * under StrictMode while its host element stays in the DOM.
 */
function popupView(view: EditorView): PluginView {
  const el = document.createElement('div')
  el.className = styles.popup
  el.setAttribute('role', 'listbox')
  el.setAttribute('aria-label', 'Pages')
  el.hidden = true
  ;(view.dom.parentElement ?? document.body).appendChild(el)

  let focused = view.hasFocus()

  const position = () => {
    let caret: { left: number; right: number; top: number; bottom: number }
    try {
      caret = view.coordsAtPos(view.state.selection.from)
    } catch {
      // Measurement needs layout. Where there is none (a hidden pane, a detached
      // editor) the popup is an aid, never a reason to throw on the typing path:
      // hide it and let the next edit try again.
      el.hidden = true
      return
    }
    const box = el.getBoundingClientRect()
    const placed = popupPlacement(
      caret,
      { width: box.width, height: box.height },
      { width: window.innerWidth, height: window.innerHeight },
    )
    if (!placed) {
      el.hidden = true
      return
    }
    el.style.left = `${placed.left}px`
    el.style.top = `${placed.top}px`
  }

  const render = (state: SuggestionState) => {
    el.replaceChildren()
    el.setAttribute('aria-label', state.kind === 'file' ? 'Files' : 'Pages')
    state.suggestions.forEach((row, index) => {
      const item = document.createElement('div')
      item.className = index === state.active ? `${styles.row} ${styles.active}` : styles.row
      item.setAttribute('role', 'option')
      item.setAttribute('aria-selected', index === state.active ? 'true' : 'false')
      const [start, end] = row.match
      if (start > 0) item.append(row.name.slice(0, start))
      const hit = document.createElement('mark')
      hit.className = styles.hit
      hit.textContent = row.name.slice(start, end)
      item.append(hit)
      if (end < row.name.length) item.append(row.name.slice(end))
      // mousedown, not click: preventDefault keeps focus and the DOM selection
      // in the editor, which is where the pick is applied.
      item.addEventListener('mousedown', (event) => {
        event.preventDefault()
        accept(view, row)
      })
      el.append(item)
    })
  }

  const sync = () => {
    const state = suggestionKey.getState(view.state)
    if (!state || !focused || !popupVisible(state)) {
      el.hidden = true
      return
    }
    render(state)
    el.hidden = false
    position()
  }

  // The pane scrolls under the popup when typing near its bottom edge, and a
  // resize moves the caret with it: reposition rather than hide.
  const reposition = () => {
    if (!el.hidden) position()
  }
  const onScroll = () => reposition()
  const onResize = () => reposition()
  window.addEventListener('scroll', onScroll, true)
  window.addEventListener('resize', onResize)

  // Blur is not a dismissal (design D7): it hides, and focusing the editor again
  // brings the picker back for a token that was never accepted or dismissed.
  const onBlur = () => {
    focused = false
    el.hidden = true
  }
  const onFocus = () => {
    focused = true
    sync()
  }
  view.dom.addEventListener('blur', onBlur)
  view.dom.addEventListener('focus', onFocus)

  return {
    update: (_view, prevState) => {
      if (suggestionKey.getState(prevState) === suggestionKey.getState(view.state)) return
      sync()
    },
    destroy: () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
      view.dom.removeEventListener('blur', onBlur)
      view.dom.removeEventListener('focus', onFocus)
      el.remove()
    },
  }
}
