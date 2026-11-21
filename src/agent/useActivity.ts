// The session's record of what an agent did, as state (add-agent-activity-log,
// D4). The list is newest first and bounded, so the surface renders it without
// sorting or slicing, and the count is its length. While the gate is off nothing
// is appended, so the record cannot grow in a build that exposes no tools.

import { useCallback, useState } from 'react'
import { appendActivity, EMPTY_ACTIVITY, type ActivityEntry } from './activity'
import type { TraceSink } from '../trace/session'

export type ActivityRecorder = {
  /** The session's entries, newest first. Stable between appends. */
  entries: readonly ActivityEntry[]
  /** Record one action. Ignored while the gate is off. */
  record: (entry: ActivityEntry) => void
  /** Drop the record: a folder switch starts a new session, and the paths an
   *  entry names belong to the folder it was recorded in. */
  reset: () => void
}

export function useActivity(enabled: boolean, sink: TraceSink | null): ActivityRecorder {
  const [entries, setEntries] = useState<readonly ActivityEntry[]>(EMPTY_ACTIVITY)
  const record = useCallback(
    (entry: ActivityEntry) => {
      if (!enabled) return
      setEntries((list) => appendActivity(list, entry, sink))
    },
    [enabled, sink],
  )
  const reset = useCallback(() => setEntries(EMPTY_ACTIVITY), [])
  return { entries, record, reset }
}
