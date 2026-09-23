import { describe, expect, it } from 'vitest'
import Fuse from 'fuse.js'
import {
  FUSE_OPTIONS,
  PER_GROUP,
  assetSearchDoc,
  boardSearchDoc,
  exactRanges,
  firstMatchBlock,
  searchDocs,
  snippetSegments,
  termsOf,
  topPerGroup,
  type SearchDoc,
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

describe('termsOf', () => {
  it('splits on whitespace and drops terms under 3 chars', () => {
    expect(termsOf('  new item a  ')).toEqual(['new', 'item'])
    expect(termsOf('ab')).toEqual([])
    expect(termsOf('')).toEqual([])
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

  it('returns nothing for a sub-3-char query', () => {
    expect(searchDocs(fuse([doc('a.md', 'A', 'abc')]), 'ab')).toEqual([])
  })
})

describe('snippetSegments', () => {
  it('windows around the first match line and marks the hit', () => {
    // 'the docker term here' is line 3; 'docker' sits at 22 (0-based).
    const text = ['line one', 'line two', 'the docker term here', 'line four', 'line five'].join(
      '\n',
    )
    const segments = snippetSegments(text, [[22, 28]])
    expect(segments.map((s) => s.text).join('')).toContain('docker')
    const marked = segments.find((s) => s.hit)
    expect(marked?.text).toBe('docker')
  })

  it('merges touching ranges into one hit segment', () => {
    const segments = snippetSegments('docker kubernetes', [
      [0, 6],
      [6, 17],
    ])
    expect(segments.filter((s) => s.hit)).toHaveLength(1)
    expect(segments.find((s) => s.hit)?.text).toBe('docker kubernetes')
  })

  it('uses the opening lines as the snippet when nothing matches in text', () => {
    const text = ['title-only match', 'second line', 'third line', 'fourth'].join('\n')
    const segments = snippetSegments(text, [])
    expect(segments).toEqual([{ text: 'title-only match\nsecond line\nthird line', hit: false }])
  })
})

describe('firstMatchBlock', () => {
  it('reports the block holding the first text match', () => {
    const text = '# Title\n\nBody dog here\n\n## More\n'
    const ranges = exactRanges(text, 'dog') // third line, second block
    expect(firstMatchBlock(text, ranges)).toBe(1)
  })

  it('uses the earliest range when matches span blocks', () => {
    const text = '# Title\n\nBody dog\n\n## More dog\n'
    const late: SearchRange = [100, 103]
    const ranges = [...exactRanges(text, 'dog'), late] // unsorted, late entry
    expect(firstMatchBlock(text, ranges)).toBe(1)
  })

  it('returns null for a title-only result (no text ranges)', () => {
    expect(firstMatchBlock('some body text', [])).toBeNull()
  })

  it('anchors a match in a list to the list block', () => {
    const text = '# Title\n\nBody\n\n- a\n- b dog\n'
    // 'dog' is in the list, which is the third top-level block.
    const ranges = exactRanges(text, 'dog')
    expect(firstMatchBlock(text, ranges)).toBe(2)
  })
})

describe('searchDocs carries the matched block', () => {
  it('reports the block holding the match on a page result', () => {
    const text = '# Title\n\nfirst\n\nsecond dog\n'
    const [hit] = searchDocs(fuse([doc('a.md', 'A', text)]), 'dog')
    expect(hit.block).toBe(2)
  })

  it('reports null for a title-only match', () => {
    const [hit] = searchDocs(fuse([doc('a.md', 'Docker notes', 'body without the term')]), 'docker')
    expect(hit.block).toBeNull()
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
    expect(hit.block).toBeNull()
    expect(snippetSegments(hit.text, hit.ranges)).toEqual([{ text: '', hit: false }])
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
