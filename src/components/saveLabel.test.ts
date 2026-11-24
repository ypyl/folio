// The one source of the shell's status copy (give-the-phone-a-navigation-bar,
// design D2). The folder's phases outrank the page's save state, and reopening
// the folder outranks indexing it (show-what-is-loading).

import { describe, expect, it } from 'vitest'
import { saveStateLabel } from './saveLabel'

describe('saveStateLabel', () => {
  it('names reopening the folder before anything else', () => {
    expect(
      saveStateLabel({ saveState: 'dirty', newPage: false, indexing: true, restoring: true }),
    ).toBe('Opening your notes…')
  })

  it('names the index build once the folder is open', () => {
    expect(saveStateLabel({ saveState: 'dirty', newPage: false, indexing: true })).toBe(
      'Indexing notes…',
    )
  })

  it('reports the page once neither phase is running', () => {
    expect(
      saveStateLabel({ saveState: 'dirty', newPage: false, indexing: false, restoring: false }),
    ).toBe('Unsaved changes')
    expect(saveStateLabel({ saveState: 'clean', newPage: false, indexing: false })).toBeNull()
  })

  it('reads a new page apart from a plain unsaved one', () => {
    expect(saveStateLabel({ saveState: 'dirty', newPage: true, indexing: false })).toBe(
      'New page: created on first save',
    )
  })
})
