import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { StatusBar } from './StatusBar'
import { version } from '../../package.json'
import styles from './StatusBar.module.css'

// App-level status frame (add-status-bar, ui-shell/page-editing specs): the
// crumb and save-state scenarios moved here from the editor pane, plus the
// indexing label, vault info, and the session navigation. Its controls are the
// navigation controls (move-nav-controls-to-status-bar) and the open page's
// name (reveal-open-page-in-files); the remaining groups are display-only. The
// pin star was removed by add-row-context-menu.

describe('StatusBar', () => {
  describe('path group (file breadcrumb)', () => {
    it('shows the vault-relative path as segments with the extension kept', () => {
      render(<StatusBar pagePath="notes/Deep/2026.md" />)
      const crumb = screen.getByTitle('notes/Deep/2026.md')
      expect(crumb.textContent).toBe('notes/Deep/2026.md')
      // Directories live in the shrinkable wrapper; the file name is the
      // separate last segment with .md kept.
      expect(crumb.querySelector(`.${styles.crumbDirs}`)?.textContent).toBe('notes/Deep')
      expect(crumb.querySelector(`.${styles.crumbLast}`)?.textContent).toBe('2026.md')
    })

    it('shows a single segment for a root-level file', () => {
      render(<StatusBar pagePath="todo.md" />)
      const crumb = screen.getByTitle('todo.md')
      expect(crumb.textContent).toBe('todo.md')
      // A root file has no directories wrapper, just the name segment.
      expect(crumb.querySelector(`.${styles.crumbDirs}`)).toBeNull()
      expect(crumb.querySelector(`.${styles.crumbLast}`)?.textContent).toBe('todo.md')
    })

    it('shows the would-be path of a page with no file yet', () => {
      render(<StatusBar pagePath="journals/2099-01-01.md" />)
      expect(screen.getByTitle('journals/2099-01-01.md').textContent).toBe('journals/2099-01-01.md')
    })

    it('leaves the path group empty without a page', () => {
      const { container } = render(<StatusBar pagePath={null} />)
      const path = container.querySelector(`.${styles.path}`)
      expect(path?.textContent).toBe('')
      expect(path?.getAttribute('title')).toBeNull()
    })

    it('keeps the crumb in the accessible tree with the full path tooltip', () => {
      render(<StatusBar pagePath="a/b.md" />)
      const crumb = screen.getByTitle('a/b.md')
      // Real identity text: no aria-hidden, no widget role.
      expect(crumb.getAttribute('aria-hidden')).toBeNull()
      expect(crumb.getAttribute('role')).toBeNull()
    })
  })

  describe('status group', () => {
    it.each([
      ['dirty', 'Unsaved changes'],
      ['saving', 'Saving…'],
      ['failed', 'Save failed'],
    ] as const)('shows %s save state as %s', (state, label) => {
      render(<StatusBar pagePath="a.md" saveState={state} />)
      expect(screen.getByRole('status').textContent).toBe(label)
    })

    it('shows the new-page copy for a page with no file yet', () => {
      render(<StatusBar pagePath="a.md" saveState="dirty" newPage />)
      expect(screen.getByRole('status').textContent).toBe('New page: created on first save')
    })

    it('shows nothing while the page is clean', () => {
      const { container } = render(<StatusBar pagePath="a.md" saveState="clean" />)
      expect(screen.queryByRole('status')).toBeNull()
      expect(container.querySelector(`.${styles.statusText}`)).toBeNull()
    })

    it('shows the indexing label while the index builds', () => {
      render(<StatusBar pagePath={null} indexing />)
      expect(screen.getByRole('status').textContent).toBe('Indexing notes…')
    })

    it('indexing outranks the save text', () => {
      render(<StatusBar pagePath="a.md" saveState="saving" indexing />)
      expect(screen.getByRole('status').textContent).toBe('Indexing notes…')
    })
  })

  describe('vault group', () => {
    it('shows the vault name and file count as display-only text', () => {
      const { container } = render(<StatusBar pagePath="a.md" vaultName="notes" fileCount={12} />)
      const status = screen.getByTitle('notes (12 files)')
      expect(status.textContent).toContain('notes')
      expect(status.textContent).toContain('· 12')
      // Display-only: no folder button, no controls on the vault text.
      expect(container.querySelectorAll('button')).toHaveLength(0)
    })

    it('leaves the vault group empty without a vault', () => {
      const { container } = render(<StatusBar pagePath="a.md" />)
      expect(container.querySelector(`.${styles.vault}`)?.textContent).toBe('')
    })
  })

  describe('version badge (version-in-status-bar)', () => {
    it('shows the running version beside the vault file count', () => {
      const { container } = render(<StatusBar pagePath="a.md" vaultName="notes" fileCount={12} />)
      const badge = screen.getByText(`v${version}`)
      expect(badge.tagName).toBe('SPAN')
      // Beside the count: the vault group comes first, the badge at the trailing
      // edge, and the badge is not part of the vault group (which stays empty
      // without a vault).
      const vault = container.querySelector(`.${styles.vault}`)
      expect(vault!.compareDocumentPosition(badge) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it('renders with no vault open', () => {
      // Build identity renders in every app state, the empty one included.
      render(<StatusBar pagePath={null} />)
      expect(screen.getByText(`v${version}`)).toBeTruthy()
    })
  })

  describe('no help control (move-help-to-right-panel)', () => {
    it('holds no help button in any state', () => {
      const { container, rerender } = render(<StatusBar pagePath={null} />)
      expect(container.querySelector('button')).toBeNull()
      rerender(<StatusBar pagePath="a.md" saveState="saving" vaultName="notes" fileCount={1} />)
      expect(container.querySelector('button')).toBeNull()
    })
  })

  describe('page-name reveal (reveal-open-page-in-files)', () => {
    it('renders the page name as a control when the app supplies a reveal handler', () => {
      const onRevealPage = vi.fn()
      render(<StatusBar pagePath="notes/Deep/2026.md" onRevealPage={onRevealPage} />)
      const name = screen.getByRole('button', { name: 'Reveal 2026.md in Files' })
      expect(name.textContent).toBe('2026.md')
      fireEvent.click(name)
      expect(onRevealPage).toHaveBeenCalledTimes(1)
    })

    it('leaves the page name as inert text without a handler', () => {
      render(<StatusBar pagePath="notes/Deep/2026.md" />)
      expect(screen.queryByRole('button')).toBeNull()
      expect(
        screen.getByTitle('notes/Deep/2026.md').querySelector(`.${styles.crumbLast}`)?.textContent,
      ).toBe('2026.md')
    })

    it('keeps the directory crumbs and the other groups inert', () => {
      const onRevealPage = vi.fn()
      const { container } = render(
        <StatusBar
          pagePath="notes/Deep/2026.md"
          saveState="saving"
          vaultName="notes"
          fileCount={3}
          onRevealPage={onRevealPage}
        />,
      )
      // The page name is the bar's only button here: the directory crumbs, the
      // status text, and the vault name carry no activation path.
      const buttons = container.querySelectorAll('button')
      expect(buttons).toHaveLength(1)
      expect(buttons[0].textContent).toBe('2026.md')
      fireEvent.click(container.querySelector(`.${styles.crumbDirs}`) as HTMLElement)
      expect(onRevealPage).not.toHaveBeenCalled()
    })
  })

  describe('the bar performs no actions', () => {
    it('exposes no control of its own', () => {
      const { container } = render(
        <StatusBar pagePath="notes/a.md" saveState="saving" vaultName="notes" fileCount={3} />,
      )
      // Breadcrumb segments and the vault text are not interactive, and the
      // bar now renders no control of its own when App supplies no navigation
      // (add-row-context-menu removed the pin star).
      expect(container.querySelectorAll('button')).toHaveLength(0)
    })
  })

  describe('navigation controls (move-nav-controls-to-status-bar)', () => {
    const nav = {
      canBack: true,
      canForward: true,
      onBack: vi.fn(),
      onForward: vi.fn(),
      canToday: true,
      onToday: vi.fn(),
    }

    it('leads the bar with Back, Forward, and Today, in order', () => {
      const { container } = render(<StatusBar pagePath="a.md" {...nav} />)
      const group = container.querySelector(`.${styles.nav}`) as HTMLElement
      const buttons = [...group.querySelectorAll('button')]
      expect(buttons.map((b) => b.getAttribute('aria-label') ?? b.textContent)).toEqual([
        'Back',
        'Forward',
        'Today',
      ])
      // Nav precedes the breadcrumb.
      const path = container.querySelector(`.${styles.path}`) as HTMLElement
      expect(group.compareDocumentPosition(path) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    })

    it('disables Back and Forward when the trail has nowhere to step', () => {
      const { rerender } = render(<StatusBar pagePath="a.md" {...nav} canBack={false} />)
      expect((screen.getByRole('button', { name: 'Back' }) as HTMLButtonElement).disabled).toBe(
        true,
      )
      expect((screen.getByRole('button', { name: 'Forward' }) as HTMLButtonElement).disabled).toBe(
        false,
      )
      rerender(<StatusBar pagePath="a.md" {...nav} canForward={false} />)
      expect((screen.getByRole('button', { name: 'Forward' }) as HTMLButtonElement).disabled).toBe(
        true,
      )
    })

    it('disables Today while no vault is usable', () => {
      render(<StatusBar pagePath={null} {...nav} canToday={false} />)
      expect((screen.getByRole('button', { name: 'Today' }) as HTMLButtonElement).disabled).toBe(
        true,
      )
    })

    it('calls the handler for each control', () => {
      const onBack = vi.fn()
      const onForward = vi.fn()
      const onToday = vi.fn()
      render(
        <StatusBar
          pagePath="a.md"
          {...nav}
          onBack={onBack}
          onForward={onForward}
          onToday={onToday}
        />,
      )
      fireEvent.click(screen.getByRole('button', { name: 'Back' }))
      fireEvent.click(screen.getByRole('button', { name: 'Forward' }))
      fireEvent.click(screen.getByRole('button', { name: 'Today' }))
      expect(onBack).toHaveBeenCalledTimes(1)
      expect(onForward).toHaveBeenCalledTimes(1)
      expect(onToday).toHaveBeenCalledTimes(1)
    })

    it('renders no navigation controls without handlers', () => {
      const { container } = render(<StatusBar pagePath="a.md" />)
      expect(container.querySelector(`.${styles.nav}`)).toBeNull()
    })
  })

  describe('the compact app bar (add-compact-mobile-shell spec)', () => {
    const onShowView = vi.fn()

    it('carries a view control at each end and no others', () => {
      const { container } = render(
        <StatusBar pagePath="a.md" compact view="editor" onShowView={onShowView} />,
      )
      const bar = container.querySelector('footer') as HTMLElement
      const controls = [...bar.querySelectorAll('button')].map(
        (b) => b.getAttribute('aria-label') ?? b.textContent,
      )
      // The two view controls lead and trail; the folder statistics and the
      // version a wide window shows are gone.
      expect(controls).toEqual(['Navigation', 'Page details'])
      expect(bar.className).toContain(styles.compactBar)
    })

    it('reports each view\u2019s shown state', () => {
      render(<StatusBar pagePath="a.md" compact view="nav" onShowView={onShowView} />)
      expect(screen.getByRole('button', { name: 'Navigation' }).getAttribute('aria-pressed')).toBe(
        'true',
      )
      expect(
        screen.getByRole('button', { name: 'Page details' }).getAttribute('aria-pressed'),
      ).toBe('false')
    })

    it('asks for a view when its control is activated', () => {
      const show = vi.fn()
      render(<StatusBar pagePath="a.md" compact view="editor" onShowView={show} />)
      fireEvent.click(screen.getByRole('button', { name: 'Navigation' }))
      fireEvent.click(screen.getByRole('button', { name: 'Page details' }))
      expect(show.mock.calls).toEqual([['nav'], ['meta']])
    })

    /** The pane path inside a view control's glyph, or null when it is closed. */
    const paneOf = (name: string) => {
      const svg = screen.getByRole('button', { name }).querySelector('svg') as SVGElement
      return svg.querySelector('path[fill="currentColor"]') as SVGPathElement | null
    }

    it('draws the open view\u2019s pane filled and the closed one empty', () => {
      const { rerender } = render(<StatusBar pagePath="a.md" compact view="nav" />)
      expect(paneOf('Navigation')).toBeTruthy()
      expect(paneOf('Page details')).toBeNull()

      rerender(<StatusBar pagePath="a.md" compact view="meta" />)
      expect(paneOf('Navigation')).toBeNull()
      expect(paneOf('Page details')).toBeTruthy()

      // The editor view is neither control's, so both are closed.
      rerender(<StatusBar pagePath="a.md" compact view="editor" />)
      expect(paneOf('Navigation')).toBeNull()
      expect(paneOf('Page details')).toBeNull()
    })

    it('fills the pane on the side its divider is drawn', () => {
      const nav = render(<StatusBar pagePath="a.md" compact view="nav" />)
      // Navigation's divider is at x=9 and its pane is to the left of it; the
      // meta control mirrors that. The fill and the divider cannot disagree
      // because both come from the same `side`.
      expect(paneOf('Navigation')!.getAttribute('d')).toBe(
        'M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4Z',
      )
      nav.unmount()

      render(<StatusBar pagePath="a.md" compact view="meta" />)
      expect(paneOf('Page details')!.getAttribute('d')).toBe(
        'M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4Z',
      )
    })

    it('draws the state it reports', () => {
      for (const view of ['nav', 'editor', 'meta'] as const) {
        const { unmount } = render(<StatusBar pagePath="a.md" compact view={view} />)
        for (const name of ['Navigation', 'Page details'] as const) {
          const button = screen.getByRole('button', { name })
          const reported = button.getAttribute('aria-pressed') === 'true'
          expect(Boolean(paneOf(name))).toBe(reported)
        }
        unmount()
      }
    })

    it('shows the open item\u2019s name alone, with no directories', () => {
      const { container } = render(<StatusBar pagePath="journals/2026-09-15.md" compact />)
      const crumb = container.querySelector(`.${styles.path}`) as HTMLElement
      expect(crumb.textContent).toBe('2026-09-15.md')
      expect(crumb.querySelector(`.${styles.crumbDirs}`)).toBeNull()
    })

    it('drops the folder statistics and the version a wide bar shows', () => {
      const { container } = render(
        <StatusBar pagePath="a.md" vaultName="notes" fileCount={12} compact />,
      )
      expect(container.querySelector(`.${styles.vaultStatus}`)).toBeNull()
      expect(container.querySelector(`.${styles.version}`)).toBeNull()
      expect(
        within(container.querySelector('footer') as HTMLElement).queryByText(`v${version}`),
      ).toBeNull()
      // The wide bar keeps both.
      const wide = render(<StatusBar pagePath="a.md" vaultName="notes" fileCount={12} />)
      expect(wide.container.querySelector(`.${styles.vaultStatus}`)).toBeTruthy()
      expect(wide.container.querySelector(`.${styles.version}`)).toBeTruthy()
    })

    it('keeps the save-state label in the compact row', () => {
      render(<StatusBar pagePath="a.md" saveState="dirty" compact />)
      expect(screen.getByRole('status').textContent).toBe('Unsaved changes')
    })
  })
})
