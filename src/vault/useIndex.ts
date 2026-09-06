import { useCallback, useEffect, useRef, useState } from 'react'
import { buildIndex, refreshIndex, upsertPage, type Graph, type VaultIndex } from './index'
import type { VaultStorage } from './storage'

// Binds the active folder's storage to its in-memory graph (design D6).
// Idle (no build, no listeners) when storage is undefined; rebuilds from
// empty when the storage changes; diff-refreshes on window focus, on
// visibility becoming visible, and on a visibility-gated interval (design
// D3 - external edits reach the index without restarting).
const REFRESH_INTERVAL_MS = 30_000

export function useIndex(storage: VaultStorage | undefined): {
  graph: Graph | null
  savePage: (path: string, content: string) => Promise<boolean>
} {
  // The build result is tagged with the storage it came from and only shown
  // for that storage during render, so a folder switch derives a null graph
  // immediately (no stale flash) without a synchronous reset in the effect.
  const [built, setBuilt] = useState<{ storage: VaultStorage; graph: Graph } | null>(null)
  const graph = built !== null && built.storage === storage ? built.graph : null
  const latest = useRef<VaultIndex | null>(null)
  const inflight = useRef(false)
  // Generation counter: bumped when the storage changes, so an in-flight save
  // from a previous folder never touches the new folder's index.
  const generation = useRef(0)

  useEffect(() => {
    const store = storage
    if (!store) {
      latest.current = null
      return
    }
    let cancelled = false
    ++generation.current
    latest.current = null

    // The index is disposable (ADR-0004): a fresh build on every folder
    // switch, never cached across storages.
    void buildIndex(store)
      .then((index) => {
        if (cancelled) return
        latest.current = index
        setBuilt({ storage: store, graph: index.graph })
      })
      .catch(() => {
        // Permission/folder failures keep the current state (no error UI).
      })

    // Const arrow (not a hoisted function declaration) so TS keeps the
    // narrowed `store` inside the closure.
    const refresh = async (): Promise<void> => {
      if (cancelled || inflight.current) return
      const current = latest.current
      if (!current) return
      inflight.current = true
      try {
        const next = await refreshIndex(store, current)
        if (cancelled) return
        latest.current = next
        setBuilt({ storage: store, graph: next.graph })
      } finally {
        inflight.current = false
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void refresh()
    }, REFRESH_INTERVAL_MS)

    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', onVisibility)
      window.clearInterval(interval)
    }
  }, [storage])

  // Write-through save (design B1), kept in a ref so callers always see a
  // stable identity and a fresh `storage` closure. Non-optimistic: the graph
  // updates only after the write resolves; a failed write reports false so the
  // caller keeps the page dirty and shows the failure.
  const savePageRef = useRef<(path: string, content: string) => Promise<boolean>>(
    async () => false,
  )
  useEffect(() => {
    const store = storage
    const current = latest.current
    savePageRef.current = async (path: string, content: string): Promise<boolean> => {
      if (!store || !current) return false
      const genAtStart = generation.current
      try {
        const next = await upsertPage(store, current, path, content)
        // A folder switch while the write was in flight: the file is saved (the
        // draft belonged to that folder), but the new folder's index is not ours
        // to touch — drop the result instead of corrupting it.
        if (genAtStart !== generation.current) return true
        latest.current = next
        setBuilt({ storage: store, graph: next.graph })
        return true
      } catch {
        return false
      }
    }
  })
  // Stable identity regardless of re-renders (the effect above repoints the
  // underlying ref), so callers can hold this in effect dependencies.
  const savePage = useCallback(
    (path: string, content: string): Promise<boolean> =>
      savePageRef.current(path, content),
    [],
  )

  return { graph,
    savePage,
  }
}