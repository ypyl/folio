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
  },
})

const text = (value: string): ProseNode => schema.text(value)
const inlineCode = (value: string): ProseNode =>
  schema.text(value, [schema.marks.inlineCode.create()])
const para = (...content: ProseNode[]): ProseNode => schema.node('paragraph', null, content)
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
