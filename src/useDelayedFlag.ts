// A boolean that is late on purpose (show-what-is-loading, design D1/D2).
//
// The shell has to say when it is reopening a stored folder, but a start that
// settles in a few milliseconds must not flash loading shapes on the way to
// content. So the value is held: it becomes true only after it has held for
// `delayMs`, and a value that drops before then never renders the delayed state
// at all.

import { useEffect, useState } from 'react'

/** How long the app waits before telling a reader it is opening their folder.
 *  Long enough that a warm start shows no placeholder, short enough that a slow
 *  one explains itself before the reader wonders. */
export const HOLD_MS = 150

export function useDelayedFlag(value: boolean, delayMs: number = HOLD_MS): boolean {
  const [held, setHeld] = useState(false)
  // The value this state was last reconciled with. Adjusting state during render
  // is how React resets state on a prop change without an effect: a value that
  // turned off must not leave a held `true` behind for the next rise.
  const [seen, setSeen] = useState(value)
  if (value !== seen) {
    setSeen(value)
    if (!value) setHeld(false)
  }

  useEffect(() => {
    if (!value) return
    const timer = setTimeout(() => setHeld(true), delayMs)
    return () => clearTimeout(timer)
  }, [value, delayMs])

  return value && held
}
