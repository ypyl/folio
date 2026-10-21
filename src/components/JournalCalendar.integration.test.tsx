import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { JournalCalendar } from './JournalCalendar'
import styles from './JournalCalendar.module.css'
import { localDayString } from '../vault/index'
import type { Page } from '../page'

const entry = (path: string): Page => ({
  path,
  title: path.slice(path.lastIndexOf('/') + 1, -3),
  kind: 'journal',
  content: '',
})

const byDate = (name: string) => screen.getByRole('button', { name })

// The grid shows one month and the fixture days sit in a fixed month, so freeze
// Date (only Date, not timers) rather than letting the wall clock decide which
// month is visible.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 8, 15))
})
afterEach(() => {
  vi.useRealTimers()
})

describe('localDayString (local-calendar guard, design D5)', () => {
  it('builds the day string from local parts near local midnight', () => {
    // 23:59 local is still the same local day; toISOString would shift it
    // into the next day on negative-offset machines.
    expect(localDayString(new Date(2026, 8, 6, 23, 59))).toBe('2026-09-06')
  })
})

describe('JournalCalendar grid', () => {
  it('renders a Sunday-first 42-cell grid with the weekday header and no Today', () => {
    render(<JournalCalendar journalEntries={[]} activePath={null} onSelect={vi.fn()} />)
    const cells = screen.getAllByRole('button')
    // 42 day cells + 2 month chevrons. The Today control lives in the sidebar's
    // navigation row (move-today-into-nav-controls), not in this header.
    expect(cells).toHaveLength(44)
    // For September 2026 the 1st is a Tuesday, so the grid anchors on Aug 30.
    expect(screen.queryByRole('button', { name: 'August 30, 2026' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Today' })).toBeNull()
  })

  it('marks only the days that have journal files (design D3)', () => {
    render(
      <JournalCalendar
        journalEntries={[entry('journals/2026-09-06.md')]}
        activePath={null}
        onSelect={vi.fn()}
      />,
    )
    expect(byDate('September 6, 2026').classList.contains(styles.marked)).toBe(true)
    expect(byDate('September 5, 2026').classList.contains(styles.marked)).toBe(false)
  })

  it('marks the open day and the current day', () => {
    render(
      <JournalCalendar
        journalEntries={[entry('journals/2026-09-06.md')]}
        activePath="journals/2026-09-06.md"
        onSelect={vi.fn()}
      />,
    )
    const open = byDate('September 6, 2026')
    expect(open.getAttribute('aria-current')).toBe('date')
    expect(open.classList.contains(styles.open)).toBe(true)
    expect(byDate('September 6, 2026')).toBe(open)
    const today = byDate(`${localTodayLabel()}`)
    expect(today.classList.contains(styles.today)).toBe(true)
  })

  it('marks the day it is given as today, not the wall clock', () => {
    // The day arrives from useToday, so a session left open across midnight
    // marks the new day without a remount (disallow-past-reminder-days).
    render(
      <JournalCalendar
        journalEntries={[]}
        activePath={null}
        onSelect={vi.fn()}
        today="2026-09-16"
      />,
    )
    expect(byDate('September 16, 2026').classList.contains(styles.today)).toBe(true)
    expect(byDate('September 15, 2026').classList.contains(styles.today)).toBe(false)
  })

  it('shows the current month when no day is open', () => {
    render(<JournalCalendar journalEntries={[]} activePath={null} onSelect={vi.fn()} />)
    const now = new Date()
    expect(screen.getByText(`${MONTHS[now.getMonth()]} ${now.getFullYear()}`)).toBeTruthy()
  })

  it("opens on the open day's month and follows it across selections", () => {
    const { rerender } = render(
      <JournalCalendar
        journalEntries={[]}
        activePath="journals/2026-08-14.md"
        onSelect={vi.fn()}
      />,
    )
    expect(screen.getByText('August 2026')).toBeTruthy()
    rerender(
      <JournalCalendar
        journalEntries={[]}
        activePath="journals/2026-09-06.md"
        onSelect={vi.fn()}
      />,
    )
    expect(screen.getByText('September 2026')).toBeTruthy()
  })

  it('clicking a day navigates to journals/YYYY-MM-DD.md', () => {
    const onSelect = vi.fn()
    render(<JournalCalendar journalEntries={[]} activePath={null} onSelect={onSelect} />)
    fireEvent.click(byDate('September 6, 2026'))
    expect(onSelect).toHaveBeenCalledWith('journals/2026-09-06.md')
  })

  it('out-of-month cells are dimmed and clickable, hopping the month (D2)', () => {
    const onSelect = vi.fn()
    const { rerender } = render(
      <JournalCalendar
        journalEntries={[]}
        activePath="journals/2026-09-06.md"
        onSelect={onSelect}
      />,
    )
    const leading = byDate('August 30, 2026')
    expect(leading.classList.contains(styles.dimmed)).toBe(true)
    fireEvent.click(leading)
    expect(onSelect).toHaveBeenCalledWith('journals/2026-08-30.md')
    // Opening the out-of-month day moves the grid into August.
    rerender(
      <JournalCalendar
        journalEntries={[]}
        activePath="journals/2026-08-30.md"
        onSelect={onSelect}
      />,
    )
    expect(screen.getByText('August 2026')).toBeTruthy()
  })

  it('chevrons browse months without opening a day (D2)', () => {
    const onSelect = vi.fn()
    render(<JournalCalendar journalEntries={[]} activePath={null} onSelect={onSelect} />)
    const start = monthLabel(new Date())
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }))
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }))
    expect(screen.getByText(monthLabel(shiftDate(new Date(), 1)))).toBeTruthy()
    // View-only movement: no day is opened, and the grid stays on the month
    // the chevrons browsed to rather than snapping back to the open day.
    expect(onSelect).not.toHaveBeenCalled()
    expect(screen.queryByText(start)).toBeNull()
    expect(start).not.toBe(monthLabel(shiftDate(new Date(), 1)))
  })

  it('opening a day after chevron drift re-anchors the grid to its month', () => {
    const onSelect = vi.fn()
    render(
      <JournalCalendar
        journalEntries={[]}
        activePath="journals/2026-09-06.md"
        onSelect={onSelect}
      />,
    )
    expect(screen.getByText('September 2026')).toBeTruthy()
    // Browse away to August without opening anything.
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }))
    expect(screen.getByText('August 2026')).toBeTruthy()
    expect(onSelect).not.toHaveBeenCalled()
    // Click a September day from August's trailing cells: it opens and the
    // grid lands back on September.
    fireEvent.click(screen.getByRole('button', { name: 'September 5, 2026' }))
    expect(onSelect).toHaveBeenCalledWith('journals/2026-09-05.md')
    expect(screen.getByText('September 2026')).toBeTruthy()
  })
})

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

function localTodayLabel(): string {
  const now = new Date()
  return `${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`
}

function monthLabel(date: Date): string {
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}

function shiftDate(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

describe('JournalCalendar day locate (focus-the-journal-day-in-the-calendar)', () => {
  const scrollIntoView = vi.fn()

  // jsdom ships no scrollIntoView, so the test defines the seam the browser
  // provides; focus works in both.
  beforeEach(() => {
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
      value: scrollIntoView,
      configurable: true,
      writable: true,
    })
  })
  afterEach(() => {
    scrollIntoView.mockClear()
    Reflect.deleteProperty(Element.prototype, 'scrollIntoView')
  })

  const grid = (locate?: { date: string; tick: number } | null) => (
    <JournalCalendar
      journalEntries={[]}
      activePath="journals/2026-09-06.md"
      onSelect={vi.fn()}
      locate={locate}
    />
  )

  it('re-anchors to the requested day and focuses its cell', () => {
    const { rerender } = render(grid())
    // Browse away: the open day's month is gone from the grid entirely.
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }))
    expect(screen.getByText('August 2026')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'September 6, 2026' })).toBeNull()

    rerender(grid({ date: '2026-09-06', tick: 1 }))

    expect(screen.getByText('September 2026')).toBeTruthy()
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest' })
    expect(document.activeElement).toBe(byDate('September 6, 2026'))
  })

  it('does not replay the last request when it mounts again', () => {
    // The request is the sidebar's state, so it outlives the calendar: a folder
    // switch unmounts it behind the loading skeleton, and it mounts again with
    // that request still waiting. A mount is not a new request.
    const locate = { date: '2026-03-15', tick: 1 }
    const first = render(grid())
    first.rerender(grid(locate))
    expect(screen.getByText('March 2026')).toBeTruthy()
    first.unmount()

    render(grid(locate))

    // The grid seeds from the open day again and focus stays where it was.
    expect(screen.getByText('September 2026')).toBeTruthy()
    expect(document.activeElement).toBe(document.body)
  })

  it('does not move focus again for the same request', () => {
    const locate = { date: '2026-09-06', tick: 1 }
    const { rerender } = render(grid())
    rerender(grid(locate))
    const previous = screen.getByRole('button', { name: 'Previous month' })
    previous.focus()

    // A re-render with the same request is not a new request.
    rerender(grid(locate))

    expect(document.activeElement).toBe(previous)
  })
})

describe('JournalCalendar day menu (add-reminders)', () => {
  it('reports a right-clicked day with its date', () => {
    const onDayContextMenu = vi.fn()
    render(
      <JournalCalendar
        journalEntries={[]}
        activePath={null}
        onSelect={vi.fn()}
        onDayContextMenu={onDayContextMenu}
      />,
    )
    fireEvent.contextMenu(screen.getByRole('button', { name: 'September 20, 2026' }))
    expect(onDayContextMenu).toHaveBeenCalledTimes(1)
    expect(onDayContextMenu.mock.calls[0][1]).toBe('2026-09-20')
  })
})
