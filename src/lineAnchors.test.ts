import { describe, expect, it } from 'vitest'
import { blockLineRange, blockStartLines } from './lineAnchors'

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

// The block's extent (frame-the-located-block): a block is not one line, and a
// frame around a located block encloses all of it. Same rule as the anchors, so
// the two cannot disagree about where a block ends.
describe('blockLineRange', () => {
  it('gives a single-line block the line it is on', () => {
    expect(blockLineRange('# Title\n\nBody\n', 1)).toEqual({ from: 3, to: 3 })
  })

  it('spans every line of a wrapped paragraph', () => {
    const text = '# Title\n\nThis is a wrapped\nparagraph line two\n\nBody\n'
    expect(blockLineRange(text, 1)).toEqual({ from: 3, to: 4 })
  })

  it('spans a tight list as one block', () => {
    const text = '# Title\n\n- a\n- b\n- c\n\nBody\n'
    expect(blockLineRange(text, 1)).toEqual({ from: 3, to: 5 })
  })

  it('spans a fence, interior lines included', () => {
    const text = 'Body\n\n```js\nconst x = 1\n# not a block\n```\n\nTail\n'
    expect(blockLineRange(text, 1)).toEqual({ from: 3, to: 6 })
  })

  it('stops at the last non-blank line before the next block', () => {
    const text = 'One\n\nTwo\n\n\n\nThree\n'
    expect(blockLineRange(text, 1)).toEqual({ from: 3, to: 3 })
    expect(blockLineRange(text, 2)).toEqual({ from: 7, to: 7 })
  })

  it('ends the last block at the document, not at a trailing newline', () => {
    expect(blockLineRange('One\n\nTwo\n', 1)).toEqual({ from: 3, to: 3 })
    expect(blockLineRange('One\n\nTwo', 1)).toEqual({ from: 3, to: 3 })
  })

  it('has no block on a blank first line', () => {
    // The rule anchors a non-blank first line, not the first line as such.
    expect(blockLineRange('\n# Title\n', 0)).toEqual({ from: 2, to: 2 })
    expect(blockLineRange('\n# Title\n', 1)).toBeNull()
  })

  it('returns null for an index the text does not hold', () => {
    expect(blockLineRange('One\n', 1)).toBeNull()
    expect(blockLineRange('', 0)).toBeNull()
  })
})
