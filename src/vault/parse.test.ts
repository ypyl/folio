import { describe, expect, it } from 'vitest'
import {
  findReferenceRanges,
  parseAssetPaths,
  parseLinks,
  referenceToken,
  referenceTrigger,
} from './parse'

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

// The trigger is the longest token prefix that ends at the caret
// (add-reference-autocomplete, design D1). Fixtures write the caret as `|`, so
// the text after it is exactly what the replacement would leave behind.
describe('referenceTrigger', () => {
  const atCaret = (fixture: string) => {
    const [before, after = ''] = fixture.split('|')
    return referenceTrigger(before, after)
  }

  it('reads a word-form token at the caret', () => {
    expect(atCaret('See #rea|')).toEqual({
      kind: 'word',
      text: '#rea',
      query: 'rea',
    })
  })

  it('keeps hyphens and digits in a word-form token', () => {
    expect(atCaret('#2026-09-1|')?.query).toBe('2026-09-1')
  })

  it('reads a bracketed token, spaces included', () => {
    expect(atCaret('#[[reading list|')).toEqual({
      kind: 'bracketed',
      text: '#[[reading list',
      query: 'reading list',
    })
  })

  it('takes the last opener on a line', () => {
    expect(atCaret('#[[a #[[b|')).toMatchObject({ query: 'b' })
  })

  it('finds nothing without a hash', () => {
    expect(atCaret('no reference here|')).toBeNull()
  })

  it('does not fire with nothing typed yet', () => {
    expect(atCaret('#|')).toBeNull()
    expect(atCaret('#[[|')).toBeNull()
  })

  it('ignores a hash inside a word', () => {
    expect(atCaret('see https://x.com/post#comments|')).toBeNull()
  })

  it('ignores the slash that closes the word form', () => {
    expect(atCaret('#a/b|')).toBeNull()
    expect(atCaret('#a/|')).toBeNull()
  })

  it('ends the word form at a space before the caret', () => {
    expect(atCaret('#rea |')).toBeNull()
    // ...but a space after the caret closes the token rather than extending it.
    expect(atCaret('#rea| ')).toMatchObject({ query: 'rea' })
  })

  it('does not fire in the middle of a word-form token', () => {
    expect(atCaret('#rea|ding')).toBeNull()
  })

  it('does not fire inside a bracketed token', () => {
    expect(atCaret('#[[reading| list]]')).toBeNull()
    expect(atCaret('#[[reading list|]]')).toBeNull()
    // A closed token with the caret after it has no open prefix either.
    expect(atCaret('#[[reading list]]|')).toBeNull()
  })

  it('does not fire when a closing bracket follows the caret', () => {
    expect(atCaret('#[[read|]]')).toBeNull()
  })
})

describe('referenceToken', () => {
  it('writes the word form for a single word', () => {
    expect(referenceToken('reading', 'word')).toBe('#reading')
    expect(referenceToken('2026-09-10', 'word')).toBe('#2026-09-10')
    expect(referenceToken('read_2', 'word')).toBe('#read_2')
  })

  it('escalates to brackets when a word trigger meets a name that is not a word', () => {
    expect(referenceToken('reading list', 'word')).toBe('#[[reading list]]')
    expect(referenceToken('café', 'word')).toBe('#[[café]]')
    expect(referenceToken('2.0', 'word')).toBe('#[[2.0]]')
  })

  it('keeps brackets when the trigger was bracketed', () => {
    expect(referenceToken('reading', 'bracketed')).toBe('#[[reading]]')
    expect(referenceToken('reading list', 'bracketed')).toBe('#[[reading list]]')
  })

  // The form the editor inserts must be a token the index counts, with the same
  // target: the two share `REF`, so this is the drift guard between them.
  it('round-trips through the canonical tokenizer', () => {
    const names = ['reading', 'reading list', 'read-2', '2.0', 'café', 'a[b', 'a#b', '2026-09-10']
    for (const name of names) {
      for (const form of ['word', 'bracketed'] as const) {
        expect(findReferenceRanges(referenceToken(name, form))[0]?.target).toBe(name)
      }
    }
  })

  it('cannot express a name containing a closing bracket', () => {
    expect(findReferenceRanges(referenceToken('weird]name', 'bracketed'))).toEqual([])
  })

  it('cannot express a name whose whitespace reference parsing trims', () => {
    expect(findReferenceRanges(referenceToken(' spaced ', 'bracketed'))[0]?.target).toBe('spaced')
  })
})

// add-asset-navigation: the destinations a page's Markdown points at, which the
// index matches against the vault's file listing (design D3).
describe('parseAssetPaths', () => {
  it('reads link and image destinations in order of appearance', () => {
    expect(
      parseAssetPaths('[Q3 report](assets/q3-report.pdf) and ![shot](assets/shot.png)'),
    ).toEqual(['assets/q3-report.pdf', 'assets/shot.png'])
  })

  it('collapses a repeated destination', () => {
    expect(parseAssetPaths('![a](assets/shot.png) ![b](assets/shot.png)')).toEqual([
      'assets/shot.png',
    ])
  })

  it('reads a destination containing a space', () => {
    expect(parseAssetPaths('[p](assets/my photo.png)')).toEqual(['assets/my photo.png'])
  })

  it('unwraps an angle-bracket destination', () => {
    expect(parseAssetPaths('[p](<assets/my photo.png>)')).toEqual(['assets/my photo.png'])
  })

  it('drops a trailing quoted title', () => {
    expect(parseAssetPaths('[p](assets/a.pdf "the notes")')).toEqual(['assets/a.pdf'])
    expect(parseAssetPaths("[p](assets/a.pdf 'the notes')")).toEqual(['assets/a.pdf'])
  })

  it('keeps a destination whose own parens are balanced', () => {
    expect(parseAssetPaths('[p](assets/a (draft).pdf)')).toEqual(['assets/a (draft).pdf'])
  })

  it('decodes a percent-encoded destination', () => {
    expect(parseAssetPaths('[p](assets/my%20report.pdf)')).toEqual(['assets/my report.pdf'])
  })

  it('falls back to the literal path when decoding fails', () => {
    expect(parseAssetPaths('[p](assets/100% done.pdf)')).toEqual(['assets/100% done.pdf'])
  })

  it('refuses anything that is not a vault path', () => {
    expect(
      parseAssetPaths(
        '[a](https://example.com/x.pdf) [b](#section) [c](/absolute.pdf) [d](mailto:x@y.z) [e](data:image/png,AAA)',
      ),
    ).toEqual([])
  })

  it('reads a path with no directory part too', () => {
    expect(parseAssetPaths('[p](notes.txt)')).toEqual(['notes.txt'])
  })

  it('reads several destinations on one line', () => {
    expect(parseAssetPaths('[a](assets/a.pdf) [b](assets/b.pdf)')).toEqual([
      'assets/a.pdf',
      'assets/b.pdf',
    ])
  })

  it('does not let an unmatched opener swallow the next line', () => {
    expect(parseAssetPaths('[broken](assets/a.pdf\n[b](assets/b.pdf)')).toEqual(['assets/b.pdf'])
  })

  it('reads nothing from text without links', () => {
    expect(parseAssetPaths('plain words, no links')).toEqual([])
  })
})
