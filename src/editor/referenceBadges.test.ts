// Reference badges (add-reference-badges): the pure document scan, the
// stay-in-sync rule (no work on caret moves), and the click / Mod+Enter
// activation. These run against a tiny hand-built schema, so they exercise the
// plugin without Milkdown or the browser.

import { describe, expect, it, vi } from 'vitest'
import type { Node as ProseNode } from '@milkdown/prose/model'
import { Schema } from '@milkdown/prose/model'
import { EditorState, TextSelection } from '@milkdown/prose/state'
import type { EditorView } from '@milkdown/prose/view'
import { buildReferenceState, createReferencePlugin } from './referenceBadges'

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

  it('keeps a plain wikilink as text', () => {
    const { refs } = buildReferenceState(doc(para(text('[[Inbox]] is not a reference'))))
    expect(refs).toEqual([])
  })
})

describe('createReferencePlugin', () => {
  it('does not rescan the document on a selection-only transaction', () => {
    const scan = vi.fn(buildReferenceState)
    const plugin = createReferencePlugin({ scan })
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

  it('reports the target when a click lands inside a reference', () => {
    const onActivate = vi.fn()
    const plugin = createReferencePlugin({ onActivate })
    const state = EditorState.create({
      schema,
      doc: doc(para(text('See #Inbox now'))),
      plugins: [plugin],
    })
    const view = viewOf(state)
    // The paragraph text starts at 1, so `#Inbox` spans 5..11.
    expect(plugin.props.handleClick?.call(plugin, view, 7, {} as MouseEvent)).toBe(true)
    expect(onActivate).toHaveBeenCalledWith('Inbox')
    onActivate.mockClear()
    expect(plugin.props.handleClick?.call(plugin, view, 0, {} as MouseEvent)).toBe(false)
    expect(onActivate).not.toHaveBeenCalled()
  })

  it('opens the reference at the caret with Mod+Enter and falls through otherwise', () => {
    const onActivate = vi.fn()
    const plugin = createReferencePlugin({ onActivate })
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
