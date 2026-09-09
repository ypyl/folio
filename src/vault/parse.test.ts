import { describe, expect, it } from 'vitest'
import { parseLinks } from './parse'

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
