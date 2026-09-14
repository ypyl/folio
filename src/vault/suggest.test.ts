import { describe, expect, it } from 'vitest'
import { buildTree, type FakeTreeNode } from './fakeHandle'
import { FileSystemVaultStorage } from './fs'
import { buildIndex, type Graph } from './index'
import {
  SUGGESTION_LIMIT,
  candidateNames,
  suggestPages,
  wordStarts,
  type PageCandidate,
} from './suggest'

async function graphOf(tree: FakeTreeNode): Promise<Graph> {
  const storage = new FileSystemVaultStorage(
    buildTree(tree) as unknown as FileSystemDirectoryHandle,
  )
  return (await buildIndex(storage)).graph
}

const pool = (...names: string[]): PageCandidate[] =>
  names.map((name) => {
    const lower = name.toLowerCase()
    return { name, path: `pages/${name}.md`, lower, starts: wordStarts(lower) }
  })

describe('candidateNames', () => {
  it('offers one row per resolvable name, in the app page order', async () => {
    const graph = await graphOf({
      pages: { 'reading.md': '#reading', 'reading list.md': 'x' },
      journals: { '2026-09-10.md': 'today' },
    })
    const rows = candidateNames(graph, [])
    expect(rows.map((row) => row.name).sort()).toEqual(['2026-09-10', 'reading', 'reading list'])
  })

  // The pool is the resolution map, so every row must resolve where it says it
  // does: a picker row that resolves elsewhere would insert the wrong link.
  it('offers only names the index resolves to the row path', async () => {
    const graph = await graphOf({ pages: { a: { 'reading.md': 'x' }, 'reading list.md': 'y' } })
    for (const row of candidateNames(graph, [])) {
      expect(graph.byName.get(row.lower)).toBe(row.path)
    }
  })

  it('yields one row for a case collision, matching the index resolution', async () => {
    const graph = await graphOf({ pages: { 'Reading.md': 'x', 'reading.md': 'y' } })
    const rows = candidateNames(graph, [])
    expect(rows).toHaveLength(1)
    expect(rows[0].path).toBe(graph.byName.get('reading'))
  })

  it('includes journal days with no special case', async () => {
    const graph = await graphOf({ journals: { '2026-09-10.md': '' } })
    expect(candidateNames(graph, [])).toEqual([
      {
        name: '2026-09-10',
        path: 'journals/2026-09-10.md',
        lower: '2026-09-10',
        starts: [5, 8],
      },
    ])
  })

  it('drops names that no reference token can express', async () => {
    const graph = await graphOf({ pages: { 'weird]name.md': 'x', 'fine.md': 'y' } })
    expect(candidateNames(graph, []).map((row) => row.name)).toEqual(['fine'])
  })

  it('leads with pinned pages', async () => {
    const graph = await graphOf({ pages: { 'a.md': 'x', 'b.md': 'y' } })
    const rows = candidateNames(graph, ['pages/b.md'])
    expect(rows.map((row) => row.name)).toEqual(['b', 'a'])
  })
})

describe('suggestPages', () => {
  it('returns nothing for an empty query', () => {
    expect(suggestPages('', pool('reading'))).toEqual([])
  })

  it('ranks a name prefix above a word-start match', () => {
    const rows = suggestPages('read', pool('re-read notes', 'reading'))
    expect(rows.map((row) => row.name)).toEqual(['reading', 're-read notes'])
  })

  it('keeps the pool order inside a tier', () => {
    const rows = suggestPages('read', pool('reading', 'reading list', 'reader'))
    expect(rows.map((row) => row.name)).toEqual(['reading', 'reading list', 'reader'])
  })

  it('matches a word inside a name', () => {
    expect(suggestPages('list', pool('reading list'))).toEqual([
      { name: 'reading list', path: 'pages/reading list.md', match: [8, 12] },
    ])
  })

  it('matches the hyphen boundary in a journal date', () => {
    expect(suggestPages('09', pool('2026-09-10'))).toEqual([
      { name: '2026-09-10', path: 'pages/2026-09-10.md', match: [5, 7] },
    ])
  })

  it('matches case-insensitively and returns the on-disk name', () => {
    expect(suggestPages('read', pool('Reading')).map((row) => row.name)).toEqual(['Reading'])
  })

  it('never matches a fragment inside a word', () => {
    expect(suggestPages('eading', pool('reading'))).toEqual([])
    expect(suggestPages('ist', pool('reading list'))).toEqual([])
  })

  it('reports the matched span of a prefix', () => {
    expect(suggestPages('read', pool('reading'))[0].match).toEqual([0, 4])
  })

  it('caps a tier at the limit without letting tier 0 be displaced', () => {
    const many = pool(...Array.from({ length: 12 }, (_, i) => `page ${i}`))
    const rows = suggestPages('page', many)
    expect(rows).toHaveLength(SUGGESTION_LIMIT)
    expect(rows.map((row) => row.name)).toEqual(
      Array.from({ length: SUGGESTION_LIMIT }, (_, i) => `page ${i}`),
    )
    // A tier-1 match never displaces a tier-0 one, even past the limit.
    const mixed = suggestPages('page', [...many, ...pool('my page')])
    expect(mixed.every((row) => row.match[0] === 0)).toBe(true)
  })
})
