import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { buildIndex, upsertPage, upsertPins, type Graph, type VaultIndex } from './index'
import type { VaultStorage } from './storage'

// Binds the active folder's storage to its in-memory graph (design D6).
// Idle (no build, no listeners) when storage is undefined; rebuilds from
// empty when the storage changes; diff-refreshes on window focus, on
// visibility becoming visible, and on a visibility-gated interval (design
// D3 - external edits reach the index without restarting).
const REFRESH_INTERVAL_MS = 30_000

type Built = { storage: VaultStorage; graph: Graph; pins: string[] }

export function useIndex(storage: VaultStorage | undefined): {
  graph: Graph | null
  pins: string[]
  savePage: (path: string, content: string) => Promise<boolean>
  togglePin: (path: string) => Promise<boolean>
} {
  // The build result is tagged with the storage it came from and only shown
  // for that storage during render, so a folder switch derives a null graph
  // immediately (no stale flash) without a synchronous reset in the effect.
  const [built, setBuilt] = useState<Built | null>(null)
  const graph = built !== null && built.storage === storage ? built.graph : null
  const pins = built !== null && built.storage === storage ? built.pins : []
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
        setBuilt({ storage: store, graph: index.graph, pins: index.pins })
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
        const next = await buildIndex(store, current)
        if (cancelled) return
        latest.current = next
        setBuilt({ storage: store, graph: next.graph, pins: next.pins })
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

  // Write-through actions (design B1, D1/D3): stable identities so callers can
  // hold them in effect dependencies, and non-optimistic — the graph changes
  // only after the write resolves, a failure reports false so the caller keeps
  // the page dirty and shows it.
  const savePage = useWriteThrough(upsertPage, storage, latest, generation, setBuilt)
  const togglePin = useWriteThrough(togglePins, storage, latest, generation, setBuilt)

  return { graph, pins, savePage, togglePin }
}

/**
 * A write-through action over the active index: `write` persists the change,
 * then the result is published as the new index and the call reports success.
 * Kept in a ref (repointed every render) so the returned function has a stable
 * identity while still seeing the current storage and index.
 */
function useWriteThrough<A extends unknown[]>(
  write: (storage: VaultStorage, current: VaultIndex, ...args: A) => Promise<VaultIndex>,
  storage: VaultStorage | undefined,
  latest: RefObject<VaultIndex | null>,
  generation: RefObject<number>,
  setBuilt: (built: Built) => void,
): (...args: A) => Promise<boolean> {
  const ref = useRef<(...args: A) => Promise<boolean>>(async () => false)
  useEffect(() => {
    const store = storage
    const current = latest.current
    ref.current = async (...args: A): Promise<boolean> => {
      if (!store || !current) return false
      const genAtStart = generation.current
      try {
        const next = await write(store, current, ...args)
        // A folder switch while the write was in flight: the change landed in
        // that folder, but the new folder's index is not ours to touch — drop
        // the result instead of corrupting it.
        if (genAtStart !== generation.current) return true
        latest.current = next
        setBuilt({ storage: store, graph: next.graph, pins: next.pins })
        return true
      } catch {
        return false
      }
    }
  })
  return useCallback((...args: A) => ref.current(...args), [])
}

/** Pin toggle as a write-through: flip membership, prepend on pin (most
 *  recently pinned first), persist via upsertPins (design D1/D3). */
function togglePins(storage: VaultStorage, current: VaultIndex, path: string): Promise<VaultIndex> {
  const pinned = current.pins.includes(path)
  const nextPins = pinned ? current.pins.filter((p) => p !== path) : [path, ...current.pins]
  return upsertPins(storage, current, nextPins)
}
