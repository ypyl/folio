import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { MetaPanel, type LinkRow } from './MetaPanel'
import styles from './MetaPanel.module.css'

// The panel receives the keyboard-shortcuts reference as a node
// (apply-shortcuts-on-click); its own content is covered by
// ShortcutsList.test.tsx, so a stub is enough here.
const shortcuts = <p>shortcuts</p>

// The meta panel is pure presentation (design D6): it renders the rows App
// hands it and reports navigation through onSelect. No editor/vault deps.

const row = (path: string, materialized = true): LinkRow => ({
  title: path.replace('.md', ''),
  path,
  materialized,
})

/** An asset row as App builds it (vault-assets): a file the vault holds. */
const assetRow = (path: string): LinkRow => ({
  title: path.slice(path.lastIndexOf('/') + 1),
  path,
  materialized: true,
})

const meta = () => screen.getByRole('complementary', { name: 'Page sidebar' })

describe('MetaPanel', () => {
  it('shows placeholder copy while no page is open', () => {
    render(
      <MetaPanel
        pageOpen={false}
        backlinks={[]}
        forwardlinks={[]}
        references={[]}
        activePath={null}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        shortcuts={shortcuts}
      />,
    )
    expect(
      within(meta()).getByText('Pages linking to this one appear once a page is open.'),
    ).toBeTruthy()
    expect(
      within(meta()).getByText('Links from this page appear once a page is open.'),
    ).toBeTruthy()
    expect(
      within(meta()).getByText('Files this page points at appear once a page is open.'),
    ).toBeTruthy()
  })

  it('shows skeleton rows instead of placeholder copy while the index builds', () => {
    render(
      <MetaPanel
        pageOpen={false}
        backlinks={[]}
        forwardlinks={[]}
        references={[]}
        activePath={null}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        shortcuts={shortcuts}
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
    expect(meta().querySelectorAll('.skeleton[aria-hidden="true"]').length).toBe(3)
  })

  it("sorts each section's rows alphabetically", () => {
    render(
      <MetaPanel
        pageOpen
        backlinks={[row('Zeta.md'), row('Alpha.md')]}
        forwardlinks={[row('Beta.md'), row('Gama.md')]}
        references={[]}
        activePath={null}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        shortcuts={shortcuts}
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
        references={[]}
        activePath={null}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        shortcuts={shortcuts}
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
        references={[]}
        activePath={null}
        onSelect={onSelect}
        onOpenAsset={() => {}}
        shortcuts={shortcuts}
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
        references={[]}
        activePath="Beta.md"
        onSelect={() => {}}
        onOpenAsset={() => {}}
        shortcuts={shortcuts}
      />,
    )
    expect(within(meta()).getByRole('button', { name: 'Beta' }).getAttribute('aria-current')).toBe(
      'page',
    )
    expect(
      within(meta()).getByRole('button', { name: 'Alpha' }).getAttribute('aria-current'),
    ).toBeNull()
  })

  it('sorts page rows and asset rows in their own sections', () => {
    render(
      <MetaPanel
        pageOpen
        backlinks={[]}
        forwardlinks={[row('Roadmap.md')]}
        references={[assetRow('assets/q3-report.pdf'), assetRow('assets/a.png')]}
        activePath={null}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        shortcuts={shortcuts}
      />,
    )
    const section = (title: string) => screen.getByText(title).closest('details') as HTMLElement
    const labels = (title: string) =>
      [...section(title).querySelectorAll('button')].map((b) => b.textContent)
    expect(labels('Forwardlinks')).toEqual(['Roadmap'])
    expect(labels('References')).toEqual(['a.png', 'q3-report.pdf'])
  })

  it('opens an asset row instead of navigating, and never dims it', () => {
    const onSelect = vi.fn()
    const onOpenAsset = vi.fn()
    render(
      <MetaPanel
        pageOpen
        backlinks={[]}
        forwardlinks={[]}
        references={[assetRow('assets/q3-report.pdf')]}
        activePath={null}
        onSelect={onSelect}
        onOpenAsset={onOpenAsset}
        shortcuts={shortcuts}
      />,
    )
    const btn = within(meta()).getByRole('button', { name: 'q3-report.pdf' })
    expect(btn.className).not.toContain(styles.dimmed)
    fireEvent.click(btn)
    expect(onOpenAsset).toHaveBeenCalledWith('assets/q3-report.pdf')
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('keeps the References section collapsed by default, after the page sections', () => {
    const { container } = render(
      <MetaPanel
        pageOpen
        backlinks={[]}
        forwardlinks={[]}
        references={[assetRow('assets/shot.png')]}
        activePath={null}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        shortcuts={shortcuts}
      />,
    )
    const sections = [...container.querySelectorAll('details')] as HTMLDetailsElement[]
    expect(sections.map((s) => s.querySelector('summary')?.textContent)).toEqual([
      'Backlinks',
      'Forwardlinks',
      'References',
      'Keyboard shortcuts',
    ])
    expect(sections.map((s) => s.open)).toEqual([true, true, false, false])
  })

  it('never dims an asset row, whatever the row says about the disk', () => {
    // An asset row is built from the vault's own listing, so it is materialized
    // by construction; the section does not consult the flag.
    render(
      <MetaPanel
        pageOpen
        backlinks={[]}
        forwardlinks={[]}
        references={[{ title: 'orphan.pdf', path: 'assets/orphan.pdf', materialized: false }]}
        activePath={null}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        shortcuts={shortcuts}
      />,
    )
    const btn = within(meta()).getByRole('button', { name: 'orphan.pdf' })
    expect(btn.className).not.toContain(styles.dimmed)
  })

  it('shows References its own empty copy, and copies only its own section', () => {
    render(
      <MetaPanel
        pageOpen
        backlinks={[row('Alpha.md')]}
        forwardlinks={[row('Beta.md')]}
        references={[]}
        activePath={null}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        shortcuts={shortcuts}
      />,
    )
    const references = screen.getByText('References').closest('details') as HTMLElement
    expect(within(references).getByText('No files on this page.')).toBeTruthy()
    expect(within(references).queryByRole('button')).toBeNull()
    // The page sections keep their rows and their own empty copy.
    expect(within(meta()).queryByText('Nothing links here yet.')).toBeNull()
    expect(within(meta()).queryByText('This page links to nothing.')).toBeNull()
  })
})

// Keyboard-shortcuts reference (move-help-to-right-panel): the panel's last
// section, content-only, present in every state.
describe('keyboard-shortcuts section', () => {
  const panel = (props: { pageOpen?: boolean; loading?: boolean } = {}) => (
    <MetaPanel
      pageOpen={props.pageOpen ?? false}
      backlinks={[]}
      forwardlinks={[]}
      references={[]}
      activePath={null}
      onSelect={() => {}}
      onOpenAsset={() => {}}
      shortcuts={shortcuts}
      loading={props.loading}
    />
  )

  it('is the panel\u2019s last section and starts collapsed', () => {
    const { container } = render(panel())
    const sections = container.querySelectorAll('details')
    expect(sections).toHaveLength(4)
    const last = sections[3] as HTMLDetailsElement
    expect(last.open).toBe(false)
    expect(last.querySelector('summary')?.textContent).toBe('Keyboard shortcuts')
    // Nothing follows it.
    expect(container.querySelectorAll('details')[3].nextElementSibling).toBeNull()
  })

  it('shows the reference in every panel state', () => {
    // Brand empty state and search-results surfaces both reach the panel with
    // no page open; the index-building state adds loading. The reference is a
    // node App supplies, so the panel's job is to render it in every state.
    const states = [
      { pageOpen: false, loading: false },
      { pageOpen: false, loading: true },
      { pageOpen: true, loading: false },
    ]
    for (const state of states) {
      const { unmount } = render(panel(state))
      expect(within(meta()).getByText('Keyboard shortcuts')).toBeTruthy()
      expect(within(meta()).getByText('shortcuts')).toBeTruthy()
      unmount()
    }
  })

  it('anchors the collapsed row to the panel\u2019s bottom', () => {
    // jsdom has no layout, so this pins the wiring (the placement class on the
    // last section) rather than the sticky behavior — the browser check in the
    // change's final task covers where the row actually lands.
    const { container } = render(panel())
    const sections = container.querySelectorAll('details')
    expect(sections[3].className).toContain(styles.footer)
    expect(sections[0].className).not.toContain(styles.footer)
  })

  it('opens independently of the link sections', () => {
    const { container } = render(panel({ pageOpen: true }))
    const sections = container.querySelectorAll('details')
    expect([...sections].map((s) => (s as HTMLDetailsElement).open)).toEqual([
      true,
      true,
      false,
      false,
    ])
    fireEvent.click(within(meta()).getByText('Keyboard shortcuts'))
    expect(sections[3].open).toBe(true)
    // Opening the reference leaves the link sections as they were.
    expect([...sections].map((s) => (s as HTMLDetailsElement).open)).toEqual([
      true,
      true,
      false,
      true,
    ])
  })
})

describe('MetaPanel board mode (add-whiteboards)', () => {
  it('shows Referenced by instead of the page-metadata sections', () => {
    render(
      <MetaPanel
        pageOpen={false}
        backlinks={[]}
        forwardlinks={[]}
        references={[]}
        activePath={null}
        boardOpen
        boardReferrers={[
          { title: 'Ideas', path: 'pages/Ideas.md', materialized: true },
          { title: 'Log', path: 'pages/Log.md', materialized: true },
        ]}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        shortcuts={shortcuts}
      />,
    )
    const panel = within(meta())
    expect(panel.getByText('Referenced by')).toBeTruthy()
    expect(panel.getByRole('button', { name: 'Ideas' })).toBeTruthy()
    expect(panel.getByRole('button', { name: 'Log' })).toBeTruthy()
    expect(panel.queryByText('Backlinks')).toBeNull()
    expect(panel.queryByText('Forwardlinks')).toBeNull()
  })

  it('navigates when a referrer row is activated', () => {
    const onSelect = vi.fn()
    render(
      <MetaPanel
        pageOpen={false}
        backlinks={[]}
        forwardlinks={[]}
        references={[]}
        activePath={null}
        boardOpen
        boardReferrers={[{ title: 'Ideas', path: 'pages/Ideas.md', materialized: true }]}
        onSelect={onSelect}
        onOpenAsset={() => {}}
        shortcuts={shortcuts}
      />,
    )
    fireEvent.click(within(meta()).getByRole('button', { name: 'Ideas' }))
    expect(onSelect).toHaveBeenCalledWith('pages/Ideas.md')
  })

  it('shows empty-state copy when no page references the board', () => {
    render(
      <MetaPanel
        pageOpen={false}
        backlinks={[]}
        forwardlinks={[]}
        references={[]}
        activePath={null}
        boardOpen
        boardReferrers={[]}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        shortcuts={shortcuts}
      />,
    )
    expect(within(meta()).getByText('No pages reference this board.')).toBeTruthy()
  })
})
