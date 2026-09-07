import { describe, expect, it } from 'vitest'
import { editorViewCtx, parserCtx, serializerCtx } from '@milkdown/core'
import { MilkdownAdapter } from './milkdown'

// jsdom has no IntersectionObserver; the code-block component's node view
// creates one on mount and initializes CodeMirror when the observed element
// intersects. A real IO delivers an initial intersecting entry right after
// observe(); the stub replicates that so the surface actually mounts.
if (typeof globalThis.IntersectionObserver === 'undefined') {
  class NoopIntersectionObserver implements IntersectionObserver {
    readonly root = null
    readonly rootMargin = ''
    readonly thresholds: ReadonlyArray<number> = []
    readonly scrollMargin = ''
    private readonly callback: IntersectionObserverCallback
    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback
    }
    observe(target: Element): void {
      queueMicrotask(() => {
        this.callback(
          [
            {
              target,
              isIntersecting: true,
              intersectionRatio: 1,
            } as unknown as IntersectionObserverEntry,
          ],
          this,
        )
      })
    }
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return []
    }
  }
  ;(globalThis as { IntersectionObserver?: typeof IntersectionObserver }).IntersectionObserver =
    NoopIntersectionObserver
}

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

  it('does not report the programmatic seed as a change, but reports real edits', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const adapter = new MilkdownAdapter()
    const changes: string[] = []
    adapter.onChange((md) => changes.push(md))
    await adapter.mount(el)

    // Seeding a non-canonical file (CRLF) re-serializes to LF; that echo must
    // not count as a user edit or it would mark the page dirty and rewrite it
    // (round-trip normalization, design C2).
    await adapter.setContent('# Title\r\n\r\nBody\r\n')
    await new Promise((r) => setTimeout(r, 400))
    expect(changes).toEqual([])
    expect(adapter.getContent()).toBe('# Title\n\nBody\n')

    // A real change (a transaction the user would produce) still reaches
    // onChange.
    ;(adapter as unknown as {
      editor: { action: (f: (ctx: unknown) => unknown) => unknown }
    }).editor.action((ctx) => {
      const access = ctx as { get: (k: unknown) => unknown }
      const view = access.get(editorViewCtx) as {
        state: { tr: { insertText: (t: string) => unknown } }
        dispatch: (t: unknown) => void
      }
      view.dispatch(view.state.tr.insertText('X'))
    })
    await new Promise((r) => setTimeout(r, 400))
    expect(changes.length).toBe(1)
    expect(changes[0]).toBe('# Title\n\nBodyX\n')

    await adapter.destroy()
    el.remove()
  })

// Paste behaves as plain text (paste-as-plain-text): the clipboard contributes
// only its plain text, verbatim. A real `paste` event is dispatched onto the
// editor DOM with a faked `clipboardData` (jsdom has no ClipboardEvent data),
// so the event flows through ProseMirror's own paste pipeline into the
// adapter's handlePaste prop — these tests exercise the real wiring, not a
// direct call. Typing is unaffected by construction: the handler bypasses the
// parser and input rules entirely, and jsdom cannot drive keystrokes
// (no execCommand), so that regression guard is by review only.

type AdapterEditor = {
  editor: { action: (f: (ctx: unknown) => unknown) => unknown }
}

const editorOf = (adapter: MilkdownAdapter) =>
  (adapter as unknown as AdapterEditor).editor

const serialize = (adapter: MilkdownAdapter): string =>
  editorOf(adapter).action((ctx) => {
    const access = ctx as { get: (k: unknown) => unknown }
    const view = access.get(editorViewCtx) as { state: { doc: unknown } }
    const serializer = access.get(serializerCtx) as (doc: unknown) => string
    return serializer(view.state.doc)
  }) as string

const viewText = (adapter: MilkdownAdapter): string =>
  editorOf(adapter).action((ctx) => {
    const access = ctx as { get: (k: unknown) => unknown }
    const view = access.get(editorViewCtx) as { dom: { textContent: string } }
    return view.dom.textContent
  }) as string

const paste = (adapter: MilkdownAdapter, plain: string, html = '') => {
  editorOf(adapter).action((ctx) => {
    const access = ctx as { get: (k: unknown) => unknown }
    const view = access.get(editorViewCtx) as { dom: HTMLElement }
    const event = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'clipboardData', {
      value: { getData: (type: string) => (type === 'text/plain' ? plain : html) },
    })
    view.dom.dispatchEvent(event)
  })
}

const mountForPaste = async () => {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const adapter = new MilkdownAdapter()
  await adapter.mount(el)
  return { adapter, el }
}

describe('MilkdownAdapter (paste as plain text)', () => {
  it('pastes only the plain text of a formatted web copy', async () => {
    const { adapter, el } = await mountForPaste()
    await adapter.setContent('')
    paste(adapter, 'wow', '<b>wow</b>')
    const doc = serialize(adapter)
    expect(doc).toContain('wow')
    // No strong mark was created from the <b> fragment (a strong mark would
    // serialize back as unescaped **wow**), and no HTML ever entered the doc.
    expect(doc).not.toContain('**wow**')
    expect(doc).not.toMatch(/<[^>]+>/)
    await adapter.setContent(doc)
    expect(serialize(adapter)).toBe(doc)
    await adapter.destroy()
    el.remove()
  })

  it('keeps the line breaks of a multi-line paste', async () => {
    const { adapter, el } = await mountForPaste()
    await adapter.setContent('')
    paste(adapter, 'line1\nline2')
    const doc = serialize(adapter)
    expect(doc).toContain('line1\nline2')
    // Reopening the saved markdown keeps the same lines.
    await adapter.setContent(doc)
    expect(serialize(adapter)).toBe(doc)
    await adapter.destroy()
    el.remove()
  })

  it('keeps markdown-looking text literal across save and reopen', async () => {
    const { adapter, el } = await mountForPaste()
    await adapter.setContent('')
    paste(adapter, '**wow**')
    // The WYSIWYG surface shows the literal characters, not bold text with
    // the markers hidden.
    expect(viewText(adapter)).toContain('**wow**')
    const doc = serialize(adapter)
    expect(doc).toContain('wow')
    // Reopen the saved markdown: identical literals, still no bold mark.
    await adapter.setContent(doc)
    expect(serialize(adapter)).toBe(doc)
    await adapter.destroy()
    el.remove()
  })

  it('changes nothing when the clipboard has no text', async () => {
    const { adapter, el } = await mountForPaste()
    await adapter.setContent('existing')
    paste(adapter, '')
    // The fall-through path settles asynchronously.
    await new Promise((r) => setTimeout(r, 150))
    expect(serialize(adapter)).toBe('existing\n')
    await adapter.destroy()
    el.remove()
  })

  it('reports canonical block start lines, live after edits', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const adapter = new MilkdownAdapter()
    await adapter.mount(el)

    // Seed with a heading, a paragraph, and a tight list, blank-separated:
    // the anchors are 1, 3, 5 — the list is one block at its start line.
    await adapter.setContent('# Title\n\nBody\n\n- a\n- b\n')
    expect(adapter.getBlockLines()).toEqual([1, 3, 5])

    // Inserting a block above shifts every later anchor (2.2): inserting a
    // fresh paragraph node at doc start pushes the three blocks to 3, 5, 7.
    ;(adapter as unknown as {
      editor: { action: (f: (ctx: unknown) => unknown) => unknown }
    }).editor.action((ctx) => {
      const access = ctx as { get: (k: unknown) => unknown }
      const view = access.get(editorViewCtx) as {
        state: { tr: { insert: (pos: number, node: unknown) => unknown } }
        dispatch: (t: unknown) => void
      }
      const parser = access.get(parserCtx) as (md: string) => {
        content: { firstChild: unknown }
      }
      const para = parser('prelude').content.firstChild
      view.dispatch(view.state.tr.insert(0, para!))
    })
    await new Promise((r) => setTimeout(r, 400))
    expect(adapter.getContent()).toContain('prelude')
    expect(adapter.getBlockLines()).toEqual([1, 3, 5, 7])

    await adapter.destroy()
    el.remove()
  })
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

  it('mounts the code-block surface for a fenced block and round-trips without a seed echo', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const adapter = new MilkdownAdapter()
    const changes: string[] = []
    adapter.onChange((md) => changes.push(md))
    await adapter.mount(el)

    // A fenced block with a language seeds the CodeMirror surface (the
    // component's node view) and re-serializes to the identical fence.
    const fenced = '```js\nconst x = 1\n```\n'
    await adapter.setContent(fenced)
    await new Promise((r) => setTimeout(r, 400))
    expect(el.querySelector('.milkdown-code-block .cm-editor')).toBeTruthy()
    // Mounting the surface is not an edit: the seed echo stays suppressed and
    // the doc is not rewritten to a different form.
    expect(changes).toEqual([])
    expect(adapter.getContent()).toBe(fenced)

    // Reload round-trip: the same fence parses, mounts, and serializes back.
    await adapter.setContent('')
    await adapter.setContent(fenced)
    expect(adapter.getContent()).toBe(fenced)

    await adapter.destroy()
    el.remove()
  })

  it('labels the placeholder block of an empty page as line 1', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const adapter = new MilkdownAdapter()
    await adapter.mount(el)
    await adapter.setContent('')
    // An empty doc re-serializes to no text (no anchors), but its single
    // placeholder block starts on line 1 (page-editing: placeholder scenario).
    expect(adapter.getBlockLines()).toEqual([1])
    await adapter.destroy()
    el.remove()
  })
})