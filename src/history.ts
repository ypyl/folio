// The session trail of opened pages (add-page-history, add-history-navigation).
// Folio's navigation is one-way: every route that opens a page replaces the open
// one. The trail is what makes Back and Forward possible, and the cursor is what
// makes them coherent: a new navigation starts a fresh line ahead of the cursor,
// stepping moves the cursor without touching the entries, and nothing about
// either writes to disk (ADR-0001, ADR-0004).

/** How many entries the trail keeps. The cap bounds the state and the work per
 *  navigation, whatever the vault contains. */
export const HISTORY_CAP = 20

/** The trail: the pages opened this session in order, and the cursor marking
 *  the page that is open. `cursor` is -1 only while nothing is recorded. */
export type Trail = {
  entries: string[]
  cursor: number
}

/** A session with nothing recorded: the state a folder switch returns to. */
export const EMPTY_TRAIL: Trail = { entries: [], cursor: -1 }

/** The page the cursor marks, or null while the trail is empty. */
export function trailPath(trail: Trail): string | null {
  return trail.entries[trail.cursor] ?? null
}

/** Whether a `delta` step (±1) has anywhere to go. */
export function canStep(trail: Trail, delta: number): boolean {
  const next = trail.cursor + delta
  return next >= 0 && next < trail.entries.length
}

/** Move the cursor one entry. The entries never change, so stepping can never
 *  rewrite what Back and Forward walk through; returns the trail unchanged when
 *  there is nowhere to step. */
export function stepTrail(trail: Trail, delta: number): Trail {
  if (!canStep(trail, delta)) return trail
  return { entries: trail.entries, cursor: trail.cursor + delta }
}

/** Record an open. A repeat of the page the cursor marks adds nothing; anything
 *  else discards every entry ahead of the cursor and appends, so Forward only
 *  ever points at pages in the line the user actually walked. Past the cap the
 *  oldest entry is dropped and the cursor moves with it, so the open page stays
 *  marked. */
export function appendTrail(trail: Trail, path: string): Trail {
  if (trail.entries[trail.cursor] === path) return trail
  const entries = [...trail.entries.slice(0, trail.cursor + 1), path]
  let cursor = entries.length - 1
  const dropped = Math.max(0, entries.length - HISTORY_CAP)
  if (dropped > 0) cursor -= dropped
  return { entries: dropped > 0 ? entries.slice(dropped) : entries, cursor }
}
