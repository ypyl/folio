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
import { codeBlockComponent, codeBlockConfig } from '@milkdown/components/code-block'
import {
  codeBlockExtensions,
  codeBlockLanguages,
} from './codeBlockSetup'
import type { EditorAdapter } from './editor'

export class MilkdownAdapter implements EditorAdapter {
  private editor: Editor | null = null
  private latest = ''
  private changeListener: ((markdown: string) => void) | null = null
  private destroyed = false
  // Programmatic-seed bookkeeping (design C2 round-trip normalization): after
  // setContent the listener emits one markdownUpdated for the doc we just
  // dispatched. That echo carries no user edit — for a non-canonical file it
  // re-serializes to a different form than the raw bytes, which would otherwise
  // mark a freshly-opened page dirty and rewrite it. Suppress it; only a real
  // change (doc differs from the seed) reaches onChange.
  private seedMarkdown: string | null = null
  private expectSeedEcho = false

  /** Mount the editor into `el`. The element must stay in the document for
   *  the editor's lifetime. If `destroy()` was called while `create()` was
   *  still in flight (StrictMode remount, fast page switch), the created
   *  editor is torn down immediately instead of leaking into the DOM. */
  async mount(el: HTMLElement): Promise<void> {
    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, el)
        // Paste is the clipboard's plain text, verbatim (paste-as-plain-text).
        // The default ProseMirror path parses the HTML fragment through the
        // schema's parseDOM and plants invisible bold/italic/code marks and
        // links that a WYSIWYG view cannot un-format. Inserting the raw text
        // keeps `**wow**` literal: the serializer escapes markdown-significant
        // runs (`\*\*wow\*\*`) so a reload re-parses to the same text and the
        // Markdown stays canonical (ADR-0001). A clipboard with no text
        // (copied files) falls through to the default handler.
        ctx.update(editorViewOptionsCtx, (prev) => ({
          ...prev,
          handlePaste: (view, event) => {
            // A paste aimed at a code block belongs to its CodeMirror surface
            // (code-block-component): CM keeps multiline text and indentation
            // there. Yield to it; all other pastes stay plain-text below.
            if (event.target instanceof HTMLElement && event.target.closest('.cm-editor')) {
              return false
            }
            const text = event.clipboardData?.getData('text/plain')
            if (!text) return false
            const { from, to } = view.state.selection
            view.dispatch(view.state.tr.insertText(text, from, to))
            return true
          },
        }))
        ctx.get(listenerCtx).markdownUpdated((_ctx, markdown) => {
          this.latest = markdown
          // The first event after a setContent echoes the seeded doc. If it
          // matches what we dispatched, it is not an edit — drop it. Any other
          // event (a real keystroke, even one folded into the same debounce
          // window) differs from the seed and is forwarded.
          const seedEcho = this.expectSeedEcho && markdown === this.seedMarkdown
          this.expectSeedEcho = false
          if (seedEcho) return
          this.changeListener?.(markdown)
        })
        // The component-backed code block (code-block-component): code blocks
        // are edited inside a CodeMirror surface — the picker gets the
        // language catalog, the surface gets the extensions (highlighting,
        // line numbers, completion, folding, search) themed with Folio
        // tokens (DESIGN.md — Code).
        ctx.update(codeBlockConfig.key, (prev) => ({
          ...prev,
          languages: codeBlockLanguages,
          extensions: codeBlockExtensions,
        }))
      })
      .use(commonmark)
      .use(listener)
      .use(history)
      .use(codeBlockComponent)
      .create()
    if (this.destroyed) {
      await editor.destroy()
      return
    }
    this.editor = editor
    this.latest = this.serialize()
  }

  async destroy(): Promise<void> {
    this.destroyed = true
    this.changeListener = null
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
      canonical = ctx.get(serializerCtx)(view.state.doc)
    })
    this.latest = canonical ?? markdown
    this.seedMarkdown = canonical
    this.expectSeedEcho = true
  }

  insertMarkdown(markdown: string): void {
    const editor = this.editor
    if (!editor) return
    editor.action((ctx) => {
      const view = ctx.get(editorViewCtx)
      // Parse the payload as nodes, not literal text: typing `![..](..)` builds a
      // real image/link node, whereas tr.insertText would insert escaped literal
      // text that serializes back with `\[`/`\(` escapes and degrades to plain
      // text on the next reload (ADR-0008 round-trip).
      const parsed = ctx.get(parserCtx)(markdown)
      const single = parsed.content.childCount === 1
      const first = parsed.content.firstChild
      if (single && first && first.isTextblock) {
        // Inline payload (single paragraph: an image or link): drop the wrapper
        // paragraph and insert its inline children so the node lands on the
        // caret's own line — an empty new line stays the line the image is on.
        const { from, to } = view.state.selection
        view.dispatch(view.state.tr.replaceWith(from, to, first.content))
      } else {
        const node = single ? first! : parsed
        view.dispatch(view.state.tr.replaceSelectionWith(node))
      }
    })
  }

  getContent(): string {
    return this.latest
  }

  onChange(listener: (markdown: string) => void): void {
    this.changeListener = listener
  }

  /** Current document serialized to Markdown, read imperatively. */
  private serialize(): string {
    const editor = this.editor
    if (!editor) return ''
    return editor.action((ctx) => {
      const view = ctx.get(editorViewCtx)
      const serializer = ctx.get(serializerCtx)
      return serializer(view.state.doc)
    })
  }
}