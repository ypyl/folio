import { useEffect, useRef, useState } from 'react'
import { buildIndex, refreshIndex, type Graph, type VaultIndex } from './index'
import type { VaultStorage } from './storage'

// Binds the active folder's storage to its in-memory graph (design D6).
// Idle (no build, no listeners) when storage is undefined; rebuilds from
// empty when the storage changes; diff-refreshes on window focus, on
// visibility becoming visible, and on a visibility-gated interval (design
// D3 - external edits reach the index without restarting).
const REFRESH_INTERVAL_MS = 30_000

export function useIndex(storage: VaultStorage | undefined): { graph: Graph | null } {
  // The build result is tagged with the storage it came from and only shown
  // for that storage during render, so a folder switch derives a null graph
  // immediately (no stale flash) without a synchronous reset in the effect.
  const [built, setBuilt] = useState<{ storage: VaultStorage; graph: Graph } | null>(null)
  const graph = built !== null && built.storage === storage ? built.graph : null
  const latest = useRef<VaultIndex | null>(null)
  const inflight = useRef(false)

  useEffect(() => {
    const store = storage
    if (!store) {
      latest.current = null
      return
    }
    let cancelled = false
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

  return { graph }
}