import { describe, expect, it, vi } from 'vitest'
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

describe('localDayString (local-calendar guard, design D5)', () => {
  it('builds the day string from local parts near local midnight', () => {
    // 23:59 local is still the same local day; toISOString would shift it
    // into the next day on negative-offset machines.
    expect(localDayString(new Date(2026, 8, 6, 23, 59))).toBe('2026-09-06')
  })
})

describe('JournalCalendar grid', () => {
  it('renders a Sunday-first 42-cell grid with the weekday header and Today', () => {
    render(<JournalCalendar journalEntries={[]} activePath={null} onSelect={vi.fn()} />)
    const cells = screen.getAllByRole('button')
    // 42 day cells + 2 month chevrons + the Today control.
    expect(cells).toHaveLength(45)
    // For September 2026 the 1st is a Tuesday, so the grid anchors on Aug 30.
    expect(screen.queryByRole('button', { name: 'August 30, 2026' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Today' })).toBeTruthy()
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
      <JournalCalendar journalEntries={[]} activePath="journals/2026-09-06.md" onSelect={onSelect} />,
    )
    const leading = byDate('August 30, 2026')
    expect(leading.classList.contains(styles.dimmed)).toBe(true)
    fireEvent.click(leading)
    expect(onSelect).toHaveBeenCalledWith('journals/2026-08-30.md')
    // Opening the out-of-month day moves the grid into August.
    rerender(
      <JournalCalendar journalEntries={[]} activePath="journals/2026-08-30.md" onSelect={onSelect} />,
    )
    expect(screen.getByText('August 2026')).toBeTruthy()
  })

  it('Today navigates to the current day', () => {
    const onSelect = vi.fn()
    render(<JournalCalendar journalEntries={[]} activePath={null} onSelect={onSelect} />)
    fireEvent.click(screen.getByRole('button', { name: 'Today' }))
    expect(onSelect).toHaveBeenCalledWith(`journals/${localDayString(new Date())}.md`)
  })

  it('chevrons browse months without opening a day (D2)', () => {
    const onSelect = vi.fn()
    render(<JournalCalendar journalEntries={[]} activePath={null} onSelect={onSelect} />)
    const start = monthLabel(new Date())
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }))
    fireEvent.click(screen.getByRole('button', { name: 'Next month' }))
    fireEvent.click(screen.getByRole('button', { name: 'Previous month' }))
    expect(screen.getByText(monthLabel(shiftDate(new Date(), 1)))).toBeTruthy()
    // View-only movement: no day is opened and the grid keeps its month.
    expect(onSelect).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: 'Today' })).toBeTruthy()
    expect(start).not.toBe(monthLabel(shiftDate(new Date(), 1)))
  })

  it('opening a day after chevron drift re-anchors the grid to its month', () => {
    const onSelect = vi.fn()
    render(
      <JournalCalendar journalEntries={[]} activePath="journals/2026-09-06.md" onSelect={onSelect} />,
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
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
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