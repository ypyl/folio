import { describe, expect, it } from 'vitest'
import { separateEmptyListLines } from './emptyLines'

describe('separateEmptyListLines', () => {
  it('inserts a blank line when a child block follows an empty item line', () => {
    expect(separateEmptyListLines('* <br />\n    ```\n    x\n    ```\n')).toBe(
      '* <br />\n\n    ```\n    x\n    ```\n',
    )
  })

  it('inserts a blank line before an indented nested list too', () => {
    expect(separateEmptyListLines('* a\n  * <br />\n    * child\n* b\n')).toBe(
      '* a\n  * <br />\n\n    * child\n* b\n',
    )
  })

  it('recognizes the <br> and <br/> spellings and ordered markers', () => {
    expect(separateEmptyListLines('* <br>\n  &nbsp;child\n')).toBe('* <br>\n\n  &nbsp;child\n')
    expect(separateEmptyListLines('1. <br/>\n   child\n')).toBe('1. <br/>\n\n   child\n')
  })

  it('leaves a sibling item at the same indent alone', () => {
    const markdown = '* <br />\n* b\n'
    expect(separateEmptyListLines(markdown)).toBe(markdown)
  })

  it('leaves an already-blank next line alone', () => {
    const markdown = '* <br />\n\n    ```\n    x\n    ```\n'
    expect(separateEmptyListLines(markdown)).toBe(markdown)
  })

  it('leaves a less-indented next line alone', () => {
    const markdown = '  * <br />\noutside\n'
    expect(separateEmptyListLines(markdown)).toBe(markdown)
  })

  it('does not touch a <br /> item line inside a fenced code block', () => {
    const markdown = '```\n* <br />\n    child\n```\n'
    expect(separateEmptyListLines(markdown)).toBe(markdown)
  })

  it('is idempotent', () => {
    const once = separateEmptyListLines('* <br />\n  child\n')
    expect(separateEmptyListLines(once)).toBe(once)
  })

  it('leaves unrelated markdown untouched', () => {
    const markdown = '# Title\n\n- one\n- two\n\n```js\nconst x = 1\n```\n'
    expect(separateEmptyListLines(markdown)).toBe(markdown)
  })
})
