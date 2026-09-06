import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FakeFileHandle, buildTree } from './fakeHandle'
import { FileSystemVaultStorage } from './fs'
import { useIndex } from './useIndex'

function vault(tree: ReturnType<typeof buildTree>): FileSystemVaultStorage {
  return new FileSystemVaultStorage(tree as unknown as FileSystemDirectoryHandle)
}

function fileOf(tree: ReturnType<typeof buildTree>, path: string): FakeFileHandle {
  return tree.children.get(path) as FakeFileHandle
}

// Fake timers break vi.waitFor; plain act ticks flush the build/refresh
// microtask chains (probed: 10 ticks suffice for a small tree).
async function flushUntil(check: () => boolean, ticks = 50): Promise<void> {
  for (let i = 0; i < ticks && !check(); i++) await act(async () => {})
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useIndex', () => {
  it('stays idle without storage', () => {
    const { result } = renderHook(() => useIndex(undefined))
    expect(result.current.graph).toBeNull()
  })

  it('builds the graph for the storage on mount', async () => {
    const tree = buildTree({ 'a.md': 'see #B' })
    const storage = vault(tree)
    const { result } = renderHook(() => useIndex(storage))
    await waitFor(() => expect(result.current.graph?.pages.has('a.md')).toBe(true))
    expect(result.current.graph!.byName.get('a')).toBe('a.md')
    expect(result.current.graph!.byName.get('b')).toBeUndefined()
  })

  it('refreshes on window focus after an external change', async () => {
    const tree = buildTree({ 'a.md': 'v1 #One' })
    const storage = vault(tree)
    const { result } = renderHook(() => useIndex(storage))
    await waitFor(() => expect(result.current.graph?.pages.has('a.md')).toBe(true))

    await act(async () => {
      await fileOf(tree, 'a.md').writeContent('v2 #Two')
    })
    await act(async () => {
      window.dispatchEvent(new Event('focus'))
    })
    await waitFor(() =>
      expect(result.current.graph?.pages.get('a.md')?.content).toBe('v2 #Two'),
    )
    expect(result.current.graph?.backlinks.get('two')).toEqual(['a.md'])
  })

  it('refreshes when the tab becomes visible', async () => {
    const tree = buildTree({ 'a.md': 'v1' })
    const storage = vault(tree)
    const { result } = renderHook(() => useIndex(storage))
    await waitFor(() => expect(result.current.graph?.pages.has('a.md')).toBe(true))

    await act(async () => {
      await fileOf(tree, 'a.md').writeContent('v2')
    })
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await waitFor(() =>
      expect(result.current.graph?.pages.get('a.md')?.content).toBe('v2'),
    )
  })

  it('refreshes on the periodic interval while visible', async () => {
    vi.useFakeTimers()
    try {
      const tree = buildTree({ 'a.md': 'v1' })
      const storage = vault(tree)
      const { result } = renderHook(() => useIndex(storage))
      await flushUntil(() => result.current.graph?.pages.has('a.md') === true)

      await act(async () => {
        await fileOf(tree, 'a.md').writeContent('v2')
      })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30_000)
      })
      await flushUntil(() => result.current.graph?.pages.get('a.md')?.content === 'v2')
      expect(result.current.graph?.pages.get('a.md')?.content).toBe('v2')
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not refresh on the interval while hidden', async () => {
    vi.useFakeTimers()
    try {
      const tree = buildTree({ 'a.md': 'v1' })
      const storage = vault(tree)
      const { result } = renderHook(() => useIndex(storage))
      await flushUntil(() => result.current.graph?.pages.has('a.md') === true)
      await act(async () => {
        await fileOf(tree, 'a.md').writeContent('v2')
      })
      vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30_000)
      })
      expect(result.current.graph?.pages.get('a.md')?.content).toBe('v1')
    } finally {
      vi.useRealTimers()
    }
  })

  it('rebuilds from empty when the storage changes', async () => {
    const treeA = buildTree({ 'a.md': 'A' })
    const treeB = buildTree({ 'b.md': 'B' })
    const { result, rerender } = renderHook(
      ({ storage }) => useIndex(storage),
      { initialProps: { storage: vault(treeA) } },
    )
    await waitFor(() => expect(result.current.graph?.pages.has('a.md')).toBe(true))

    rerender({ storage: vault(treeB) })
    await waitFor(() => expect(result.current.graph?.pages.has('b.md')).toBe(true))
    expect(result.current.graph?.pages.has('a.md')).toBe(false)
  })

  it('savePage writes through and updates the graph immediately', async () => {
    const tree = buildTree({ 'a.md': 'v1 #One', 'b.md': 'other' })
    const storage = vault(tree)
    const { result } = renderHook(() => useIndex(storage))
    await waitFor(() => expect(result.current.graph?.pages.has('a.md')).toBe(true))

    let ok = false
    await act(async () => {
      ok = await result.current.savePage('a.md', 'v2 #New')
    })
    expect(ok).toBe(true)
    // Disk written.
    expect(await storage.read('a.md')).toBe('v2 #New')
    // Graph reflects the save without any refresh.
    expect(result.current.graph?.pages.get('a.md')?.content).toBe('v2 #New')
    // Backlinks re-derived: New points back to a.md.
    expect(result.current.graph?.backlinks.get('new')).toEqual(['a.md'])
  })

  it('savePage reports false on a failed write and leaves the graph unchanged', async () => {
    const tree = buildTree({ 'a.md': 'v1' })
    const storage = vault(tree)
    const { result } = renderHook(() => useIndex(storage))
    await waitFor(() => expect(result.current.graph?.pages.has('a.md')).toBe(true))

    const file = tree.children.get('a.md') as FakeFileHandle
    file.createWritable = async () => {
      throw new DOMException('denied', 'SecurityError')
    }
    let ok = true
    await act(async () => {
      ok = await result.current.savePage('a.md', 'v2')
    })
    expect(ok).toBe(false)
    expect(result.current.graph?.pages.get('a.md')?.content).toBe('v1')
  })

  it('a save targeting an idle index reports false', async () => {
    const { result } = renderHook(() => useIndex(undefined))
    expect(await result.current.savePage('a.md', 'x')).toBe(false)
  })
})
