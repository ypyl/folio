// The search-result row body (show-every-match-per-result): one snippet per
// place the query occurs, capped per surface, with the remainder counted.
//
// The last describe reads the stylesheet from disk, because a CSS-module import
// is a proxy of class names in vitest and the declarations are the point: a
// reintroduced line clamp would hide the second match of a two-match window,
// which is the failure this change exists to fix. `src/components/
// locatedBlockFrame.test.ts` reads its stylesheet for the same reason.

import { readFileSync } from 'node:fs'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { exactRanges, snippetSegments, type SearchResult } from '../search/core'
import { MatchBody } from './MatchBody'

vi.mock('../search/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../search/core')>()
  return { ...actual, snippetSegments: vi.fn(actual.snippetSegments) }
})

const result = (text: string, over: Partial<SearchResult> = {}): SearchResult => ({
  path: 'Notes.md',
  title: 'Notes',
  kind: 'page',
  score: 0,
  ranges: [],
  text,
  blocks: [],
  ...over,
})

/** A page whose occurrences sit far enough apart to be separate snippets. */
const spread = (n: number) =>
  Array.from({ length: n * 8 }, (_, i) => (i % 8 === 0 ? `dog ${i}` : `line ${i}`)).join('\n')

const marks = () => screen.queryAllByText('dog')

describe('MatchBody', () => {
  it('shows a snippet for every place the query occurs', () => {
    const text = ['dog one', '', 'b', '', 'c', '', 'd', '', 'e', '', 'f', 'g dog'].join('\n')
    render(<MatchBody result={result(text, { ranges: exactRanges(text, 'dog') })} limit={2} />)
    expect(marks()).toHaveLength(2)
    expect(screen.queryByText(/more on this page/)).toBeNull()
  })

  it('notes the occurrences past the cap, counting occurrences', () => {
    const text = spread(5)
    render(<MatchBody result={result(text, { ranges: exactRanges(text, 'dog') })} limit={2} />)
    expect(marks()).toHaveLength(2)
    expect(screen.getByText('+3 more on this page')).toBeTruthy()
  })

  it('shows every occurrence a snippet covers, none cut off', () => {
    const text = ['a backlink', 'b backlink'].join('\n')
    render(<MatchBody result={result(text, { ranges: exactRanges(text, 'backlink') })} limit={2} />)
    expect(screen.getAllByText('backlink')).toHaveLength(2)
    expect(screen.queryByText(/more on this page/)).toBeNull()
  })

  it('shows one snippet and no note when the query occurs once', () => {
    const text = 'a dog here\n\nnothing else'
    render(<MatchBody result={result(text, { ranges: exactRanges(text, 'dog') })} limit={2} />)
    expect(marks()).toHaveLength(1)
    expect(screen.queryByText(/more on this page/)).toBeNull()
  })

  it('falls back to the opening lines when nothing matches in text', () => {
    render(<MatchBody result={result('opening line\nsecond\nthird\nfourth')} limit={2} />)
    expect(screen.getByText(/opening line/)).toBeTruthy()
    expect(screen.queryByText(/more on this page/)).toBeNull()
  })

  it('does not walk again when nothing the row reads changed', () => {
    const text = spread(2)
    const once = result(text, { ranges: exactRanges(text, 'dog') })
    const walk = vi.mocked(snippetSegments)
    walk.mockClear()
    const { rerender } = render(<MatchBody result={once} limit={2} />)
    const calls = walk.mock.calls.length
    rerender(<MatchBody result={once} limit={2} />)
    expect(walk.mock.calls.length).toBe(calls)
  })
})

describe('MatchBody stylesheet', () => {
  const css = readFileSync('src/components/MatchBody.module.css', 'utf8')
  const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({
    selector: match[1].trim(),
    body: match[2],
  }))
  const body = (name: string) =>
    rules
      .filter((rule) => rule.selector.includes(`.${name}`))
      .map((rule) => rule.body)
      .join(' ')

  it('leaves no line clamp on the snippet, which would hide a match', () => {
    expect(body('snip')).not.toMatch(/line-clamp/)
    expect(body('snip')).not.toMatch(/-webkit-box/)
  })

  it('gives each window its own block', () => {
    expect(body('window')).toMatch(/display:\s*block/)
  })

  it('gives the remainder note its own block', () => {
    expect(body('more')).toMatch(/display:\s*block/)
  })
})
