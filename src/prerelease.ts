// Prerelease mode (add-prerelease-mode): an app-level preference that turns on
// features which ship behind a flag. It is not vault content: one value for
// every vault, stored in the browser, so it never writes a file.

import { useCallback, useState } from 'react'

/** The preference key. A new key needs no migration; absent means off. */
const KEY = 'folio.prerelease'

/** The saved mode, false when browser storage is unavailable. */
export function readPrerelease(): boolean {
  try {
    return localStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

/** Persist the mode. A storage failure leaves the session's in-memory state. */
export function writePrerelease(on: boolean): void {
  try {
    localStorage.setItem(KEY, on ? '1' : '0')
  } catch {
    // Storage unavailable (private mode): the in-memory state still applies.
  }
}

/** The prerelease mode as React state, persisted across reloads. */
export function usePrerelease(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(readPrerelease)
  const set = useCallback((next: boolean) => {
    writePrerelease(next)
    setOn(next)
  }, [])
  return [on, set]
}
