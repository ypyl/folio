import { describe, expect, it } from 'vitest'
import { DraftStore } from './drafts'

describe('DraftStore (design C1)', () => {
  it('opens a page clean from its saved content', () => {
    const store = new DraftStore()
    const draft = store.open('a.md', 'original')
    expect(draft).toEqual({ content: 'original', saved: 'original', status: 'clean' })
    expect(store.get('a.md')).toBe(draft)
  })

  it('edit marks a page dirty and returns it to clean on undo', () => {
    const store = new DraftStore()
    store.open('a.md', 'original')
    expect(store.edit('a.md', 'edited')).toBe('dirty')
    expect(store.get('a.md')!.status).toBe('dirty')
    expect(store.edit('a.md', 'original')).toBe('clean')
  })

  it('ignores edits to pages that were never opened', () => {
    const store = new DraftStore()
    expect(store.edit('ghost.md', 'x')).toBe('clean')
    expect(store.get('ghost.md')).toBeUndefined()
  })

  it('reopening returns the unsaved draft, not the saved content', () => {
    const store = new DraftStore()
    store.open('a.md', 'original')
    store.edit('a.md', 'edited')
    const draft = store.open('a.md', 'original')
    expect(draft.content).toBe('edited')
    expect(draft.status).toBe('dirty')
  })

  it('drafts are isolated per page', () => {
    const store = new DraftStore()
    store.open('a.md', 'one')
    store.open('b.md', 'two')
    store.edit('a.md', 'one-prime')
    expect(store.get('b.md')!.content).toBe('two')
    expect(store.get('b.md')!.status).toBe('clean')
  })

  it('tracks the save lifecycle: saving -> succeed/fail -> clean/failed', () => {
    const store = new DraftStore()
    store.open('a.md', 'original')
    store.edit('a.md', 'edited')
    store.beginSave('a.md')
    expect(store.get('a.md')!.status).toBe('saving')
    store.succeed('a.md')
    expect(store.get('a.md')).toEqual({ content: 'edited', saved: 'edited', status: 'clean' })

    store.edit('a.md', 'edited-again')
    store.beginSave('a.md')
    store.fail('a.md')
    expect(store.get('a.md')!.status).toBe('failed')
    expect(store.get('a.md')!.content).toBe('edited-again') // draft kept
  })

  it('clear drops every draft', () => {
    const store = new DraftStore()
    store.open('a.md', 'one')
    store.clear()
    expect(store.get('a.md')).toBeUndefined()
  })
})