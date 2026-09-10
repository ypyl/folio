// Reference completion (add-reference-autocomplete): the trigger and state
// derivation, the keys the popup claims, and the popup element itself. The
// state and key tests run against a tiny hand-built schema with a fake view;
// the DOM tests mount a real ProseMirror view, because that is what creates the
// popup element.

import { afterEach, describe, expect, it } from 'vitest'
import type { Node as ProseNode } from '@milkdown/prose/model'
import { Schema } from '@milkdown/prose/model'
import type { EditorState } from '@milkdown/prose/state'
import { EditorState as EditorStateClass, TextSelection } from '@milkdown/prose/state'
import type { EditorView } from '@milkdown/prose/view'
import { EditorView as EditorViewClass } from '@milkdown/prose/view'
import type { Suggestion } from '../vault/suggest'
import {
  createReferenceSuggestPlugin,
  popupVisible,
  suggestionKey,
  suggestionKeyDown,
  triggerAt,
  type SuggestionState,
} from './referenceSuggest'

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

/** A one-paragraph document with the caret `caret` characters into its text. */
const paraAt = (content: string, caret: number) => {
  const d = doc(para(text(content)))
  return { doc: d, pos: 1 + caret }
}

const row = (name: string): Suggestion => ({ name, path: `${name}.md`, match: [0, name.length] })

/** A provider that records the queries it is asked, and returns `rows`. */
const recorder = (rows: Suggestion[]) => {
  const queries: string[] = []
  return {
    queries,
    suggest: (query: string) => {
      queries.push(query)
      return rows
    },
  }
}

const stateOf = (d: ProseNode, pos: number, suggest: (q: string) => Suggestion[]) =>
  EditorStateClass.create({
    schema,
    doc: d,
    selection: TextSelection.create(d, pos),
    plugins: [createReferenceSuggestPlugin({ suggest })],
  })

const statePart = (state: EditorState): SuggestionState => suggestionKey.getState(state)!

/** The plugin with a fake view: enough surface for the key handler to dispatch. */
const keyHarness = (d: ProseNode, pos: number, suggest: (q: string) => Suggestion[]) => {
  let state = stateOf(d, pos, suggest)
  const view = {
    get state() {
      return state
    },
    composing: false,
    dispatch: (tr: Parameters<EditorState['apply']>[0]) => {
      state = state.apply(tr)
    },
  } as unknown as EditorView
  // `part` is a function, not a getter: fixtures spread this object, and a
  // spread would freeze a getter's value at build time.
  return { view, part: () => statePart(state) }
}

const keyEvent = (key: string, init: KeyboardEventInit = {}) =>
  new KeyboardEvent('keydown', { key, cancelable: true, bubbles: true, ...init })

afterEach(() => {
  document.body.replaceChildren()
})

describe('reference completion state', () => {
  it('derives the trigger and asks the source for the typed query', () => {
    const { doc: d, pos } = paraAt('See #re', 7)
    const source = recorder([row('reading'), row('reading list')])
    const part = statePart(stateOf(d, pos, source.suggest))
    expect(part.trigger).toMatchObject({ kind: 'word', text: '#re', query: 're' })
    expect(part.suggestions.map((s) => s.name)).toEqual(['reading', 'reading list'])
    expect(part.active).toBe(0)
    expect(source.queries).toEqual(['re'])
    expect(popupVisible(part)).toBe(true)
  })

  it('clears the trigger when the caret leaves the token end', () => {
    const { doc: d, pos } = paraAt('See #re', 7)
    const source = recorder([row('reading')])
    const state = stateOf(d, pos, source.suggest)
    const moved = state.apply(state.tr.setSelection(TextSelection.create(d, 6)))
    expect(statePart(state).trigger).not.toBeNull()
    expect(statePart(moved).trigger).toBeNull()
    expect(popupVisible(statePart(moved))).toBe(false)
  })

  it('hands back the same state object when nothing relevant changed', () => {
    const { doc: d, pos } = paraAt('See #re', 7)
    const source = recorder([row('reading')])
    const state = stateOf(d, pos, source.suggest)
    const untouched = state.apply(state.tr.setMeta('unrelated', true))
    expect(statePart(untouched)).toBe(statePart(state))
    // ...so no second query reaches the source and no DOM work is triggered.
    expect(source.queries).toEqual(['re'])
  })

  it('never completes inside fenced code, inline code, or a selection', () => {
    const code = doc(fenced('#re'))
    expect(triggerAt(EditorStateClass.create({ schema, doc: code }))).toBeNull()
    expect(statePart(stateOf(code, 4, recorder([]).suggest)).trigger).toBeNull()

    const marked = doc(para(inlineCode('#re')))
    expect(statePart(stateOf(marked, 4, recorder([]).suggest)).trigger).toBeNull()

    const { doc: d } = paraAt('See #re', 7)
    const range = EditorStateClass.create({
      schema,
      doc: d,
      selection: TextSelection.create(d, 1, 7),
      plugins: [createReferenceSuggestPlugin({ suggest: () => [] })],
    })
    expect(statePart(range).trigger).toBeNull()
  })

  it('keeps the popup closed for a dismissed token until its text changes', () => {
    const { doc: d, pos } = paraAt('See #re', 7)
    const source = recorder([row('reading')])
    const state = stateOf(d, pos, source.suggest)
    const dismissed = state.apply(state.tr.setMeta(suggestionKey, { suppress: '#re' }))
    expect(popupVisible(statePart(dismissed))).toBe(false)
    // The same text stays dismissed, whatever else changes...
    const elsewhere = dismissed.apply(dismissed.tr.insertText('!', 1))
    expect(popupVisible(statePart(elsewhere))).toBe(false)
    // ...and one more character re-enables it.
    const typed = elsewhere.apply(elsewhere.tr.insertText('a'))
    expect(popupVisible(statePart(typed))).toBe(true)
  })

  it('resets the active row when the typed text changes', () => {
    const { doc: d, pos } = paraAt('See #re', 7)
    const source = recorder([row('reading'), row('reading list'), row('re-read')])
    const state = stateOf(d, pos, source.suggest)
    const stepped = state.apply(state.tr.setMeta(suggestionKey, { move: 1 }))
    expect(statePart(stepped).active).toBe(1)
    const typed = stepped.apply(stepped.tr.insertText('a'))
    expect(statePart(typed).active).toBe(0)
  })

  it('clamps the active row when the candidate list shrinks', () => {
    const { doc: d, pos } = paraAt('#re', 3)
    let rows = [row('reading'), row('reading list'), row('re-read')]
    const state = stateOf(d, pos, () => rows)
    const stepped = state.apply(state.tr.setMeta(suggestionKey, { move: 1 }))
    expect(statePart(stepped).active).toBe(1)
    // A change elsewhere keeps the token text, but the source now has one row.
    rows = [row('reading')]
    const shrunk = stepped.apply(stepped.tr.insertText('x', 1))
    expect(statePart(shrunk).active).toBe(0)
  })
})

describe('completion keys', () => {
  const setup = (rows = [row('reading'), row('reading list'), row('re-read')]) => {
    const { doc: d, pos } = paraAt('See #re', 7)
    const source = recorder(rows)
    return { ...keyHarness(d, pos, source.suggest), source }
  }

  it('moves the active row with the arrow keys, wrapping', () => {
    const h = setup()
    expect(suggestionKeyDown(h.view, keyEvent('ArrowDown'))).toBe(true)
    expect(h.part().active).toBe(1)
    expect(suggestionKeyDown(h.view, keyEvent('ArrowDown'))).toBe(true)
    expect(h.part().active).toBe(2)
    expect(suggestionKeyDown(h.view, keyEvent('ArrowDown'))).toBe(true)
    expect(h.part().active).toBe(0)
    expect(suggestionKeyDown(h.view, keyEvent('ArrowUp'))).toBe(true)
    expect(h.part().active).toBe(2)
  })

  it('accepts the active row with Enter, in one transaction that suppresses it', () => {
    const h = setup()
    const event = keyEvent('Enter')
    expect(suggestionKeyDown(h.view, event)).toBe(true)
    expect(event.defaultPrevented).toBe(true)
    expect(h.view.state.doc.textContent).toBe('See #reading')
    expect(h.view.state.selection.from).toBe(13)
    expect(popupVisible(h.part())).toBe(false)
  })

  it('accepts with Tab and claims it, so focus stays in the editor', () => {
    const h = setup()
    const event = keyEvent('Tab')
    expect(suggestionKeyDown(h.view, event)).toBe(true)
    expect(event.defaultPrevented).toBe(true)
    expect(h.view.state.doc.textContent).toBe('See #reading')
  })

  it('keeps the trigger form when brackets were typed', () => {
    const { doc: d, pos } = paraAt('See #[[read', 11)
    const h = keyHarness(d, pos, recorder([row('reading list')]).suggest)
    expect(suggestionKeyDown(h.view, keyEvent('Enter'))).toBe(true)
    expect(h.view.state.doc.textContent).toBe('See #[[reading list]]')
  })

  it('dismisses with Escape without changing the text', () => {
    const h = setup()
    const event = keyEvent('Escape')
    expect(suggestionKeyDown(h.view, event)).toBe(true)
    expect(event.defaultPrevented).toBe(true)
    expect(h.view.state.doc.textContent).toBe('See #re')
    expect(popupVisible(h.part())).toBe(false)
  })

  it('leaves modified keys to the editor', () => {
    const h = setup()
    for (const event of [
      keyEvent('Enter', { metaKey: true }),
      keyEvent('Enter', { ctrlKey: true }),
      keyEvent('ArrowDown', { altKey: true }),
      keyEvent('Tab', { shiftKey: true }),
    ]) {
      expect(suggestionKeyDown(h.view, event)).toBe(false)
      expect(event.defaultPrevented).toBe(false)
    }
    // Shift-Tab in particular must still outdent rather than accept.
    expect(h.view.state.doc.textContent).toBe('See #re')
  })

  it('leaves keys it does not own alone', () => {
    const h = setup()
    const left = keyEvent('ArrowLeft')
    expect(suggestionKeyDown(h.view, left)).toBe(false)
    expect(left.defaultPrevented).toBe(false)
    const backspace = keyEvent('Backspace')
    expect(suggestionKeyDown(h.view, backspace)).toBe(false)
    expect(backspace.defaultPrevented).toBe(false)
  })

  it('claims nothing when the popup is not visible', () => {
    const { doc: d, pos } = paraAt('See #re', 7)
    const h = keyHarness(d, pos, () => [])
    const enter = keyEvent('Enter')
    expect(suggestionKeyDown(h.view, enter)).toBe(false)
    expect(enter.defaultPrevented).toBe(false)
  })

  it('claims nothing while composing', () => {
    const h = setup()
    const composing = keyEvent('Enter', { isComposing: true })
    expect(suggestionKeyDown(h.view, composing)).toBe(false)
    expect(composing.defaultPrevented).toBe(false)
  })

  it('claims nothing inside the code block surface', () => {
    const h = setup()
    const cm = document.createElement('div')
    cm.className = 'cm-editor'
    const inner = document.createElement('span')
    cm.appendChild(inner)
    const event = keyEvent('Enter')
    inner.dispatchEvent(event)
    expect(suggestionKeyDown(h.view, event)).toBe(false)
    expect(event.defaultPrevented).toBe(false)
  })
})

describe('completion popup element', () => {
  const mount = (
    d: ProseNode,
    pos: number,
    suggest: (q: string) => Suggestion[],
    measure = true,
  ) => {
    const place = document.createElement('div')
    document.body.appendChild(place)
    const view = new EditorViewClass(place, {
      state: EditorStateClass.create({
        schema,
        doc: d,
        selection: TextSelection.create(d, pos),
        plugins: [createReferenceSuggestPlugin({ suggest })],
      }),
    })
    // No layout in jsdom, so the caret measurement is stubbed. The unstubbed
    // failure path has its own test below.
    if (measure) view.coordsAtPos = () => ({ left: 10, right: 11, top: 20, bottom: 30 })
    // jsdom cannot focus a contenteditable, so the popup's focus listener is
    // driven the way the browser would drive it.
    view.dom.dispatchEvent(new FocusEvent('focus'))
    return { view, place }
  }
  const popupOf = (place: HTMLElement) => place.querySelector('[role="listbox"]') as HTMLElement
  const rowsOf = (place: HTMLElement) => [...place.querySelectorAll('[role="option"]')]

  it('renders rows beside the editable root, with the match highlighted', () => {
    const { doc: d, pos } = paraAt('See #rea', 8)
    const suggest = (): Suggestion[] => [
      { name: 'reading', path: 'reading.md', match: [0, 4] },
      { name: 'reading list', path: 'reading list.md', match: [0, 4] },
    ]
    const { place } = mount(d, pos, suggest)
    const popup = popupOf(place)
    expect(popup).not.toBeNull()
    expect(popup.parentElement).toBe(place)
    expect(popup.hidden).toBe(false)
    expect(rowsOf(place).map((el) => el.textContent)).toEqual(['reading', 'reading list'])
    expect(rowsOf(place).map((el) => el.getAttribute('aria-selected'))).toEqual(['true', 'false'])
    expect(rowsOf(place)[0].querySelector('mark')?.textContent).toBe('read')
    expect(rowsOf(place)[0].className).toContain('active')
  })

  it('follows the active row and highlights a word-start match', () => {
    const { doc: d, pos } = paraAt('#[[list', 7)
    const suggest = (): Suggestion[] => [
      { name: 'reading list', path: 'reading list.md', match: [8, 12] },
    ]
    const { view, place } = mount(d, pos, suggest)
    expect(rowsOf(place)[0].textContent).toBe('reading list')
    expect(rowsOf(place)[0].querySelector('mark')?.textContent).toBe('list')
    view.dispatch(view.state.tr.setMeta(suggestionKey, { move: 1 }))
    expect(rowsOf(place)[0].getAttribute('aria-selected')).toBe('true')
  })

  it('hides on blur, comes back on focus, and goes away with the editor', () => {
    const { doc: d, pos } = paraAt('See #re', 7)
    const { view, place } = mount(d, pos, recorder([row('reading')]).suggest)
    expect(popupOf(place).hidden).toBe(false)
    view.dom.dispatchEvent(new FocusEvent('blur'))
    expect(popupOf(place).hidden).toBe(true)
    view.dom.dispatchEvent(new FocusEvent('focus'))
    expect(popupOf(place).hidden).toBe(false)
    // Repositioning on scroll and resize must not hide a visible popup.
    window.dispatchEvent(new Event('scroll'))
    window.dispatchEvent(new Event('resize'))
    expect(popupOf(place).hidden).toBe(false)
    view.destroy()
    expect(popupOf(place)).toBeNull()
  })

  it('accepts a row on mousedown without stealing focus', () => {
    const { doc: d, pos } = paraAt('See #re', 7)
    const rows = [row('reading'), row('reading list')]
    const { view, place } = mount(d, pos, () => rows)
    const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true })
    rowsOf(place)[1].dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(view.state.doc.textContent).toBe('See #[[reading list]]')
    expect(popupOf(place).hidden).toBe(true)
  })

  it('hides when there is nothing to offer', () => {
    const { doc: d, pos } = paraAt('See #zz', 7)
    const { place } = mount(d, pos, () => [])
    expect(popupOf(place).hidden).toBe(true)
  })

  // The popup is decoration on the typing path: a caret that cannot be measured
  // (no layout, as in jsdom) must hide it rather than throw where the user is
  // typing. This is the only test that leaves `coordsAtPos` as the environment
  // provides it.
  it('hides instead of throwing when the caret cannot be measured', () => {
    const { doc: d, pos } = paraAt('See #re', 7)
    const { view, place } = mount(d, pos, recorder([row('reading')]).suggest, false)
    expect(() => view.dispatch(view.state.tr.setMeta(suggestionKey, { move: 1 }))).not.toThrow()
    expect(popupOf(place).hidden).toBe(true)
  })
})
