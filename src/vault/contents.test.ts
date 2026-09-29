import { describe, expect, it } from 'vitest'
import { deriveContents } from './contents'

describe('deriveContents (add-page-contents)', () => {
  it('lists headings in document order with level and block', () => {
    const md = '# Alpha\n\nIntro\n\n## Beta\n\n### Gamma\n'
    expect(deriveContents(md)).toEqual([
      { level: 1, text: 'Alpha', block: 0 },
      { level: 2, text: 'Beta', block: 2 },
      { level: 3, text: 'Gamma', block: 3 },
    ])
  })

  it('agrees with the editor on the top-level block index', () => {
    const md = '# A\n\npara\n\n- one\n- two\n\n```\ncode\n```\n\n## B\n'
    const entries = deriveContents(md)
    // `# A` is block 0; `## B` follows the paragraph, the list, and the fence.
    expect(entries[0].block).toBe(0)
    expect(entries[1].block).toBe(4)
  })

  it('ignores a # inside a fenced code block', () => {
    const md = 'text\n\n```\n# not a heading\n```\n\n## Real\n'
    expect(deriveContents(md)).toEqual([{ level: 2, text: 'Real', block: 2 }])
  })

  it('ignores a # on a continuation line', () => {
    // The second line follows a non-blank line, so it is not a block start.
    const md = 'a wrapped paragraph\n# not a heading\n'
    expect(deriveContents(md)).toEqual([])
  })

  it('treats #tag and a seven-hash run as non-headings', () => {
    expect(deriveContents('#tag\n\n#######\n')).toEqual([])
  })

  it('reduces inline formatting to plain text', () => {
    const md = '## **Bold** and `code` and [Link](https://x)\n'
    expect(deriveContents(md)).toEqual([{ level: 2, text: 'Bold and code and Link', block: 0 }])
  })

  it('returns nothing for a page with no headings', () => {
    expect(deriveContents('just prose\n\n- a list\n')).toEqual([])
  })

  it('strips ATX closing hashes', () => {
    expect(deriveContents('## Beta ##\n')).toEqual([{ level: 2, text: 'Beta', block: 0 }])
  })
})
