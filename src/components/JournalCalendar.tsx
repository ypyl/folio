import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import type { Page } from '../page'
import { journalDate, localDayString } from '../vault/index'
import { dayLabel, monthYearLabel } from './months'
import styles from './JournalCalendar.module.css'

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

function monthOf(dateString: string): { year: number; month: number } {
  const [year, month] = dateString.split('-').map(Number)
  return { year, month: month - 1 } // month is 0-based
}

function shiftMonth(view: { year: number; month: number }, delta: number) {
  const month = view.month + delta
  return { year: view.year + Math.floor(month / 12), month: ((month % 12) + 12) % 12 }
}

type DayCell = { date: string; label: string; inMonth: boolean }

/** 42-cell Sunday-first grid anchored at the Sunday on or before the 1st:
 *  a fixed 6x7 block keeps row height stable across months (design D2). */
function cellsFor(year: number, month: number): DayCell[] {
  const first = new Date(year, month, 1)
  const anchor = new Date(year, month, 1 - first.getDay())
  const cells: DayCell[] = []
  for (let i = 0; i < 42; i++) {
    const d = new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + i)
    cells.push({
      date: localDayString(d),
      label: dayLabel(d),
      inMonth: d.getMonth() === month,
    })
  }
  return cells
}

/** The journal calendar (PLAN task 10, journal-calendar D1/D4/D6): owns the
 *  Journal section's body, replaces the flat day list, and stays a dumb,
 *  prop-driven child of Sidebar. The displayed month is component-local,
 *  seeded from and re-anchored to the open day; chevrons browse freely
 *  without opening a day. The Today control lives in the sidebar's navigation
 *  row (move-today-into-nav-controls), which bumps `todayTick` so the grid
 *  still re-anchors to the current day when that day is already open, and a
 *  `locate` request (focus-the-journal-day-in-the-calendar) re-anchors from
 *  outside and focuses the day. */
export function JournalCalendar({
  journalEntries,
  activePath,
  onSelect,
  onDayContextMenu,
  today = localDayString(new Date()),
  todayTick = 0,
  locate = null,
}: {
  journalEntries: Page[]
  activePath: string | null
  onSelect: (path: string) => void
  /** Open the day's context menu (add-reminders): Sidebar owns the menu and its
   *  reminder items, so this only reports the invocation and its day. */
  onDayContextMenu?: (event: ReactMouseEvent<HTMLButtonElement>, date: string) => void
  /** The local day as `YYYY-MM-DD`, the cell marked as today. Passed down so it
   *  matches the day menu's past-day guard and refreshes at local midnight
   *  (useToday); a test can pin it. */
  today?: string
  /** Bumped when the navigation row's Today control is activated; only a
   *  reason to re-run the re-anchor effect below. */
  todayTick?: number
  /** A request to locate a day (focus-the-journal-day-in-the-calendar): the
   *  day's date as `YYYY-MM-DD` and a counter, so activating the same day twice
   *  acts twice. A new request moves the shown month to that day, scrolls its
   *  cell into view, and focuses it. Requests come from the status bar's day
   *  crumb through Sidebar, which owns opening the section. */
  locate?: { date: string; tick: number } | null
}) {
  const existing = new Set<string>()
  for (const page of journalEntries) {
    const date = journalDate(page.path)
    if (date) existing.add(date)
  }

  const gridRef = useRef<HTMLDivElement | null>(null)

  const activeDate = activePath ? journalDate(activePath) : null
  const [view, setView] = useState(() => monthOf(activeDate ?? today))

  // Follow the open day across navigations that don't go through a day-cell
  // click (e.g. a future links-pane row pointing at a journal). Chevron
  // browsing is the intended case where the view differs from the anchor, so
  // this only re-anchors when the open day itself changed - or when Today was
  // activated, which is the same day the grid may have been browsed away from.
  useEffect(() => {
    if (activeDate) {
      // oxlint-disable-next-line react/set-state-in-effect
      setView(monthOf(activeDate))
    }
  }, [activeDate, todayTick])

  // Opening a day re-anchors the grid to its month: clicking a day means
  // "show me this day's month" (in-month cell or out-of-month cell).
  const openDay = (date: string) => {
    onSelect(`journals/${date}.md`)
    setView(monthOf(date))
  }

  // A locate request is the same "show me this day" from outside the calendar:
  // it re-anchors the shown month and puts focus on the cell. The re-anchor is
  // one commit and the focus the next, because a day outside the shown month's
  // 42-cell grid has no cell to focus until the month has moved; the pending
  // ref carries the day across that commit. The request's identity is the only
  // trigger, so an unrelated re-render never moves focus back.
  const pendingFocus = useRef<string | null>(null)
  useEffect(() => {
    if (!locate) return
    pendingFocus.current = locate.date
    // oxlint-disable-next-line react/set-state-in-effect
    setView(monthOf(locate.date))
  }, [locate])

  // Runs after every commit and does nothing unless a locate is waiting for its
  // cell. The grid is keyed by date, so a day that is in the shown month keeps
  // the same element across the re-anchor and keeps the focus.
  useEffect(() => {
    const date = pendingFocus.current
    if (date === null) return
    const cell = gridRef.current?.querySelector<HTMLElement>(`[data-date="${date}"]`)
    if (!cell) return
    pendingFocus.current = null
    // jsdom has no scrollIntoView; the browser does, and focus works in both.
    cell.scrollIntoView?.({ block: 'nearest' })
    cell.focus()
  })

  const cells = cellsFor(view.year, view.month)

  return (
    <div className={styles.calendar}>
      {/* ‹ label › across the whole panel: chevrons at the ends, month
          centered between them. The Today control moved to the sidebar's
          navigation row (move-today-into-nav-controls). */}
      <div className={styles.monthGroup}>
        <button
          type="button"
          className={styles.navBtn}
          aria-label="Previous month"
          onClick={() => setView((v) => shiftMonth(v, -1))}
        >
          {'\u2039'}
        </button>
        <span className={styles.month}>{monthYearLabel(view.year, view.month)}</span>
        <button
          type="button"
          className={styles.navBtn}
          aria-label="Next month"
          onClick={() => setView((v) => shiftMonth(v, 1))}
        >
          {'\u203A'}
        </button>
      </div>
      <div className={styles.weekdays}>
        {WEEKDAYS.map((d, i) => (
          <span key={i} className={styles.weekday}>
            {d}
          </span>
        ))}
      </div>
      <div className={styles.grid} ref={gridRef}>
        {cells.map((cell) => {
          const classes = [styles.day]
          if (!cell.inMonth) classes.push(styles.dimmed)
          if (existing.has(cell.date)) classes.push(styles.marked)
          if (cell.date === today) classes.push(styles.today)
          if (cell.date === activeDate) classes.push(styles.open)
          return (
            <button
              key={cell.date}
              type="button"
              className={classes.join(' ')}
              aria-label={cell.label}
              aria-current={cell.date === activeDate ? 'date' : undefined}
              data-date={cell.date}
              onClick={() => openDay(cell.date)}
              onContextMenu={(e) => onDayContextMenu?.(e, cell.date)}
            >
              {Number(cell.date.slice(8))}
            </button>
          )
        })}
      </div>
    </div>
  )
}
