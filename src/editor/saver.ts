// Debounced writer (design C1/C2): re-arms a single timer on every schedule
// and, after a pause, flushes the accumulated drafts sequentially — one write
// in flight at a time — so rapid edits collapse into one save per page and
// the index upsert never races another upsert. Page-pending entries that
// become clean before the flush (an undo back to the saved text) are skipped
// by the caller's compare-skip in the save function.

type SaveFn = (path: string, content: string) => Promise<boolean>

export function createDebouncedSaver(save: SaveFn, delay: number) {
  let timer: ReturnType<typeof setTimeout> | null = null
  const pending = new Map<string, string>()

  function schedule(path: string, content: string): void {
    pending.set(path, content)
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(() => {
      void flush()
    }, delay)
  }

  /** Write every scheduled draft in path order, sequentially. */
  async function flush(): Promise<void> {
    if (timer !== null) clearTimeout(timer)
    timer = null
    const items = [...pending]
    pending.clear()
    for (const [path, content] of items) {
      await save(path, content)
    }
  }

  /** Stop the timer and write what is pending. Disposing must not drop the last
   *  edits: a folder switch or an unmount would otherwise lose the text typed
   *  inside the debounce window. The writes are fire-and-forget here, and the
   *  save function's own compare-skip still drops a page that went back to its
   *  saved text. */
  function dispose(): void {
    void flush()
  }

  return { schedule, flush, dispose }
}
