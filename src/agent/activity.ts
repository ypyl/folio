// What an agent did on the user's behalf (add-agent-activity-log, ADR-0036):
// one entry per action, so a change the user did not make is distinguishable
// from one they did. A log for review, not a ledger: entries are never revised,
// and nothing is stored beyond the session except the trace line each one
// mirrors into (ADR-0035). No page text ever enters an entry.
//
// Keystroke budget: nothing here runs on the typing path. An entry is appended
// only when an action lands, and the append is one array build bounded by
// ACTIVITY_CAP plus, at most, one buffered trace line.

import type { TraceSink } from '../trace/session'

/** One recorded action. Paths are vault-relative, as ADR-0013 defines them. */
export type ActivityEntry = {
  /** When the action landed, in epoch milliseconds. */
  at: number
  /** The action's name, as the surface the agent called names it. */
  tool: string
  /** The vault-relative path the action touched. */
  path: string
  /** Lines the action added. */
  added: number
  /** Lines the action removed. */
  removed: number
}

/** How many entries the session keeps. Past it the oldest is dropped, the way
 *  the trace caps its own lines, so a long session stays bounded. */
export const ACTIVITY_CAP = 200

/** The empty record. One shared instance, so an empty list never re-renders. */
export const EMPTY_ACTIVITY: readonly ActivityEntry[] = []

/**
 * The record with `entry` at its head, oldest dropped past the cap. The trace
 * line is written through `sink` when one is given: the durable half names the
 * action, the path, and the counts, and never the page's text (ADR-0035).
 */
export function appendActivity(
  list: readonly ActivityEntry[],
  entry: ActivityEntry,
  sink?: TraceSink | null,
): readonly ActivityEntry[] {
  sink?.event('info', 'agent', {
    tool: entry.tool,
    path: entry.path,
    added: entry.added,
    removed: entry.removed,
  })
  const next = [entry, ...list]
  return next.length > ACTIVITY_CAP ? next.slice(0, ACTIVITY_CAP) : next
}
