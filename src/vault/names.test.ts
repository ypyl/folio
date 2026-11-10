import { describe, expect, it } from 'vitest'
import { isWritableFileName } from './names'

describe('isWritableFileName', () => {
  it.each(['Notes', 'reading list', 'café', '2.0', '100% done', 'a(b)', '[draft]', 'Q3-report.md'])(
    'accepts the writable name %s',
    (name) => {
      expect(isWritableFileName(name)).toBe(true)
    },
  )

  it.each([
    'a|b',
    'a:b',
    'a?b',
    'a*b',
    'a<b',
    'a>b',
    'a"b',
    'a/b',
    'a\\b',
    'a\tb',
    'a\nb',
    'a\u007fb',
  ])('refuses the protected character in %j', (name) => {
    expect(isWritableFileName(name)).toBe(false)
  })

  it('refuses a C0 control character', () => {
    expect(isWritableFileName('a\u0000b')).toBe(false)
    expect(isWritableFileName('a\u0001b')).toBe(false)
  })

  it('refuses the empty name', () => {
    expect(isWritableFileName('')).toBe(false)
  })

  it.each(['CON', 'con', 'NUL', 'nul', 'COM1', 'lpt9', 'con.md', 'AUX.txt'])(
    'refuses the Windows device name %s',
    (name) => {
      expect(isWritableFileName(name)).toBe(false)
    },
  )

  it('keeps a name that merely starts with a device name', () => {
    expect(isWritableFileName('Console')).toBe(true)
    expect(isWritableFileName('COM10')).toBe(true)
    expect(isWritableFileName('NULL')).toBe(true)
  })
})
