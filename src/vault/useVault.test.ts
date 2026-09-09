import { describe, expect, it, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { act } from 'react'
import { useVault } from './useVault'
import { buildTree, type FakeDirectoryHandle } from './fakeHandle'

// 1.3: in-memory registry stub for handleStore — hook tests never touch IDB.
const store = vi.hoisted(() => {
  const rows = new Map<string, { id: string; name: string; handle: unknown }>()
  let lastActive: string | null = null
  return {
    listVaultHandles: async () => [...rows.values()],
    saveVaultHandle: async (row: { id: string; name: string; handle: unknown }) => {
      rows.set(row.id, row)
    },
    clearVaultHandle: async (id: string) => {
      rows.delete(id)
    },
    getLastActiveId: async () => lastActive,
    setLastActiveId: async (id: string) => {
      lastActive = id
    },
    clearLastActiveId: async () => {
      lastActive = null
    },
    lastActiveId: () => lastActive,
    seed: (name: string, permission: PermissionState, id?: string, h?: FakeDirectoryHandle) => {
      const handle = h ?? fake(name, permission)
      const rid = id ?? name
      rows.set(rid, { id: rid, name, handle })
      return { id: rid, handle }
    },
    reset: () => {
      rows.clear()
      lastActive = null
    },
  }
})

vi.mock('./handleStore', () => store)

const TREE = { 'welcome.md': '# Welcome', 'tags.md': '#tag' }

let uid = 0
function fake(name: string, permission: PermissionState): FakeDirectoryHandle {
  const root = buildTree(TREE)
  root.name = name
  root.permission = permission
  root._id = `h${uid++}`
  return root
}
function handle(name: string, permission: PermissionState): FakeDirectoryHandle {
  return fake(name, permission)
}

beforeEach(() => store.reset())

describe('boot restore', () => {
  it('reopens several granted folders and makes the last active win', async () => {
    store.seed('work', 'granted')
    store.seed('home', 'granted')
    store.setLastActiveId('home')
    const { result } = renderHook(() => useVault())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.folders.map((f) => f.name)).toEqual(['work', 'home'])
    expect(result.current.activeId).toBe('home')
    const active = result.current.folders.find((f) => f.id === 'home')!
    expect(active.storage).toBeTruthy()
    expect(active.fileCount).toBe(2)
  })

  it('lists a count only for the active folder at boot', async () => {
    store.seed('work', 'granted')
    store.seed('home', 'granted')
    store.setLastActiveId('home')
    const { result } = renderHook(() => useVault())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    const work = result.current.folders.find((f) => f.name === 'work')!
    const home = result.current.folders.find((f) => f.name === 'home')!
    expect(work.fileCount).toBeUndefined()
    expect(home.fileCount).toBe(2)
  })

  it('holds a pending folder without storage, not active', async () => {
    store.seed('work', 'prompt')
    store.seed('ready', 'granted')
    const { result } = renderHook(() => useVault())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    const pending = result.current.folders.find((f) => f.name === 'work')!
    expect(pending.permission).toBe('prompt')
    expect(pending.storage).toBeUndefined()
    expect(result.current.activeId).toBe(result.current.folders.find((f) => f.name === 'ready')!.id)
  })

  it('drops a denied folder while others still reopen', async () => {
    store.seed('dead', 'denied')
    store.seed('alive', 'granted')
    const { result } = renderHook(() => useVault())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.folders.map((f) => f.name)).toEqual(['alive'])
  })

  it('stays ready with no stored folders', async () => {
    const { result } = renderHook(() => useVault())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    expect(result.current.folders).toEqual([])
    expect(result.current.activeId).toBeNull()
  })
})

describe('activate', () => {
  it('switches to another granted folder and persists last active', async () => {
    store.seed('work', 'granted')
    store.seed('home', 'granted')
    store.setLastActiveId('work')
    const { result } = renderHook(() => useVault())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    const home = result.current.folders.find((f) => f.name === 'home')!
    await act(() => result.current.activate(home.id))
    expect(result.current.activeId).toBe(home.id)
    expect(store.lastActiveId()).toBe(home.id)
    // the newly active folder got its count on switch
    expect(result.current.folders.find((f) => f.id === home.id)!.fileCount).toBe(2)
  })

  it('reconnects a pending folder on click without re-picking', async () => {
    store.seed('work', 'prompt')
    const picker = vi.fn()
    vi.stubGlobal('showDirectoryPicker', picker)
    const { result } = renderHook(() => useVault())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    const pending = result.current.folders.find((f) => f.name === 'work')!
    await act(() => result.current.activate(pending.id))
    expect(picker).not.toHaveBeenCalled()
    expect(result.current.activeId).toBe(pending.id)
    expect(result.current.folders.find((f) => f.id === pending.id)!.storage).toBeTruthy()
    vi.unstubAllGlobals()
  })

  it('drops a folder whose re-grant fails and falls back to the picker', async () => {
    const h = fake('work', 'prompt')
    h.requestPermission = async () => 'denied'
    store.seed('work', 'prompt', 'work', h)
    const chosen = handle('chosen', 'granted')
    vi.stubGlobal(
      'showDirectoryPicker',
      vi.fn(async () => chosen as unknown as FileSystemDirectoryHandle),
    )
    const { result } = renderHook(() => useVault())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    await act(() => result.current.activate('work'))
    expect(result.current.folders.some((f) => f.name === 'work')).toBe(false)
    expect(result.current.folders.some((f) => f.name === 'chosen')).toBe(true)
    vi.unstubAllGlobals()
  })
})

describe('addFolder', () => {
  it('picks, stores, activates, and persists last active', async () => {
    const chosen = handle('notes', 'granted')
    vi.stubGlobal(
      'showDirectoryPicker',
      vi.fn(async () => chosen as unknown as FileSystemDirectoryHandle),
    )
    const { result } = renderHook(() => useVault())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    await act(() => result.current.addFolder())
    expect(result.current.folders).toHaveLength(1)
    expect(result.current.folders[0].name).toBe('notes')
    expect(result.current.activeId).toBe(result.current.folders[0].id)
    expect(store.lastActiveId()).toBe(result.current.folders[0].id)
    vi.unstubAllGlobals()
  })

  it('keeps previously opened folders when adding', async () => {
    store.seed('work', 'granted')
    const chosen = handle('notes', 'granted')
    vi.stubGlobal(
      'showDirectoryPicker',
      vi.fn(async () => chosen as unknown as FileSystemDirectoryHandle),
    )
    const { result } = renderHook(() => useVault())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    await act(() => result.current.addFolder())
    expect(result.current.folders.map((f) => f.name)).toEqual(['work', 'notes'])
    vi.unstubAllGlobals()
  })

  it('does nothing when the picker is cancelled', async () => {
    vi.stubGlobal(
      'showDirectoryPicker',
      vi.fn(async () => {
        throw new DOMException('The user aborted a request.', 'AbortError')
      }),
    )
    const { result } = renderHook(() => useVault())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    await act(() => result.current.addFolder())
    expect(result.current.folders).toEqual([])
    vi.unstubAllGlobals()
  })

  it('dedups a re-picked folder and activates the existing entry', async () => {
    const first = fake('notes', 'granted')
    vi.stubGlobal(
      'showDirectoryPicker',
      vi.fn(async () => first as unknown as FileSystemDirectoryHandle),
    )
    const { result } = renderHook(() => useVault())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    await act(() => result.current.addFolder())
    // re-pick the same physical folder (same _id, fresh handle object)
    const same = fake('notes', 'granted')
    same._id = first._id!
    vi.stubGlobal(
      'showDirectoryPicker',
      vi.fn(async () => same as unknown as FileSystemDirectoryHandle),
    )
    await act(() => result.current.addFolder())
    expect(result.current.folders).toHaveLength(1)
    expect(result.current.activeId).toBe(result.current.folders[0].id)
    expect(store.lastActiveId()).toBe(result.current.folders[0].id)
    vi.unstubAllGlobals()
  })
})

describe('closeFolder', () => {
  it('closes a non-active folder, keeping the active folder and list intact', async () => {
    store.seed('work', 'granted')
    store.seed('home', 'granted')
    store.setLastActiveId('home')
    const { result } = renderHook(() => useVault())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    const work = result.current.folders.find((f) => f.name === 'work')!
    await act(() => result.current.closeFolder(work.id))
    expect(result.current.folders.map((f) => f.name)).toEqual(['home'])
    expect(result.current.activeId).toBe(result.current.folders[0].id)
    expect(store.lastActiveId()).toBe('home')
    // the closed folder's handle is gone from the registry
    expect((await store.listVaultHandles()).some((r) => r.id === work.id)).toBe(false)
  })

  it('closing the active folder returns home and clears last active', async () => {
    store.seed('work', 'granted')
    store.seed('home', 'granted')
    store.setLastActiveId('work')
    const { result } = renderHook(() => useVault())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    const work = result.current.folders.find((f) => f.name === 'work')!
    await act(() => result.current.closeFolder(work.id))
    expect(result.current.activeId).toBeNull()
    expect(result.current.folders.map((f) => f.name)).toEqual(['home'])
    expect(store.lastActiveId()).toBeNull()
    expect((await store.listVaultHandles()).some((r) => r.id === work.id)).toBe(false)
  })

  it('closing the last folder returns home with nothing listed', async () => {
    store.seed('work', 'granted')
    const { result } = renderHook(() => useVault())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    await act(() => result.current.closeFolder(result.current.folders[0].id))
    expect(result.current.activeId).toBeNull()
    expect(result.current.folders).toEqual([])
    expect(store.lastActiveId()).toBeNull()
  })

  it('ignores a close for an unknown id', async () => {
    store.seed('work', 'granted')
    const { result } = renderHook(() => useVault())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    await act(() => result.current.closeFolder('nope'))
    expect(result.current.folders.map((f) => f.name)).toEqual(['work'])
    expect(result.current.activeId).not.toBeNull()
  })
})

describe('goHome', () => {
  it('clears the active folder and last active without removing folders', async () => {
    store.seed('work', 'granted')
    store.seed('home', 'granted')
    store.setLastActiveId('home')
    const { result } = renderHook(() => useVault())
    await waitFor(() => expect(result.current.status).toBe('ready'))
    await act(() => result.current.goHome())
    expect(result.current.activeId).toBeNull()
    expect(result.current.folders.map((f) => f.name)).toEqual(['work', 'home'])
    expect(store.lastActiveId()).toBeNull()
  })
})
