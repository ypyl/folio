// Debounced writer (design C1/C2): re-arms a single timer on every schedule
// and, after a pause, flushes the accumulated drafts sequentially — one write
// in flight at a time — so rapid edits collapse into one save per page and
// the index upsert never races another upsert. Page-pending entries that
// become clean before the flush (an undo back to the saved text) are skipped
// by the caller's compare-skip in the save function.
//
// A save that does not land keeps its text (fix: a failed save is not lost). The
// write is retried on the same debounce a bounded number of times, and the entry
// stays pending after that, so the next flush — a hidden tab, a page going away —
// tries it again instead of the last edits existing only in memory.

type SaveFn = (path: string, content: string) => Promise<boolean>

/** How many times a failed write is retried on its own before the text is left
 *  to the next flush. Enough that a transient failure (a permission re-prompt, a
 *  share that blinks) heals by itself; few enough that a folder that can never be
 *  written is not hammered once a second. */
const RETRY_LIMIT = 3

export function createDebouncedSaver(save: SaveFn, delay: number) {
  let timer: ReturnType<typeof setTimeout> | null = null
  const pending = new Map<string, string>()
  /** Consecutive failures per path, cleared by a save that lands and by a new
   *  edit: a fresh keystroke earns a fresh set of retries. */
  const failures = new Map<string, number>()
  // Flushes run one after another. The timer and a `pagehide`/`dispose` flush can
  // both fire while a write is on its way, and two overlapping flushes could
  // write the same page concurrently — the file then holds whichever write
  // closes last, which can be the older text.
  let queue: Promise<void> = Promise.resolve()
  let disposed = false

  /** (Re-)arm the one timer the saver keeps. */
  function arm(): void {
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(() => {
      void flush()
    }, delay)
  }

  function schedule(path: string, content: string): void {
    pending.set(path, content)
    failures.delete(path)
    arm()
  }

  /** Write every scheduled draft in path order, sequentially, and never
   *  alongside another flush. */
  function flush(): Promise<void> {
    if (timer !== null) clearTimeout(timer)
    timer = null
    const items = [...pending]
    pending.clear()
    if (items.length === 0) return queue
    queue = queue.then(async () => {
      let retry = false
      for (const [path, content] of items) {
        const ok = await save(path, content)
        if (ok) {
          failures.delete(path)
          continue
        }
        const failed = (failures.get(path) ?? 0) + 1
        failures.set(path, failed)
        // The text this write carried is still unsaved, so it stays pending. A
        // newer edit already queued for the same page wins: it is a later text.
        if (!pending.has(path)) pending.set(path, content)
        if (failed <= RETRY_LIMIT) retry = true
      }
      // Retry on the saver's own delay, unless this saver is going away (its
      // dispose already asked for one last write, and nothing will read a
      // timer's result).
      if (retry && !disposed) arm()
    })
    return queue
  }

  /** Stop the timer and write what is pending. Disposing must not drop the last
   *  edits: a folder switch or an unmount would otherwise lose the text typed
   *  inside the debounce window. The writes run in the flush queue here, and the
   *  save function's own compare-skip still drops a page that went back to its
   *  saved text. */
  function dispose(): void {
    disposed = true
    void flush()
  }

  /** How many writes the next flush would carry (add-session-trace-logs): the
   *  session trace records a flush with its size, and an empty flush with a
   *  non-empty one are different facts. Reads the map; writes nothing. */
  function pendingCount(): number {
    return pending.size
  }

  return { schedule, flush, dispose, pending: pendingCount }
}
