import { useEffect, useState } from 'react'
import type { Page } from '../page'
import { journalDate, localDayString } from '../vault/index'
import { MONTHS } from './months'
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
      label: `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`,
      inMonth: d.getMonth() === month,
    })
  }
  return cells
}

/** The journal calendar (PLAN task 10, journal-calendar D1/D4/D6): owns the
 *  Journal section's body, replaces the flat day list, and stays a dumb,
 *  prop-driven child of Sidebar. The displayed month is component-local,
 *  seeded from and re-anchored to the open day; chevrons browse freely
 *  without opening a day. */
export function JournalCalendar({
  journalEntries,
  activePath,
  onSelect,
}: {
  journalEntries: Page[]
  activePath: string | null
  onSelect: (path: string) => void
}) {
  const today = localDayString(new Date())
  const existing = new Set<string>()
  for (const page of journalEntries) {
    const date = journalDate(page.path)
    if (date) existing.add(date)
  }

  const activeDate = activePath ? journalDate(activePath) : null
  const [view, setView] = useState(() => monthOf(activeDate ?? today))

  // Follow the open day across navigations that don't go through a day-cell
  // click (e.g. a future links-pane row pointing at a journal). Chevron
  // browsing is the intended case where the view differs from the anchor, so
  // this only re-anchors when the open day itself changed.
  useEffect(() => {
    if (activeDate) {
      // oxlint-disable-next-line react/set-state-in-effect
      setView(monthOf(activeDate))
    }
  }, [activeDate])

  // Opening a day re-anchors the grid to its month: clicking a day means
  // "show me this day's month" (in-month cell, out-of-month cell, or Today).
  const openDay = (date: string) => {
    onSelect(`journals/${date}.md`)
    setView(monthOf(date))
  }

  const cells = cellsFor(view.year, view.month)

  return (
    <div className={styles.calendar}>
      <div className={styles.header}>
        {/* ‹ label › as one centered cluster; Today held right (D2). */}
        <div className={styles.monthGroup}>
          <button
            type="button"
            className={styles.navBtn}
            aria-label="Previous month"
            onClick={() => setView((v) => shiftMonth(v, -1))}
          >
            {'\u2039'}
          </button>
          <span className={styles.month}>{`${MONTHS[view.month]} ${view.year}`}</span>
          <button
            type="button"
            className={styles.navBtn}
            aria-label="Next month"
            onClick={() => setView((v) => shiftMonth(v, 1))}
          >
            {'\u203A'}
          </button>
        </div>
        <button type="button" className={styles.todayBtn} onClick={() => openDay(today)}>
          Today
        </button>
      </div>
      <div className={styles.weekdays}>
        {WEEKDAYS.map((d, i) => (
          <span key={i} className={styles.weekday}>{d}</span>
        ))}
      </div>
      <div className={styles.grid}>
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
              onClick={() => openDay(cell.date)}
            >
              {Number(cell.date.slice(8))}
            </button>
          )
        })}
      </div>
    </div>
  )
}