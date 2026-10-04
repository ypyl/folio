import { useEffect, useState } from 'react'

// The compact shell's breakpoint (add-compact-mobile-shell, design D2).
//
// The width is needed in two places, and declared in both because neither can
// read the other: here, because the shell's behavior depends on it (whether the
// collapse strips exist, whether a fold applies, and which view leads at load),
// and in `src/index.css`, because the compact composition is a layout the
// browser applies before any state settles. `compact.test.ts` reads the
// stylesheets from disk and fails when the two disagree — the guard
// `scrollRegions.test.ts` puts under a CSS rule, for the same reason.
export const COMPACT_BREAKPOINT_PX = 640

/** The condition both declarations describe. */
export const COMPACT_QUERY = `(max-width: ${COMPACT_BREAKPOINT_PX}px)`

/** The three views the compact shell shows one at a time (design D1). */
export type CompactView = 'nav' | 'editor' | 'meta'

/** Whether this window is at or below the breakpoint, read at render time.
 *  Guarded rather than assumed: jsdom ships no `matchMedia`, and no
 *  `matchMedia` means the wide composition — which is what every test that
 *  does not stub it is asserting. */
export function matchesCompact(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(COMPACT_QUERY).matches
    : false
}

/** Follow the breakpoint, so a window resized across it re-renders. The shell
 *  cannot leave this to the stylesheet alone: which pane is shown, whether the
 *  strips exist, and which panes are folded are decisions the app makes, and a
 *  media query cannot make them. */
export function useCompact(): boolean {
  const [compact, setCompact] = useState(matchesCompact)
  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const query = window.matchMedia(COMPACT_QUERY)
    const update = () => setCompact(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return compact
}
