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
    expect(within(meta()).getByText('Headings appear once a page is open.')).toBeTruthy()
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
    // One Forwardlinks section holds both groups: Pages then Files.
    expect(labels('Forwardlinks')).toEqual(['Roadmap', 'a.png', 'q3-report.pdf'])
    expect(within(section('Forwardlinks')).getByText('Pages')).toBeTruthy()
    expect(within(section('Forwardlinks')).getByText('Files')).toBeTruthy()
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

  it('opens Contents and Backlinks by default, with Forwardlinks collapsed', () => {
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
      'Contents',
      'Backlinks',
      'Forwardlinks',
      'Keyboard shortcuts',
    ])
    expect(sections.map((s) => s.open)).toEqual([true, true, false, false])
  })

  it('dims an unmaterialized board row in References, and leaves a file row undimmed', () => {
    // References holds asset rows (always materialized, because they come from
    // the vault's own listing) and board rows, which may name a board the vault
    // does not hold yet; only the latter dims (board-references-in-panel).
    render(
      <MetaPanel
        pageOpen
        backlinks={[]}
        forwardlinks={[]}
        references={[
          { title: 'q3-report.pdf', path: 'assets/q3-report.pdf', materialized: true },
          {
            title: 'Architecture.excalidraw',
            path: 'boards/Architecture.excalidraw',
            materialized: false,
          },
        ]}
        activePath={null}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        shortcuts={shortcuts}
      />,
    )
    expect(within(meta()).getByRole('button', { name: 'q3-report.pdf' }).className).not.toContain(
      styles.dimmed,
    )
    expect(
      within(meta()).getByRole('button', { name: 'Architecture.excalidraw' }).className,
    ).toContain(styles.dimmed)
  })

  it('shows the Files group its own empty copy, and copies only its own group', () => {
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
    const forward = screen.getByText('Forwardlinks').closest('details') as HTMLElement
    expect(within(forward).getByText('No files on this page.')).toBeTruthy()
    // The page sections keep their rows and their own empty copy.
    expect(within(meta()).queryByText('Nothing links here yet.')).toBeNull()
    expect(within(meta()).queryByText('This page links to nothing.')).toBeNull()
  })

  it('lists the page headings in Contents, indented by level, and locates on activation', () => {
    const onLocate = vi.fn()
    render(
      <MetaPanel
        pageOpen
        contents={[
          { level: 1, text: 'Alpha', block: 0 },
          { level: 2, text: 'Beta', block: 2 },
        ]}
        backlinks={[]}
        forwardlinks={[]}
        references={[]}
        activePath={null}
        onSelect={() => {}}
        onLocate={onLocate}
        onOpenAsset={() => {}}
        shortcuts={shortcuts}
      />,
    )
    const contents = screen.getByText('Contents').closest('details') as HTMLElement
    const buttons = [...contents.querySelectorAll('button')] as HTMLElement[]
    expect(buttons.map((b) => b.textContent)).toEqual(['Alpha', 'Beta'])
    // A level-two heading is indented further than a level-one heading.
    const alpha = Number.parseFloat(buttons[0].style.paddingLeft)
    const beta = Number.parseFloat(buttons[1].style.paddingLeft)
    expect(beta).toBeGreaterThan(alpha)
    fireEvent.click(buttons[1])
    expect(onLocate).toHaveBeenCalledWith(2)
  })

  it('shows empty copy in Contents for a page with no headings', () => {
    render(
      <MetaPanel
        pageOpen
        contents={[]}
        backlinks={[]}
        forwardlinks={[]}
        references={[]}
        activePath={null}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        shortcuts={shortcuts}
      />,
    )
    const contents = screen.getByText('Contents').closest('details') as HTMLElement
    expect(within(contents).getByText('No headings on this page.')).toBeTruthy()
  })

  it('shows no Contents section while a board is open', () => {
    render(
      <MetaPanel
        pageOpen={false}
        boardOpen
        backlinks={[]}
        forwardlinks={[]}
        references={[]}
        activePath={null}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        shortcuts={shortcuts}
      />,
    )
    expect(screen.queryByText('Contents')).toBeNull()
    expect(screen.getByText('Referenced by')).toBeTruthy()
  })

  it('puts the collapsed link sections in a group directly above the shortcuts row', () => {
    const { container } = render(
      <MetaPanel
        pageOpen
        backlinks={[]}
        forwardlinks={[]}
        references={[]}
        activePath={null}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        shortcuts={shortcuts}
      />,
    )
    const panel = container.querySelector('#meta-panel') as HTMLElement
    const links = panel.querySelector(`.${styles.links}`) as HTMLElement
    expect(links).toBeTruthy()
    // The group holds the two link sections, in order…
    const linkDetails = [...links.querySelectorAll('details')] as HTMLDetailsElement[]
    expect(linkDetails.map((d) => d.querySelector('summary')?.textContent)).toEqual([
      'Backlinks',
      'Forwardlinks',
    ])
    // …and sits directly before the keyboard-shortcuts row, so with both link
    // sections collapsed their rows land at the panel's bottom next to it.
    linkDetails.forEach((d) => (d.open = false))
    expect(links.nextElementSibling?.textContent).toContain('Keyboard shortcuts')
    expect(
      [...panel.querySelectorAll('details')].map((d) => (d as HTMLDetailsElement).open),
    ).toEqual([true, false, false, false])
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
