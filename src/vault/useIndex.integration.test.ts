import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FakeFileHandle, FakeDirectoryHandle, buildTree } from './fakeHandle'
import { FileSystemVaultStorage } from './fs'
import { useIndex } from './useIndex'

function vault(tree: ReturnType<typeof buildTree>): FileSystemVaultStorage {
  return new FileSystemVaultStorage(tree as unknown as FileSystemDirectoryHandle)
}

function fileOf(tree: ReturnType<typeof buildTree>, path: string): FakeFileHandle {
  const segments = path.split('/')
  let dir: FakeDirectoryHandle = tree
  for (const segment of segments.slice(0, -1)) {
    dir = dir.children.get(segment) as FakeDirectoryHandle
  }
  return dir.children.get(segments[segments.length - 1]) as FakeFileHandle
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
    const tree = buildTree({ pages: { 'a.md': 'see #B' } })
    const storage = vault(tree)
    const { result } = renderHook(() => useIndex(storage))
    await waitFor(() => expect(result.current.graph?.pages.has('pages/a.md')).toBe(true))
    expect(result.current.graph!.byName.get('a')).toBe('pages/a.md')
    expect(result.current.graph!.byName.get('b')).toBeUndefined()
  })

  it('refreshes on window focus after an external change', async () => {
    const tree = buildTree({ pages: { 'a.md': 'v1 #One' } })
    const storage = vault(tree)
    const { result } = renderHook(() => useIndex(storage))
    await waitFor(() => expect(result.current.graph?.pages.has('pages/a.md')).toBe(true))

    await act(async () => {
      await fileOf(tree, 'pages/a.md').writeContent('v2 #Two')
    })
    await act(async () => {
      window.dispatchEvent(new Event('focus'))
    })
    await waitFor(() =>
      expect(result.current.graph?.pages.get('pages/a.md')?.content).toBe('v2 #Two'),
    )
    expect(result.current.graph?.backlinks.get('two')).toEqual(['pages/a.md'])
  })

  it('refreshes when the tab becomes visible', async () => {
    const tree = buildTree({ pages: { 'a.md': 'v1' } })
    const storage = vault(tree)
    const { result } = renderHook(() => useIndex(storage))
    await waitFor(() => expect(result.current.graph?.pages.has('pages/a.md')).toBe(true))

    await act(async () => {
      await fileOf(tree, 'pages/a.md').writeContent('v2')
    })
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible')
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await waitFor(() => expect(result.current.graph?.pages.get('pages/a.md')?.content).toBe('v2'))
  })

  it('refreshes on the periodic interval while visible', async () => {
    vi.useFakeTimers()
    try {
      const tree = buildTree({ pages: { 'a.md': 'v1' } })
      const storage = vault(tree)
      const { result } = renderHook(() => useIndex(storage))
      await flushUntil(() => result.current.graph?.pages.has('pages/a.md') === true)

      await act(async () => {
        await fileOf(tree, 'pages/a.md').writeContent('v2')
      })
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30_000)
      })
      await flushUntil(() => result.current.graph?.pages.get('pages/a.md')?.content === 'v2')
      expect(result.current.graph?.pages.get('pages/a.md')?.content).toBe('v2')
    } finally {
      vi.useRealTimers()
    }
  })

  it('does not refresh on the interval while hidden', async () => {
    vi.useFakeTimers()
    try {
      const tree = buildTree({ pages: { 'a.md': 'v1' } })
      const storage = vault(tree)
      const { result } = renderHook(() => useIndex(storage))
      await flushUntil(() => result.current.graph?.pages.has('pages/a.md') === true)
      await act(async () => {
        await fileOf(tree, 'pages/a.md').writeContent('v2')
      })
      vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
      await act(async () => {
        await vi.advanceTimersByTimeAsync(30_000)
      })
      expect(result.current.graph?.pages.get('pages/a.md')?.content).toBe('v1')
    } finally {
      vi.useRealTimers()
    }
  })

  it('rebuilds from empty when the storage changes', async () => {
    const treeA = buildTree({ pages: { 'a.md': 'A' } })
    const treeB = buildTree({ pages: { 'b.md': 'B' } })
    const { result, rerender } = renderHook(({ storage }) => useIndex(storage), {
      initialProps: { storage: vault(treeA) },
    })
    await waitFor(() => expect(result.current.graph?.pages.has('pages/a.md')).toBe(true))

    rerender({ storage: vault(treeB) })
    await waitFor(() => expect(result.current.graph?.pages.has('pages/b.md')).toBe(true))
    expect(result.current.graph?.pages.has('pages/a.md')).toBe(false)
  })

  it('savePage writes through and updates the graph immediately', async () => {
    const tree = buildTree({ pages: { 'a.md': 'v1 #One', 'b.md': 'other' } })
    const storage = vault(tree)
    const { result } = renderHook(() => useIndex(storage))
    await waitFor(() => expect(result.current.graph?.pages.has('pages/a.md')).toBe(true))

    let ok = false
    await act(async () => {
      ok = await result.current.savePage('pages/a.md', 'v2 #New')
    })
    expect(ok).toBe(true)
    // Disk written.
    expect(await storage.read('pages/a.md')).toBe('v2 #New')
    // Graph reflects the save without any refresh.
    expect(result.current.graph?.pages.get('pages/a.md')?.content).toBe('v2 #New')
    // Backlinks re-derived: New points back to a.md.
    expect(result.current.graph?.backlinks.get('new')).toEqual(['pages/a.md'])
  })

  it('savePage reports false on a failed write and leaves the graph unchanged', async () => {
    const tree = buildTree({ pages: { 'a.md': 'v1' } })
    const storage = vault(tree)
    const { result } = renderHook(() => useIndex(storage))
    await waitFor(() => expect(result.current.graph?.pages.has('pages/a.md')).toBe(true))

    const file = fileOf(tree, 'pages/a.md')
    file.createWritable = async () => {
      throw new DOMException('denied', 'SecurityError')
    }
    let ok = true
    await act(async () => {
      ok = await result.current.savePage('pages/a.md', 'v2')
    })
    expect(ok).toBe(false)
    expect(result.current.graph?.pages.get('pages/a.md')?.content).toBe('v1')
  })

  it('a save targeting an idle index reports false', async () => {
    const { result } = renderHook(() => useIndex(undefined))
    expect(await result.current.savePage('pages/a.md', 'x')).toBe(false)
  })
})

describe('useIndex pins (add-pinned-pages)', () => {
  it('exposes the pins read from the vault meta file', async () => {
    const tree = buildTree({ pages: { 'a.md': 'a' }, '.folio': { 'pins.md': '- pages/a.md\n' } })
    const storage = vault(tree)
    const { result } = renderHook(() => useIndex(storage))
    await waitFor(() => expect(result.current.graph?.pages.has('pages/a.md')).toBe(true))
    expect(result.current.pins).toEqual(['pages/a.md'])
  })

  it('togglePin pins (prepend) and unpins through the meta file', async () => {
    const tree = buildTree({ pages: { 'a.md': 'a', 'b.md': 'b' } })
    const storage = vault(tree)
    const { result } = renderHook(() => useIndex(storage))
    await waitFor(() => expect(result.current.graph?.pages.has('pages/a.md')).toBe(true))

    expect(result.current.pins).toEqual([])
    let ok = false
    await act(async () => {
      ok = await result.current.togglePin('pages/a.md')
    })
    expect(ok).toBe(true)
    // Most recently pinned first.
    await act(async () => {
      await result.current.togglePin('pages/b.md')
    })
    expect(result.current.pins).toEqual(['pages/b.md', 'pages/a.md'])
    // Persisted on disk, header + list line.
    expect(await storage.read('.folio/pins.md')).toContain('- pages/b.md')

    await act(async () => {
      await result.current.togglePin('pages/b.md')
    })
    expect(result.current.pins).toEqual(['pages/a.md'])
    expect(await storage.read('.folio/pins.md')).not.toContain('- pages/b.md')
  })

  it('togglePin is referentially stable across renders', async () => {
    const tree = buildTree({ pages: { 'a.md': 'a' } })
    const storage = vault(tree)
    const { result } = renderHook(() => useIndex(storage))
    await waitFor(() => expect(result.current.graph?.pages.has('pages/a.md')).toBe(true))
    const first = result.current.togglePin
    await act(async () => {
      await result.current.togglePin('pages/a.md')
    })
    expect(result.current.togglePin).toBe(first)
  })

  it('keeps one empty pins identity while the graph is still building', () => {
    // The sidebar is memoized (add-page-history, D8), so a fresh [] on every
    // render before the index resolves would re-render it for nothing.
    const tree = buildTree({ pages: { 'a.md': 'a' } })
    const storage = vault(tree)
    const { result, rerender } = renderHook(() => useIndex(storage))
    const first = result.current.pins
    rerender()
    expect(result.current.graph).toBeNull()
    expect(result.current.pins).toBe(first)
  })

  it('togglePin reports false on a failed write and leaves pins unchanged', async () => {
    const tree = buildTree({ pages: { 'a.md': 'a' }, '.folio': { 'pins.md': '- pages/a.md\n' } })
    const storage = vault(tree)
    const { result } = renderHook(() => useIndex(storage))
    await waitFor(() => expect(result.current.graph?.pages.has('pages/a.md')).toBe(true))

    const folio = tree.children.get('.folio') as FakeDirectoryHandle
    const pinsFile = folio.children.get('pins.md') as FakeFileHandle
    pinsFile.createWritable = async () => {
      throw new DOMException('denied', 'SecurityError')
    }
    let ok = true
    await act(async () => {
      ok = await result.current.togglePin('pages/a.md') // would unpin
    })
    expect(ok).toBe(false)
    expect(result.current.pins).toEqual(['pages/a.md'])
  })

  it('togglePin against an idle index reports false', async () => {
    const { result } = renderHook(() => useIndex(undefined))
    expect(await result.current.togglePin('pages/a.md')).toBe(false)
  })
})
