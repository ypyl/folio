// Milkdown transport for the editor seam (design D1, ADR-0008). Imperative
// mount onto a DOM element: EditorPane owns the element and the lifecycle,
// this adapter owns the editor. Styling is applied by the pane's token-based
// stylesheet (design D3) — no @milkdown/theme-* import.

import {
  Editor,
  editorViewCtx,
  parserCtx,
  rootCtx,
  serializerCtx,
} from '@milkdown/core'
import { history } from '@milkdown/plugin-history'
import { listener, listenerCtx } from '@milkdown/plugin-listener'
import { commonmark } from '@milkdown/preset-commonmark'
import type { EditorAdapter } from './editor'

export class MilkdownAdapter implements EditorAdapter {
  private editor: Editor | null = null
  private latest = ''
  private changeListener: ((markdown: string) => void) | null = null
  private destroyed = false

  /** Mount the editor into `el`. The element must stay in the document for
   *  the editor's lifetime. If `destroy()` was called while `create()` was
   *  still in flight (StrictMode remount, fast page switch), the created
   *  editor is torn down immediately instead of leaking into the DOM. */
  async mount(el: HTMLElement): Promise<void> {
    const editor = await Editor.make()
      .config((ctx) => {
        ctx.set(rootCtx, el)
        ctx.get(listenerCtx).markdownUpdated((_ctx, markdown) => {
          this.latest = markdown
          this.changeListener?.(markdown)
        })
      })
      .use(commonmark)
      .use(listener)
      .use(history)
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
    this.latest = markdown
    if (!this.editor) return
    this.editor.action((ctx) => {
      const view = ctx.get(editorViewCtx)
      const doc = ctx.get(parserCtx)(markdown)
      const tr = view.state.tr
      view.dispatch(tr.replaceWith(0, view.state.doc.content.size, doc.content))
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