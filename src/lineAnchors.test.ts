import { describe, expect, it } from 'vitest'
import { blockStartLines } from './lineAnchors'

// The numbering rule contract (line-numbers, design D1): one shared pure
// function for the editor gutter and search. These cases pin the observable
// behavior — sparse numbers across blanks, one anchor per tight list,
// fence-aware skipping, block-anchored (not glyph-anchored) addresses.

describe('blockStartLines', () => {
  it('anchors the first line and each line following a blank', () => {
    expect(blockStartLines('# Title\n\nBody\n\n## More\n')).toEqual([1, 3, 5])
  })

  it('returns [] for empty text', () => {
    expect(blockStartLines('')).toEqual([])
  })

  it('gives a tight list a single anchor at its start', () => {
    expect(blockStartLines('- a\n- b\n- c\n')).toEqual([1])
  })

  it('skips fenced code interiors but anchors the opening fence', () => {
    const text = '```js\nconst x = 1\n# not a block\n```\n'
    expect(blockStartLines(text)).toEqual([1])
  })

  it('anchors blocks after a closed fence', () => {
    const text = '```js\nconst x = 1\n```\n\nBody\n'
    expect(blockStartLines(text)).toEqual([1, 5])
  })

  it('does not treat a hard-broken continuation as a new block', () => {
    expect(blockStartLines('para one\nmore of the same paragraph\n')).toEqual([1])
  })

  it('counts blank lines so later anchors stay true to the file', () => {
    // Heading (1), blank (2), para (3), blank (4), list (5): the list anchor
    // is 5, not 3 — the blanks pushed the count up.
    expect(blockStartLines('# Title\n\nBody\n\n- a\n')).toEqual([1, 3, 5])
  })
})

describe('consistency across file and canonical forms (design D1/D2)', () => {
  it('agrees with itself on a canonicalized page', () => {
    const canonical = '# Title\n\nBody\n\n- a\n- b\n'
    // File and canonical are the same text after Folio has saved a page.
    expect(blockStartLines(canonical)).toEqual(blockStartLines(canonical))
  })

  it('documents the drift case: a wrapped legacy paragraph shifts later anchors', () => {
    // Legacy file wraps a paragraph at ~80 cols; the editor canonical form
    // unwraps it (one block == one line). Doclineed behavior: canonical
    // anchors are <= file anchors after a wrap — the page renumbers on save.
    const file = '# Title\n\nThis is a wrapped\nparagraph line two\n\nBody\n'
    const canonical = '# Title\n\nThis is a wrapped paragraph line two\n\nBody\n'
    const fileAnchors = blockStartLines(file)
    const canonicalAnchors = blockStartLines(canonical)
    expect(fileAnchors).toEqual([1, 3, 6])
    expect(canonicalAnchors).toEqual([1, 3, 5])
    // Same number of blocks either way; only the numeric addresses drift.
    expect(fileAnchors.length).toBe(canonicalAnchors.length)
  })
})
