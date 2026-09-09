import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { Sidebar } from './Sidebar'

const journal = {
  path: 'journals/2026-09-06.md',
  title: '2026-09-06',
  kind: 'journal' as const,
  content: '',
}
const page = { path: 'notes.md', title: 'notes', kind: 'page' as const, content: '' }

function sidebar(loading: boolean) {
  return render(
    <Sidebar
      pages={[page]}
      journalEntries={[journal]}
      activePath={null}
      onSelect={() => {}}
      hasVault={!loading}
      loading={loading}
    />,
  )
}

describe('Sidebar', () => {
  it('renders sections and page rows when loaded', () => {
    sidebar(false)
    expect(screen.getByRole('button', { name: 'notes' })).toBeTruthy()
    expect(within(screen.getByRole('complementary')).getAllByRole('button').length).toBeGreaterThan(
      0,
    )
  })

  it('shows skeleton rows and no page rows while the index builds', () => {
    const { rerender } = sidebar(true)
    // Every skeleton row is decorative and never read as a button/content.
    for (const el of screen.getAllByRole('complementary')) {
      expect(within(el).queryByRole('button', { name: 'notes' })).toBeNull()
      expect(within(el).queryByRole('button', { name: '2026-09-06' })).toBeNull()
    }
    const sections = screen.getAllByRole('group')
    expect(sections.length).toBe(2)
    // Journal mirrors the calendar geometry (month bar + weekday letters + a
    // 6x7 day grid = 43 placeholders); Pages shows three text-height rows.
    expect(sections[0].querySelectorAll('.skeleton').length).toBe(43)
    expect(sections[1].querySelectorAll('.skeleton').length).toBe(3)
    // Switching back to loaded content shows the real rows again.
    rerender(
      <Sidebar
        pages={[page]}
        journalEntries={[journal]}
        activePath={null}
        onSelect={() => {}}
        hasVault
        loading={false}
      />,
    )
    expect(screen.getByRole('button', { name: 'notes' })).toBeTruthy()
  })
})

describe('Sidebar pinned rows (add-pinned-pages)', () => {
  const renderRows = (pages: (typeof page)[], pinnedPaths: string[], onSelect = vi.fn()) =>
    render(
      <Sidebar
        pages={pages}
        journalEntries={[]}
        activePath={null}
        onSelect={onSelect}
        pinnedPaths={pinnedPaths}
        hasVault
      />,
    )

  it('a pinned row shows the pinned style and data-pinned; unpinned rows show neither', () => {
    const folded = [
      { path: 'a.md', title: 'a', kind: 'page' as const, content: '' },
      { path: 'b.md', title: 'b', kind: 'page' as const, content: '' },
    ]
    renderRows(folded, ['a.md'])
    const a = screen.getByRole('button', { name: 'a' })
    const b = screen.getByRole('button', { name: 'b' })
    expect(a.getAttribute('data-pinned')).toBe('true')
    expect(a.className).toContain('rowPinned')
    expect(a.querySelector('svg')).toBeNull() // no icon on the row
    expect(b.getAttribute('data-pinned')).toBeNull()
    expect(b.className).not.toContain('rowPinned')
  })

  it('a page row is a single navigable button — no star control on the row', () => {
    renderRows([page], ['notes.md'])
    expect(screen.queryByRole('button', { name: /pin notes/i })).toBeNull()
    const row = screen.getByRole('button', { name: 'notes' })
    expect(row.getAttribute('data-pinned')).toBe('true')
    expect(within(row).queryByRole('button')).toBeNull()
    expect(row.querySelector('svg')).toBeNull()
  })

  it('clicking the row navigates', () => {
    const onSelect = vi.fn()
    renderRows([page], [], onSelect)
    fireEvent.click(screen.getByRole('button', { name: 'notes' }))
    expect(onSelect).toHaveBeenCalledWith('notes.md')
  })

  it('renders rows in the given order, marking only the pinned ones', () => {
    const folded = [
      { path: 'a.md', title: 'a', kind: 'page' as const, content: '' },
      { path: 'b.md', title: 'b', kind: 'page' as const, content: '' },
    ]
    renderRows(folded, ['a.md'])
    expect(screen.getAllByRole('button', { name: /^(a|b)$/ }).map((b) => b.textContent)).toEqual([
      'a',
      'b',
    ])
  })
})
