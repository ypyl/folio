import { describe, expect, it } from 'vitest'
import { isImagePath, linkForAsset, linkLabel, markdownDestination } from './link'
import { parseAssetPaths } from './parse'

describe('markdownDestination', () => {
  it('leaves an ordinary path exactly as it is', () => {
    expect(markdownDestination('assets/q3-report.pdf')).toBe('assets/q3-report.pdf')
    expect(markdownDestination('assets/2026/q3_report.final.pdf')).toBe(
      'assets/2026/q3_report.final.pdf',
    )
  })

  it('escapes what would end or alter a destination', () => {
    expect(markdownDestination('assets/Q3 report.pdf')).toBe('assets/Q3%20report.pdf')
    expect(markdownDestination('assets/a (draft).pdf')).toBe('assets/a%20%28draft%29.pdf')
    expect(markdownDestination('assets/100% done.pdf')).toBe('assets/100%25%20done.pdf')
    expect(markdownDestination('assets/<odd>"name".pdf')).toBe('assets/%3Codd%3E%22name%22.pdf')
  })

  it('keeps the separator, so the path stays a path', () => {
    expect(markdownDestination('assets/2026/q3 report.pdf')).toBe('assets/2026/q3%20report.pdf')
  })

  it('leaves a non-ASCII name readable', () => {
    expect(markdownDestination('assets/café.pdf')).toBe('assets/café.pdf')
  })
})

describe('linkLabel and isImagePath', () => {
  it('labels a link with the file name without its extension', () => {
    expect(linkLabel('assets/q3-report.pdf')).toBe('q3-report')
    expect(linkLabel('assets/2026/shot.png')).toBe('shot')
    expect(linkLabel('assets/noext')).toBe('noext')
    expect(linkLabel('assets/.hidden')).toBe('.hidden')
  })

  it('knows which paths are images', () => {
    expect(isImagePath('assets/shot.png')).toBe(true)
    expect(isImagePath('assets/photo.JPG')).toBe(true)
    expect(isImagePath('assets/q3-report.pdf')).toBe(false)
    expect(isImagePath('assets/notes')).toBe(false)
    expect(isImagePath('assets/.png')).toBe(false)
  })
})

describe('linkForAsset', () => {
  it('writes an image reference for an image and a plain link otherwise', () => {
    expect(linkForAsset('assets/photo.png')).toBe('![photo](assets/photo.png)')
    expect(linkForAsset('assets/notes.pdf')).toBe('[notes](assets/notes.pdf)')
  })

  it('writes a destination the index reads back as the file it names', () => {
    for (const path of [
      'assets/q3-report.pdf',
      'assets/Q3 report.pdf',
      'assets/a (draft).pdf',
      'assets/100% done.pdf',
      'assets/café.pdf',
    ]) {
      expect(parseAssetPaths(linkForAsset(path))).toEqual([path])
    }
  })
})
