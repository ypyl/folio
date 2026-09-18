// Milkdown transport for the editor seam (design D1, ADR-0008). Imperative
// mount onto a DOM element: EditorPane owns the element and the lifecycle,
// this adapter owns the editor. Styling is applied by the pane's token-based
// stylesheet (design D3) — no @milkdown/theme-* import.

import {
  Editor,
  editorViewCtx,
  editorViewOptionsCtx,
  parserCtx,
  rootCtx,
  serializerCtx,
} from '@milkdown/core'
import { history } from '@milkdown/plugin-history'
import { listener, listenerCtx } from '@milkdown/plugin-listener'
import { commonmark } from '@milkdown/preset-commonmark'
import type { Node as ProseNode, Slice } from '@milkdown/prose/model'
import { codeBlockComponent, codeBlockConfig } from '@milkdown/components/code-block'
import { tableBlock, tableBlockConfig } from '@milkdown/components/table-block'
import { codeBlockExtensions, codeBlockLanguages } from './codeBlockSetup'
import { tableRenderButton, tableSlice } from './tableSetup'
import { tableCellCaret } from './tableCellCaret'
import { keepTableHandlesInThePane } from './tableHandleClamp'
import { chordToKeyEventInit } from './chord'
import { looksLikeMarkdown } from './markdownLike'
import { inlineDecorations } from './inlineDecorations'
import { noVaultReader, type AssetReader } from '../vault/assetOpen'
import { vaultImageView } from './vaultImageView'
import { referenceSuggest } from './referenceSuggest'
import { documentTail, trimTrailingBlankLines } from './documentTail'
import { blockStartLines } from '../lineAnchors'
import type { EditorAdapter, SuggestionSources } from './editor'

/** Private clipboard flavor carrying the selection's canonical Markdown
 *  (copy-as-markdown), so the app's own paste restores structure without the
 *  markdown-likeness gate. External targets never see it. */
export const FOLIO_CLIPBOARD_FLAVOR = 'application/x-folio-markdown'

export class MilkdownAdapter implements EditorAdapter {
  private editor: Editor | null = null
  private latest = ''
  private changeListener: ((markdown: string) => void) | null = null
  private referenceClickListener: ((target: string) => void) | null = null
  /** Vault bytes for a link a page points into the vault, read through this at
   *  activation time for the same reason the reference listener is consulted
   *  then: the reader is attached after mount, and a folder switch replaces the
   *  vault behind it (open-vault-assets). Starts as the reader that cannot
   *  answer, so a link opens nothing until the app attaches one. */
  private assetReader: AssetReader = noVaultReader
  /** Completion candidates, read through a getter at query time: the app
   *  replaces its pool on every save, and the adapter mounts once. */
  private suggestSources: SuggestionSources | null = null
  private destroyed = false
  // Programmatic-seed bookkeeping (design C2 round-trip normalization): after
  // setContent the listener emits one markdownUpdated for the doc we just
  // dispatched. That echo carries no user edit — for a non-canonical file it
  // re-serializes to a different form than the raw bytes, which would otherwise
  // mark a freshly-opened page dirty and rewrite it. Suppress it; only a real
  // change (doc differs from the seed) reaches onChange. The seed is cleared
  // by the first update, so it only ever holds a pending echo.
  private seedMarkdown: string | null = null
  // Copy/cut flavor wiring (copy-as-markdown): the listener lives on the mount
  // root, not in handleDOMEvents, because ProseMirror's own copy handler runs
  // after custom handlers and calls clipboardData.clearData(); a listener on an
  // ancestor runs after it, so the flavor written here survives.
  private copyRoot: HTMLElement | null = null
  private copySnapshot: ((event: Event) => void) | null = null
  private copyWrite: ((event: Event) => void) | null = null
  // Caret-surface tracking (apply-shortcuts-on-click, design D7): an applied
  // chord must land where the caret is, and while the caret is inside a code
  // block that surface is CodeMirror's, not the ProseMirror root. `focusin`
  // bubbles, so one listener on the mount root sees both surfaces.
  private focusRoot: HTMLElement | null = null
  private focusHandler: ((event: FocusEvent) => void) | null = null
  private lastFocusedWithin: HTMLElement | null = null
  // Forward delete in a list item (see deleteDeletesText): the one key this
  // adapter intercepts before the editor's own keymaps see it.
  private keyRoot: HTMLElement | null = null
  private keyHandler: ((event: KeyboardEvent) => void) | null = null
  // A table's handles inside the pane (keep-table-handles-in-the-pane): the
  // component places them above the row or cell they belong to, which the pane's
  // box can clip when the table sits at its top edge.
  private handleClamp: (() => void) | null = null

  /** Mount the editor into `el`. The element must stay in the document for
   *  the editor's lifetime. If `destroy()` was called while `create()` was
   *  still in flight (StrictMode remount, fast page switch), the created
   *  editor is torn down immediately instead of leaking into the DOM. */
  async mount(el: HTMLElement): Promise<void> {
    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, el)
        // Paste is markdown-aware (paste-as-markdown): the clipboard's plain
        // text is inserted either literally or — when it resembles a Markdown
        // document (looksLikeMarkdown) — parsed into real blocks and
        // formatting. The default ProseMirror path parses the HTML fragment
        // through the schema's parseDOM and plants invisible bold/italic/code
        // marks and links that a WYSIWYG view cannot un-format; reading only
        // text/plain keeps that pollution out no matter which branch runs.
        // Literal inserts stay canonical (ADR-0001): the serializer escapes
        // markdown-significant runs (`\*\*wow\*\*`) so a reload re-parses to
        // the same text. Mod+Shift+V is the universal "plain text" paste and
        // forces the literal branch, bypassing the sniff. A clipboard with no
        // text (copied files) falls through to the default handler.
        ctx.update(editorViewOptionsCtx, (prev) => ({
          ...prev,
          handlePaste: (view, event) => {
            // A paste aimed at a code block belongs to its CodeMirror surface
            // (code-block-component): CM keeps multiline text and indentation
            // there. Yield to it; all other pastes follow the paste rule.
            if (event.target instanceof HTMLElement && event.target.closest('.cm-editor')) {
              return false
            }
            // The DOM lib types ClipboardEvent without the modifier keys the
            // browser actually provides; read them via the shared shape.
            const mods = event as ClipboardEvent & {
              shiftKey: boolean
              ctrlKey: boolean
              metaKey: boolean
            }
            const forceLiteral = mods.shiftKey && (mods.ctrlKey || mods.metaKey)
            // The app's own clipboard (copy-as-markdown): canonical Markdown
            // under the private flavor is parsed unconditionally, so a selection
            // copied or cut in the editor round-trips whatever its shape. The
            // force-literal shortcut still wins and inserts plain text verbatim.
            const flavor = forceLiteral
              ? null
              : event.clipboardData?.getData(FOLIO_CLIPBOARD_FLAVOR)
            if (flavor) {
              this.insertParsedMarkdown(flavor)
              return true
            }
            const text = event.clipboardData?.getData('text/plain')
            if (!text) return false
            if (forceLiteral || !looksLikeMarkdown(text)) {
              const { from, to } = view.state.selection
              view.dispatch(view.state.tr.insertText(text, from, to))
            } else {
              this.insertParsedMarkdown(text)
            }
            return true
          },
        }))
        ctx.get(listenerCtx).markdownUpdated((_ctx, markdown) => {
          // The tail is normalized on the way out (edit-after-trailing-code-block):
          // the paragraph the document keeps after a trailing code block must not
          // reach the file, and neither must a stray blank line at the end.
          const canonical = trimTrailingBlankLines(markdown)
          this.latest = canonical
          // The first event after a setContent echoes the seeded doc. If it
          // matches what we dispatched, it is not an edit — drop it. Any other
          // event (a real keystroke, even one folded into the same debounce
          // window) differs from the seed and is forwarded.
          const seedEcho = canonical === this.seedMarkdown
          this.seedMarkdown = null
          if (seedEcho) return
          this.changeListener?.(canonical)
        })
        // are edited inside a CodeMirror surface — the picker gets the
        // language catalog, the surface gets the extensions (highlighting,
        // line numbers, completion, folding, search) themed with Folio
        // tokens (DESIGN.md — Code).
        ctx.update(codeBlockConfig.key, (prev) => ({
          ...prev,
          languages: codeBlockLanguages,
          extensions: codeBlockExtensions,
        }))
        // The table block's controls (add-table-editing, design D4): the
        // component fills a span with whatever this returns, so the markup is
        // Folio's own drawing plus the label that names the control.
        ctx.update(tableBlockConfig.key, (prev) => ({
          ...prev,
          renderButton: tableRenderButton,
        }))
      })
      .use(commonmark)
      // The image node's DOM (fit-vault-images-to-pane, ADR-0018): a wrapper with
      // the expand/collapse control, registered over the commonmark image schema.
      // It is a view, not a resolver — the pane's asset pass still turns a vault
      // path into the bytes, and this view is careful not to write that `blob:`
      // URL back into the document (render-vault-images' "no node view" note
      // still holds for resolution; the control is what needed Folio's own DOM).
      .use(vaultImageView)
      .use(listener)
      .use(history)
      .use(codeBlockComponent)
      // Reference badges (add-reference-badges): inline decorations over
      // `#word` / `#[[Page]]`, and a click / Mod+Enter path that reports the
      // target across the seam. The listener is read at activation time, so
      // onReferenceClick may be attached after mount. The same goes for the
      // vault reader a vault-relative link is opened with (open-vault-assets):
      // with no vault open there is none, and the gesture opens nothing.
      .use(
        inlineDecorations(
          (target) => this.referenceClickListener?.(target),
          (path) => this.assetReader(path),
        ),
      )
      // Tables (add-table-editing, design D1): GFM's table slice and the
      // component block that gives it controls. Registered after the decoration
      // plugin, so the reference chord keeps its meaning inside a cell (D8): the
      // GFM keymap binds Mod-Enter to leaving a table, and the reference wins.
      .use(tableSlice)
      .use(tableBlock)
      // A click in a table cell is a caret, not a selection of the whole cell
      // (make-table-entry-usable, design D1/D2): the component claims the press,
      // so the selection it dispatches is converted here.
      .use(tableCellCaret)
      // Reference and vault-file completion (add-reference-autocomplete,
      // add-asset-references): the popup and its keys, fed by the app's
      // candidate sources through the getters above.
      .use(
        referenceSuggest({
          pages: (query) => this.suggestSources?.pages(query) ?? [],
          files: (query, onlyImages) => this.suggestSources?.files(query, onlyImages) ?? [],
        }),
      )
      // Document tail (edit-after-trailing-code-block): a code block that ends
      // the page keeps an empty paragraph after it, so the block is always
      // followed by somewhere to continue.
      .use(documentTail)
      .create()
    if (this.destroyed) {
      await editor.destroy()
      return
    }
    this.editor = editor
    this.latest = this.serialize()
    // Copy/cut carries the selection as canonical Markdown under a private
    // flavor (copy-as-markdown). text/plain and text/html are left exactly as
    // ProseMirror sets them; only the extra flavor is added. The snapshot runs
    // in the capture phase because ProseMirror's own cut handler deletes the
    // selection, and the write runs in the bubble phase because that handler
    // also calls clipboardData.clearData(); the mount root is an ancestor of
    // the editable root, so it sees both phases.
    let pendingFlavor: string | null = null
    const snapshotFlavor = () => {
      pendingFlavor = null
      editor.action((ctx) => {
        const view = ctx.get(editorViewCtx)
        const { from, to } = view.state.selection
        if (from === to) return
        const markdown = this.serializeSlice(view.state.doc.slice(from, to))
        if (markdown !== '') pendingFlavor = markdown
      })
    }
    const writeFlavor = (event: Event) => {
      if (!pendingFlavor) return
      ;(event as ClipboardEvent).clipboardData?.setData(FOLIO_CLIPBOARD_FLAVOR, pendingFlavor)
      pendingFlavor = null
    }
    this.copyRoot = el
    this.copySnapshot = snapshotFlavor
    this.copyWrite = writeFlavor
    el.addEventListener('copy', snapshotFlavor, true)
    el.addEventListener('cut', snapshotFlavor, true)
    el.addEventListener('copy', writeFlavor, false)
    el.addEventListener('cut', writeFlavor, false)
    this.focusRoot = el
    this.focusHandler = (event) => {
      this.lastFocusedWithin = event.target instanceof HTMLElement ? event.target : null
    }
    el.addEventListener('focusin', this.focusHandler)
    // Forward delete (deleteDeletesText): the list keymap binds Delete and
    // Backspace to the same "lift the first list item" command, so Delete at an
    // item's start lifted the item instead of deleting the character after the
    // caret — for a key a user pressed to delete text, the wrong command. The
    // event is stopped in the capture phase, before ProseMirror's own handler,
    // which leaves the key unclaimed: exactly how a paragraph behaves, where the
    // browser deletes the character and ProseMirror reads the change.
    this.keyRoot = el
    this.keyHandler = (event) => {
      if (event.key !== 'Delete') return
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      if (this.deleteDeletesText()) event.stopPropagation()
    }
    el.addEventListener('keydown', this.keyHandler, true)
    this.handleClamp = keepTableHandlesInThePane(el)
  }

  async destroy(): Promise<void> {
    this.destroyed = true
    this.changeListener = null
    this.referenceClickListener = null
    this.assetReader = noVaultReader
    this.suggestSources = null
    if (this.copyRoot && this.copySnapshot && this.copyWrite) {
      this.copyRoot.removeEventListener('copy', this.copySnapshot, true)
      this.copyRoot.removeEventListener('cut', this.copySnapshot, true)
      this.copyRoot.removeEventListener('copy', this.copyWrite, false)
      this.copyRoot.removeEventListener('cut', this.copyWrite, false)
    }
    this.copyRoot = null
    this.copySnapshot = null
    this.copyWrite = null
    if (this.focusRoot && this.focusHandler) {
      this.focusRoot.removeEventListener('focusin', this.focusHandler)
    }
    if (this.keyRoot && this.keyHandler) {
      this.keyRoot.removeEventListener('keydown', this.keyHandler, true)
    }
    this.keyRoot = null
    this.keyHandler = null
    this.handleClamp?.()
    this.handleClamp = null
    this.focusRoot = null
    this.focusHandler = null
    this.lastFocusedWithin = null
    await this.editor?.destroy()
    this.editor = null
  }

  async setContent(markdown: string): Promise<void> {
    if (!this.editor) {
      this.latest = markdown
      return
    }
    let canonical: string | null = null
    this.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx)
      const doc = ctx.get(parserCtx)(markdown)
      const tr = view.state.tr
      view.dispatch(tr.replaceWith(0, view.state.doc.content.size, doc.content))
      // Capture the canonical serialization of what we just seeded so the
      // echoed markdownUpdated can be recognized and suppressed (no user edit).
      canonical = trimTrailingBlankLines(ctx.get(serializerCtx)(view.state.doc))
    })
    this.latest = canonical ?? markdown
    this.seedMarkdown = canonical
  }

  insertMarkdown(markdown: string): void {
    this.insertParsedMarkdown(markdown)
  }

  /** Apply `chord` exactly as pressing it would (ADR-0016): focus the surface
   *  the caret is in — which restores the DOM selection from `state.selection`,
   *  which a blur never touched — then dispatch a synthetic keydown at it and
   *  report whether the editor's own keymap claimed the chord. */
  applyChord(chord: string): boolean {
    const editor = this.editor
    if (!editor) return false
    return editor.action((ctx) => {
      const view = ctx.get(editorViewCtx)
      const remembered = this.lastFocusedWithin
      const target =
        remembered && remembered.isConnected && view.dom.contains(remembered)
          ? remembered
          : view.dom
      if (!view.hasFocus()) {
        // view.focus() also writes the state selection back to the DOM; a
        // CodeMirror surface just takes focus on its own element.
        if (target === view.dom) view.focus()
        else target.focus()
      }
      const event = new KeyboardEvent('keydown', chordToKeyEventInit(chord))
      target.dispatchEvent(event)
      return event.defaultPrevented
    })
  }

  /** Parse `markdown` into nodes and replace the selection with them.
   *  Shared by drops (`insertMarkdown`) and markdown-aware paste; parsing
   *  builds real nodes, whereas tr.insertText would insert escaped literal
   *  text that serializes back with `\[`/`\(` escapes and degrades to
   *  plain text on the next reload (ADR-0008 round-trip). */
  private insertParsedMarkdown(markdown: string): void {
    const editor = this.editor
    if (!editor) return
    editor.action((ctx) => {
      const view = ctx.get(editorViewCtx)
      const parsed = ctx.get(parserCtx)(markdown)
      const single = parsed.content.childCount === 1
      const first = parsed.content.firstChild
      // When the caret sits in an empty top-level paragraph (a fresh page's
      // placeholder line), insert into its place rather than after it, so a
      // pasted document starts at the top of the page instead of below a
      // stray blank line.
      const resolved = view.state.doc.resolve(view.state.selection.from)
      const replaceEmptyParagraph =
        resolved.parent.isTextblock && resolved.parent.content.size === 0 && resolved.depth === 1
      if (single && first && first.isTextblock && first.type.name === 'paragraph') {
        // Inline payload (single paragraph: an image or link): drop the wrapper
        // paragraph and insert its inline children so the node lands on the
        // caret's own line — an empty new line stays the line the image is on.
        // A single non-paragraph textblock (a heading) keeps its block form
        // (copy-as-markdown): dropping its wrapper would demote it to a
        // paragraph. A single fenced block likewise stays a block.
        const { from, to } = view.state.selection
        view.dispatch(view.state.tr.replaceWith(from, to, first.content))
      } else if (single) {
        if (replaceEmptyParagraph) {
          view.dispatch(
            view.state.tr.replaceWith(
              resolved.before(resolved.depth),
              resolved.after(resolved.depth),
              parsed.content,
            ),
          )
        } else {
          view.dispatch(view.state.tr.replaceSelectionWith(first!))
        }
      } else {
        // Multi-block payload (a pasted document): replace the selection (or
        // the empty paragraph it sits in) with the parsed block fragment
        // (replaceWith accepts a Fragment, same as setContent's seed);
        // ProseMirror splits surrounding text as needed.
        const { from, to } = view.state.selection
        if (replaceEmptyParagraph) {
          view.dispatch(
            view.state.tr.replaceWith(
              resolved.before(resolved.depth),
              resolved.after(resolved.depth),
              parsed.content,
            ),
          )
        } else {
          view.dispatch(view.state.tr.replaceWith(from, to, parsed.content))
        }
      }
    })
  }

  /** The canonical start line of each top-level block, in doc order
   *  (line-numbers, design D1/D2). The shared anchor rule runs over the
   *  canonical text the adapter already produces; the first N anchors map to
   *  the N blocks the file holds, in order. */
  getBlockLines(): number[] {
    const editor = this.editor
    if (!editor) return []
    return editor.action((ctx) => {
      const view = ctx.get(editorViewCtx)
      // An empty document serializes to no text, so the anchor rule yields no
      // lines — but the doc still holds one (placeholder) block that starts on
      // line 1. Give that first block its number.
      const anchors = blockStartLines(this.latest)
      const lines = anchors.length ? anchors : [1]
      return lines.slice(0, contentBlockCount(view.state.doc))
    })
  }

  onChange(listener: (markdown: string) => void): void {
    this.changeListener = listener
  }

  onReferenceClick(listener: (target: string) => void): void {
    this.referenceClickListener = listener
  }

  setAssetReader(reader: AssetReader): void {
    this.assetReader = reader
  }

  setSuggestionSource(sources: SuggestionSources): void {
    this.suggestSources = sources
  }

  /**
   * Whether a forward delete should delete the character after the caret rather
   * than run the list keymap's "lift the first list item" command: the caret is
   * at the very start of a list item's first text block and there is something
   * after it. The condition mirrors the preset's own guard for that command —
   * an empty selection at offset 0 inside a list item — plus the check that
   * there is a character (or node) to delete at all.
   */
  private deleteDeletesText(): boolean {
    const editor = this.editor
    if (!editor) return false
    return editor.action((ctx) => {
      const { selection } = ctx.get(editorViewCtx).state
      const { $from } = selection
      return (
        selection.empty &&
        $from.parentOffset === 0 &&
        $from.node(-1)?.type.name === 'list_item' &&
        $from.nodeAfter !== null
      )
    })
  }

  /** Current document serialized to Markdown, read imperatively. */
  private serialize(): string {
    const editor = this.editor
    if (!editor) return ''
    return editor.action((ctx) => {
      const view = ctx.get(editorViewCtx)
      const serializer = ctx.get(serializerCtx)
      return trimTrailingBlankLines(serializer(view.state.doc))
    })
  }

  /** Canonical Markdown for a document slice (copy-as-markdown), produced by
   *  the same serializer that saves pages (ADR-0001). The slice's content is
   *  wrapped in a doc node so a whole-selection slice serializes exactly as it
   *  would on disk. */
  private serializeSlice(slice: Slice): string {
    const editor = this.editor
    if (!editor || slice.size === 0) return ''
    return editor.action((ctx) => {
      const view = ctx.get(editorViewCtx)
      const serializer = ctx.get(serializerCtx)
      return trimTrailingBlankLines(
        serializer(view.state.schema.topNodeType.create(null, slice.content)),
      )
    })
  }
}

/** The number of top-level blocks the page's Markdown holds: the document's
 *  children less the empty paragraph the editor maintains at the end, which has
 *  no Markdown of its own and so takes no gutter number. That paragraph is only
 *  the last child when the document holds something else — an empty page's
 *  single paragraph IS the placeholder, and line 1 is its number. */
function contentBlockCount(doc: ProseNode): number {
  const last = doc.lastChild
  const trailing =
    last !== null && last.type.name === 'paragraph' && last.content.size === 0 && doc.childCount > 1
  return trailing ? doc.childCount - 1 : doc.childCount
}
