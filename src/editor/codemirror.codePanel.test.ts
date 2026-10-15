import { EditorState } from '@codemirror/state'
import { describe, expect, it } from 'vitest'
import { codePanelLines } from './codemirror'

const doc = (text: string) => EditorState.create({ doc: text }).doc

describe("a code block's panel lines", () => {
  it('spans every line, with the padded, rounded roles on the ends', () => {
    // '```js\nconst a = 1\n```\n': opening 1, code 2, closing 3.
    const lines = codePanelLines(doc('```js\nconst a = 1\n```\n'), 0, 20, 1, 4)
    expect(lines.map((line) => line.number)).toEqual([1, 2, 3])
    expect(lines.every((line) => line.classes.includes('folio-cm-code'))).toBe(true)
    expect(lines[0].classes).toContain('folio-cm-code-first')
    expect(lines[1].classes).not.toContain('folio-cm-code-first')
    expect(lines[1].classes).not.toContain('folio-cm-code-last')
    expect(lines[2].classes).toContain('folio-cm-code-last')
  })

  it('does not mislabel a scrolled-in line as the block first', () => {
    // The opening line (1) is above the viewport, which starts at line 2.
    const lines = codePanelLines(doc('```js\ncode\nmore\n```\n'), 0, 18, 2, 4)
    expect(lines.map((line) => line.number)).toEqual([2, 3, 4])
    expect(lines.some((line) => line.classes.includes('folio-cm-code-first'))).toBe(false)
    expect(lines[lines.length - 1].classes).toContain('folio-cm-code-last')
  })

  it('decorates nothing when the block is entirely out of view', () => {
    expect(codePanelLines(doc('```js\ncode\n```\n'), 0, 14, 5, 9)).toEqual([])
  })
})
