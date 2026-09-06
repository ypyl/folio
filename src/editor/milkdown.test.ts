import { describe, expect, it } from 'vitest'
import { editorViewCtx, serializerCtx } from '@milkdown/core'
import { MilkdownAdapter } from './milkdown'

// Thin smoke test for the real transport (design D1): the seam contract is
// fully covered by FakeEditor; this proves ProseMirror boots in jsdom and the
// setContent/getContent wiring works end to end. Driving real keystrokes is
// out of reach (jsdom has no execCommand, and transactions need the private
// view), so onChange stays covered by the fake — the listener plugin is
// Milidown's own, wired verbatim per its documented API.

describe('MilkdownAdapter (smoke)', () => {
  it('mounts, round-trips content, and destroys cleanly', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const adapter = new MilkdownAdapter()
    await adapter.mount(el)
    await adapter.setContent('# Hello\n\nSome *text* with #ref.\n')
    expect(adapter.getContent()).toContain('# Hello')
    await adapter.setContent('second body')
    expect(adapter.getContent()).toContain('second body')
    await adapter.destroy()
    await adapter.destroy() // idempotent
    el.remove()
  })

  it('insertMarkdown inserts text into the document at the selection', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const adapter = new MilkdownAdapter()
    await adapter.mount(el)
    await adapter.setContent('first')
    adapter.insertMarkdown(' ![pic](assets/pic.png)')
    // The listener plugin never fires in jsdom, so read the doc directly
    // (same serialize path the adapter uses internally).
    const doc = (adapter as unknown as {
      editor: { action: (f: (ctx: unknown) => unknown) => unknown }
    }).editor.action((ctx) => {
      const access = ctx as { get: (k: unknown) => unknown }
      const view = access.get(editorViewCtx) as { state: { doc: unknown } }
      const serializer = access.get(serializerCtx) as (doc: unknown) => string
      return serializer(view.state.doc)
    }) as string
    // Serialized as a real image node (not escaped literal text), inline on the
    // caret's own line — no new paragraph is opened for it — and the serialization
    // re-parses to the same markdown, so the link survives reload.
    expect(doc).toContain('![pic](assets/pic.png)')
    expect(doc).not.toContain('\n\n') // inline: the wrapper paragraph is not inserted
    const reopened = new MilkdownAdapter()
    await reopened.mount(el)
    await reopened.setContent(doc)
    expect(reopened.getContent()).toBe(doc)
    await reopened.destroy()
    await adapter.destroy()
    el.remove()
  })
})