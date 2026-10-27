import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import {
  buildIndex,
  emptyIndex,
  upsertBoard,
  upsertPage,
  upsertPins,
  upsertReminders,
  type Graph,
  type ReminderRule,
  type VaultIndex,
} from './index'
import type { VaultStorage } from './storage'

// Binds the active folder's storage to its in-memory graph (design D6).
// Idle (no build, no listeners) when storage is undefined; rebuilds from
// empty when the storage changes; diff-refreshes on window focus, on
// visibility becoming visible, and on a visibility-gated interval (design
// D3 - external edits reach the index without restarting).
const REFRESH_INTERVAL_MS = 30_000

type Built = { storage: VaultStorage; graph: Graph; pins: string[]; reminders: ReminderRule[] }

/** The published index and the folder it belongs to (see `latest`). */
type Published = { storage: VaultStorage; index: VaultIndex }

// One shared empty list for the no-graph state (add-page-history, design D8):
// the sidebar is memoized, so a fresh [] on every render would defeat the memo
// while the index builds.
const EMPTY_PINS: string[] = []
const EMPTY_REMINDERS: ReminderRule[] = []

/** The write base for a page or board whose folder is no longer indexed: the
 *  call carries the whole content, so the file lands and the result is dropped
 *  by the publish guards below. Shared because it is never mutated: every
 *  write-through copies what it reads from it. */
const DETACHED_INDEX = emptyIndex()

export function useIndex(storage: VaultStorage | undefined): {
  graph: Graph | null
  pins: string[]
  reminders: ReminderRule[]
  savePage: (path: string, content: string) => Promise<boolean>
  saveBoard: (path: string, scene: string) => Promise<boolean>
  saveReminders: (rules: ReminderRule[]) => Promise<boolean>
  togglePin: (path: string) => Promise<boolean>
} {
  // The build result is tagged with the storage it came from and only shown
  // for that storage during render, so a folder switch derives a null graph
  // immediately (no stale flash) without a synchronous reset in the effect.
  const [built, setBuilt] = useState<Built | null>(null)
  const graph = built !== null && built.storage === storage ? built.graph : null
  const pins = built !== null && built.storage === storage ? built.pins : EMPTY_PINS
  const reminders = built !== null && built.storage === storage ? built.reminders : EMPTY_REMINDERS
  // The published index, tagged with the folder it belongs to: a write from a
  // folder that is no longer open writes its file through a detached base
  // instead of this index, and the next folder's build never diffs against
  // another folder's snapshot.
  const latest = useRef<Published | null>(null)
  // The folder the app is showing now. A write that resolves after a switch has
  // already landed in its own folder's file; this is what stops it publishing
  // its index over the folder the user opened instead.
  const activeStorage = useRef(storage)
  /* oxlint-disable-next-line react/refs */
  activeStorage.current = storage
  // Generation counter: bumped on every folder change (a switch or a close),
  // so an in-flight save from a previous folder never touches the new folder's
  // index.
  const generation = useRef(0)
  // Publish revision: bumped by every publish of the index. A refresh reads it
  // before it starts reading files and publishes only when it is unchanged, so
  // a refresh that was in flight when a write landed cannot put the pre-write
  // reminders or pins back (design D6, the lost-replacement bug).
  const revision = useRef(0)

  useEffect(() => {
    const store = storage
    let cancelled = false
    // One scan at a time per storage (a build in flight, whether the first one
    // or a refresh). Local to the effect, so a folder switch or StrictMode's
    // second mount starts its own scan instead of waiting on the old one.
    let building = false
    // Every folder change invalidates an in-flight write's right to publish,
    // a close included: the write itself still lands in its own folder.
    ++generation.current
    if (!store) return

    // Const arrow (not a hoisted function declaration) so TS keeps the
    // narrowed `store` inside the closure. One path for the first scan and
    // every refresh: a fresh build while there is no index yet, a diff when
    // there is one. The index is disposable (ADR-0004): a fresh build on every
    // folder switch, never cached across storages.
    const build = async (): Promise<void> => {
      if (cancelled || building) return
      const previous = latest.current?.storage === store ? latest.current.index : undefined
      const revAtStart = revision.current
      building = true
      try {
        const next = await buildIndex(store, previous)
        if (cancelled) return
        // A write-through landed while this build was reading: what it read is
        // older than the write's own index, so publishing would undo the
        // write. Drop this pass; the next tick reads again.
        if (revAtStart !== revision.current) return
        /* oxlint-disable-next-line react/immutability */
        latest.current = { storage: store, index: next }
        revision.current++
        setBuilt({ storage: store, graph: next.graph, pins: next.pins, reminders: next.reminders })
      } catch {
        // A transient failure (a page or the listing vanishing mid-scan, a
        // permission blip) must not reject: the current index stays, and the
        // next tick retries. Retrying the first build the same way is what
        // stops one bad scan from leaving the app on "Indexing notes" for the
        // whole session.
      } finally {
        building = false
      }
    }

    void build()

    const onVisibility = () => {
      if (document.visibilityState === 'visible') void build()
    }
    const interval = window.setInterval(() => {
      if (document.visibilityState === 'visible') void build()
    }, REFRESH_INTERVAL_MS)

    window.addEventListener('focus', build)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelled = true
      window.removeEventListener('focus', build)
      document.removeEventListener('visibilitychange', onVisibility)
      window.clearInterval(interval)
    }
  }, [storage])

  // Write-through actions (design B1, D1/D3): stable identities so callers can
  // hold them in effect dependencies, and non-optimistic — the graph changes
  // only after the write resolves, a failure reports false so the caller keeps
  // the page dirty and shows it.
  const savePage = useWriteThrough(
    upsertPage,
    'graph',
    storage,
    latest,
    activeStorage,
    generation,
    revision,
    setBuilt,
  )
  const saveBoard = useWriteThrough(
    upsertBoard,
    'graph',
    storage,
    latest,
    activeStorage,
    generation,
    revision,
    setBuilt,
  )
  const saveReminders = useWriteThrough(
    upsertReminders,
    'reminders',
    storage,
    latest,
    activeStorage,
    generation,
    revision,
    setBuilt,
  )
  const togglePin = useWriteThrough(
    togglePins,
    'pins',
    storage,
    latest,
    activeStorage,
    generation,
    revision,
    setBuilt,
  )

  return { graph, pins, reminders, savePage, saveBoard, saveReminders, togglePin }
}

/** Which part of the index a write owns; the rest is carried from the base it
 *  wrote through. */
type OwnedField = 'graph' | 'pins' | 'reminders'

/**
 * A write-through action over the active index: `write` persists the change,
 * then the result is published as the new index and the call reports success.
 * The returned function is stable per storage (every dep below is stable), so
 * callers can hold them in effect dependencies; the index is read from the ref at
 * call time, so a write always sees the latest one.
 *
 * A second publish can land while this write's file is on its way: another save,
 * or a refresh. So the publish takes the field this write owns from the write's
 * own result and the others from the newest index, and a write that carried the
 * pre-write reminders cannot put them back over a replacement (design D6, the
 * lost-replacement bug).
 */
function useWriteThrough<A extends unknown[]>(
  write: (storage: VaultStorage, current: VaultIndex, ...args: A) => Promise<VaultIndex>,
  owned: OwnedField,
  storage: VaultStorage | undefined,
  latest: RefObject<Published | null>,
  activeStorage: RefObject<VaultStorage | undefined>,
  generation: RefObject<number>,
  revision: RefObject<number>,
  setBuilt: (built: Built) => void,
): (...args: A) => Promise<boolean> {
  return useCallback(
    async (...args: A): Promise<boolean> => {
      if (!storage) return false
      const published = latest.current
      // A page or board save carries its whole content, so it can still land
      // after its folder stopped being the indexed one (a pending flush at a
      // folder switch). Pins and reminder rules derive their file from the
      // index, so they need it.
      const current =
        published?.storage === storage ? published.index : owned === 'graph' ? DETACHED_INDEX : null
      if (!current) return false
      const genAtStart = generation.current
      try {
        const next = await write(storage, current, ...args)
        // A folder switch while the write was in flight: the change landed in
        // that folder, but the new folder's index is not ours to touch — drop
        // the result instead of corrupting it.
        if (genAtStart !== generation.current) return true
        // A switch away and back to the same folder keeps the generation, so
        // the folder itself is the second half of the guard.
        if (activeStorage.current !== storage) return true
        // No index of this folder is published any more: the write landed in
        // its file, and the next build reads it from there.
        if (latest.current?.storage !== storage) return true
        const newest = latest.current.index
        // The snapshot stays the write's own: it heals this file's mtime, and
        // dropping an entry a refresh added only costs one re-read.
        const merged: VaultIndex = {
          graph: owned === 'graph' ? next.graph : newest.graph,
          snapshot: next.snapshot,
          pins: owned === 'pins' ? next.pins : newest.pins,
          reminders: owned === 'reminders' ? next.reminders : newest.reminders,
        }
        // The index ref is written after the write resolves; mutation from a
        // callback is exactly the intended write-through (the rule targets
        // render-time mutation and cannot see the await boundary).
        /* oxlint-disable react/immutability */
        latest.current = { storage, index: merged }
        revision.current++
        /* oxlint-enable react/immutability */
        setBuilt({ storage, graph: merged.graph, pins: merged.pins, reminders: merged.reminders })
        return true
      } catch {
        return false
      }
    },
    [write, owned, storage, latest, activeStorage, generation, revision, setBuilt],
  )
}

/** Pin toggle as a write-through: flip membership, prepend on pin (most
 *  recently pinned first), persist via upsertPins (design D1/D3). */
function togglePins(storage: VaultStorage, current: VaultIndex, path: string): Promise<VaultIndex> {
  const pinned = current.pins.includes(path)
  const nextPins = pinned ? current.pins.filter((p) => p !== path) : [path, ...current.pins]
  return upsertPins(storage, current, nextPins)
}
