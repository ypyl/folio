// Build-time feature flags. A capability that ships behind a flag keeps its
// seams, so flipping the flag is the whole enable step (the `PRESENT_ENABLED`
// precedent). Flags are constants, not preferences: the app keeps no settings
// store and the vault holds no flag. They are read at call time, so a test can
// flip one without remounting the world.

export const features = {
  /**
   * The session trace (add-session-trace-logs): the per-session log written to
   * `.folio/logs/`. Off in the shipped build. A run can turn it on with
   * `VITE_TRACE=1` (the e2e does), and the app's experimental switch turns it on
   * without a rebuild, so the engine stays exercised while the shipped build
   * writes nothing.
   */
  trace: import.meta.env.VITE_TRACE === '1',
}
