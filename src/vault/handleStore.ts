// Folder-registry IndexedDB shim (D1). The `handles` store holds one row per
// opened folder ({ id, name, handle }) keyed by id, and the `meta` store the
// last-active id — both survive reloads while the picker's session grant does
// not. jsdom has no IndexedDB, so every call is null/no-op safe there (D6);
// the real round-trip is covered by task-6 e2e. Version 2: adding the `meta`
// store requires a bump.

interface StoredVaultFolder {
  id: string
  name: string
  handle: FileSystemDirectoryHandle
}

export async function listVaultHandles(): Promise<StoredVaultFolder[]> {
  const store = await openStore('handles', 'readonly')
  if (!store) return []
  // Rows are written only by saveVaultHandle below; the stored shape is ours.
  return request(store.getAll())
}

export async function saveVaultHandle(row: StoredVaultFolder): Promise<void> {
  const store = await openStore('handles', 'readwrite')
  if (!store) return
  await request(store.put(row, row.id))
}

export async function clearVaultHandle(id: string): Promise<void> {
  const store = await openStore('handles', 'readwrite')
  if (!store) return
  await request(store.delete(id))
}

export async function getLastActiveId(): Promise<string | null> {
  const store = await openStore('meta', 'readonly')
  if (!store) return null
  return (await request(store.get('lastActiveId'))) ?? null
}

export async function setLastActiveId(id: string): Promise<void> {
  const store = await openStore('meta', 'readwrite')
  if (!store) return
  await request(store.put(id, 'lastActiveId'))
}

/** Clear the last-active pointer so the next boot opens the empty state. */
export async function clearLastActiveId(): Promise<void> {
  const store = await openStore('meta', 'readwrite')
  if (!store) return
  await request(store.delete('lastActiveId'))
}

let dbPromise: Promise<IDBDatabase | null> | null = null

function openDb(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null)
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase | null>((resolve, reject) => {
      const open = indexedDB.open('folio', 2)
      open.onupgradeneeded = () => {
        if (!open.result.objectStoreNames.contains('handles')) {
          open.result.createObjectStore('handles')
        }
        if (!open.result.objectStoreNames.contains('meta')) {
          open.result.createObjectStore('meta')
        }
      }
      open.onsuccess = () => resolve(open.result)
      open.onerror = () => reject(open.error)
    })
  }
  return dbPromise
}

async function openStore(name: string, mode: IDBTransactionMode): Promise<IDBObjectStore | null> {
  const db = await openDb()
  if (!db) return null
  return db.transaction(name, mode).objectStore(name)
}

function request<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
