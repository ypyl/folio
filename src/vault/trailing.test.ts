import { describe, expect, it } from 'vitest'
import { withTrailingBlankLine } from './trailing'

describe('withTrailingBlankLine (add-trailing-empty-line)', () => {
  it('adds a blank line after content with no trailing newline', () => {
    expect(withTrailingBlankLine('Done')).toBe('Done\n\n')
  })

  it('turns a single trailing newline into one empty line', () => {
    expect(withTrailingBlankLine('Done\n')).toBe('Done\n\n')
  })

  it('collapses several trailing blank lines to one', () => {
    expect(withTrailingBlankLine('Done\n\n\n')).toBe('Done\n\n')
  })

  it('makes an empty text a single empty line', () => {
    expect(withTrailingBlankLine('')).toBe('\n')
  })

  it('treats a text of only newlines as empty', () => {
    expect(withTrailingBlankLine('\n\n')).toBe('\n')
  })

  it('keeps whitespace-only content and adds the blank line', () => {
    expect(withTrailingBlankLine('   ')).toBe('   \n\n')
  })

  it('keeps the content above the terminal line exactly', () => {
    expect(withTrailingBlankLine('  _a_\n*b*')).toBe('  _a_\n*b*\n\n')
  })

  it('is idempotent', () => {
    expect(withTrailingBlankLine('Done\n\n')).toBe('Done\n\n')
    expect(withTrailingBlankLine('\n')).toBe('\n')
  })
})
