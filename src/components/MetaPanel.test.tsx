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

/** A forwardlink page row as App builds it. */
const row = (path: string, materialized = true): LinkRow => ({
  kind: 'page',
  badge: 'out',
  title: path.replace('.md', ''),
  path,
  materialized,
})

/** A backlink page row as App builds it. */
const backlinkRow = (path: string, materialized = true): LinkRow => ({
  kind: 'page',
  badge: 'in',
  title: path.replace('.md', ''),
  path,
  materialized,
})

/** An asset row as App builds it (vault-assets): a file the vault holds. */
const assetRow = (path: string): LinkRow => ({
  kind: 'asset',
  badge: 'a',
  title: path.slice(path.lastIndexOf('/') + 1),
  path,
  materialized: true,
})

/** A board row as App builds it (whiteboards): the vault may not hold one yet. */
const boardRow = (path: string, materialized = true): LinkRow => ({
  kind: 'board',
  badge: 'b',
  title: path.slice(path.lastIndexOf('/') + 1),
  path,
  materialized,
})

const meta = () => screen.getByRole('complementary', { name: 'Page sidebar' })

describe('MetaPanel', () => {
  it('shows placeholder copy while no page is open', () => {
    render(
      <MetaPanel
        pageOpen={false}
        links={[]}
        activePath={null}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        shortcuts={shortcuts}
      />,
    )
    expect(within(meta()).getByText('Links appear once a page is open.')).toBeTruthy()
    expect(within(meta()).getByText('Headings appear once a page is open.')).toBeTruthy()
  })

  it('shows skeleton rows instead of placeholder copy while the index builds', () => {
    render(
      <MetaPanel
        pageOpen={false}
        links={[]}
        activePath={null}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        shortcuts={shortcuts}
        loading
      />,
    )
    // No placeholder copy, no link rows — only decorative skeleton lines.
    expect(within(meta()).queryByText('Links appear once a page is open.')).toBeNull()
    expect(within(meta()).queryByText('Headings appear once a page is open.')).toBeNull()
    expect(within(meta()).queryByRole('button')).toBeNull()
    // One placeholder line per section, sized like the copy it replaces.
    expect(meta().querySelectorAll('.skeleton[aria-hidden="true"]').length).toBe(2)
  })

  it('renders the Links rows in the order they are given', () => {
    render(
      <MetaPanel
        pageOpen
        links={[backlinkRow('Zeta.md'), row('Beta.md'), assetRow('assets/shot.png')]}
        activePath={null}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        shortcuts={shortcuts}
      />,
    )
    // The panel never re-sorts: the list keeps the order its caller passed.
    const list = meta().querySelector(`.${styles.list}`) as HTMLElement
    expect([...list.querySelectorAll('button')].map((b) => b.textContent)).toEqual([
      'inZeta',
      'outBeta',
      'ashot.png',
    ])
  })

  it('badges every row by direction or file kind', () => {
    render(
      <MetaPanel
        pageOpen
        links={[
          backlinkRow('Topic.md'),
          row('Roadmap.md'),
          assetRow('assets/shot.png'),
          boardRow('boards/migration.excalidraw'),
        ]}
        activePath={null}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        shortcuts={shortcuts}
      />,
    )
    const badge = (name: string) =>
      within(meta()).getByRole('button', { name }).querySelector(`.${styles.badge}`)?.textContent
    expect(badge('Topic')).toBe('in')
    expect(badge('Roadmap')).toBe('out')
    expect(badge('shot.png')).toBe('a')
    expect(badge('migration.excalidraw')).toBe('b')
  })

  it('shows empty-state copy when the Links list has no rows', () => {
    render(
      <MetaPanel
        pageOpen
        links={[]}
        activePath={null}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        shortcuts={shortcuts}
      />,
    )
    expect(within(meta()).getByText('No links yet.')).toBeTruthy()
  })

  it('dims unmaterialized rows but keeps them clickable', () => {
    const onSelect = vi.fn()
    render(
      <MetaPanel
        pageOpen
        links={[row('missing.md', false)]}
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
        links={[backlinkRow('Alpha.md'), backlinkRow('Beta.md')]}
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

  it('opens an asset row instead of navigating, and never dims it', () => {
    const onSelect = vi.fn()
    const onOpenAsset = vi.fn()
    render(
      <MetaPanel
        pageOpen
        links={[assetRow('assets/q3-report.pdf')]}
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

  it('opens Contents and Links by default, with the keyboard reference collapsed', () => {
    const { container } = render(
      <MetaPanel
        pageOpen
        links={[assetRow('assets/shot.png')]}
        activePath={null}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        shortcuts={shortcuts}
      />,
    )
    const sections = [...container.querySelectorAll('details')] as HTMLDetailsElement[]
    expect(sections.map((s) => s.querySelector('summary')?.textContent)).toEqual([
      'Contents',
      'Links',
      'Keyboard shortcuts',
    ])
    expect(sections.map((s) => s.open)).toEqual([true, true, false])
  })

  it('dims an unmaterialized board row in Links, and leaves a file row undimmed', () => {
    render(
      <MetaPanel
        pageOpen
        links={[
          assetRow('assets/q3-report.pdf'),
          boardRow('boards/Architecture.excalidraw', false),
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

  it('shows no empty copy when the page has links', () => {
    render(
      <MetaPanel
        pageOpen
        links={[backlinkRow('Alpha.md')]}
        activePath={null}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        shortcuts={shortcuts}
      />,
    )
    expect(within(meta()).queryByText('No links yet.')).toBeNull()
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
        links={[]}
        activePath={null}
        onSelect={() => {}}
        onLocate={onLocate}
        onOpenAsset={() => {}}
        shortcuts={shortcuts}
      />,
    )
    const contents = screen.getByText('Contents').closest('details') as HTMLElement
    // A level-two heading is indented further than a level-one heading.
    const rows = [...contents.querySelectorAll(`.${styles.contentRow}`)] as HTMLElement[]
    expect(rows).toHaveLength(2)
    const alpha = Number.parseFloat(rows[0].style.paddingLeft)
    const beta = Number.parseFloat(rows[1].style.paddingLeft)
    expect(beta).toBeGreaterThan(alpha)
    fireEvent.click(within(contents).getByRole('button', { name: 'Beta' }))
    expect(onLocate).toHaveBeenCalledWith(2)
  })

  it('nests headings and collapses and expands a subtree', () => {
    render(
      <MetaPanel
        pageOpen
        contents={[
          { level: 1, text: 'Alpha', block: 0 },
          { level: 2, text: 'Beta', block: 2 },
          { level: 3, text: 'Gamma', block: 3 },
          { level: 1, text: 'Delta', block: 5 },
        ]}
        links={[]}
        activePath={null}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        shortcuts={shortcuts}
      />,
    )
    const contents = screen.getByText('Contents').closest('details') as HTMLElement
    const panel = within(contents)
    // Only headings with a subtree carry a disclosure control.
    const alpha = panel.getByRole('button', { name: 'Collapse Alpha' })
    expect(panel.queryByRole('button', { name: 'Collapse Delta' })).toBeNull()
    // Collapsing Alpha hides its descendants and leaves the sibling root.
    fireEvent.click(alpha)
    expect(panel.queryByRole('button', { name: 'Beta' })).toBeNull()
    expect(panel.queryByRole('button', { name: 'Gamma' })).toBeNull()
    expect(panel.getByRole('button', { name: 'Delta' })).toBeTruthy()
    expect(panel.getByRole('button', { name: 'Expand Alpha' }).getAttribute('aria-expanded')).toBe(
      'false',
    )
    // Expanding shows them again.
    fireEvent.click(panel.getByRole('button', { name: 'Expand Alpha' }))
    expect(panel.getByRole('button', { name: 'Beta' })).toBeTruthy()
    expect(panel.getByRole('button', { name: 'Gamma' })).toBeTruthy()
  })

  it('resets collapse state when a different page opens', () => {
    const tree = [
      { level: 1, text: 'Alpha', block: 0 },
      { level: 2, text: 'Beta', block: 2 },
    ]
    const panel = (activePath: string) => (
      <MetaPanel
        pageOpen
        contents={tree}
        links={[]}
        activePath={activePath}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        shortcuts={shortcuts}
      />
    )
    const { rerender } = render(panel('pages/A.md'))
    const contents = screen.getByText('Contents').closest('details') as HTMLElement
    fireEvent.click(within(contents).getByRole('button', { name: 'Collapse Alpha' }))
    expect(within(contents).queryByRole('button', { name: 'Beta' })).toBeNull()
    // A different page starts with every heading expanded.
    rerender(panel('pages/B.md'))
    expect(within(contents).getByRole('button', { name: 'Beta' })).toBeTruthy()
  })

  it('shows empty copy in Contents for a page with no headings', () => {
    render(
      <MetaPanel
        pageOpen
        contents={[]}
        links={[]}
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
        links={[]}
        activePath={null}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        shortcuts={shortcuts}
      />,
    )
    expect(screen.queryByText('Contents')).toBeNull()
    expect(screen.getByText('Referenced by')).toBeTruthy()
  })

  it('puts the collapsed Links section directly above the shortcuts row', () => {
    const { container } = render(
      <MetaPanel
        pageOpen
        links={[]}
        activePath={null}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        shortcuts={shortcuts}
      />,
    )
    const panel = container.querySelector('#meta-panel') as HTMLElement
    const links = panel.querySelector(`.${styles.links}`) as HTMLElement
    expect(links).toBeTruthy()
    const linkDetails = [...links.querySelectorAll('details')] as HTMLDetailsElement[]
    expect(linkDetails.map((d) => d.querySelector('summary')?.textContent)).toEqual(['Links'])
    linkDetails.forEach((d) => (d.open = false))
    expect(links.nextElementSibling?.textContent).toContain('Keyboard shortcuts')
    expect(
      [...panel.querySelectorAll('details')].map((d) => (d as HTMLDetailsElement).open),
    ).toEqual([true, false, false])
  })
})

// Keyboard-shortcuts reference (move-help-to-right-panel): the panel's last
// section, content-only, present in every state.
describe('keyboard-shortcuts section', () => {
  const panel = (props: { pageOpen?: boolean; loading?: boolean } = {}) => (
    <MetaPanel
      pageOpen={props.pageOpen ?? false}
      links={[]}
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
    expect(sections).toHaveLength(3)
    const last = sections[2] as HTMLDetailsElement
    expect(last.open).toBe(false)
    expect(last.querySelector('summary')?.textContent).toBe('Keyboard shortcuts')
    // Nothing follows it.
    expect(container.querySelectorAll('details')[2].nextElementSibling).toBeNull()
  })

  it('shows the reference in every panel state', () => {
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
    const { container } = render(panel())
    const sections = container.querySelectorAll('details')
    expect(sections[2].className).toContain(styles.footer)
    expect(sections[0].className).not.toContain(styles.footer)
  })

  it('opens independently of the Links section', () => {
    const { container } = render(panel({ pageOpen: true }))
    const sections = container.querySelectorAll('details')
    expect([...sections].map((s) => (s as HTMLDetailsElement).open)).toEqual([true, true, false])
    fireEvent.click(within(meta()).getByText('Keyboard shortcuts'))
    expect(sections[2].open).toBe(true)
    // Opening the reference leaves the Links section as it was.
    expect([...sections].map((s) => (s as HTMLDetailsElement).open)).toEqual([true, true, true])
  })
})

describe('MetaPanel board mode (add-whiteboards)', () => {
  it('shows Referenced by instead of the page-metadata sections', () => {
    render(
      <MetaPanel
        pageOpen={false}
        links={[]}
        activePath={null}
        boardOpen
        boardReferrers={[
          { kind: 'page', badge: 'in', title: 'Ideas', path: 'pages/Ideas.md', materialized: true },
          { kind: 'page', badge: 'in', title: 'Log', path: 'pages/Log.md', materialized: true },
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
    // A referrer is a backlink, so it carries the `in` badge.
    expect(
      panel.getByRole('button', { name: 'Ideas' }).querySelector(`.${styles.badge}`)?.textContent,
    ).toBe('in')
    expect(panel.queryByText('Links')).toBeNull()
  })

  it('navigates when a referrer row is activated', () => {
    const onSelect = vi.fn()
    render(
      <MetaPanel
        pageOpen={false}
        links={[]}
        activePath={null}
        boardOpen
        boardReferrers={[
          { kind: 'page', badge: 'in', title: 'Ideas', path: 'pages/Ideas.md', materialized: true },
        ]}
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
        links={[]}
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
