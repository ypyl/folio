import { render, screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Sidebar } from './Sidebar'

const journal = { path: 'journals/2026-09-06.md', title: '2026-09-06', kind: 'journal' as const, content: '' }
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
    expect(within(screen.getByRole('complementary')).getAllByRole('button').length).toBeGreaterThan(0)
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