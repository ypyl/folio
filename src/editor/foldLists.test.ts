// List folding (add-collapsible-list-items, ADR-0026): the plugin state, the
// incremental invalidation, and the selection guard. These run against a tiny
// hand-built schema, so they exercise the plugin without Milkdown or a browser.

import { describe, expect, it, vi } from 'vitest'
import type { Node as ProseNode } from '@milkdown/prose/model'
import { Schema } from '@milkdown/prose/model'
import type { Plugin, PluginKey } from '@milkdown/prose/state'
import { EditorState, TextSelection } from '@milkdown/prose/state'
import type { Decoration, DecorationSet } from '@milkdown/prose/view'
import {
  FOLDED_CLASS,
  FOLD_HEAD_CLASS,
  FOLD_ITEM_CLASS,
  createFoldPlugin,
  hiddenBoundary,
  isFoldableItem,
} from './foldLists'

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'inline*', toDOM: () => ['p', 0] },
    bullet_list: { group: 'block', content: 'list_item+', toDOM: () => ['ul', 0] },
    list_item: { content: 'block+', toDOM: () => ['li', 0] },
    text: { group: 'inline' },
  },
})

const text = (value: string): ProseNode => schema.text(value)
const para = (...content: ProseNode[]): ProseNode => schema.node('paragraph', null, content)
const item = (...blocks: ProseNode[]): ProseNode => schema.node('list_item', null, blocks)
const list = (...items: ProseNode[]): ProseNode => schema.node('bullet_list', null, items)
const doc = (...content: ProseNode[]): ProseNode => schema.node('doc', null, content)

/** The document used throughout: item A holds a nested item A1; item B is a
 *  leaf and so shows no control. */
const nestedDoc = (): ProseNode =>
  doc(list(item(para(text('A')), list(item(para(text('A1'))))), item(para(text('B')))))

/** The start position of the list item whose first paragraph reads `label`. */
function itemStart(d: ProseNode, label: string): number {
  let found = -1
  d.descendants((node, pos) => {
    if (node.type.name === 'list_item' && node.firstChild?.textContent === label) found = pos
  })
  return found
}

function classOf(decoration: Decoration): string {
  return (
    (decoration as unknown as { type?: { attrs?: { class?: string } } }).type?.attrs?.class ?? ''
  )
}

function stateWith(plugin: Plugin, d: ProseNode): EditorState {
  return EditorState.create({ doc: d, plugins: [plugin] })
}

function toggle(plugin: Plugin, state: EditorState, start: number): EditorState {
  const key = plugin.spec.key as PluginKey
  return state.applyTransaction(state.tr.setMeta(key, { toggle: start })).state
}

function foldedOf(plugin: Plugin, state: EditorState): ReadonlySet<number> {
  return plugin.getState(state).folded as ReadonlySet<number>
}

function decorationsOf(plugin: Plugin, state: EditorState): DecorationSet {
  return plugin.getState(state).decorations as DecorationSet
}

describe('isFoldableItem', () => {
  it('is true for an item with a nested list and false for a leaf', () => {
    const d = nestedDoc()
    const items: Record<string, ProseNode> = {}
    d.descendants((node) => {
      if (node.type.name === 'list_item') items[node.firstChild?.textContent ?? '?'] = node
    })
    expect(isFoldableItem(items.A)).toBe(true)
    expect(isFoldableItem(items.A1)).toBe(false)
    expect(isFoldableItem(items.B)).toBe(false)
  })
})

describe('fold decorations', () => {
  it('marks a foldable item and its first block, and gives it one control', () => {
    const plugin = createFoldPlugin()
    const state = stateWith(plugin, nestedDoc())
    const decorations = decorationsOf(plugin, state).find()
    // Item A: item class, head class, toggle widget. Leaf items contribute none.
    expect(decorations).toHaveLength(3)
    expect(decorations.map(classOf)).toContain(FOLD_ITEM_CLASS)
    expect(decorations.map(classOf)).toContain(FOLD_HEAD_CLASS)
  })

  it('adds the folded class and leaves the head and control in place', () => {
    const plugin = createFoldPlugin()
    const d = nestedDoc()
    const start = itemStart(d, 'A')
    const state = toggle(plugin, stateWith(plugin, d), start)
    expect(foldedOf(plugin, state).has(start)).toBe(true)
    const classes = decorationsOf(plugin, state).find().map(classOf)
    expect(classes).toContain(`${FOLD_ITEM_CLASS} ${FOLDED_CLASS}`)
    expect(classes).toContain(FOLD_HEAD_CLASS)
  })

  it('does not call the layout callback on an ordinary document change', () => {
    const onLayout = vi.fn()
    const plugin = createFoldPlugin(onLayout)
    const d = nestedDoc()
    const start = itemStart(d, 'A')
    let state = toggle(plugin, stateWith(plugin, d), start)
    state = state.applyTransaction(state.tr.insertText('!', itemStart(state.doc, 'A') + 3)).state
    expect(onLayout).not.toHaveBeenCalled()
  })
})

describe('the folded set is carried forward', () => {
  it('keeps a folded item through a text edit inside it', () => {
    const plugin = createFoldPlugin()
    const d = nestedDoc()
    const start = itemStart(d, 'A')
    let state = toggle(plugin, stateWith(plugin, d), start)
    const at = start + 3 // inside A's text
    state = state.applyTransaction(state.tr.insertText('X', at)).state
    expect(foldedOf(plugin, state).has(start)).toBe(true)
  })

  it('drops a fold when the item loses its children', () => {
    const plugin = createFoldPlugin()
    const d = nestedDoc()
    const start = itemStart(d, 'A')
    let state = toggle(plugin, stateWith(plugin, d), start)
    // Delete A's nested list, leaving only its paragraph.
    const nested = state.doc.nodeAt(start)?.lastChild
    expect(nested?.type.name).toBe('bullet_list')
    const nestedFrom = start + 1 + (state.doc.nodeAt(start)?.firstChild?.nodeSize ?? 0)
    state = state.applyTransaction(
      state.tr.delete(nestedFrom, nestedFrom + (nested?.nodeSize ?? 0)),
    ).state
    expect(foldedOf(plugin, state).has(start)).toBe(false)
    expect(decorationsOf(plugin, state).find().map(classOf)).not.toContain(
      `${FOLD_ITEM_CLASS} ${FOLDED_CLASS}`,
    )
  })
})

describe('hiddenBoundary', () => {
  it('returns the visible end for a position inside a folded item, null otherwise', () => {
    const d = nestedDoc()
    const start = itemStart(d, 'A')
    const folded = new Set([start])
    const node = d.nodeAt(start) as ProseNode
    const first = node.firstChild as ProseNode
    const visibleEnd = start + 1 + first.nodeSize
    // A position inside the hidden nested list.
    const hidden = visibleEnd + 2
    expect(hiddenBoundary(d, folded, hidden)).toBe(visibleEnd)
    // The boundary itself is visible, and so is A's own text.
    expect(hiddenBoundary(d, folded, visibleEnd)).toBeNull()
    expect(hiddenBoundary(d, folded, start + 2)).toBeNull()
    // No folds, no hidden content.
    expect(hiddenBoundary(d, new Set(), hidden)).toBeNull()
  })
})

describe('the selection guard', () => {
  it('moves a selection that lands inside a folded item to its visible text', () => {
    const plugin = createFoldPlugin()
    const d = nestedDoc()
    const start = itemStart(d, 'A')
    let state = toggle(plugin, stateWith(plugin, d), start)
    const node = state.doc.nodeAt(start) as ProseNode
    const first = node.firstChild as ProseNode
    const visibleEnd = start + 1 + first.nodeSize
    const hidden = visibleEnd + 3 // inside A1's text, in A's hidden nested list
    state = state.applyTransaction(
      state.tr.setSelection(TextSelection.create(state.doc, hidden)),
    ).state
    // The caret lands at the end of the visible text, not on the boundary.
    expect(state.selection.from).toBe(visibleEnd - 1)
  })

  it('leaves a selection in visible text alone', () => {
    const plugin = createFoldPlugin()
    const d = nestedDoc()
    const start = itemStart(d, 'A')
    let state = toggle(plugin, stateWith(plugin, d), start)
    const at = start + 2
    state = state.applyTransaction(state.tr.setSelection(TextSelection.create(state.doc, at))).state
    expect(state.selection.from).toBe(at)
  })
})
