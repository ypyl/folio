import { describe, expect, it } from 'vitest'
import { editorViewCtx, parserCtx, serializerCtx } from '@milkdown/core'
import type { EditorState, Transaction } from '@milkdown/prose/state'
import { AllSelection, TextSelection } from '@milkdown/prose/state'
import type { Node as ProseNode } from '@milkdown/prose/model'
import { FOLIO_CLIPBOARD_FLAVOR, MilkdownAdapter } from './milkdown'

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
  // edit-after-trailing-code-block: a code block that ends the page keeps an
  // empty paragraph after it (so ArrowDown and a click below it have somewhere
  // to go), and that paragraph never reaches the serialized Markdown.
  describe('the document tail', () => {
    // The same access pattern the helpers above use: the context is untyped at
    // this boundary, so a read casts once.
    const docOf = (adapter: MilkdownAdapter): ProseNode =>
      editorOf(adapter).action((ctx) => {
        const access = ctx as { get: (k: unknown) => unknown }
        const view = access.get(editorViewCtx) as { state: { doc: ProseNode } }
        return view.state.doc
      }) as ProseNode

    const typeAt = (adapter: MilkdownAdapter, offset: number, text: string): void => {
      editorOf(adapter).action((ctx) => {
        const access = ctx as { get: (k: unknown) => unknown }
        const view = access.get(editorViewCtx) as {
          state: { doc: ProseNode; tr: { insertText: (t: string, p: number) => unknown } }
          dispatch: (tr: unknown) => void
        }
        view.dispatch(view.state.tr.insertText(text, view.state.doc.content.size + offset))
      })
    }

    const mount = async () => {
      const el = document.createElement('div')
      document.body.appendChild(el)
      const adapter = new MilkdownAdapter()
      await adapter.mount(el)
      return { adapter, el }
    }

    it('keeps a paragraph after a trailing code block without writing it to the file', async () => {
      const { adapter, el } = await mount()
      const changes: string[] = []
      adapter.onChange((markdown) => changes.push(markdown))
      const seed = ['```js', 'const a = 1', '```', ''].join('\n')
      await adapter.setContent(seed)
      // The change stream is debounced; this waits past it so "no change" means
      // the seed echo really was suppressed.
      await new Promise((resolve) => setTimeout(resolve, 400))
      expect(docOf(adapter).lastChild?.type.name).toBe('paragraph')
      // The file's text is what the page holds: no trailing blank line, and
      // the maintained paragraph is not an edit the app would save.
      expect(adapter.getContent()).toBe(seed)
      expect(changes).toEqual([])
      await adapter.destroy()
      el.remove()
    })

    it('appends nothing to a page that already ends with a paragraph', async () => {
      const { adapter, el } = await mount()
      await adapter.setContent(['Just a paragraph', ''].join('\n'))
      expect(docOf(adapter).lastChild?.type.name).toBe('paragraph')
      expect(docOf(adapter).childCount).toBe(1)
      await adapter.destroy()
      el.remove()
    })

    it('keeps the paragraph when the code block is edited, and trims the tail on save', async () => {
      const { adapter, el } = await mount()
      await adapter.setContent(['```js', 'const a = 1', '```', ''].join('\n'))
      typeAt(adapter, -1, 'typed')
      await new Promise((resolve) => setTimeout(resolve, 400))
      expect(docOf(adapter).lastChild?.type.name).toBe('paragraph')
      const markdown = adapter.getContent()
      expect(markdown).toContain('typed')
      expect(markdown.endsWith('typed\n')).toBe(true)
      expect(markdown).not.toMatch(/\n\n$/)
      await adapter.destroy()
      el.remove()
    })
  })

  // A forward delete inside a list item (the preset binds Delete and Backspace
  // to the same "lift the first list item" command, which is Backspace's job).
  describe('forward delete in a list item', () => {
    const mount = async () => {
      const el = document.createElement('div')
      document.body.appendChild(el)
      const adapter = new MilkdownAdapter()
      await adapter.mount(el)
      return { adapter, el }
    }

    /** The document's first child, for asserting the list survived the key. */
    const firstBlock = (adapter: MilkdownAdapter): ProseNode =>
      editorOf(adapter).action((ctx) => {
        const access = ctx as { get: (k: unknown) => unknown }
        const view = access.get(editorViewCtx) as { state: { doc: ProseNode } }
        return view.state.doc.firstChild as ProseNode
      }) as ProseNode

    /** Put the caret at the start of the first list item and press a key. */
    const pressAtItemStart = (adapter: MilkdownAdapter, key: string): void => {
      editorOf(adapter).action((ctx) => {
        const access = ctx as { get: (k: unknown) => unknown }
        const view = access.get(editorViewCtx) as {
          state: { doc: ProseNode; tr: { setSelection: (s: unknown) => unknown } }
          dispatch: (tr: unknown) => void
          dom: HTMLElement
        }
        // The first list item's first text block starts one position in.
        const itemStart = 1 + 1 + 1
        view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, itemStart)))
        view.dom.dispatchEvent(
          new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
        )
      })
    }

    it('does not lift the item out of the list', async () => {
      const { adapter, el } = await mount()
      await adapter.setContent(
        ['- banana split', '- second item', ''].join(String.fromCharCode(10)),
      )
      pressAtItemStart(adapter, 'Delete')
      // Unclaimed, so the browser would delete the character; in jsdom nothing
      // changes, and the point of the test is that the item is still a list
      // item rather than a paragraph lifted out of the list.
      expect(firstBlock(adapter).type.name).toBe('bullet_list')
      expect(firstBlock(adapter).firstChild?.type.name).toBe('list_item')
      await adapter.destroy()
      el.remove()
    })

    it('still lifts the item on Backspace, which is that gesture', async () => {
      const { adapter, el } = await mount()
      await adapter.setContent(
        ['- banana split', '- second item', ''].join(String.fromCharCode(10)),
      )
      pressAtItemStart(adapter, 'Backspace')
      expect(firstBlock(adapter).type.name).toBe('paragraph')
      await adapter.destroy()
      el.remove()
    })
  })

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

  it('renders reference badges as decorations and keeps the text literal', async () => {
    const el = document.createElement('div')
    document.body.appendChild(el)
    const adapter = new MilkdownAdapter()
    await adapter.mount(el)
    await adapter.setContent('See #Inbox and #[[reading list]] now.\n')
    // The badge is presentational: a `.ref` span wraps the literal token while
    // the document keeps the text (design D1).
    const badges = el.querySelectorAll('.ref')
    expect(badges).toHaveLength(2)
    expect(badges[0].textContent).toBe('#Inbox')
    expect(badges[1].textContent).toBe('#[[reading list]]')
    expect(adapter.getContent()).toContain('#Inbox')
    await adapter.destroy()
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
    ;(
      adapter as unknown as {
        editor: { action: (f: (ctx: unknown) => unknown) => unknown }
      }
    ).editor.action((ctx) => {
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

  // Paste follows the paste rule (paste-as-markdown): the clipboard contributes
  // only its plain text — HTML fragments are ignored — and the text is inserted
  // literally unless it resembles a Markdown document, in which case it is
  // parsed into real blocks and formatting. A real `paste` event is dispatched
  // onto the editor DOM with a faked `clipboardData` (jsdom has no ClipboardEvent
  // data), so the event flows through ProseMirror's own paste pipeline into the
  // adapter's handlePaste prop — these tests exercise the real wiring, not a
  // direct call. Typing is unaffected by construction: the handler bypasses the
  // input rules entirely, and jsdom cannot drive keystrokes (no execCommand), so
  // that regression guard is by review only.

  type AdapterEditor = {
    editor: { action: (f: (ctx: unknown) => unknown) => unknown }
  }

  const editorOf = (adapter: MilkdownAdapter) => (adapter as unknown as AdapterEditor).editor

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

  const paste = (
    adapter: MilkdownAdapter,
    plain: string,
    html = '',
    mods: { shiftKey?: boolean; ctrlKey?: boolean; metaKey?: boolean } = {},
    flavor = '',
  ) => {
    editorOf(adapter).action((ctx) => {
      const access = ctx as { get: (k: unknown) => unknown }
      const view = access.get(editorViewCtx) as { dom: HTMLElement }
      const event = new Event('paste', { bubbles: true, cancelable: true })
      Object.defineProperty(event, 'clipboardData', {
        value: {
          getData: (type: string) =>
            type === FOLIO_CLIPBOARD_FLAVOR ? flavor : type === 'text/plain' ? plain : html,
        },
      })
      for (const [key, value] of Object.entries(mods)) {
        Object.defineProperty(event, key, { value })
      }
      view.dom.dispatchEvent(event)
    })
  }

  // Select the whole document and copy it, capturing every flavor the copy
  // handlers write. ProseMirror's own copy handler runs first and clears the
  // data; the adapter's flavor listener is on the mount root and runs after.
  const selectAllAndCopy = (
    adapter: MilkdownAdapter,
    captured: Record<string, string>,
    type: 'copy' | 'cut' = 'copy',
  ) => {
    editorOf(adapter).action((ctx) => {
      const access = ctx as { get: (k: unknown) => unknown }
      const view = access.get(editorViewCtx) as {
        state: { doc: ProseNode; tr: { setSelection: (s: unknown) => unknown } }
        dispatch: (t: unknown) => void
        dom: HTMLElement
      }
      view.dispatch(view.state.tr.setSelection(new AllSelection(view.state.doc)))
      const event = new Event(type, { bubbles: true, cancelable: true })
      Object.defineProperty(event, 'clipboardData', {
        value: {
          clearData: () => {},
          setData: (type: string, value: string) => {
            captured[type] = value
          },
        },
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

  describe('MilkdownAdapter (paste)', () => {
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

    it('pastes a markdown document as real structure', async () => {
      const { adapter, el } = await mountForPaste()
      await adapter.setContent('')
      paste(
        adapter,
        [
          '# Sample Markdown',
          '',
          '- Item one',
          '- Item two',
          '- Item three',
          '',
          '```js',
          'const x = 1',
          '```',
        ].join('\n'),
      )
      const doc = serialize(adapter)
      // Real structure, not escaped literals: heading, list, and fence nodes,
      // and the document starts at the heading — the empty placeholder
      // paragraph is replaced, not left behind. (Tight lists re-serialize with
      // `*` — normalization, not escapes.)
      expect(doc.startsWith('# Sample Markdown')).toBe(true)
      expect(doc).toContain('Item one')
      expect(doc).toContain('```js')
      expect(doc).not.toContain('\\#')
      expect(doc).not.toContain('\\-')
      // The fenced block mounts the code surface.
      await new Promise((r) => setTimeout(r, 200))
      expect(el.querySelector('.milkdown-code-block .cm-editor')).toBeTruthy()
      // Saving and reopening yields the same structure (spec: a Markdown
      // document pastes as structure).
      await adapter.setContent(doc)
      expect(serialize(adapter)).toBe(doc)
      await adapter.destroy()
      el.remove()
    })

    it('keeps a lone heading line literal across save and reopen', async () => {
      const { adapter, el } = await mountForPaste()
      await adapter.setContent('')
      paste(adapter, '# Title')
      // The WYSIWYG shows the literal characters; no heading block exists.
      expect(viewText(adapter)).toContain('# Title')
      const doc = serialize(adapter)
      expect(doc).toContain('\\# Title')
      expect(doc).not.toMatch(/^# Title/m)
      // Reopen: identical literal text, still not a heading (spec: a lone
      // heading line stays literal).
      await adapter.setContent(doc)
      expect(serialize(adapter)).toBe(doc)
      await adapter.destroy()
      el.remove()
    })

    it('forces literal text with the shift modifier (Mod+Shift+V)', async () => {
      const { adapter, el } = await mountForPaste()
      await adapter.setContent('')
      // This text WOULD parse as Markdown (heading + list); the modifier must
      // short-circuit the sniff and take the literal path (spec: a
      // shift-modifier paste forces literal text).
      paste(adapter, '# Heading\n- item', '', { ctrlKey: true, shiftKey: true })
      const doc = serialize(adapter)
      expect(doc).toContain('\\# Heading')
      expect(doc).toContain('\\- item')
      await adapter.setContent(doc)
      expect(serialize(adapter)).toBe(doc)
      // The meta variant behaves the same.
      await adapter.setContent('')
      paste(adapter, '# Heading2\n- item2', '', { metaKey: true, shiftKey: true })
      expect(serialize(adapter)).toContain('\\# Heading2')
      await adapter.destroy()
      el.remove()
    })

    it('copies the selection as canonical Markdown under the private flavor', async () => {
      const { adapter, el } = await mountForPaste()
      await adapter.setContent('# Title\n\nBody **bold**\n\n- a\n- b\n')
      const captured: Record<string, string> = {}
      selectAllAndCopy(adapter, captured)
      // The flavor is the same canonical form the page saves (ADR-0001).
      expect(captured[FOLIO_CLIPBOARD_FLAVOR]).toBe(serialize(adapter))
      expect(captured[FOLIO_CLIPBOARD_FLAVOR]).toContain('# Title')
      expect(captured[FOLIO_CLIPBOARD_FLAVOR]).toContain('**bold**')
      expect(captured[FOLIO_CLIPBOARD_FLAVOR]).toContain('* a')
      await adapter.destroy()
      el.remove()
    })

    it('copies a struck run as its literal tildes', async () => {
      // render-struck-text: the run is literal text under a decoration, so the
      // clipboard carries the Markdown the page holds, tildes and all.
      const { adapter, el } = await mountForPaste()
      await adapter.setContent(['~~done~~ later', ''].join('\n'))
      const captured: Record<string, string> = {}
      selectAllAndCopy(adapter, captured)
      expect(captured[FOLIO_CLIPBOARD_FLAVOR]).toContain('~~done~~')
      await adapter.destroy()
      el.remove()
    })

    it('writes nothing to the private flavor for an empty selection', async () => {
      const { adapter, el } = await mountForPaste()
      await adapter.setContent('# Title\n')
      const captured: Record<string, string> = {}
      editorOf(adapter).action((ctx) => {
        const access = ctx as { get: (k: unknown) => unknown }
        const view = access.get(editorViewCtx) as { dom: HTMLElement }
        const event = new Event('copy', { bubbles: true, cancelable: true })
        Object.defineProperty(event, 'clipboardData', {
          value: {
            clearData: () => {},
            setData: (type: string, value: string) => {
              captured[type] = value
            },
          },
        })
        view.dom.dispatchEvent(event)
      })
      expect(captured[FOLIO_CLIPBOARD_FLAVOR]).toBeUndefined()
      await adapter.destroy()
      el.remove()
    })

    it('carries the selection on cut before it is removed', async () => {
      const { adapter, el } = await mountForPaste()
      await adapter.setContent('## Budget\n\nBody\n')
      const captured: Record<string, string> = {}
      selectAllAndCopy(adapter, captured, 'cut')
      // The flavor is written from the capture-phase snapshot, before the
      // built-in cut handler deletes the selection and clears the clipboard.
      expect(captured[FOLIO_CLIPBOARD_FLAVOR]).toContain('## Budget')
      expect(captured[FOLIO_CLIPBOARD_FLAVOR]).toContain('Body')
      // The cut removed the text from the document.
      expect(serialize(adapter).trim()).toBe('')
      await adapter.destroy()
      el.remove()
    })

    it('parses the private flavor unconditionally, keeping block shapes', async () => {
      const { adapter, el } = await mountForPaste()
      // A lone heading would fail the markdown-likeness rule as plain text; the
      // flavor bypasses the rule and must keep the heading, not demote it.
      await adapter.setContent('')
      paste(adapter, '', '', {}, '# Title')
      expect(serialize(adapter).trim()).toBe('# Title')
      // An inline run round-trips as formatting, not as literal markers.
      await adapter.setContent('')
      paste(adapter, '', '', {}, '**bold**')
      expect(serialize(adapter).trim()).toBe('**bold**')
      await adapter.destroy()
      el.remove()
    })

    it('forces literal plain text even when the private flavor is present', async () => {
      const { adapter, el } = await mountForPaste()
      await adapter.setContent('')
      // The flavor says "# Title"; the shift modifier must ignore it and insert
      // the plain text verbatim (spec: force-literal).
      paste(adapter, '# Heading\n- item', '', { ctrlKey: true, shiftKey: true }, '# Title')
      const doc = serialize(adapter)
      expect(doc).toContain('\\# Heading')
      expect(doc).not.toContain('# Title')
      await adapter.destroy()
      el.remove()
    })

    it('keeps a paste aimed at a code block on the code surface', async () => {
      const { adapter, el } = await mountForPaste()
      const fenced = '```js\nconst x = 1\n```\n'
      await adapter.setContent(fenced)
      await new Promise((r) => setTimeout(r, 200))
      const cm = el.querySelector('.cm-editor')
      expect(cm).toBeTruthy()
      // A markdown-lookalike paste aimed at the code surface must not route
      // through markdown interpretation: the handler yields to CodeMirror, so
      // no heading/list is created and the fence stays the document's first
      // block (spec: pasting inside a code block is handled by the code
      // surface). What CM does with the clipboard text is its own domain;
      // jsdom pins the routing boundary only.
      const event = new Event('paste', { bubbles: true, cancelable: true })
      Object.defineProperty(event, 'clipboardData', {
        value: {
          getData: (type: string) => (type === 'text/plain' ? '# Heading\n- item' : ''),
        },
      })
      ;(cm as HTMLElement).dispatchEvent(event)
      await new Promise((r) => setTimeout(r, 300))
      const doc = serialize(adapter)
      expect(doc.startsWith('```')).toBe(true)
      expect(doc).toContain('```js')
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
      ;(
        adapter as unknown as {
          editor: { action: (f: (ctx: unknown) => unknown) => unknown }
        }
      ).editor.action((ctx) => {
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
    const doc = (
      adapter as unknown as {
        editor: { action: (f: (ctx: unknown) => unknown) => unknown }
      }
    ).editor.action((ctx) => {
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

  // Reference completion end to end through the real transport
  // (add-reference-autocomplete, task 7.1): a real ProseMirror view, the real
  // plugin, the real popup element, and a real keydown event routed by
  // ProseMirror's own DOM listener. The caret is placed by a transaction rather
  // than by keystrokes, which jsdom cannot produce (no execCommand).
  describe('MilkdownAdapter (reference completion)', () => {
    type RealView = {
      state: EditorState
      dispatch: (tr: Transaction) => void
      dom: HTMLElement
      coordsAtPos: (pos: number) => { left: number; right: number; top: number; bottom: number }
    }

    const viewOf = (adapter: MilkdownAdapter): RealView =>
      editorOf(adapter).action((ctx) => {
        const access = ctx as { get: (k: unknown) => unknown }
        return access.get(editorViewCtx)
      }) as RealView

    const mountWithSuggestions = async () => {
      const el = document.createElement('div')
      document.body.appendChild(el)
      const adapter = new MilkdownAdapter()
      adapter.setSuggestionSource((query) =>
        query === 're' ? [{ name: 'reading', path: 'Reading.md', match: [0, 2] }] : [],
      )
      await adapter.mount(el)
      const view = viewOf(adapter)
      // jsdom has no layout, so the caret measurement the popup positions
      // itself with is stubbed; the unstubbed failure path hides the popup
      // (covered by the plugin's own tests).
      view.coordsAtPos = () => ({ left: 10, right: 11, top: 20, bottom: 30 })
      // The popup shows only while the editor holds focus, which jsdom cannot
      // give a contenteditable.
      view.dom.dispatchEvent(new FocusEvent('focus'))
      return { adapter, el, view }
    }

    /** Put the caret at the end of the document's only line, as typing would. */
    const caretToEnd = (view: RealView) => {
      const end = view.state.doc.content.size - 1
      view.dispatch(view.state.tr.setSelection(TextSelection.create(view.state.doc, end)))
    }

    it('offers candidates while a reference is typed and inserts the token on Enter', async () => {
      const { adapter, el, view } = await mountWithSuggestions()
      const changes: string[] = []
      adapter.onChange((md) => changes.push(md))
      await adapter.setContent('See #re\n')
      caretToEnd(view)

      const popup = el.querySelector('[role="listbox"]') as HTMLElement
      expect(popup).toBeTruthy()
      expect(popup.hidden).toBe(false)
      expect([...popup.querySelectorAll('[role="option"]')].map((n) => n.textContent)).toEqual([
        'reading',
      ])
      expect(popup.querySelector('mark')?.textContent).toBe('re')

      // A real keydown on the editable root, routed by ProseMirror's listener.
      const enter = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      })
      view.dom.dispatchEvent(enter)
      expect(enter.defaultPrevented).toBe(true)
      expect(serialize(adapter)).toContain('#reading')
      expect(view.state.selection.from).toBe(view.state.doc.content.size - 1)
      // The popup consumed the key, so the paragraph did not split: this is the
      // observable difference between "the picker took Enter" and "the editor
      // took Enter" (both prevent the browser default).
      expect(view.state.doc.childCount).toBe(1)
      expect(popup.hidden).toBe(true)

      // The insertion is an ordinary edit: it reaches the change stream that
      // feeds the draft and the debounced save.
      await new Promise((r) => setTimeout(r, 400))
      expect(changes.at(-1)).toContain('#reading')

      await adapter.destroy()
      // Nothing of the popup survives the editor (StrictMode remounts the pane
      // while its host stays in the DOM).
      expect(el.querySelector('[role="listbox"]')).toBeNull()
      el.remove()
    })

    it('leaves Enter to the editor when the popup has nothing to offer', async () => {
      const { adapter, el, view } = await mountWithSuggestions()
      await adapter.setContent('See #zz\n')
      caretToEnd(view)
      const popup = el.querySelector('[role="listbox"]') as HTMLElement
      expect(popup.hidden).toBe(true)

      // With no popup, Enter belongs to the editor again: the paragraph splits
      // as before this feature and nothing is completed.
      const enter = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      })
      const blocksBefore = view.state.doc.childCount
      view.dom.dispatchEvent(enter)
      expect(view.state.doc.childCount).toBe(blocksBefore + 1)
      expect(serialize(adapter)).not.toContain('#reading')
      await adapter.destroy()
      el.remove()
    })
  })

  // Applying a chord from the keyboard-shortcuts reference
  // (apply-shortcuts-on-click, ADR-0016): the app dispatches a synthetic
  // keydown and the editor's own keymap resolves it. The payload is the toggle
  // — a formatting combination applied to text that already carries it removes
  // it — so `serialize` (the document itself) is the assertion, not
  // `getContent`, which only catches up when Milkdown's change listener fires.
  // The code-block chords are CodeMirror's, so the surface the caret is in has
  // to be the surface the replay reaches; those cases run against the real
  // component (jsdom mounts it once IntersectionObserver is stubbed).
  describe('MilkdownAdapter (applyChord)', () => {
    const selectAll = (adapter: MilkdownAdapter): void => {
      editorOf(adapter).action((ctx) => {
        const view = (ctx as { get: (k: unknown) => unknown }).get(editorViewCtx) as {
          state: { doc: ProseNode; tr: { setSelection: (s: unknown) => unknown } }
          dispatch: (t: unknown) => void
        }
        view.dispatch(view.state.tr.setSelection(new AllSelection(view.state.doc)))
      })
    }

    const caretToEnd = (adapter: MilkdownAdapter): void => {
      editorOf(adapter).action((ctx) => {
        const view = (ctx as { get: (k: unknown) => unknown }).get(editorViewCtx) as {
          state: { doc: ProseNode; tr: { setSelection: (s: unknown) => unknown } }
          dispatch: (t: unknown) => void
        }
        const end = view.state.doc.content.size
        view.dispatch(view.state.tr.setSelection(TextSelection.near(view.state.doc.resolve(end))))
      })
    }

    const mountPlain = async () => {
      const el = document.createElement('div')
      document.body.appendChild(el)
      const adapter = new MilkdownAdapter()
      await adapter.mount(el)
      return { adapter, el }
    }

    // A real panel control would take focus on mousedown; every case below
    // moves focus to a detached button first so the editor has to take it back.
    const focusAway = () => {
      const button = document.createElement('button')
      document.body.appendChild(button)
      button.focus()
      return button
    }
    const settleCodeBlock = () => new Promise((r) => setTimeout(r, 50))

    it('removes formatting from a selection and restores it on a second apply', async () => {
      const { adapter, el } = await mountPlain()
      await adapter.setContent('a **bold** run\n')
      expect(serialize(adapter)).toBe('a **bold** run\n')

      // Any emphasis inside the selection means the toggle strips it (the
      // command's own removeWhenPresent rule) — the un-format case the
      // reference exists to make reachable without a keyboard.
      selectAll(adapter)
      expect(adapter.applyChord('Mod-b')).toBe(true)
      expect(serialize(adapter)).toBe('a bold run\n')

      // Applying the same chord again restores it: the control is a pipe, the
      // command owns the toggle.
      selectAll(adapter)
      expect(adapter.applyChord('Mod-b')).toBe(true)
      expect(serialize(adapter)).toBe('**a bold run**\n')

      await adapter.destroy()
      el.remove()
    })

    it('reports false for a chord nothing claims, and leaves the document alone', async () => {
      const { adapter, el } = await mountPlain()
      await adapter.setContent('an ordinary paragraph\n')

      // Tab sinks a list item, which no plain paragraph allows, so the keymap
      // declines — and the replay says so rather than pretending it applied.
      expect(adapter.applyChord('Tab')).toBe(false)
      expect(serialize(adapter)).toBe('an ordinary paragraph\n')

      await adapter.destroy()
      el.remove()
    })

    it('takes focus back, so the selection survives the click', async () => {
      const { adapter, el } = await mountPlain()
      await adapter.setContent('a **bold** run\n')
      selectAll(adapter)
      const button = focusAway()
      expect(el.contains(document.activeElement)).toBe(false)

      adapter.applyChord('Mod-b')
      expect(el.contains(document.activeElement)).toBe(true)
      expect(serialize(adapter)).toBe('a bold run\n')

      button.remove()
      await adapter.destroy()
      el.remove()
    })

    describe('code-block chords', () => {
      const cmContent = (el: HTMLElement) => {
        const content = el.querySelector('.cm-content')
        expect(content).toBeTruthy()
        return content as HTMLElement
      }
      const focusProse = (el: HTMLElement) => {
        const editable = el.querySelector('.ProseMirror')
        expect(editable).toBeTruthy()
        ;(editable as HTMLElement).focus()
        return editable as HTMLElement
      }

      it('reaches the CodeMirror surface when the caret is inside the block', async () => {
        const { adapter, el } = await mountPlain()
        await adapter.setContent('```' + '\n' + 'let x = 1' + '\n' + '```' + '\n')
        await settleCodeBlock()
        expect(serialize(adapter)).toContain('```')

        // The caret is in the block, so CodeMirror owns the surface and takes
        // focus; the adapter remembers it through the mount root's focusin.
        cmContent(el).focus()
        const button = focusAway()

        expect(adapter.applyChord('Backspace')).toBe(true)
        expect(serialize(adapter)).not.toContain('```')

        button.remove()
        await adapter.destroy()
        el.remove()
      })

      it('leaves an unrelated code block alone when the caret is in prose', async () => {
        const { adapter, el } = await mountPlain()
        await adapter.setContent(
          '```' + '\n' + 'let x = 1' + '\n' + '```' + '\n' + '\n' + 'after' + '\n',
        )
        await settleCodeBlock()

        // Caret in the trailing paragraph, focus on the ProseMirror root: no
        // surface binds Backspace, so the replay reports it was not applied and
        // the block is untouched — a synthetic Backspace can never delete.
        caretToEnd(adapter)
        focusProse(el)
        expect(adapter.applyChord('Backspace')).toBe(false)
        expect(serialize(adapter)).toContain('```')

        await adapter.destroy()
        el.remove()
      })
    })
  })
})
