import { useCallback, useEffect, useRef, useState } from 'react'
import {
  buildIndex,
  refreshIndex,
  upsertPage,
  upsertPins,
  type Graph,
  type VaultIndex,
} from './index'
import type { VaultStorage } from './storage'

// Binds the active folder's storage to its in-memory graph (design D6).
// Idle (no build, no listeners) when storage is undefined; rebuilds from
// empty when the storage changes; diff-refreshes on window focus, on
// visibility becoming visible, and on a visibility-gated interval (design
// D3 - external edits reach the index without restarting).
const REFRESH_INTERVAL_MS = 30_000

export function useIndex(storage: VaultStorage | undefined): {
  graph: Graph | null
  pins: string[]
  savePage: (path: string, content: string) => Promise<boolean>
  togglePin: (path: string) => Promise<boolean>
} {
  // The build result is tagged with the storage it came from and only shown
  // for that storage during render, so a folder switch derives a null graph
  // immediately (no stale flash) without a synchronous reset in the effect.
  const [built, setBuilt] = useState<{
    storage: VaultStorage
    graph: Graph
    pins: string[]
  } | null>(null)
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
        const next = await refreshIndex(store, current)
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

  // Write-through save (design B1), kept in a ref so callers always see a
  // stable identity and a fresh `storage` closure. Non-optimistic: the graph
  // updates only after the write resolves; a failed write reports false so the
  // caller keeps the page dirty and shows the failure.
  const savePageRef = useRef<(path: string, content: string) => Promise<boolean>>(async () => false)
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
        setBuilt({ storage: store, graph: next.graph, pins: next.pins })
        return true
      } catch {
        return false
      }
    }
  })
  // Stable identity regardless of re-renders (the effect above repoints the
  // underlying ref), so callers can hold this in effect dependencies.
  const savePage = useCallback(
    (path: string, content: string): Promise<boolean> => savePageRef.current(path, content),
    [],
  )

  // Write-through pin toggle (design D1/D3), same shape as savePage: flip
  // membership, prepend on pin (most recently pinned first), persist via
  // upsertPins, non-optimistic — a failed write reports false and the pins
  // stay as they were.
  const togglePinRef = useRef<(path: string) => Promise<boolean>>(async () => false)
  useEffect(() => {
    const store = storage
    togglePinRef.current = async (path: string): Promise<boolean> => {
      const current = latest.current
      if (!store || !current) return false
      const genAtStart = generation.current
      try {
        const pinned = current.pins.includes(path)
        const nextPins = pinned ? current.pins.filter((p) => p !== path) : [path, ...current.pins]
        const next = await upsertPins(store, current, nextPins)
        // A folder switch while the write was in flight: the pins file was
        // written into that folder, but the new folder's index is not ours
        // to touch — drop the result instead of corrupting it.
        if (genAtStart !== generation.current) return true
        latest.current = next
        setBuilt({ storage: store, graph: next.graph, pins: next.pins })
        return true
      } catch {
        return false
      }
    }
  })
  // Stable identity regardless of re-renders (the effect above repoints the
  // underlying ref), so callers can hold this in effect dependencies.
  const togglePin = useCallback((path: string): Promise<boolean> => togglePinRef.current(path), [])

  return { graph, pins, savePage, togglePin }
}
