// The on-demand JSON formatter (format-json-code-block). The command is a
// ProseMirror command over the code block node, so it is tested against a
// minimal schema that has a `code_block` with a language attribute — the same
// shape the real editor's commonmark preset provides.

import { Schema } from '@milkdown/prose/model'
import { EditorState, TextSelection } from '@milkdown/prose/state'
import { describe, expect, it } from 'vitest'
import { formatJsonBlock, formatJsonText } from './codeFormat'

const schema = new Schema({
  nodes: {
    doc: { content: 'block+' },
    paragraph: { group: 'block', content: 'inline*' },
    code_block: {
      group: 'block',
      content: 'text*',
      marks: '',
      code: true,
      attrs: { language: { default: '' } },
    },
    text: { group: 'inline' },
  },
})

/** A document holding one code block with `language`, caret inside it. */
function stateWith(text: string, language?: string): EditorState {
  const code = schema.nodes.code_block.create(
    language === undefined ? null : { language },
    schema.text(text),
  )
  const doc = schema.nodes.doc.create(null, [code])
  return EditorState.create({ schema, doc, selection: TextSelection.near(doc.resolve(1)) })
}

/** Apply the command and report whether it ran, plus the resulting block. */
function run(state: EditorState) {
  let next = state
  const handled = formatJsonBlock(state, (tr) => {
    next = state.apply(tr)
  })
  const block = next.doc.firstChild
  return {
    handled,
    text: block?.textContent ?? null,
    language: block?.attrs.language ?? null,
    caret: next.selection.from,
  }
}

describe('formatJsonText', () => {
  it('reindents minified JSON with a two-space indent', () => {
    expect(formatJsonText('{"a":1,"b":[2,3]}')).toBe(
      '{\n  "a": 1,\n  "b": [\n    2,\n    3\n  ]\n}',
    )
  })

  it('preserves key order and every value kind', () => {
    const text = '{"z":1,"a":"two","m":true,"n":null,"o":{"k":1},"l":[1,2]}'
    const formatted = formatJsonText(text)
    expect(formatted).not.toBeNull()
    expect(JSON.parse(formatted as string)).toEqual(JSON.parse(text))
    expect((formatted as string).indexOf('"z"')).toBeLessThan((formatted as string).indexOf('"a"'))
  })

  it('returns null for text already in that form', () => {
    const once = formatJsonText('{"a":1}')
    expect(once).not.toBeNull()
    expect(formatJsonText(once as string)).toBeNull()
  })

  it('returns null for text that is not valid JSON', () => {
    expect(formatJsonText('{a: 1}')).toBeNull()
    expect(formatJsonText('')).toBeNull()
    expect(formatJsonText('not json')).toBeNull()
  })
})

describe('formatJsonBlock', () => {
  it('reindents a JSON block, keeps its language, and puts the caret at the start', () => {
    expect(run(stateWith('{"a":1,"b":2}', 'json'))).toEqual({
      handled: true,
      text: '{\n  "a": 1,\n  "b": 2\n}',
      language: 'json',
      caret: 1,
    })
  })

  it('accepts a fence that spells the language in another case', () => {
    const result = run(stateWith('{"a":1}', 'JSON'))
    expect(result.handled).toBe(true)
    expect(result.text).toBe('{\n  "a": 1\n}')
    expect(result.language).toBe('JSON')
  })

  it('declines a block whose language is not JSON', () => {
    expect(run(stateWith('{"a":1}', 'js'))).toEqual({
      handled: false,
      text: '{"a":1}',
      language: 'js',
      caret: 1,
    })
  })

  it('declines a block with no language', () => {
    expect(run(stateWith('{"a":1}')).handled).toBe(false)
    expect(run(stateWith('{"a":1}')).text).toBe('{"a":1}')
  })

  it('declines text that is not valid JSON', () => {
    expect(run(stateWith('{a:1}', 'json')).handled).toBe(false)
    expect(run(stateWith('{a:1}', 'json')).text).toBe('{a:1}')
  })

  it('declines already-formatted text and records no edit', () => {
    expect(run(stateWith('{\n  "a": 1\n}', 'json')).handled).toBe(false)
    expect(run(stateWith('{\n  "a": 1\n}', 'json')).text).toBe('{\n  "a": 1\n}')
  })

  it('declines when the caret is not in a code block', () => {
    const paragraph = schema.nodes.paragraph.create(null, schema.text('{"a":1}'))
    const doc = schema.nodes.doc.create(null, [paragraph])
    const state = EditorState.create({ schema, doc, selection: TextSelection.near(doc.resolve(1)) })
    expect(formatJsonBlock(state, () => {})).toBe(false)
  })
})
