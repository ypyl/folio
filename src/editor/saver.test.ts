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

  it('dispose cancels a pending timer and drops drafts', async () => {
    vi.useFakeTimers()
    const saved: string[] = []
    const saver = createDebouncedSaver(async (p) => {
      saved.push(p)
      return true
    }, 1000)
    saver.schedule('a.md', 'x')
    saver.dispose()
    await vi.advanceTimersByTimeAsync(2000)
    expect(saved).toEqual([])
  })
})