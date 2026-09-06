import { describe, expect, it } from 'vitest'
import Fuse from 'fuse.js'
import {
  FUSE_OPTIONS,
  PER_GROUP,
  exactRanges,
  searchDocs,
  snippetSegments,
  termsOf,
  topPerGroup,
  type SearchDoc,
} from './core'

function doc(path: string, title: string, text: string, kind: 'page' | 'journal' = 'page'): SearchDoc {
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
    const text = ['line one', 'line two', 'the docker term here', 'line four', 'line five'].join('\n')
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