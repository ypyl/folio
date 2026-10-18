// Build-time feature flags. A capability that ships behind a flag keeps its
// seams, so flipping the flag is the whole enable step (the `PRESENT_ENABLED`
// precedent). Flags are constants, not preferences: the app keeps no settings
// store and the vault holds no flag. They are read at call time, so a test can
// flip one without remounting the world.

export const features = {
  /**
   * Reminders: the Journal calendar's day menu, the app badge, and materializing
   * a due reminder into the day's note. Off in the shipped build. A run can turn
   * it on with `VITE_REMINDERS=1` (the e2e does), so the engine stays exercised
   * while the shipped build hides it.
   */
  reminders: import.meta.env.VITE_REMINDERS === '1',
}
