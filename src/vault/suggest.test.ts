import { describe, expect, it } from 'vitest'
import { buildTree, type FakeTreeNode } from './fakeHandle'
import { FileSystemVaultStorage } from './fs'
import { buildIndex, type Graph } from './index'
import {
  SUGGESTION_LIMIT,
  boardCandidates,
  candidateNames,
  fileCandidates,
  suggestBoards,
  suggestFiles,
  suggestPages,
  wordStarts,
  type FileCandidate,
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

/** A file pool the way `fileCandidates` builds it, for the ranker's own tests. */
const filePool = (...paths: string[]): FileCandidate[] =>
  paths.map((path) => {
    const name = path.slice(path.indexOf('/') + 1)
    const lower = name.toLowerCase()
    return {
      name,
      path,
      lower,
      starts: wordStarts(lower),
      image: /\.(png|jpe?g)$/.test(name),
    }
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

describe('fileCandidates', () => {
  it('offers every vault file that is not a page, ordered by path', async () => {
    const graph = await graphOf({
      assets: { 'q3-report.pdf': 'x', '2026': { 'shot.png': 'y' } },
      pages: { 'reading.md': 'x' },
      journals: { '2026-09-10.md': 'x' },
      notes: { 'draft.docx': 'x' },
    })
    expect(fileCandidates(graph).map((row) => row.name)).toEqual([
      '2026/shot.png',
      'q3-report.pdf',
      // A file outside `assets/` has no path inside it to be labelled by, so it
      // keeps its own path.
      'notes/draft.docx',
    ])
  })

  it('keeps pages, journals, and hidden files out of the pool', async () => {
    const graph = await graphOf({
      assets: { 'shot.png': 'x', '.hidden.png': 'y' },
      pages: { 'reading.md': 'x' },
      journals: { '2026-09-10.md': 'x' },
    })
    expect(fileCandidates(graph).map((row) => row.path)).toEqual(['assets/shot.png'])
  })

  it('marks the files an image destination may take', async () => {
    const graph = await graphOf({
      assets: { 'shot.png': 'x', 'q3-report.pdf': 'y', 'notes.txt': 'z' },
    })
    const byImage = Object.fromEntries(fileCandidates(graph).map((row) => [row.name, row.image]))
    expect(byImage).toEqual({ 'shot.png': true, 'q3-report.pdf': false, 'notes.txt': false })
  })

  it('carries the matcher columns, so a query costs no per-candidate work', async () => {
    const graph = await graphOf({ assets: { 'q3-report.pdf': 'x' } })
    const [row] = fileCandidates(graph)
    expect(row.lower).toBe('q3-report.pdf')
    expect(row.starts).toEqual([3])
  })
})

describe('suggestFiles', () => {
  it('ranks by prefix and word start, like the page picker', () => {
    const rows = suggestFiles('q3', filePool('assets/q3-report.pdf', 'assets/shot.png'), false)
    expect(rows.map((row) => row.name)).toEqual(['q3-report.pdf'])
    expect(rows[0].path).toBe('assets/q3-report.pdf')
    const word = suggestFiles('report', filePool('assets/q3-report.pdf'), false)
    expect(word[0].match).toEqual([3, 9])
  })

  it('matches case-insensitively and offers nothing for an empty query', () => {
    expect(suggestFiles('SHOT', filePool('assets/shot.png'), false)).toHaveLength(1)
    expect(suggestFiles('', filePool('assets/shot.png'), false)).toEqual([])
  })

  it('offers no file that cannot be an image when an image is being written', () => {
    const pool = filePool('assets/q3-report.pdf', 'assets/shot.png')
    expect(suggestFiles('q3', pool, true)).toEqual([])
    expect(suggestFiles('sh', pool, true).map((row) => row.name)).toEqual(['shot.png'])
  })

  it('caps the rows at the limit', () => {
    const many = filePool(...Array.from({ length: 12 }, (_, i) => `assets/scan-${i}.png`))
    expect(suggestFiles('scan', many, true)).toHaveLength(SUGGESTION_LIMIT)
  })
})

describe('board completion pool (add-whiteboards)', () => {
  it('offers one row per resolvable board name, built from the index', async () => {
    const graph = await graphOf({
      boards: { 'Migration.excalidraw': '{}', 'Migration topology.excalidraw': '{}' },
    })
    const rows = boardCandidates(graph)
    expect(rows.map((r) => r.name)).toEqual(['Migration topology', 'Migration'])
    expect(rows.map((r) => r.path)).toEqual([
      'boards/Migration topology.excalidraw',
      'boards/Migration.excalidraw',
    ])
  })

  it('ranks a board prefix above a word start', async () => {
    const graph = await graphOf({
      boards: { 'Migration.excalidraw': '{}', 'data migration.excalidraw': '{}' },
    })
    const pool = boardCandidates(graph)
    expect(suggestBoards('mig', pool).map((s) => s.name)).toEqual(['Migration', 'data migration'])
  })

  it('offers nothing for an empty query or no board', async () => {
    const graph = await graphOf({ boards: { 'Migration.excalidraw': '{}' } })
    const pool = boardCandidates(graph)
    expect(suggestBoards('', pool)).toEqual([])
    expect(suggestBoards('zzz', pool)).toEqual([])
  })
})
