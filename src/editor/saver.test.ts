import { afterEach, describe, expect, it, vi } from 'vitest'
import { createDebouncedSaver } from './saver'

afterEach(() => {
  vi.useRealTimers()
})

describe('createDebouncedSaver (design C1/C2)', () => {
  it('collapses rapid edits into a single save with the latest content', async () => {
    vi.useFakeTimers()
    const saved: Array<[string, string]> = []
    const saver = createDebouncedSaver(async (p, c) => {
      saved.push([p, c])
      return true
    }, 1000)

    saver.schedule('a.md', 'v1')
    await vi.advanceTimersByTimeAsync(300)
    saver.schedule('a.md', 'v2')
    await vi.advanceTimersByTimeAsync(300)
    saver.schedule('a.md', 'v3')
    await vi.advanceTimersByTimeAsync(1000)

    expect(saved).toEqual([['a.md', 'v3']])
    saver.dispose()
  })

  it('saves multiple dirty pages sequentially in schedule order', async () => {
    vi.useFakeTimers()
    const order: string[] = []
    const saver = createDebouncedSaver(async (p) => {
      order.push(p)
      return true
    }, 500)

    saver.schedule('a.md', '1')
    saver.schedule('b.md', '2')
    await vi.advanceTimersByTimeAsync(500)
    expect(order).toEqual(['a.md', 'b.md'])
    saver.dispose()
  })

  it('a save that never fires when nothing is scheduled', async () => {
    vi.useFakeTimers()
    const saved: string[] = []
    const saver = createDebouncedSaver(async (p) => {
      saved.push(p)
      return true
    }, 1000)
    await vi.advanceTimersByTimeAsync(5000)
    expect(saved).toEqual([])
    saver.dispose()
  })

  it('dispose flushes a pending draft instead of dropping it', async () => {
    vi.useFakeTimers()
    const saved: Array<[string, string]> = []
    const saver = createDebouncedSaver(async (p, c) => {
      saved.push([p, c])
      return true
    }, 1000)
    saver.schedule('a.md', 'x')
    saver.dispose()
    await vi.advanceTimersByTimeAsync(0)
    expect(saved).toEqual([['a.md', 'x']])
  })

  it('keeps a failed save pending and retries it on its own', async () => {
    vi.useFakeTimers()
    const attempts: Array<[string, string]> = []
    let fail = true
    const saver = createDebouncedSaver(async (p, c) => {
      attempts.push([p, c])
      return !fail
    }, 1000)

    saver.schedule('a.md', 'typed while the share was down')
    await vi.advanceTimersByTimeAsync(1000)
    expect(attempts).toHaveLength(1)
    // The text is still unsaved, so the saver holds it.
    expect(saver.pending()).toBe(1)

    // The failure clears by itself: the retry writes the text without a keystroke.
    fail = false
    await vi.advanceTimersByTimeAsync(1000)
    expect(attempts).toEqual([
      ['a.md', 'typed while the share was down'],
      ['a.md', 'typed while the share was down'],
    ])
    expect(saver.pending()).toBe(0)
    saver.dispose()
  })

  it('stops retrying a write that keeps failing, and a flush still tries again', async () => {
    vi.useFakeTimers()
    const attempts: string[] = []
    const saver = createDebouncedSaver(async (p) => {
      attempts.push(p)
      return false
    }, 1000)

    saver.schedule('a.md', 'x')
    // The first write plus its retries, then nothing more on a timer.
    await vi.advanceTimersByTimeAsync(10_000)
    expect(attempts).toHaveLength(4)
    expect(saver.pending()).toBe(1)

    // Hiding the tab flushes what is still pending: one more attempt.
    await saver.flush()
    expect(attempts).toHaveLength(5)
    saver.dispose()
  })

  it('a new edit earns a fresh set of retries', async () => {
    vi.useFakeTimers()
    const attempts: string[] = []
    const saver = createDebouncedSaver(async (_p, c) => {
      attempts.push(c)
      return false
    }, 1000)

    saver.schedule('a.md', 'first')
    await vi.advanceTimersByTimeAsync(10_000)
    const stuck = attempts.length
    saver.schedule('a.md', 'second')
    await vi.advanceTimersByTimeAsync(1000)
    expect(attempts.length).toBeGreaterThan(stuck)
    expect(attempts.at(-1)).toBe('second')
    saver.dispose()
  })

  it('never runs two flushes at once, so one page is written in order', async () => {
    // The timer's flush is waiting on the disk when the tab is hidden and the
    // hide flush starts: the page must be written by one flush at a time, or the
    // file ends up with whichever write closes last.
    const saved: Array<[string, string]> = []
    let release: (() => void) | null = null
    const saver = createDebouncedSaver(async (p, c) => {
      saved.push([p, c])
      if (release === null) {
        await new Promise<void>((resolve) => {
          release = resolve
        })
      }
      return true
    }, 1000)

    saver.schedule('a.md', 'older')
    const first = saver.flush()
    saver.schedule('a.md', 'newer')
    const second = saver.flush()

    await Promise.resolve()
    await Promise.resolve()
    expect(saved).toEqual([['a.md', 'older']])
    release!()
    await Promise.all([first, second])
    expect(saved).toEqual([
      ['a.md', 'older'],
      ['a.md', 'newer'],
    ])
    saver.dispose()
  })
})
