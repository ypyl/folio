import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { StatusBar } from './StatusBar'
import styles from './StatusBar.module.css'

// App-level status frame (add-status-bar, ui-shell/page-editing specs): the
// crumb and save-state scenarios moved here from the editor pane, plus the
// indexing label, vault info, and help-button contract.

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
      // Display-only: no folder button, no actions on the vault text.
      expect(container.querySelectorAll('button')).toHaveLength(1) // only the help button
    })

    it('leaves the vault group empty without a vault', () => {
      const { container } = render(<StatusBar pagePath="a.md" />)
      expect(container.querySelector(`.${styles.vault}`)?.textContent).toBe('')
    })
  })

  describe('help button', () => {
    it('is present in every state, including the empty state', () => {
      const { rerender } = render(<StatusBar pagePath={null} />)
      expect(screen.getByRole('button', { name: 'Keyboard shortcuts' })).toBeTruthy()
      rerender(<StatusBar pagePath="a.md" saveState="saving" vaultName="notes" fileCount={1} />)
      expect(screen.getByRole('button', { name: 'Keyboard shortcuts' })).toBeTruthy()
    })

    it('fires onHelp and keeps the dialog aria wiring', () => {
      const onHelp = vi.fn()
      render(<StatusBar pagePath="a.md" onHelp={onHelp} helpOpen />)
      const button = screen.getByRole('button', { name: 'Keyboard shortcuts' })
      expect(button.getAttribute('aria-expanded')).toBe('true')
      expect(button.getAttribute('aria-controls')).toBeTruthy()
      fireEvent.click(button)
      expect(onHelp).toHaveBeenCalled()
    })
  })

  describe('the bar performs no actions', () => {
    it('exposes no control other than the help button', () => {
      const { container } = render(
        <StatusBar pagePath="notes/a.md" saveState="saving" vaultName="notes" fileCount={3} />,
      )
      // Breadcrumb segments and vault text are not interactive; the bar's
      // only button is the help control.
      const buttons = container.querySelectorAll('button')
      expect(buttons).toHaveLength(1)
      expect(buttons[0].getAttribute('aria-label')).toBe('Keyboard shortcuts')
    })
  })
})