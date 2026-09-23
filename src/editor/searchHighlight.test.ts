// Search-match marking (mark-search-matches-on-the-page): the pure plugin —
// marking a block, clearing on an edit, and ignoring an out-of-range index.
// Runs against a tiny hand-built schema, without Milkdown or a browser.

import { describe, expect, it } from 'vitest'
import type { Node as ProseNode } from '@milkdown/prose/model'
import { Schema } from '@milkdown/prose/model'
import type { PluginKey } from '@milkdown/prose/state'
import { EditorState } from '@milkdown/prose/state'
import type { Decoration } from '@milkdown/prose/view'
import { SEARCH_HIT_CLASS, blockStart, createSearchHighlightPlugin } from './searchHighlight'

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'inline*', toDOM: () => ['p', 0] },
    text: { group: 'inline' },
  },
})

const para = (text: string): ProseNode =>
  schema.node('paragraph', null, text === '' ? [] : [schema.text(text)])

function doc(): ProseNode {
  return schema.node('doc', null, [para('one'), para('two'), para('three')])
}

function classOf(decoration: Decoration): string {
  return (
    (decoration as unknown as { type?: { attrs?: { class?: string } } }).type?.attrs?.class ?? ''
  )
}

describe('blockStart', () => {
  it('reports the position before the block and null past the end', () => {
    const d = doc()
    expect(blockStart(d, 0)).toBe(0)
    expect(blockStart(d, 2)).toBe(d.child(0).nodeSize + d.child(1).nodeSize)
    expect(blockStart(d, 3)).toBeNull()
    expect(blockStart(d, -1)).toBeNull()
  })
})

type StateOf = { block: number | null; decorations: { find: () => Decoration[] } }
const stateOf = (plugin: ReturnType<typeof createSearchHighlightPlugin>, state: EditorState) =>
  plugin.getState(state) as StateOf

function mark(plugin: ReturnType<typeof createSearchHighlightPlugin>, block: number) {
  const state = EditorState.create({ doc: doc(), plugins: [plugin] })
  const key = plugin.spec.key as PluginKey
  return state.applyTransaction(state.tr.setMeta(key, { block })).state
}

describe('the highlight plugin', () => {
  it('marks the requested block', () => {
    const plugin = createSearchHighlightPlugin()
    expect(stateOf(plugin, mark(plugin, 1)).decorations.find().map(classOf)).toEqual([
      SEARCH_HIT_CLASS,
    ])
  })

  it('clears the mark on a document change', () => {
    const plugin = createSearchHighlightPlugin()
    const marked = mark(plugin, 1)
    const edited = marked.applyTransaction(marked.tr.insertText('!', 1)).state
    expect(stateOf(plugin, edited).decorations.find()).toHaveLength(0)
    expect(stateOf(plugin, edited).block).toBeNull()
  })

  it('ignores a block the document does not hold', () => {
    const plugin = createSearchHighlightPlugin()
    expect(stateOf(plugin, mark(plugin, 99)).decorations.find()).toHaveLength(0)
  })

  it('leaves the mark alone on a selection-only transaction', () => {
    const plugin = createSearchHighlightPlugin()
    expect(stateOf(plugin, mark(plugin, 0)).decorations.find().map(classOf)).toEqual([
      SEARCH_HIT_CLASS,
    ])
  })
})
