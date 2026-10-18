// The app-icon badge (add-reminders, design D8): the one notification a
// local-first PWA can offer while it runs. Chromium exposes the Badging API on
// `navigator`; a browser without it is a no-op, never an error.

export type BadgingNavigator = Navigator & {
  setAppBadge?: (contents?: number) => Promise<void>
  clearAppBadge?: () => Promise<void>
}

/** Show `count` on the app icon, or clear it when the count is zero. */
export function syncAppBadge(
  count: number,
  nav: BadgingNavigator = navigator as BadgingNavigator,
): void {
  if (count > 0) {
    void nav.setAppBadge?.(count)?.catch(() => {})
  } else {
    void nav.clearAppBadge?.()?.catch(() => {})
  }
}
