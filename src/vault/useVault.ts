import { useEffect, useState } from 'react'
import { FileSystemVaultStorage, pickVaultFolder } from './fs'
import { isPagePath } from './index'
import type { VaultStorage } from './storage'
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

/** How long the restore may hold the app on its transitional state before the
 *  state settles anyway. Long enough for a real folder's first scan (the demo
 *  vault's own is instant; a network share's is not), short enough that a stuck
 *  one is not a trap. One deadline per mount, not a poll. */
export const RESTORE_DEADLINE_MS = 15_000

export interface VaultFolder {
  id: string
  name: string
  /** Absent for a virtual folder (the guided demo), which has no directory
   *  handle and therefore can never reach a real file (add-guided-demo). */
  handle?: FileSystemDirectoryHandle
  permission: PermissionState
  storage?: VaultStorage
  /** The folder's notes, by the index's own rule (isPagePath), so the number the
   *  bar shows before the index lands is the number it shows after. */
  noteCount?: number
  /** A session-only virtual vault: no handle, no stored row, no restore. */
  demo?: boolean
}

export function useVault() {
  const [status, setStatus] = useState<VaultStatus>('restoring')
  const [folders, setFolders] = useState<VaultFolder[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    // The restore waits on things this app does not control: the folder
    // registry's IndexedDB, a stored handle whose permission query never
    // settles, and a first scan of a folder that is large or on a network
    // share. Any of those leaving the promise pending would strand the app on
    // its transitional state, where the rail holds neither the picker nor a
    // folder entry and there is no way back. So the state settles on a
    // deadline, and a restore that answers late still fills the list in, unless
    // the user has already opened something.
    const settle = (restored: VaultFolder[] = []) => {
      if (cancelled) return
      setFolders((prev) => (prev.length === 0 ? restored : prev))
      setStatus('ready')
    }
    const deadline = setTimeout(() => settle(), RESTORE_DEADLINE_MS)
    void restore()
      .then(([restored, active]) => {
        if (cancelled) return
        clearTimeout(deadline)
        setFolders((prev) => (prev.length === 0 ? restored : prev))
        setActiveId((prev) => prev ?? active)
        setStatus('ready')
      })
      .catch(() => {
        // A folder registry that cannot be read (site data blocked, a blocked
        // upgrade, a failed open) leaves nothing to restore, which is the empty
        // state, not a reason to stay on "restoring" forever: the rail must
        // still offer the picker. Nothing is lost; the folders are still on
        // disk.
        clearTimeout(deadline)
        settle()
      })
    return () => {
      cancelled = true
      clearTimeout(deadline)
    }
  }, [])

  // Make a folder the active one, in state and in the stored last-active
  // pointer. Every path that activates a folder ends here. A virtual folder
  // (the demo) is not stored, so a reload restores the real folders unchanged
  // (add-guided-demo, design D2).
  async function makeActive(id: string, persist = true): Promise<void> {
    setActiveId(id)
    if (persist) await setLastActiveId(id)
  }

  // Activate an existing folder. Granted: switch (loading the count lazily).
  // Pending: re-grant from the STORED handle; denied/failed re-grant drops the
  // row and falls back to the picker (delta: denied stored folder).
  async function activate(id: string): Promise<void> {
    const target = folders.find((f) => f.id === id)
    if (!target) return
    if (target.permission === 'granted') {
      if (target.noteCount === undefined && target.storage) {
        const noteCount = await countNotes(target.storage)
        upsert(setFolders, { ...target, noteCount })
      }
      await makeActive(id, target.demo !== true)
      return
    }
    if (!target.handle) return
    const granted = await permission(target.handle, 'request')
    if (granted !== 'denied' && granted !== 'granted') {
      // Could not tell, or the browser wants another gesture: the row stays
      // listed and pending, so the next click can ask again. Nothing is dropped
      // on a click that did not actually get an answer.
      return
    }
    if (granted === 'granted') {
      const open = await openVault(target.handle)
      upsert(setFolders, {
        ...target,
        permission: granted,
        storage: open.storage,
        noteCount: open.noteCount,
      })
      await makeActive(id)
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
    const target = folders.find((f) => f.id === id)
    if (!target) return
    // A virtual folder has no stored handle; closing it discards its in-memory
    // contents and leaves the registry alone.
    if (target.demo !== true) await clearVaultHandle(id)
    setFolders((prev) => prev.filter((f) => f.id !== id))
    if (id === activeId) {
      setActiveId(null)
      if (target.demo !== true) await clearLastActiveId()
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
      if (await isSameHandle(f.handle, handle)) {
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
      noteCount: open.noteCount,
    })
    await makeActive(id)
  }

  // Add a vault that is not a directory (add-guided-demo): the demo's storage
  // is already built, so there is no picker, permission request, handle, or
  // stored row. Same one-entry-per-id dedup as a folder: a second request for a
  // listed virtual vault activates that row instead of replacing its contents.
  async function addVirtualFolder(folder: {
    id: string
    name: string
    storage: VaultStorage
    demo?: boolean
  }): Promise<void> {
    const existing = folders.find((f) => f.id === folder.id)
    if (existing) {
      await makeActive(existing.id, existing.demo !== true)
      return
    }
    const noteCount = await countNotes(folder.storage)
    upsert(setFolders, {
      id: folder.id,
      name: folder.name,
      permission: 'granted',
      storage: folder.storage,
      noteCount,
      demo: folder.demo,
    })
    await makeActive(folder.id, folder.demo !== true)
  }

  return {
    status,
    folders,
    activeId,
    addFolder: openNewFolder,
    addVirtualFolder,
    activate,
    closeFolder,
    goHome,
  }
}

// Boot flow: restore every granted stored folder (storage created lazily —
// the ctor does no IO), list a count only for the folder that becomes active,
// hold 'prompt' folders for the reconnect click, drop 'denied' ones. The
// active folder is the last-active one when present, else the first granted,
// else the first pending one, so a folder that needs one click to reopen is
// still the one the pane offers that click for.
//
// A start must never cost the reader their folders. Two failures used to: a
// registry read that failed once settled the app into the no-folder state for
// the session (the rows were still stored), and a permission *query* that threw
// was read as a refusal and deleted the row. So the read is retried once, a
// query that cannot answer keeps the folder as pending, and only a real
// 'denied' — which the browser reports, not an error — drops anything
// (fix: a stored folder survives a start that cannot ask).
async function restore(): Promise<[VaultFolder[], string | null]> {
  const rows = await readRegistry()
  const lastActiveId = await getLastActiveId()
  const restored: VaultFolder[] = []
  for (const row of rows) {
    const state = await permission(row.handle, 'query')
    // A real refusal is the one thing that drops a stored folder (the vault
    // requirement: a denied folder is dropped). 'error' is not a refusal: the
    // folder may be on a drive that is not mounted yet, or the profile may need
    // a gesture to answer, so it stays listed and pending.
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
            permission: 'granted',
            storage: new FileSystemVaultStorage(row.handle),
          }
        : { id: row.id, name: row.name, handle: row.handle, permission: 'prompt' },
    )
  }
  const active =
    restored.find((f) => f.id === lastActiveId) ??
    restored.find((f) => f.permission === 'granted') ??
    restored[0] ??
    null
  if (active?.storage) {
    try {
      active.noteCount = await countNotes(active.storage)
    } catch {
      // A count is decoration: a scan that fails at startup (a share that is
      // not reachable yet) must not take the folder with it. The index build
      // that follows reports its own failure.
    }
  }
  return [restored, active?.id ?? null]
}

/** How long to wait before reading the folder registry a second time: enough
 *  for a closing window to release its connection, or for the profile to finish
 *  starting, without making a genuinely broken registry feel slow. */
const REGISTRY_RETRY_MS = 400

/** The stored folders, read once more if the first read failed. A blocked open,
 *  a failed `getAll`, or a registry that is not readable yet all reject; the
 *  rows are still on disk, so one retry usually finds them. */
async function readRegistry(): Promise<Awaited<ReturnType<typeof listVaultHandles>>> {
  try {
    return await listVaultHandles()
  } catch {
    await new Promise((resolve) => setTimeout(resolve, REGISTRY_RETRY_MS))
    return listVaultHandles()
  }
}

/** isSameEntry behind a guard: some handles (and test fakes) do not expose it,
 *  and a throw must not abort the import's folder registration. */
async function isSameHandle(
  a: FileSystemDirectoryHandle | undefined,
  b: FileSystemDirectoryHandle,
): Promise<boolean> {
  if (!a) return false
  try {
    return await a.isSameEntry(b)
  } catch {
    return false
  }
}

/** How many notes the folder holds: the listing filtered by the index's own
 *  rule, so a pre-index count and the index's page count agree (this change's
 *  D1). Assets, boards, and `.folio` state are not notes. */
async function countNotes(storage: VaultStorage): Promise<number> {
  return (await storage.list('')).filter(isPagePath).length
}

async function openVault(handle: FileSystemDirectoryHandle) {
  const storage = new FileSystemVaultStorage(handle)
  return { storage, noteCount: await countNotes(storage) }
}

/** A permission answer, or 'error' when the browser could not answer at all. */
async function permission(
  handle: FileSystemDirectoryHandle,
  kind: 'query' | 'request',
): Promise<PermissionState | 'error'> {
  try {
    return kind === 'query'
      ? await handle.queryPermission({ mode: 'readwrite' })
      : await handle.requestPermission({ mode: 'readwrite' })
  } catch {
    // Could not answer (jsdom has neither method; a real browser refuses to
    // answer without a gesture, or the handle's folder is unreachable). That is
    // not a refusal, so it never drops a folder: the caller treats it as
    // pending and asks again on a click.
    return 'error'
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
