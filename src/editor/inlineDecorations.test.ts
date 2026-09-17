// Reference badges (add-reference-badges): the pure document scan, the
// stay-in-sync rule (no work on caret moves), and the click / Mod+Enter
// activation. These run against a tiny hand-built schema, so they exercise the
// plugin without Milkdown or the browser.

import { describe, expect, it, vi } from 'vitest'
import type { Node as ProseNode } from '@milkdown/prose/model'
import { Schema } from '@milkdown/prose/model'
import { EditorState, TextSelection } from '@milkdown/prose/state'
import type { Decoration, DecorationSet, EditorView } from '@milkdown/prose/view'
import {
  buildReferenceState,
  createInlineDecorationPlugin,
  referenceAt,
  scanInline,
  type BlockRange,
  type ReferenceRef,
  openExternal,
} from './inlineDecorations'

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'inline*', toDOM: () => ['p', 0] },
    code_block: {
      group: 'block',
      content: 'text*',
      marks: '',
      code: true,
      toDOM: () => ['pre', ['code', 0]],
    },
    text: { group: 'inline' },
  },
  marks: {
    inlineCode: { toDOM: () => ['code', 0] },
    link: { attrs: { href: {} }, toDOM: () => ['a', 0] },
  },
})

const text = (value: string): ProseNode => schema.text(value)
const inlineCode = (value: string): ProseNode =>
  schema.text(value, [schema.marks.inlineCode.create()])
const para = (...content: ProseNode[]): ProseNode => schema.node('paragraph', null, content)
const link = (value: string, href: string): ProseNode =>
  schema.text(value, [schema.marks.link.create({ href })])
const fenced = (value: string): ProseNode => schema.node('code_block', null, text(value))
const doc = (...content: ProseNode[]): ProseNode => schema.node('doc', null, content)

const viewOf = (state: EditorState): EditorView => ({ state }) as unknown as EditorView

describe('buildReferenceState', () => {
  it('badges both reference forms over their literal text', () => {
    const d = doc(para(text('See #Inbox and #[[reading list]] now')))
    const { refs, decorations } = buildReferenceState(d)
    expect(refs.map((ref) => d.textBetween(ref.from, ref.to))).toEqual([
      '#Inbox',
      '#[[reading list]]',
    ])
    expect(refs.map((ref) => ref.target)).toEqual(['Inbox', 'reading list'])
    expect(decorations.find()).toHaveLength(2)
  })

  it('skips references inside inline code and fenced code', () => {
    const d = doc(para(text('real #Inbox here')), para(inlineCode('#code-mark')), fenced('#fenced'))
    const { refs } = buildReferenceState(d)
    expect(refs.map((ref) => ref.target)).toEqual(['Inbox'])
  })

  // render-struck-text: struck runs ride the same decorations, so they are
  // covered by the same walk, the same invalidation, and the same one-pass cost.
  describe('struck runs', () => {
    /** An inline decoration's attrs live on the type, which ProseMirror's
     *  public Decoration type does not expose — read the class through it. */
    const classOf = (decoration: Decoration): string =>
      (decoration as unknown as { type: { attrs: { class?: string } } }).type.attrs.class ?? ''

    const runsIn = (d: ProseNode, decorations: DecorationSet): string[] =>
      decorations
        .find()
        .filter((decoration) => classOf(decoration) === 'strike')
        .map((decoration) => d.textBetween(decoration.from, decoration.to))

    const blockRanges = (d: ProseNode): BlockRange[] => {
      const ranges: BlockRange[] = []
      d.forEach((node, offset) => ranges.push({ from: offset, to: offset + node.nodeSize }))
      return ranges
    }

    it('decorates each struck run over its literal text', () => {
      const d = doc(para(text('Before ~~done~~ and ~~two words~~ after')))
      const { decorations } = buildReferenceState(d)
      expect(runsIn(d, decorations)).toEqual(['~~done~~', '~~two words~~'])
    })

    it('leaves the near misses plain', () => {
      const cases = ['~~~~', '~~ spaced ~~', '~single~', '~~~~~', '~~a b ~c~~', '~~ ~~']
      const d = doc(para(text(cases.join(' | '))))
      const { decorations } = buildReferenceState(d)
      expect(runsIn(d, decorations)).toEqual([])
    })

    it('strikes the first complete pair when runs share a line', () => {
      // `~~a~~b~~` is a struck "a" and a stray tail, not one run: the pair that
      // closes first wins, which is the rule the spec states.
      const d = doc(para(text('~~a~~b~~')))
      const { decorations } = buildReferenceState(d)
      expect(runsIn(d, decorations)).toEqual(['~~a~~'])
    })

    it('skips runs inside inline code and fenced code', () => {
      const d = doc(para(inlineCode('~~code~~')), fenced('~~fenced~~'))
      const { decorations } = buildReferenceState(d)
      expect(runsIn(d, decorations)).toEqual([])
    })

    it('decorates a struck reference with both schemes', () => {
      const d = doc(para(text('~~#Inbox~~')))
      const { decorations, refs } = buildReferenceState(d)
      expect(refs.map((ref) => ref.target)).toEqual(['Inbox'])
      expect(decorations.find().map(classOf).sort()).toEqual(['ref', 'strike'])
    })

    it('re-decorates only the block an edit touched', () => {
      const ranges: (BlockRange | undefined)[] = []
      const scan = vi.fn((d: ProseNode, range?: BlockRange) => {
        ranges.push(range)
        return scanInline(d, range)
      })
      const blocks = Array.from({ length: 30 }, (_, i) =>
        para(text(i === 10 ? 'Target ~~note~~ here' : `Paragraph ${i} of the page`)),
      )
      const d = doc(...blocks)
      const plugin = createInlineDecorationPlugin({ scan })
      let state = EditorState.create({ schema, doc: d, plugins: [plugin] })
      expect(runsIn(state.doc, plugin.getState(state)!.decorations)).toEqual(['~~note~~'])
      ranges.length = 0

      // Type one character inside paragraph 3.
      state = state.apply(state.tr.insertText('x', blockRanges(d)[3].from + 3))

      expect(ranges).toHaveLength(1)
      // The struck run further down the page survives the edit.
      expect(runsIn(state.doc, plugin.getState(state)!.decorations)).toEqual(['~~note~~'])
    })
  })

  // open-links-on-ctrl-click: a bare URL is decorated as a link while the text
  // stays literal, and the click gesture is the modifier.
  describe('bare URLs', () => {
    const classOf = (decoration: Decoration): string =>
      (decoration as unknown as { type: { attrs: { class?: string } } }).type.attrs.class ?? ''

    const urlsIn = (d: ProseNode, decorations: DecorationSet): string[] =>
      decorations
        .find()
        .filter((decoration) => classOf(decoration) === 'url')
        .map((decoration) => d.textBetween(decoration.from, decoration.to))

    it('decorates each bare URL form over its literal text', () => {
      const d = doc(para(text('see https://example.com/path and http://x.y and www.z.dev now')))
      const { decorations } = buildReferenceState(d)
      expect(urlsIn(d, decorations)).toEqual([
        'https://example.com/path',
        'http://x.y',
        'www.z.dev',
      ])
    })

    it('leaves a sentence back to the writer', () => {
      const d = doc(para(text('Read https://example.com/path. Then stop.')))
      const { decorations } = buildReferenceState(d)
      expect(urlsIn(d, decorations)).toEqual(['https://example.com/path'])
    })

    it('skips URLs inside code and inside a link', () => {
      const d = doc(
        para(inlineCode('https://code.example')),
        fenced('https://fenced.example'),
        // A link's own text is already under an anchor.
        para(link('https://linked.example', 'https://linked.example')),
      )
      const { decorations } = buildReferenceState(d)
      expect(urlsIn(d, decorations)).toEqual([])
    })

    it('re-decorates only the block an edit touched', () => {
      const blocks = Array.from({ length: 20 }, (_, i) =>
        para(text(i === 8 ? 'See https://example.com/here' : `Paragraph ${i}`)),
      )
      const d = doc(...blocks)
      const plugin = createInlineDecorationPlugin()
      let state = EditorState.create({ schema, doc: d, plugins: [plugin] })
      expect(urlsIn(state.doc, plugin.getState(state)!.decorations)).toEqual([
        'https://example.com/here',
      ])
      const ranges: BlockRange[] = []
      state.doc.forEach((node, offset) => ranges.push({ from: offset, to: offset + node.nodeSize }))
      state = state.apply(state.tr.insertText('x', ranges[2].from + 2))
      expect(urlsIn(state.doc, plugin.getState(state)!.decorations)).toEqual([
        'https://example.com/here',
      ])
    })
  })

  // open-links-on-ctrl-click: the gesture lives on the click event, because
  // that is the event that activates an anchor — preventing it is what keeps a
  // Ctrl+Click on a markdown link from opening two tabs.
  describe('opening links', () => {
    const clickEvent = (target: Element, modifiers: { ctrl?: boolean; meta?: boolean } = {}) => {
      const event = {
        target,
        ctrlKey: modifiers.ctrl ?? false,
        metaKey: modifiers.meta ?? false,
        clientX: 0,
        clientY: 0,
        preventDefault: vi.fn(),
      }
      return event as unknown as MouseEvent & { preventDefault: ReturnType<typeof vi.fn> }
    }

    /** A view double: the click path needs a position for the coordinates. */
    const viewAt = (state: EditorState, pos: number): EditorView =>
      ({ state, posAtCoords: () => ({ pos, inside: -1 }) }) as unknown as EditorView

    const urlSpan = (): HTMLElement => {
      const el = document.createElement('span')
      el.className = 'url'
      return el
    }

    const anchorTag = (href: string): HTMLElement => {
      const el = document.createElement('a')
      el.setAttribute('href', href)
      return el
    }

    const opens = () => {
      const calls: string[] = []
      const spy = vi.spyOn(window, 'open').mockImplementation((url) => {
        calls.push(String(url))
        return null
      })
      return { calls, restore: () => spy.mockRestore() }
    }

    /** A window `window.open` hands back, so the display branch runs to the end
     *  and the URL it was pointed at can be read. */
    const displayWindow = () => {
      const opened = { opener: {} as unknown, location: { href: '' }, close: vi.fn() }
      const spy = vi.spyOn(window, 'open').mockImplementation(() => opened as unknown as Window)
      return { opened, restore: () => spy.mockRestore() }
    }

    /** A vault reader that records the paths it was asked for. */
    const vaultReader = (fail = false) => {
      const calls: string[] = []
      const read = (path: string) => {
        calls.push(path)
        return fail
          ? Promise.reject(new Error('missing'))
          : Promise.resolve(new Blob(['bytes'], { type: 'application/pdf' }))
      }
      return Object.assign(read, { calls })
    }

    /** Let the activation's read and its continuation settle. */
    const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

    const click = (
      plugin: ReturnType<typeof createInlineDecorationPlugin>,
      view: EditorView,
      event: MouseEvent,
    ) => plugin.props.handleDOMEvents?.click?.call(plugin, view, event as unknown as PointerEvent)

    it('opens a bare URL on a modifier click, once, and stops the default', () => {
      const d = doc(para(text('see https://example.com/path now')))
      const plugin = createInlineDecorationPlugin()
      const state = EditorState.create({ schema, doc: d, plugins: [plugin] })
      const urlStart = d.textBetween(0, d.content.size).indexOf('https')
      const { calls, restore } = opens()
      const event = clickEvent(urlSpan(), { ctrl: true })
      expect(click(plugin, viewAt(state, 1 + urlStart), event)).toBe(true)
      expect(calls).toEqual(['https://example.com/path'])
      expect(event.preventDefault).toHaveBeenCalled()
      restore()
    })

    it('keeps an external anchor from double-opening', () => {
      const plugin = createInlineDecorationPlugin()
      const state = EditorState.create({ schema, doc: doc(para(text('link'))), plugins: [plugin] })
      const { calls, restore } = opens()
      const event = clickEvent(anchorTag('https://example.com/x'), { meta: true })
      expect(click(plugin, viewAt(state, 1), event)).toBe(true)
      expect(calls).toEqual(['https://example.com/x'])
      // The browser's own Ctrl+Click activation is stopped, so one tab opens.
      expect(event.preventDefault).toHaveBeenCalled()
      restore()
    })

    it('opens nothing for a vault target when no vault reader is attached', () => {
      const plugin = createInlineDecorationPlugin()
      const state = EditorState.create({ schema, doc: doc(para(text('asset'))), plugins: [plugin] })
      const { calls, restore } = opens()
      const event = clickEvent(anchorTag('assets/photo.png'), { ctrl: true })
      expect(click(plugin, viewAt(state, 1), event)).toBe(false)
      expect(calls).toEqual([])
      // The default is stopped — a tab to a vault path would 404 — but the
      // click is not claimed, so the editor still places the caret.
      expect(event.preventDefault).toHaveBeenCalled()
      restore()
    })

    // open-vault-assets: a link into the vault is opened with the file's own
    // bytes, read once, on the same gesture as an external link.
    it('opens a vault link from its file bytes, once, on a modifier click', async () => {
      const read = vaultReader()
      const plugin = createInlineDecorationPlugin({ readAsset: read })
      const state = EditorState.create({ schema, doc: doc(para(text('asset'))), plugins: [plugin] })
      const { opened, restore } = displayWindow()
      const event = clickEvent(anchorTag('assets/q3%20report.pdf'), { ctrl: true })
      expect(click(plugin, viewAt(state, 1), event)).toBe(true)
      expect(event.preventDefault).toHaveBeenCalled()
      await settle()
      expect(read.calls).toEqual(['assets/q3 report.pdf'])
      expect(opened.location.href).toMatch(/^blob:/)
      expect(opened.close).not.toHaveBeenCalled()
      restore()
    })

    it('opens nothing, and navigates nowhere, for a vault path that will not resolve', async () => {
      const read = vaultReader(true)
      const plugin = createInlineDecorationPlugin({ readAsset: read })
      const state = EditorState.create({ schema, doc: doc(para(text('asset'))), plugins: [plugin] })
      const { opened, restore } = displayWindow()
      const event = clickEvent(anchorTag('assets/missing.pdf'), { ctrl: true })
      expect(click(plugin, viewAt(state, 1), event)).toBe(true)
      await settle()
      expect(read.calls).toEqual(['assets/missing.pdf'])
      // The window opened before the read is discarded with nothing in it.
      expect(opened.location.href).toBe('')
      expect(opened.close).toHaveBeenCalled()
      restore()
    })

    it('reads nothing for a vault link on a plain click', async () => {
      const read = vaultReader()
      const plugin = createInlineDecorationPlugin({ readAsset: read })
      const state = EditorState.create({ schema, doc: doc(para(text('asset'))), plugins: [plugin] })
      const { calls, restore } = opens()
      const event = clickEvent(anchorTag('assets/q3-report.pdf'))
      expect(click(plugin, viewAt(state, 1), event)).toBe(false)
      await settle()
      expect(read.calls).toEqual([])
      expect(calls).toEqual([])
      expect(event.preventDefault).not.toHaveBeenCalled()
      restore()
    })

    it('sends an external link to the browser and never to the vault', () => {
      const read = vaultReader()
      const plugin = createInlineDecorationPlugin({ readAsset: read })
      const state = EditorState.create({ schema, doc: doc(para(text('link'))), plugins: [plugin] })
      const { calls, restore } = opens()
      const event = clickEvent(anchorTag('https://example.com/x'), { ctrl: true })
      expect(click(plugin, viewAt(state, 1), event)).toBe(true)
      expect(calls).toEqual(['https://example.com/x'])
      expect(read.calls).toEqual([])
      restore()
    })

    it('opens nothing for a fragment, even with a reader attached', async () => {
      const read = vaultReader()
      const plugin = createInlineDecorationPlugin({ readAsset: read })
      const state = EditorState.create({
        schema,
        doc: doc(para(text('#section'))),
        plugins: [plugin],
      })
      const { calls, restore } = opens()
      const event = clickEvent(anchorTag('#section'), { ctrl: true })
      expect(click(plugin, viewAt(state, 1), event)).toBe(false)
      await settle()
      expect(read.calls).toEqual([])
      expect(calls).toEqual([])
      expect(event.preventDefault).toHaveBeenCalled()
      restore()
    })

    // open-vault-assets, the read budget (AGENTS.md): the vault is read on the
    // activation and nowhere else. Fails if a read is ever moved onto a
    // document change.
    it('reads nothing while the document changes, then once for the activation', async () => {
      const read = vaultReader()
      const plugin = createInlineDecorationPlugin({ readAsset: read })
      let state = EditorState.create({
        schema,
        doc: doc(para(text('see assets/q3-report.pdf'))),
        plugins: [plugin],
      })
      for (let i = 0; i < 5; i++) {
        state = state.apply(state.tr.insertText('x', 1))
        expect(read.calls).toEqual([])
      }
      const { restore } = displayWindow()
      click(plugin, viewAt(state, 1), clickEvent(anchorTag('assets/q3-report.pdf'), { ctrl: true }))
      await settle()
      expect(read.calls).toEqual(['assets/q3-report.pdf'])
      restore()
    })

    // open-vault-assets: the gesture is a read. Nothing it does touches the
    // document, so nothing can reach the file on disk (ADR-0001).
    it('writes nothing: the activation dispatches no transaction', async () => {
      const read = vaultReader()
      const plugin = createInlineDecorationPlugin({ readAsset: read })
      const state = EditorState.create({ schema, doc: doc(para(text('asset'))), plugins: [plugin] })
      const dispatch = vi.fn()
      const view = {
        state,
        dispatch,
        posAtCoords: () => ({ pos: 1, inside: -1 }),
      } as unknown as EditorView
      const { restore } = displayWindow()
      click(plugin, view, clickEvent(anchorTag('assets/q3-report.pdf'), { ctrl: true }))
      await settle()
      expect(read.calls).toEqual(['assets/q3-report.pdf'])
      expect(dispatch).not.toHaveBeenCalled()
      expect(state.doc.textBetween(0, state.doc.content.size)).toContain('asset')
      restore()
    })

    it('opens nothing on a plain click', () => {
      const d = doc(para(text('see https://example.com/path now')))
      const plugin = createInlineDecorationPlugin()
      const state = EditorState.create({ schema, doc: d, plugins: [plugin] })
      const urlStart = d.textBetween(0, d.content.size).indexOf('https')
      const { calls, restore } = opens()
      const event = clickEvent(urlSpan())
      expect(click(plugin, viewAt(state, 1 + urlStart), event)).toBe(false)
      expect(calls).toEqual([])
      expect(event.preventDefault).not.toHaveBeenCalled()
      restore()
    })

    it.each([
      ['https://example.com/x', true],
      ['http://example.com/x', true],
      ['mailto:someone@example.com', true],
      ['www.example.com', true],
      ['assets/photo.png', false],
      ['#section', false],
      ['', false],
      [null, false],
    ])('openExternal(%s) -> %s', (href, expected) => {
      const { calls, restore } = opens()
      expect(openExternal(href as string | null)).toBe(expected)
      expect(calls).toHaveLength(expected ? 1 : 0)
      restore()
    })
  })

  it('keeps a plain wikilink as text', () => {
    const { refs } = buildReferenceState(doc(para(text('[[Inbox]] is not a reference'))))
    expect(refs).toEqual([])
  })
})

describe('createInlineDecorationPlugin', () => {
  it('does not rescan the document on a selection-only transaction', () => {
    const scan = vi.fn(scanInline)
    const plugin = createInlineDecorationPlugin({ scan })
    let state = EditorState.create({
      schema,
      doc: doc(para(text('See #Inbox now'))),
      plugins: [plugin],
    })
    expect(scan).toHaveBeenCalledTimes(1)
    const before = plugin.getState(state)
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, 7)))
    expect(scan).toHaveBeenCalledTimes(1)
    expect(plugin.getState(state)).toBe(before)
  })

  it('reports the target when a click lands on a reference badge', () => {
    const onActivate = vi.fn()
    const plugin = createInlineDecorationPlugin({ onActivate })
    const state = EditorState.create({
      schema,
      doc: doc(para(text('See #Inbox now'))),
      plugins: [plugin],
    })
    const view = viewOf(state)
    const click = (target: Element) => ({ target }) as unknown as MouseEvent
    const badge = () => {
      const el = document.createElement('span')
      el.className = 'ref'
      return el
    }
    // The paragraph text starts at 1, so `#Inbox` spans 5..11.
    expect(plugin.props.handleClick?.call(plugin, view, 7, click(badge()))).toBe(true)
    expect(onActivate).toHaveBeenCalledWith('Inbox')
    onActivate.mockClear()
    expect(plugin.props.handleClick?.call(plugin, view, 0, click(badge()))).toBe(false)
    expect(onActivate).not.toHaveBeenCalled()
  })

  it('places the caret for a click past a reference instead of navigating', () => {
    // The reported bug: a page holding only `#NewPage` navigated away when the
    // user clicked the end of the line to add content after it. That click
    // lands on position `to`, exactly where the badge's last character is, so
    // only the target says which the user meant.
    const onActivate = vi.fn()
    const plugin = createInlineDecorationPlugin({ onActivate })
    const state = EditorState.create({
      schema,
      doc: doc(para(text('#NewPage'))),
      plugins: [plugin],
    })
    const view = viewOf(state)
    const paragraph = document.createElement('p')
    expect(
      plugin.props.handleClick?.call(plugin, view, 8, {
        target: paragraph,
      } as unknown as MouseEvent),
    ).toBe(false)
    expect(onActivate).not.toHaveBeenCalled()
  })

  it('opens the reference at the caret with Mod+Enter and falls through otherwise', () => {
    const onActivate = vi.fn()
    const plugin = createInlineDecorationPlugin({ onActivate })
    const base = EditorState.create({
      schema,
      doc: doc(para(text('See #Inbox now'))),
      plugins: [plugin],
    })
    const chord = {
      key: 'Enter',
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
    } as KeyboardEvent

    let inside = base.apply(base.tr.setSelection(TextSelection.create(base.doc, 7)))
    expect(plugin.props.handleKeyDown?.call(plugin, viewOf(inside), chord)).toBe(true)
    expect(onActivate).toHaveBeenCalledWith('Inbox')

    onActivate.mockClear()
    inside = base.apply(base.tr.setSelection(TextSelection.create(base.doc, 0)))
    expect(plugin.props.handleKeyDown?.call(plugin, viewOf(inside), chord)).toBe(false)
    expect(onActivate).not.toHaveBeenCalled()

    // A plain Enter (no modifier) is never the open chord.
    inside = base.apply(base.tr.setSelection(TextSelection.create(base.doc, 7)))
    expect(
      plugin.props.handleKeyDown?.call(plugin, viewOf(inside), {
        ...chord,
        ctrlKey: false,
      } as KeyboardEvent),
    ).toBe(false)
  })
})

// Incremental invalidation (bound-editor-per-keystroke-work, design D1): the
// badge set is carried across a change and only the blocks the edit touched are
// rescanned. The from-scratch scan stays the reference implementation, so the
// property test below compares the two after every edit.
describe('badge invalidation scope', () => {
  /** Blocks of a document, in order, with their ranges. */
  const blocksOf = (d: ProseNode): { from: number; to: number }[] => {
    const blocks: { from: number; to: number }[] = []
    d.forEach((_node, offset) => {
      blocks.push({ from: offset, to: offset + _node.nodeSize })
    })
    return blocks
  }

  it('rescans only the block an edit touched', () => {
    const ranges: (BlockRange | undefined)[] = []
    const scan = vi.fn((d: ProseNode, range?: BlockRange) => {
      ranges.push(range)
      return scanInline(d, range)
    })
    const blocks = Array.from({ length: 40 }, (_, i) =>
      para(text(i === 20 ? 'Target #note here' : `Paragraph ${i} of the page`)),
    )
    const d = doc(...blocks)
    const plugin = createInlineDecorationPlugin({ scan })
    let state = EditorState.create({ schema, doc: d, plugins: [plugin] })
    ranges.length = 0

    // Type one character inside paragraph 5.
    const at = blocksOf(d)[5].from + 3
    state = state.apply(state.tr.insertText('x', at))

    expect(ranges).toHaveLength(1)
    expect(ranges[0]).toEqual(blocksOf(state.doc)[5])
    // ...and the reference further down the page is still badged from the map.
    const refs = plugin.getState(state)!.refs
    expect(refs.map((ref) => ref.target)).toEqual(['note'])
  })

  it('covers both sides of a structural edit', () => {
    const ranges: (BlockRange | undefined)[] = []
    const scan = vi.fn((d: ProseNode, range?: BlockRange) => {
      ranges.push(range)
      return scanInline(d, range)
    })
    const d = doc(para(text('before')), para(text('after #Inbox')))
    const plugin = createInlineDecorationPlugin({ scan })
    let state = EditorState.create({ schema, doc: d, plugins: [plugin] })
    ranges.length = 0

    // Split the first paragraph at its end: both the old and the new block
    // count as touched, because the boundary rewrites the text around it.
    const splitAt = blocksOf(d)[0].to - 1
    state = state.apply(state.tr.split(splitAt))

    expect(state.doc.childCount).toBe(3)
    expect(ranges).toHaveLength(1)
    expect(ranges[0]).toEqual({
      from: blocksOf(state.doc)[0].from,
      to: blocksOf(state.doc)[1].to,
    })
  })

  it('rescans when inline code is toggled, since the text did not change', () => {
    const ranges: (BlockRange | undefined)[] = []
    const scan = vi.fn((d: ProseNode, range?: BlockRange) => {
      ranges.push(range)
      return scanInline(d, range)
    })
    const d = doc(para(text('See #Inbox now')))
    const plugin = createInlineDecorationPlugin({ scan })
    let state = EditorState.create({ schema, doc: d, plugins: [plugin] })
    expect(plugin.getState(state)!.refs).toHaveLength(1)
    ranges.length = 0

    state = state.apply(state.tr.addMark(5, 11, schema.marks.inlineCode.create()))

    expect(ranges).toHaveLength(1)
    expect(plugin.getState(state)!.refs).toEqual([])
    expect(plugin.getState(state)!.decorations.find()).toEqual([])
  })
})

describe('activation after an edit', () => {
  const chord = {
    key: 'Enter',
    ctrlKey: true,
    metaKey: false,
    shiftKey: false,
    altKey: false,
  } as KeyboardEvent

  it('keeps a mapped reference activatable at every caret boundary', () => {
    const onActivate = vi.fn()
    const plugin = createInlineDecorationPlugin({ onActivate })
    let state = EditorState.create({
      schema,
      doc: doc(para(text('See #Inbox now')), para(text('other'))),
      plugins: [plugin],
    })
    // An edit in the following block maps the reference's positions rather than
    // rescanning them.
    state = state.apply(state.tr.insertText('z', state.doc.content.size - 2))
    const ref = plugin.getState(state)!.refs[0]
    expect(state.doc.textBetween(ref.from, ref.to)).toBe('#Inbox')

    for (const at of [ref.from, ref.from + 3, ref.to]) {
      state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, at)))
      expect(referenceAt(plugin.getState(state)!.refs, at)?.target).toBe('Inbox')
      onActivate.mockClear()
      expect(plugin.props.handleKeyDown?.call(plugin, viewOf(state), chord)).toBe(true)
      expect(onActivate).toHaveBeenCalledWith('Inbox')
    }
  })

  it('activates a reference whose own block was rescanned', () => {
    const onActivate = vi.fn()
    const plugin = createInlineDecorationPlugin({ onActivate })
    let state = EditorState.create({
      schema,
      doc: doc(para(text('See #Inbox now'))),
      plugins: [plugin],
    })
    const before = plugin.getState(state)!.refs[0]
    state = state.apply(state.tr.insertText('x', before.from + 1))

    const ref = plugin.getState(state)!.refs[0]
    expect(state.doc.textBetween(ref.from, ref.to)).toBe('#xInbox')
    state = state.apply(state.tr.setSelection(TextSelection.create(state.doc, ref.to)))
    expect(plugin.props.handleKeyDown?.call(plugin, viewOf(state), chord)).toBe(true)
    expect(onActivate).toHaveBeenCalledWith('xInbox')
  })
})

describe('incremental badges match a full scan', () => {
  const blockTops = (d: ProseNode): number[] => {
    const starts: number[] = []
    d.forEach((_node, offset) => starts.push(offset))
    return starts
  }

  const summarize = (state: { decorations: DecorationSet; refs: ReferenceRef[] }) => ({
    marks: state.decorations
      .find()
      .map((mark: Decoration) => `${mark.from}-${mark.to}:${String(mark.spec.class)}`)
      .sort(),
    refs: state.refs.map((ref) => `${ref.from}-${ref.to}:${ref.target}`).sort(),
  })

  it('agrees with buildReferenceState after every edit in a randomized run', () => {
    // A tiny deterministic generator, so a failure reproduces exactly.
    let seed = 20260910
    const next = (bound: number) => {
      seed = (seed * 1103515245 + 12345) % 2147483648
      return seed % bound
    }

    const initial = doc(
      para(text('Intro with #intro and #[[two words]]')),
      para(text('plain paragraph')),
      para(inlineCode('#coded')),
      fenced('#fenced'),
      para(text('another #ref here')),
      para(text('the last paragraph')),
    )
    const plugin = createInlineDecorationPlugin()
    let state = EditorState.create({ schema, doc: initial, plugins: [plugin] })

    const textPositions = () => {
      const out: number[] = []
      state.doc.descendants((node, pos) => {
        if (node.isText && node.text) for (let i = 0; i <= node.text.length; i++) out.push(pos + i)
      })
      return out
    }

    for (let step = 0; step < 60; step++) {
      const positions = textPositions()
      const pick = positions[next(positions.length)]
      const choice = next(7)
      const tr = state.tr
      if (choice === 0) tr.insertText('#', pick)
      else if (choice === 1) tr.insertText('x', pick)
      else if (choice === 2 && pick + 1 <= state.doc.content.size) tr.delete(pick, pick + 1)
      else if (choice === 3) tr.split(pick)
      else if (choice === 4) {
        tr.addMark(
          pick,
          Math.min(pick + 2, state.doc.content.size),
          schema.marks.inlineCode.create(),
        )
      } else if (choice === 5) {
        const tops = blockTops(state.doc)
        if (tops.length > 2) {
          const index = next(tops.length - 2) + 1
          tr.delete(tops[index], tops[index + 1])
        }
      } else {
        const tops = blockTops(state.doc)
        if (tops.length > 2) {
          const index = next(tops.length - 2) + 1
          tr.join(tops[index])
        }
      }
      state = state.apply(tr)
      expect(summarize(plugin.getState(state)!)).toEqual(summarize(buildReferenceState(state.doc)))
    }
  })
})
