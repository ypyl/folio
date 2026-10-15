import { describe, expect, it } from 'vitest'
import Fuse from 'fuse.js'
import {
  FUSE_OPTIONS,
  PER_GROUP,
  assetSearchDoc,
  boardSearchDoc,
  exactRanges,
  matchBlocks,
  parseQuery,
  searchDocs,
  sectionsOf,
  snippetSegments,
  topPerGroup,
  wordRanges,
  type SearchDoc,
  type SearchOperator,
  type SearchRange,
} from './core'

function doc(
  path: string,
  title: string,
  text: string,
  kind: 'page' | 'journal' = 'page',
): SearchDoc {
  return { path, title, kind, text }
}

function fuse(docs: SearchDoc[]) {
  return new Fuse(docs, FUSE_OPTIONS)
}

describe('wordRanges', () => {
  it('matches whole words only, case-insensitively', () => {
    expect(wordRanges('UX design, ux again', 'ux')).toEqual([
      [0, 2],
      [11, 13],
    ])
    expect(wordRanges('Linux', 'ux')).toEqual([])
  })

  it('treats punctuation as a boundary, so C# and CI/CD match', () => {
    expect(wordRanges('I use C# daily', 'C#')).toEqual([[6, 8]])
    expect(wordRanges('CI/CD pipeline', 'CI/CD')).toEqual([[0, 5]])
  })
})

describe('exactRanges', () => {
  it('finds case-insensitive exact occurrences as [start, end) ranges', () => {
    expect(exactRanges('a Docker day, then Docker again', 'docker')).toEqual([
      [2, 8],
      [19, 25],
    ])
  })

  it('returns no ranges when the term is absent', () => {
    expect(exactRanges('nothing here', 'docker')).toEqual([])
  })
})

describe('searchDocs (AND-term model)', () => {
  it('returns a doc only when every term matches', () => {
    const docs = [
      doc('both.md', 'Both', 'docker and kubernetes here'),
      doc('one.md', 'One', 'only docker'),
      doc('none.md', 'None', 'no matches at all'),
    ]
    const results = searchDocs(fuse(docs), 'docker kubernetes')
    expect(results.map((r) => r.path)).toEqual(['both.md'])
    expect(results[0].ranges).toEqual([
      [0, 6],
      [11, 21],
    ])
  })

  it('ranks a title match above a content-only match', () => {
    const docs = [
      doc('content.md', 'Notes', 'docker in the body'),
      doc('title.md', 'Docker', 'plain body'),
    ]
    const results = searchDocs(fuse(docs), 'docker')
    expect(results.map((r) => r.path)).toEqual(['title.md', 'content.md'])
  })

  it('prefers exact ranges, falling back to the fuzzy range for a typo', () => {
    const docs = [doc('typo.md', 'Typos', 'I run cointainers every day')]
    // Exact term is absent: the fuzzy fallback still surfaces the doc.
    const results = searchDocs(fuse(docs), 'containers')
    expect(results.map((r) => r.path)).toEqual(['typo.md'])
    expect(results[0].ranges.length).toBeGreaterThan(0)
  })

  it('returns the full match set uncapped, kinds in relevance order', () => {
    const docs: SearchDoc[] = []
    for (let i = 0; i < PER_GROUP + 3; i++) docs.push(doc(`p${i}.md`, 'Page', 'docker body'))
    docs.push(doc('2026-09-02.md', '2026-09-02', 'docker', 'journal'))
    const results = searchDocs(fuse(docs), 'docker')
    expect(results).toHaveLength(PER_GROUP + 4)
    expect(results.filter((r) => r.kind === 'page')).toHaveLength(PER_GROUP + 3)
    expect(results.filter((r) => r.kind === 'journal')).toHaveLength(1)
  })

  it('topPerGroup slices the first per-group matches of each kind', () => {
    const docs: SearchDoc[] = []
    for (let i = 0; i < PER_GROUP + 3; i++) docs.push(doc(`p${i}.md`, 'Page', 'docker body'))
    docs.push(doc('2026-09-02.md', '2026-09-02', 'docker', 'journal'))
    const sliced = topPerGroup(searchDocs(fuse(docs), 'docker'))
    expect(sliced.filter((r) => r.kind === 'page')).toHaveLength(PER_GROUP)
    expect(sliced.filter((r) => r.kind === 'journal')).toHaveLength(1)
    expect(sliced).toHaveLength(PER_GROUP + 1)
  })

  it('matches a short term as a whole word, in title or body', () => {
    const docs = [
      doc('UX.md', 'UX', 'notes'),
      doc('body.md', 'Notes', 'a UX review'),
      doc('linux.md', 'Linux', 'kernel notes'),
    ]
    const results = searchDocs(fuse(docs), 'UX')
    // Title word first, then the body word; Linux is never a candidate.
    expect(results.map((r) => r.path)).toEqual(['UX.md', 'body.md'])
  })

  it('never matches a short term inside a longer word', () => {
    expect(searchDocs(fuse([doc('linux.md', 'Linux', 'kernel notes')]), 'ux')).toEqual([])
  })

  it('highlights only the whole-word occurrence of a short term', () => {
    const results = searchDocs(fuse([doc('notes.md', 'Notes', 'Linux and UX here')]), 'ux')
    expect(results.map((r) => r.path)).toEqual(['notes.md'])
    expect(results[0].ranges).toEqual([[10, 12]])
  })

  it('still requires every term when one of them is short', () => {
    const docs = [
      doc('both.md', 'Both', 'UX design system'),
      doc('only-ux.md', 'Only UX', 'nothing else'),
      doc('only-design.md', 'Design', 'no shortterm here'),
    ]
    expect(searchDocs(fuse(docs), 'UX design').map((r) => r.path)).toEqual(['both.md'])
  })
})

describe('searchDocs (exact-first ranking)', () => {
  it('leads with title matches that contain the term literally', () => {
    const docs = [
      doc('body.md', 'Notes', 'docker in the body'),
      doc('one.md', 'Docker', 'plain body'),
      doc('two.md', 'Docker notes', 'docker again'),
    ]
    const results = searchDocs(fuse(docs), 'docker')
    expect(results[results.length - 1].path).toBe('body.md')
    expect(new Set(results.slice(0, 2).map((r) => r.path))).toEqual(new Set(['one.md', 'two.md']))
  })

  it('ranks an exact body match above a fuzzy title match', () => {
    const docs = [
      doc('fuzzy-title.md', 'Dockr', 'plain body'),
      doc('exact-body.md', 'Notes', 'docker in the body'),
    ]
    const results = searchDocs(fuse(docs), 'docker')
    expect(results.map((r) => r.path)).toEqual(['exact-body.md', 'fuzzy-title.md'])
  })

  it('ranks an exact body match above a fuzzy body match', () => {
    const docs = [
      doc('typo.md', 'Notes', 'I run cointainers every day'),
      doc('literal.md', 'Other', 'containers everywhere'),
    ]
    const results = searchDocs(fuse(docs), 'containers')
    expect(results.map((r) => r.path)).toEqual(['literal.md', 'typo.md'])
  })

  it('ranks a fuzzy title match above a fuzzy body match', () => {
    const docs = [
      doc('fuzzy-body.md', 'Notes', 'Dockr in the body'),
      doc('fuzzy-title.md', 'Dockr', 'plain body'),
    ]
    const results = searchDocs(fuse(docs), 'docker')
    expect(results.map((r) => r.path)).toEqual(['fuzzy-title.md', 'fuzzy-body.md'])
  })

  it('orders each kind group by tier independently', () => {
    const docs = [
      doc('page-fuzzy.md', 'Notes', 'Dockr in the body'),
      doc('page-exact.md', 'Other', 'docker in the body'),
      doc('2026-09-02.md', '2026-09-02', 'Dockr too', 'journal'),
    ]
    const results = searchDocs(fuse(docs), 'docker')
    const pages = results.filter((r) => r.kind === 'page').map((r) => r.path)
    expect(pages).toEqual(['page-exact.md', 'page-fuzzy.md'])
  })

  it('breaks a tier and score tie by path', () => {
    const docs = [doc('b.md', 'Notes', 'docker body'), doc('a.md', 'Notes', 'docker body')]
    const results = searchDocs(fuse(docs), 'docker')
    expect(results.map((r) => r.path)).toEqual(['a.md', 'b.md'])
  })
})

describe('parseQuery (search operators)', () => {
  it('returns terms with no operator when none is typed', () => {
    expect(parseQuery('docker kubernetes')).toEqual({
      operator: null,
      terms: ['docker', 'kubernetes'],
    })
  })

  it('takes the first operator and leaves its remainder as a term', () => {
    expect(parseQuery('board:meeting notes')).toEqual({
      operator: 'board',
      terms: ['meeting', 'notes'],
    })
  })

  it('accepts a bare operator', () => {
    expect(parseQuery('board: notes')).toEqual({ operator: 'board', terms: ['notes'] })
    expect(parseQuery('board:')).toEqual({ operator: 'board', terms: [] })
  })

  it('is case-insensitive', () => {
    expect(parseQuery('Board: notes')).toEqual({ operator: 'board', terms: ['notes'] })
  })

  it('maps the assets: token to the asset kind', () => {
    expect(parseQuery('assets: report').operator).toBe('asset')
  })

  it('ignores an operator token after the first', () => {
    expect(parseQuery('board: assets: notes')).toEqual({ operator: 'board', terms: ['notes'] })
  })

  it('leaves a colon that is not an operator word as a term', () => {
    expect(parseQuery('http://x notes')).toEqual({ operator: null, terms: ['http://x', 'notes'] })
  })
})

describe('matchedTitle (search operators)', () => {
  it('is true when a term matches the title, with or without a body match', () => {
    const [both] = searchDocs(fuse([doc('Docker.md', 'Docker', 'docker in body')]), 'docker')
    expect(both.matchedTitle).toBe(true)
    const [titleOnly] = searchDocs(fuse([doc('Docker.md', 'Docker', 'plain')]), 'docker')
    expect(titleOnly.matchedTitle).toBe(true)
  })

  it('is false for a body-only match', () => {
    const [hit] = searchDocs(fuse([doc('Notes.md', 'Notes', 'docker in body')]), 'docker')
    expect(hit.matchedTitle).toBe(false)
  })
})

describe('sectionsOf (search operators)', () => {
  const corpus = [
    doc('Notes.md', 'Notes', 'docker in the body'),
    doc('journals/2026-09-02.md', '2026-09-02', 'docker notes', 'journal'),
    boardSearchDoc('boards/docker-map.excalidraw'),
    assetSearchDoc('assets/docker-notes.pdf'),
  ]
  const labels = (results: ReturnType<typeof searchDocs>, op: SearchOperator | null) =>
    sectionsOf(results, op).map((s) => s.label)

  it('keeps the default order with no operator', () => {
    expect(labels(searchDocs(fuse(corpus), 'docker'), null)).toEqual([
      'Pages',
      'Journal',
      'Boards',
      'Assets',
    ])
  })

  it('promotes the operator kind and keeps the rest in default order', () => {
    expect(labels(searchDocs(fuse(corpus), 'docker'), 'board')).toEqual([
      'Boards',
      'Pages',
      'Journal',
      'Assets',
    ])
    expect(labels(searchDocs(fuse(corpus), 'docker'), 'asset')).toEqual([
      'Assets',
      'Pages',
      'Journal',
      'Boards',
    ])
  })

  it('drops empty groups', () => {
    const results = searchDocs(fuse([doc('Notes.md', 'Notes', 'docker')]), 'docker')
    expect(labels(results, 'board')).toEqual(['Pages'])
  })

  it('leads with a Names section for title, then the content groups', () => {
    const results = searchDocs(
      fuse([doc('Docker.md', 'Docker', 'plain'), doc('Notes.md', 'Notes', 'docker')]),
      'docker',
    )
    expect(labels(results, 'title')).toEqual(['Names', 'Pages'])
  })
})

describe('snippetSegments', () => {
  /** The windows' hit spans, as the row would show them. */
  const hits = (windows: ReturnType<typeof snippetSegments>) =>
    windows.flatMap((w) => w.segments.filter((s) => s.hit).map((s) => s.text))

  it('windows around the first match line and marks the hit', () => {
    // 'the docker term here' is line 3; 'docker' sits at 22 (0-based).
    const text = ['line one', 'line two', 'the docker term here', 'line four', 'line five'].join(
      '\n',
    )
    const [window] = snippetSegments(text, [[22, 28]])
    expect(window.segments.map((s) => s.text).join('')).toContain('docker')
    expect(window.segments.find((s) => s.hit)?.text).toBe('docker')
  })

  it('merges touching ranges into one hit segment', () => {
    const [window] = snippetSegments('docker kubernetes', [
      [0, 6],
      [6, 17],
    ])
    expect(window.segments.filter((s) => s.hit)).toHaveLength(1)
    expect(window.segments.find((s) => s.hit)?.text).toBe('docker kubernetes')
  })

  it('uses the opening lines as the snippet when nothing matches in text', () => {
    const text = ['title-only match', 'second line', 'third line', 'fourth'].join('\n')
    const [window] = snippetSegments(text, [])
    expect(window).toEqual({
      from: 1,
      to: 3,
      hits: 0,
      segments: [{ text: 'title-only match\nsecond line\nthird line', hit: false }],
    })
  })

  it('shows a window for every place the match occurs', () => {
    const text = ['dog one', '', 'b', '', 'c', '', 'd', '', 'e', '', 'f', 'g dog'].join('\n')
    const windows = snippetSegments(text, exactRanges(text, 'dog'))
    expect(windows).toHaveLength(2)
    expect(hits(windows)).toEqual(['dog', 'dog'])
    expect(windows[0].from).toBe(1)
    expect(windows[1].to).toBe(12)
  })

  it('shares one window between nearby occurrences', () => {
    const text = ['# Ideas', '', 'a backlink', '', '- b backlink', '- c backlink'].join('\n')
    const windows = snippetSegments(text, exactRanges(text, 'backlink'))
    expect(windows).toHaveLength(1)
    expect(windows[0].hits).toBe(3)
    expect(hits(windows)).toEqual(['backlink', 'backlink', 'backlink'])
  })

  it('walks a dense page in bounded, non-overlapping windows', () => {
    // A match on every line from 1 to 30.
    const text = Array.from({ length: 30 }, (_, i) => `dog ${i}`).join('\n')
    const windows = snippetSegments(text, exactRanges(text, 'dog'))
    expect(windows.length).toBeGreaterThan(1)
    for (const w of windows) expect(w.to - w.from + 1).toBeLessThanOrEqual(8)
    for (let i = 1; i < windows.length; i += 1) {
      expect(windows[i].from).toBeGreaterThan(windows[i - 1].to)
    }
  })

  it('covers every occurrence exactly once', () => {
    const text = Array.from({ length: 20 }, (_, i) =>
      i % 3 === 0 ? `dog ${i}` : `line ${i}`,
    ).join('\n')
    const ranges = exactRanges(text, 'dog')
    const windows = snippetSegments(text, ranges)
    // The merged occurrences the windows report, and the text they actually quote.
    const reported = windows.reduce((n, w) => n + w.hits, 0)
    const quoted = windows
      .flatMap((w) => w.segments.filter((s) => s.hit).map((s) => s.text))
      .join('').length
    expect(reported).toBe(ranges.length)
    expect(hits(windows)).toEqual(Array.from({ length: ranges.length }, () => 'dog'))
    expect(quoted).toBe(ranges.length * 3)
  })
})

describe('matchBlocks', () => {
  it('reports the block holding a text match', () => {
    const text = '# Title\n\nBody dog here\n\n## More\n'
    const ranges = exactRanges(text, 'dog') // third line, second block
    expect(matchBlocks(text, ranges)).toEqual([1])
  })

  it('reports every block a term appears in, in document order', () => {
    const text = '# dog\n\nBody dog\n\n## More dog\n'
    expect(matchBlocks(text, exactRanges(text, 'dog'))).toEqual([0, 1, 2])
  })

  it('reports a block once when the term appears in it twice', () => {
    const text = '# Title\n\nBody dog and dog again\n'
    expect(matchBlocks(text, exactRanges(text, 'dog'))).toEqual([1])
  })

  it('sorts unordered ranges before mapping them', () => {
    const text = '# Title\n\nBody dog\n\n## More dog\n'
    const late: SearchRange = [100, 103]
    const ranges = [...exactRanges(text, 'dog'), late] // unsorted, late entry
    expect(matchBlocks(text, ranges)).toEqual([1, 2])
  })

  it('returns nothing for a title-only result (no text ranges)', () => {
    expect(matchBlocks('some body text', [])).toEqual([])
  })

  it('anchors a match in a list to the list block', () => {
    const text = '# Title\n\nBody\n\n- a\n- b dog\n'
    // 'dog' is in the list, which is the third top-level block.
    const ranges = exactRanges(text, 'dog')
    expect(matchBlocks(text, ranges)).toEqual([2])
  })
})

describe('searchDocs carries the matched blocks', () => {
  it('reports every block holding the match on a page result', () => {
    const text = '# dog\n\nfirst\n\nsecond dog\n'
    const [hit] = searchDocs(fuse([doc('a.md', 'A', text)]), 'dog')
    expect(hit.blocks).toEqual([0, 2])
  })

  it('reports nothing for a title-only match', () => {
    const [hit] = searchDocs(fuse([doc('a.md', 'Docker notes', 'body without the term')]), 'docker')
    expect(hit.blocks).toEqual([])
  })
})

// search-assets-by-name: a vault file joins the corpus by name only. Its bytes
// are never read (ADR-0022), so `text` is empty and the whole title-only path
// already applies — no ranges, no snippet, no block.
describe('asset search documents', () => {
  it('labels by the path inside assets/ and carries no text', () => {
    expect(assetSearchDoc('assets/2026/q3-report.pdf')).toEqual({
      path: 'assets/2026/q3-report.pdf',
      title: '2026/q3-report.pdf',
      kind: 'asset',
      text: '',
    })
  })

  it('matches by its file name', () => {
    const results = searchDocs(fuse([assetSearchDoc('assets/Q3-report.pdf')]), 'q3-report')
    expect(results).toHaveLength(1)
    expect(results[0].kind).toBe('asset')
    expect(results[0].title).toBe('Q3-report.pdf')
  })

  it('matches by its subfolder', () => {
    const results = searchDocs(fuse([assetSearchDoc('assets/2026/q3-report.pdf')]), '2026')
    expect(results).toHaveLength(1)
  })

  it('reports no ranges, so it has no snippet anchor and no block', () => {
    const [hit] = searchDocs(fuse([assetSearchDoc('assets/q3-report.pdf')]), 'q3-report')
    expect(hit.ranges).toEqual([])
    expect(hit.blocks).toEqual([])
    expect(snippetSegments(hit.text, hit.ranges)[0].segments).toEqual([{ text: '', hit: false }])
  })

  it('has no contents to match', () => {
    // The word exists only inside the file's bytes, which the app never reads.
    expect(searchDocs(fuse([assetSearchDoc('assets/report.pdf')]), 'revenue')).toEqual([])
  })

  it('caps per kind, so a file is not crowded out by page matches', () => {
    const docs = [
      doc('a.md', 'a', 'docker body'),
      doc('journals/2026-09-02.md', '2026-09-02', 'docker body', 'journal'),
      assetSearchDoc('assets/docker-notes.pdf'),
    ]
    // The slice keeps relevance order and counts per kind; the surfaces are what
    // order the groups (Pages, Journal, Assets).
    const visible = topPerGroup(searchDocs(fuse(docs), 'docker'))
    expect(visible.map((r) => r.kind).sort()).toEqual(['asset', 'journal', 'page'])
  })
})

describe('boardSearchDoc (add-whiteboards, design D9)', () => {
  it('labels a board by its path inside boards/ and never reads its scene', () => {
    const doc = boardSearchDoc('boards/2026/migration.excalidraw')
    expect(doc.kind).toBe('board')
    expect(doc.title).toBe('2026/migration.excalidraw')
    expect(doc.text).toBe('')
  })

  it('a board is found by name and its scene text is never matched', () => {
    const fuse = new Fuse(
      [
        doc('pages/a.md', 'Alpha', 'queue processing notes'),
        boardSearchDoc('boards/migration.excalidraw'),
      ],
      FUSE_OPTIONS,
    )
    expect(searchDocs(fuse, 'migration').map((r) => r.kind)).toEqual(['board'])
    // `queue` is the word that would appear in the board's scene; the app never
    // reads it, so no board result is produced.
    expect(searchDocs(fuse, 'queue').map((r) => r.path)).toEqual(['pages/a.md'])
  })
})
