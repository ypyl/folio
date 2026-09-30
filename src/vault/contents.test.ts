import { describe, expect, it } from 'vitest'
import { buildContentTree, deriveContents } from './contents'

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

describe('buildContentTree (add-contents-tree)', () => {
  const entry = (level: number, text: string, block: number) => ({ level, text, block })

  it('nests deeper headings under the nearest shallower one', () => {
    const tree = buildContentTree([
      entry(1, 'Alpha', 0),
      entry(2, 'Beta', 2),
      entry(3, 'Gamma', 3),
      entry(1, 'Delta', 5),
    ])
    expect(tree.map((n) => n.text)).toEqual(['Alpha', 'Delta'])
    expect(tree[0].children.map((n) => n.text)).toEqual(['Beta'])
    expect(tree[0].children[0].children.map((n) => n.text)).toEqual(['Gamma'])
    expect(tree[1].children).toEqual([])
  })

  it('closes a run when a sibling at the same level arrives', () => {
    const tree = buildContentTree([entry(1, 'Alpha', 0), entry(2, 'Beta', 1), entry(2, 'Gamma', 2)])
    expect(tree[0].children.map((n) => n.text)).toEqual(['Beta', 'Gamma'])
  })

  it('nests a skipped level under the shallower heading', () => {
    const tree = buildContentTree([entry(1, 'Alpha', 0), entry(3, 'Deep', 1)])
    expect(tree[0].children.map((n) => n.text)).toEqual(['Deep'])
  })

  it('makes headings with no shallower predecessor roots', () => {
    const tree = buildContentTree([entry(2, 'Beta', 0), entry(1, 'Alpha', 1)])
    expect(tree.map((n) => n.text)).toEqual(['Beta', 'Alpha'])
  })

  it('returns a single root for a lone heading', () => {
    const tree = buildContentTree([entry(2, 'Only', 4)])
    expect(tree).toEqual([{ level: 2, text: 'Only', block: 4, children: [] }])
  })

  it('returns nothing for no headings', () => {
    expect(buildContentTree([])).toEqual([])
  })
})
