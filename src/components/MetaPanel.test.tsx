import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MetaPanel, type LinkRow } from './MetaPanel'
import styles from './MetaPanel.module.css'

// The meta panel is pure presentation (design D6): it renders the rows App
// hands it and reports navigation through onSelect. No editor/vault deps.

const row = (path: string, materialized = true): LinkRow => ({
  title: path.replace('.md', ''),
  path,
  materialized,
})

const meta = () => screen.getByRole('complementary', { name: 'Page links' })

describe('MetaPanel', () => {
  it('shows placeholder copy while no page is open', () => {
    render(
      <MetaPanel
        pageOpen={false}
        backlinks={[]}
        forwardlinks={[]}
        activePath={null}
        onSelect={() => {}}
      />,
    )
    expect(
      within(meta()).getByText('Pages linking to this one appear once a page is open.'),
    ).toBeTruthy()
    expect(
      within(meta()).getByText('Links from this page appear once a page is open.'),
    ).toBeTruthy()
  })

  it('shows skeleton rows instead of placeholder copy while the index builds', () => {
    render(
      <MetaPanel
        pageOpen={false}
        backlinks={[]}
        forwardlinks={[]}
        activePath={null}
        onSelect={() => {}}
        loading
      />,
    )
    // No placeholder copy, no link rows — only decorative skeleton lines.
    expect(
      within(meta()).queryByText('Pages linking to this one appear once a page is open.'),
    ).toBeNull()
    expect(
      within(meta()).queryByText('Links from this page appear once a page is open.'),
    ).toBeNull()
    expect(within(meta()).queryByRole('button')).toBeNull()
    // One placeholder line per section, sized like the copy it replaces.
    expect(meta().querySelectorAll('.skeleton[aria-hidden="true"]').length).toBe(2)
  })

  it("sorts each section's rows alphabetically", () => {
    render(
      <MetaPanel
        pageOpen
        backlinks={[row('Zeta.md'), row('Alpha.md')]}
        forwardlinks={[row('Beta.md'), row('Gama.md')]}
        activePath={null}
        onSelect={() => {}}
      />,
    )
    // Each section sorts its own list; DOM order follows the accordion
    // (Backlinks then Forwardlinks).
    const lists = meta().querySelectorAll(`.${styles.list}`)
    const first = [...lists[0].querySelectorAll('button')].map((b) => b.textContent)
    const second = [...lists[1].querySelectorAll('button')].map((b) => b.textContent)
    expect(first).toEqual(['Alpha', 'Zeta'])
    expect(second).toEqual(['Beta', 'Gama'])
  })

  it('shows empty-state copy when a section has no rows', () => {
    render(
      <MetaPanel
        pageOpen
        backlinks={[]}
        forwardlinks={[row('Beta.md')]}
        activePath={null}
        onSelect={() => {}}
      />,
    )
    expect(within(meta()).getByText('Nothing links here yet.')).toBeTruthy()
    expect(within(meta()).queryByText('This page links to nothing.')).toBeNull()
  })

  it('dims unmaterialized rows but keeps them clickable', () => {
    const onSelect = vi.fn()
    render(
      <MetaPanel
        pageOpen
        backlinks={[]}
        forwardlinks={[row('missing.md', false)]}
        activePath={null}
        onSelect={onSelect}
      />,
    )
    const btn = within(meta()).getByRole('button', { name: 'missing' })
    expect(btn.className).toContain(styles.dimmed)
    fireEvent.click(btn)
    expect(onSelect).toHaveBeenCalledWith('missing.md')
  })

  it('marks the open page row with aria-current', () => {
    render(
      <MetaPanel
        pageOpen
        backlinks={[row('Alpha.md'), row('Beta.md')]}
        forwardlinks={[]}
        activePath="Beta.md"
        onSelect={() => {}}
      />,
    )
    expect(within(meta()).getByRole('button', { name: 'Beta' }).getAttribute('aria-current')).toBe(
      'page',
    )
    expect(
      within(meta()).getByRole('button', { name: 'Alpha' }).getAttribute('aria-current'),
    ).toBeNull()
  })
})
