import { describe, expect, it } from 'vitest'
import { findReferenceRanges, parseLinks } from './parse'

describe('parseLinks', () => {
  it('extracts both reference forms with their lexical form', () => {
    expect(parseLinks('See #Inbox and #[[reading list]]')).toEqual([
      { target: 'Inbox', via: 'word' },
      { target: 'reading list', via: 'bracketed' },
    ])
  })

  it('extracts references from prose at word boundaries', () => {
    expect(parseLinks('check the #Inbox, then #[[Folio]] soon.')).toEqual([
      { target: 'Inbox', via: 'word' },
      { target: 'Folio', via: 'bracketed' },
    ])
  })

  it('keeps hyphenated words as one reference', () => {
    expect(parseLinks('#reading-list')).toEqual([{ target: 'reading-list', via: 'word' }])
  })

  it('does not treat URL fragments as references', () => {
    expect(parseLinks('see https://x.com/post#comments')).toEqual([])
  })

  it('collapses duplicate references to the same page', () => {
    expect(parseLinks('#Folio #Folio #[[Folio]]')).toEqual([{ target: 'Folio', via: 'word' }])
  })

  it('collapses case variants as the same page, keeping the first form', () => {
    expect(parseLinks('#Folio #[[folio]]')).toEqual([{ target: 'Folio', via: 'word' }])
  })

  it('trims whitespace around bracketed targets', () => {
    expect(parseLinks('#[[ reading list ]]')).toEqual([
      { target: 'reading list', via: 'bracketed' },
    ])
  })

  it('ignores empty bracketed references', () => {
    expect(parseLinks('#[[ ]] #[[   ]]')).toEqual([])
  })

  it('ignores plain wikilinks and other conventions', () => {
    expect(parseLinks('[[Inbox]] and #tag/word are not references')).toEqual([])
  })

  it('reads editor-serialized bracketed references (commonmark escape)', () => {
    // Milkdown's serializer escapes `[[` on save, so an editor-authored
    // `#[[Reading Log]]` lies on disk as `#\[[Reading Log]]`. The index must
    // tokenize exactly what the editor wrote (design D6).
    expect(parseLinks('moved items into #\\[\\[Reading Log]].')).toEqual([
      { target: 'Reading Log', via: 'bracketed' },
    ])
  })

  it('extracts nothing from plain text', () => {
    expect(parseLinks('no references here')).toEqual([])
  })
})

// The editor badges exactly what the index counts (design D6): both consume
// the same `REF`, so their targets must agree on every fixture. `parseLinks`
// collapses repeats case-insensitively; `findReferenceRanges` keeps every
// occurrence, so the test collapses the ranges the same way before comparing.
describe('findReferenceRanges', () => {
  it('agrees with parseLinks on targets', () => {
    const fixtures = [
      'See #Inbox and #[[reading list]]',
      'check the #Inbox, then #[[Folio]] soon.',
      '#reading-list',
      'see https://x.com/post#comments',
      '#Folio #Folio #[[folio]]',
      '#[[ reading list ]]',
      '#[[ ]] #[[   ]]',
      '[[Inbox]] and #tag/word are not references',
      'moved items into #\\[\\[Reading Log]].',
      'no references here',
    ]
    for (const text of fixtures) {
      const seen = new Set<string>()
      const targets: string[] = []
      for (const range of findReferenceRanges(text)) {
        const key = range.target.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        targets.push(range.target)
      }
      expect(targets).toEqual(parseLinks(text).map((link) => link.target))
    }
  })

  it('reports the source range of each occurrence', () => {
    const text = 'See #Inbox now'
    expect(findReferenceRanges(text)).toEqual([{ from: 4, to: 10, target: 'Inbox' }])
    expect(text.slice(4, 10)).toBe('#Inbox')
  })

  it('keeps every occurrence, unlike parseLinks', () => {
    expect(findReferenceRanges('#Folio #folio')).toEqual([
      { from: 0, to: 6, target: 'Folio' },
      { from: 7, to: 13, target: 'folio' },
    ])
  })
})
