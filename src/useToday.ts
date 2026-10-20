import { useEffect, useState } from 'react'
import { localDayString } from './vault/dates'

/**
 * The local day as `YYYY-MM-DD`, re-read when the clock crosses local midnight
 * and when the tab becomes visible again (disallow-past-reminder-days). The
 * calendar's today marking and the day menu's past-day guard read one value, so
 * a session left open overnight cannot mark yesterday as today or offer a
 * reminder anchored on a day that has passed, even in the window before the
 * vault's next index refresh re-renders the sidebar.
 *
 * The day is a piece of state, not a call per render, so passing it down costs
 * no re-render until the day actually changes.
 */
export function useToday(): string {
  const [today, setToday] = useState(() => localDayString(new Date()))

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    const read = () => {
      const next = localDayString(new Date())
      // The same value is not a change: React bails out and nothing re-renders.
      setToday((prev) => (prev === next ? prev : next))
    }

    const schedule = () => {
      const now = new Date()
      // Tomorrow's local midnight, built from local parts rather than
      // `now + 86_400_000`: a DST change makes a local day 23 or 25 hours long.
      const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
      // A second of slack so the read lands after midnight rather than a timer's
      // rounding away from it.
      timer = setTimeout(
        () => {
          read()
          schedule()
        },
        nextMidnight.getTime() - now.getTime() + 1000,
      )
    }

    schedule()
    // A backgrounded tab's timers are throttled and a sleeping machine's are
    // late, so waking re-reads the day instead of trusting the timer.
    const onVisible = () => {
      if (!document.hidden) read()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return today
}
