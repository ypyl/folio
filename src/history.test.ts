import { describe, expect, it } from 'vitest'
import {
  EMPTY_TRAIL,
  HISTORY_CAP,
  appendTrail,
  canStep,
  stepTrail,
  trailPath,
  type Trail,
} from './history'

const trail = (entries: string[], cursor = entries.length - 1): Trail => ({ entries, cursor })

describe('appendTrail (add-history-navigation)', () => {
  it('records the first page', () => {
    const next = appendTrail(EMPTY_TRAIL, 'a.md')
    expect(next).toEqual({ entries: ['a.md'], cursor: 0 })
    expect(trailPath(next)).toBe('a.md')
  })

  it('appends in the order pages were opened', () => {
    const next = appendTrail(appendTrail(EMPTY_TRAIL, 'a.md'), 'b.md')
    expect(next.entries).toEqual(['a.md', 'b.md'])
    expect(next.cursor).toBe(1)
  })

  it('adds nothing when the page is the one the cursor marks', () => {
    const current = trail(['a.md', 'b.md'])
    expect(appendTrail(current, 'b.md')).toBe(current)
  })

  it('appends a repeat of an earlier page rather than reordering', () => {
    const next = appendTrail(trail(['a.md', 'b.md']), 'a.md')
    expect(next).toEqual({ entries: ['a.md', 'b.md', 'a.md'], cursor: 2 })
  })

  it('discards what was ahead of the cursor', () => {
    // Walked a -> b -> c, stepped Back to b, then opened d.
    const next = appendTrail(trail(['a.md', 'b.md', 'c.md'], 1), 'd.md')
    expect(next).toEqual({ entries: ['a.md', 'b.md', 'd.md'], cursor: 2 })
  })

  it('drops the oldest entry past the cap, keeping the cursor on the open page', () => {
    const full = trail(Array.from({ length: HISTORY_CAP }, (_, i) => `p${i}.md`))
    const next = appendTrail(full, 'new.md')
    expect(next.entries).toHaveLength(HISTORY_CAP)
    expect(next.cursor).toBe(HISTORY_CAP - 1)
    expect(trailPath(next)).toBe('new.md')
    expect(next.entries).not.toContain('p0.md')
    expect(next.entries[0]).toBe('p1.md')
  })

  it('does not mutate the trail it was given', () => {
    const current = trail(['a.md', 'b.md'])
    appendTrail(current, 'c.md')
    expect(current).toEqual({ entries: ['a.md', 'b.md'], cursor: 1 })
  })
})

describe('stepping (add-history-navigation)', () => {
  it('has nowhere to step in an empty trail', () => {
    expect(canStep(EMPTY_TRAIL, -1)).toBe(false)
    expect(canStep(EMPTY_TRAIL, 1)).toBe(false)
    expect(stepTrail(EMPTY_TRAIL, -1)).toBe(EMPTY_TRAIL)
  })

  it('cannot step past either end', () => {
    const atEnd = trail(['a.md', 'b.md'], 1)
    expect(canStep(atEnd, 1)).toBe(false)
    expect(stepTrail(atEnd, 1)).toBe(atEnd)

    const atStart = trail(['a.md', 'b.md'], 0)
    expect(canStep(atStart, -1)).toBe(false)
    expect(stepTrail(atStart, -1)).toBe(atStart)
  })

  it('moves the cursor without touching the entries', () => {
    const current = trail(['a.md', 'b.md', 'c.md'], 2)
    const back = stepTrail(current, -1)
    expect(back.cursor).toBe(1)
    expect(back.entries).toBe(current.entries)
    expect(trailPath(back)).toBe('b.md')

    const forward = stepTrail(back, 1)
    expect(forward.cursor).toBe(2)
    expect(forward.entries).toBe(current.entries)
    expect(trailPath(forward)).toBe('c.md')
  })
})
