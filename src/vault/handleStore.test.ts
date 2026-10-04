import { afterEach, describe, expect, it, vi } from 'vitest'
import type * as HandleStore from './handleStore'

// A minimal in-memory IndexedDB: exactly the API handleStore touches — open
// with an upgrade that creates its object stores, then get / getAll / put /
// delete per store. jsdom ships no IndexedDB, so before this every real path
// was uncovered; only the "no IndexedDB" no-op branch ran.
function makeIndexedDB() {
  const stores = new Map<string, Map<unknown, unknown>>()
  const db = {
    objectStoreNames: { contains: (name: string) => stores.has(name) },
    createObjectStore: (name: string) => {
      stores.set(name, new Map())
      return {}
    },
    transaction: (name: string) => ({
      objectStore: () => {
        const map = stores.get(name)!
        const request = (result: unknown) => {
          const req = { onsuccess: null as null | (() => void), onerror: null, result, error: null }
          queueMicrotask(() => req.onsuccess?.())
          return req
        }
        return {
          getAll: () => request([...map.values()]),
          get: (key: unknown) => request(map.get(key)),
          put: (value: unknown, key: unknown) => {
            map.set(key, value)
            return request(key)
          },
          delete: (key: unknown) => {
            map.delete(key)
            return request(undefined)
          },
        }
      },
    }),
  }
  return {
    open: () => {
      const req = {
        onsuccess: null as null | (() => void),
        onerror: null as null | (() => void),
        onupgradeneeded: null as null | (() => void),
        result: db,
        error: null,
      }
      queueMicrotask(() => {
        req.onupgradeneeded?.()
        req.onsuccess?.()
      })
      return req
    },
  }
}

/** A fresh module instance, so the cached database promise does not leak
 *  between the two scenarios. */
async function load(): Promise<typeof HandleStore> {
  vi.resetModules()
  return import('./handleStore')
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('handleStore', () => {
  it('round-trips the folder registry and the last-active pointer', async () => {
    vi.stubGlobal('indexedDB', makeIndexedDB())
    const store = await load()
    expect(await store.listVaultHandles()).toEqual([])
    expect(await store.getLastActiveId()).toBeNull()

    const handle = { name: 'notes' } as unknown as FileSystemDirectoryHandle
    await store.saveVaultHandle({ id: 'a', name: 'notes', handle })
    await store.setLastActiveId('a')

    expect(await store.listVaultHandles()).toEqual([{ id: 'a', name: 'notes', handle }])
    expect(await store.getLastActiveId()).toBe('a')

    await store.clearLastActiveId()
    expect(await store.getLastActiveId()).toBeNull()
    await store.clearVaultHandle('a')
    expect(await store.listVaultHandles()).toEqual([])
  })

  it('is a safe no-op where IndexedDB is absent', async () => {
    vi.stubGlobal('indexedDB', undefined)
    const store = await load()
    const handle = {} as FileSystemDirectoryHandle
    expect(await store.listVaultHandles()).toEqual([])
    expect(await store.getLastActiveId()).toBeNull()
    await expect(store.saveVaultHandle({ id: 'a', name: 'n', handle })).resolves.toBeUndefined()
    await expect(store.setLastActiveId('a')).resolves.toBeUndefined()
    await expect(store.clearVaultHandle('a')).resolves.toBeUndefined()
    await expect(store.clearLastActiveId()).resolves.toBeUndefined()
  })
})
