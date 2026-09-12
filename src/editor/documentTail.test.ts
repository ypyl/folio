import { describe, expect, it } from 'vitest'
import { trimTrailingBlankLines } from './documentTail'

// edit-after-trailing-code-block: the file's tail is normalized so the
// paragraph the editor maintains after a trailing code block stays out of it.
describe('trimTrailingBlankLines', () => {
  it('drops a trailing blank line', () => {
    expect(trimTrailingBlankLines('```js\nx\n```\n\n')).toBe('```js\nx\n```\n')
  })

  it('drops several trailing blank lines', () => {
    expect(trimTrailingBlankLines('text\n\n\n\n')).toBe('text\n')
  })

  it('leaves a single trailing newline alone', () => {
    expect(trimTrailingBlankLines('text\n')).toBe('text\n')
  })

  it('leaves text with no trailing newline alone', () => {
    expect(trimTrailingBlankLines('text')).toBe('text')
  })

  it('leaves interior blank lines alone', () => {
    expect(trimTrailingBlankLines('a\n\n\nb\n')).toBe('a\n\n\nb\n')
  })

  it('leaves an empty document empty', () => {
    expect(trimTrailingBlankLines('')).toBe('')
  })
})
