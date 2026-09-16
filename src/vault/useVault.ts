import { useEffect, useState } from 'react'
import { FileSystemVaultStorage, pickVaultFolder } from './fs'
import {
  clearLastActiveId,
  clearVaultHandle,
  getLastActiveId,
  listVaultHandles,
  saveVaultHandle,
  setLastActiveId,
} from './handleStore'

// queryPermission/requestPermission were dropped from lib.dom in TS 6;
// declare the two members this file needs (isSameEntry survives).
declare global {
  interface FileSystemHandle {
    queryPermission(options?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>
    requestPermission(options?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>
  }
}

// Owns the multi-folder state machine (design.md D2). Boot restores every
// granted stored folder silently (count only for the last-active one), holds
// pending-permission folders without storage so their rail entry can re-grant
// on click, and drops denied ones. All permission paths run inside a user
// gesture — requestPermission requires one — and never re-pick.

export type VaultStatus = 'restoring' | 'ready'

export interface VaultFolder {
  id: string
  name: string
  handle: FileSystemDirectoryHandle
  permission: PermissionState
  storage?: FileSystemVaultStorage
  fileCount?: number
}

export function useVault() {
  const [status, setStatus] = useState<VaultStatus>('restoring')
  const [folders, setFolders] = useState<VaultFolder[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void restore().then(([restored, active]) => {
      if (cancelled) return
      setFolders(restored)
      setActiveId(active)
      setStatus('ready')
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Activate an existing folder. Granted: switch (loading the count lazily).
  // Pending: re-grant from the STORED handle; denied/failed re-grant drops the
  // row and falls back to the picker (delta: denied stored folder).
  async function activate(id: string): Promise<void> {
    const target = folders.find((f) => f.id === id)
    if (!target) return
    if (target.permission === 'granted') {
      if (target.fileCount === undefined && target.storage) {
        const fileCount = (await target.storage.list('')).length
        upsert(setFolders, { ...target, fileCount })
      }
      setActiveId(id)
      await setLastActiveId(id)
      return
    }
    const granted = await permission(target.handle, 'request')
    if (granted === 'granted') {
      const open = await openVault(target.handle)
      upsert(setFolders, {
        ...target,
        permission: granted,
        storage: open.storage,
        fileCount: open.fileCount,
      })
      setActiveId(id)
      await setLastActiveId(id)
      return
    }
    // Denied or failed re-grant: the stored handle is dead.
    await clearVaultHandle(id)
    setFolders((prev) => prev.filter((f) => f.id !== id))
    await openNewFolder(id)
  }

  // Close a folder: forget it (rail row + stored handle) and, when it was
  // active, return home (no active folder, last-active cleared). Closing a
  // non-active folder only removes its entry and leaves the active folder.
  async function closeFolder(id: string): Promise<void> {
    if (!folders.some((f) => f.id === id)) return
    await clearVaultHandle(id)
    setFolders((prev) => prev.filter((f) => f.id !== id))
    if (id === activeId) {
      setActiveId(null)
      await clearLastActiveId()
    }
  }

  // Return home: make no folder active and clear the last-active pointer so
  // a reload also opens the empty state. Never forgets a folder.
  async function goHome(): Promise<void> {
    setActiveId(null)
    await clearLastActiveId()
  }

  // Add a folder from the picker. Re-picking an already-opened folder
  // activates the existing entry instead of duplicating it (D1 dedup).
  // excludeId: a just-dropped folder must be re-addable as a fresh row.
  async function openNewFolder(excludeId?: string): Promise<void> {
    let handle: FileSystemDirectoryHandle
    try {
      handle = await pickVaultFolder()
    } catch {
      return // user cancelled the picker; stay in current state
    }
    for (const f of folders) {
      if (f.id === excludeId) continue
      if (await f.handle.isSameEntry(handle)) {
        await activate(f.id)
        return
      }
    }
    const id = crypto.randomUUID()
    const open = await openVault(handle)
    await saveVaultHandle({ id, name: handle.name, handle })
    upsert(setFolders, {
      id,
      name: handle.name,
      handle,
      permission: 'granted',
      storage: open.storage,
      fileCount: open.fileCount,
    })
    setActiveId(id)
    await setLastActiveId(id)
  }

  return { status, folders, activeId, addFolder: openNewFolder, activate, closeFolder, goHome }
}

// Boot flow: restore every granted stored folder (storage created lazily —
// the ctor does no IO), list a count only for the folder that becomes active,
// hold 'prompt' folders for the reconnect click, drop 'denied' ones. The
// active folder is the last-active one when present, else the first granted.
async function restore(): Promise<[VaultFolder[], string | null]> {
  const rows = await listVaultHandles()
  const lastActiveId = await getLastActiveId()
  const restored: VaultFolder[] = []
  for (const row of rows) {
    const state = await permission(row.handle, 'query')
    if (state === 'denied') {
      await clearVaultHandle(row.id)
      continue
    }
    restored.push(
      state === 'granted'
        ? {
            id: row.id,
            name: row.name,
            handle: row.handle,
            permission: state,
            storage: new FileSystemVaultStorage(row.handle),
          }
        : { id: row.id, name: row.name, handle: row.handle, permission: state },
    )
  }
  const active =
    restored.find((f) => f.id === lastActiveId) ??
    restored.find((f) => f.permission === 'granted') ??
    null
  if (active?.storage) {
    active.fileCount = (await active.storage.list('')).length
  }
  return [restored, active?.id ?? null]
}

async function openVault(handle: FileSystemDirectoryHandle) {
  const storage = new FileSystemVaultStorage(handle)
  const files = await storage.list('')
  return { storage, fileCount: files.length }
}

/** A permission request's outcome, or 'denied' when the browser throws
 *  (jsdom has neither method). */
async function permission(
  handle: FileSystemDirectoryHandle,
  kind: 'query' | 'request',
): Promise<PermissionState> {
  try {
    return kind === 'query'
      ? await handle.queryPermission({ mode: 'readwrite' })
      : await handle.requestPermission({ mode: 'readwrite' })
  } catch {
    return 'denied'
  }
}

function upsert(
  set: (fn: (prev: VaultFolder[]) => VaultFolder[]) => void,
  folder: VaultFolder,
): void {
  set((prev) => {
    const i = prev.findIndex((f) => f.id === folder.id)
    return i < 0 ? [...prev, folder] : prev.map((f, j) => (j === i ? folder : f))
  })
}
