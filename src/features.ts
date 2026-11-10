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

/** What a gated feature turns on, as the rail's experimental popup states it
 *  (explain-the-experimental-switch): one entry per flag in `features`, so the
 *  popup can neither describe a feature that no flag gates nor omit one that a
 *  flag gates. `features.test.ts` holds the two sets equal. */
export type ExperimentalFeature = {
  /** The build-time flag that gates it. */
  flag: keyof typeof features
  /** The feature's name, as the popup lists it. */
  label: string
  /** One line under the name: what turning the switch on enables. */
  detail: string
}

export const experimentalFeatures: readonly ExperimentalFeature[] = [
  {
    flag: 'trace',
    label: 'Session trace',
    detail: 'Records writes and failures in .folio/logs/',
  },
]
