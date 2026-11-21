import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { FolderRail, ISSUE_CHOOSER_URL } from './FolderRail'
import styles from './FolderRail.module.css'
import { buildTree } from '../vault/fakeHandle'
import type { VaultFolder } from '../vault/useVault'

function folder(name: string, permission: 'granted' | 'prompt', id: string) {
  const h = buildTree({})
  h.name = name
  h.permission = permission
  h._id = id
  return {
    id,
    name: h.name as string,
    permission: h.permission as 'granted' | 'prompt',
    handle: h as unknown as FileSystemDirectoryHandle,
  } satisfies Omit<VaultFolder, 'storage' | 'fileCount'>
}

type RailProps = Parameters<typeof FolderRail>[0]

/** The rail's shared props (replace-header-with-spotlight): the brand and
 *  search trigger are always present, so every case supplies them. */
function railProps(overrides: Partial<RailProps> = {}): RailProps {
  return {
    status: 'ready',
    folders: [],
    activeId: null,
    onHome: vi.fn(),
    onSearch: vi.fn(),
    onActivate: vi.fn(),
    onClose: vi.fn(),
    ...overrides,
  }
}

describe('FolderRail', () => {
  it('renders the brand and search trigger while restoring, but no entries', () => {
    render(<FolderRail {...railProps({ status: 'restoring', searchDisabled: true })} />)
    screen.getByRole('button', { name: 'Folio, go home' })
    screen.getByRole('button', { name: 'Open search' })
    expect(screen.queryByRole('button', { name: 'Add folder' })).toBeNull()
  })

  it('renders the brand and search trigger in every state', () => {
    const { rerender } = render(<FolderRail {...railProps({ onAdd: vi.fn() })} />)
    screen.getByRole('button', { name: 'Folio, go home' })
    screen.getByRole('button', { name: 'Open search' })

    rerender(
      <FolderRail
        {...railProps({ folders: [folder('Work', 'granted', 'a')], searchDisabled: true })}
      />,
    )
    screen.getByRole('button', { name: 'Folio, go home' })
    screen.getByRole('button', { name: 'Open search' })
  })

  it('fires home on the brand and opens search from the trigger', () => {
    const onHome = vi.fn()
    const onSearch = vi.fn()
    render(<FolderRail {...railProps({ onHome, onSearch })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Folio, go home' }))
    expect(onHome).toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Open search' }))
    expect(onSearch).toHaveBeenCalled()
  })

  it('disables and inerts the search trigger without a usable vault', () => {
    const onSearch = vi.fn()
    render(<FolderRail {...railProps({ onSearch, searchDisabled: true })} />)
    const trigger = screen.getByRole('button', { name: 'Open search' }) as HTMLButtonElement
    expect(trigger.disabled).toBe(true)
    fireEvent.click(trigger)
    expect(onSearch).not.toHaveBeenCalled()
  })

  it('renders the add button and one avatar per folder', () => {
    const folders = [folder('Work', 'granted', 'a'), folder('Home', 'granted', 'b')]
    render(<FolderRail {...railProps({ folders, activeId: 'b', onAdd: vi.fn() })} />)
    screen.getByRole('button', { name: 'Add folder' })
    screen.getByRole('button', { name: 'Open folder Work' })
    screen.getByRole('button', { name: 'Open folder Home' })
  })

  it('renders the add button only when the browser can open folders', () => {
    const folders = [folder('Work', 'granted', 'a')]
    render(<FolderRail {...railProps({ folders })} />)
    expect(screen.queryByRole('button', { name: 'Add folder' })).toBeNull()
    // The column and its entries stay: only the add control is gated.
    screen.getByRole('navigation', { name: 'Open folders' })
    screen.getByRole('button', { name: 'Open folder Work' })
  })

  it('marks the active folder and fires activate on click', () => {
    const folders = [
      folder('Work', 'granted', 'a'),
      folder('Home', 'granted', 'b'),
    ] as unknown as RailProps['folders']
    const onActivate = vi.fn()
    render(<FolderRail {...railProps({ folders, activeId: 'a', onAdd: vi.fn(), onActivate })} />)
    expect(
      screen.getByRole('button', { name: 'Open folder Work' }).getAttribute('aria-current'),
    ).toBe('page')
    expect(
      screen.getByRole('button', { name: 'Open folder Home' }).getAttribute('aria-current'),
    ).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Open folder Home' }))
    expect(onActivate).toHaveBeenCalledWith('b')
  })

  it('renders pending folders with the pending marker', () => {
    const folders = [folder('Work', 'prompt', 'a')]
    render(<FolderRail {...railProps({ folders, onAdd: vi.fn() })} />)
    const work = screen.getByRole('button', { name: 'Open folder Work' })
    expect(work.className).toContain('pending')
  })

  it('applies the collapsed class while the left navigation is folded', () => {
    const { container } = render(
      <FolderRail {...railProps({ folders: [folder('Work', 'granted', 'a')], collapsed: true })} />,
    )
    const nav = container.querySelector('nav') as HTMLElement
    expect(nav.id).toBe('folder-rail')
    // The collapsed class applies visibility: hidden, which keeps the grid slot
    // while taking the rail's controls out of the tab order in the browser
    // (jsdom does not apply CSS-module rules, so only the class is assertable).
    expect(nav.className).toContain(styles.collapsed)
  })

  it('falls back to a question mark for a nameless folder', () => {
    const folders = [folder('', 'granted', 'x')]
    render(<FolderRail {...railProps({ folders, onAdd: vi.fn() })} />)
    const name = screen.getAllByRole('button').find((b) => b.textContent?.includes('?'))
    expect(name).toBeTruthy()
  })

  it('fires add on the + button', () => {
    const onAdd = vi.fn()
    render(<FolderRail {...railProps({ onAdd })} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add folder' }))
    expect(onAdd).toHaveBeenCalled()
  })

  it("renders the tour control only with onTour, and it is the rail's last", () => {
    const onTour = vi.fn()
    const { rerender } = render(<FolderRail {...railProps({ onTour })} />)
    const tour = screen.getByRole('button', { name: 'Take the tour' })
    fireEvent.click(tour)
    expect(onTour).toHaveBeenCalledTimes(1)

    // Last in DOM order: the rail's bottom-anchored control follows every
    // folder entry and its close badge.
    const nav = screen.getByRole('navigation', { name: 'Open folders' })
    const controls = nav.querySelectorAll('button')
    expect(controls[controls.length - 1]).toBe(tour)

    rerender(
      <FolderRail {...railProps({ folders: [folder('Work', 'granted', 'a')], onAdd: vi.fn() })} />,
    )
    expect(screen.queryByRole('button', { name: 'Take the tour' })).toBeNull()
  })

  it('renders a close control on every entry and closes without activating', () => {
    const folders = [
      folder('Work', 'granted', 'a'),
      folder('Home', 'granted', 'b'),
    ] as unknown as RailProps['folders']
    const onActivate = vi.fn()
    const onClose = vi.fn()
    render(
      <FolderRail
        {...railProps({ folders, activeId: 'a', onAdd: vi.fn(), onActivate, onClose })}
      />,
    )
    screen.getByRole('button', { name: 'Close folder Work' })
    screen.getByRole('button', { name: 'Close folder Home' })
    fireEvent.click(screen.getByRole('button', { name: 'Close folder Home' }))
    expect(onClose).toHaveBeenCalledWith('b')
    expect(onActivate).not.toHaveBeenCalled()
  })

  it('closes the active entry without switching', () => {
    const folders = [folder('Work', 'granted', 'a')] as unknown as RailProps['folders']
    const onActivate = vi.fn()
    const onClose = vi.fn()
    render(
      <FolderRail
        {...railProps({ folders, activeId: 'a', onAdd: vi.fn(), onActivate, onClose })}
      />,
    )
    screen.getByRole('button', { name: 'Close folder Work' })
    fireEvent.click(screen.getByRole('button', { name: 'Close folder Work' }))
    expect(onClose).toHaveBeenCalledWith('a')
    expect(onActivate).not.toHaveBeenCalled()
  })

  it('shows a close control on pending entries too', () => {
    const folders = [folder('Work', 'prompt', 'a')]
    render(<FolderRail {...railProps({ folders, onAdd: vi.fn() })} />)
    screen.getByRole('button', { name: 'Close folder Work' })
  })
})

describe('FolderRail bottom group', () => {
  it('opens the issue chooser from the feedback control in a new tab', () => {
    render(<FolderRail {...railProps()} />)
    const feedback = screen.getByRole('link', { name: 'Send feedback on GitHub' })
    expect(feedback.getAttribute('href')).toBe(ISSUE_CHOOSER_URL)
    expect(feedback.getAttribute('href')).toBe('https://github.com/ypyl/folio/issues/new/choose')
    expect(feedback.getAttribute('target')).toBe('_blank')
    expect(feedback.getAttribute('rel')).toBe('noopener noreferrer')
  })

  it('renders the feedback control in every state where no tour is offered', () => {
    const { rerender } = render(<FolderRail {...railProps({ status: 'restoring' })} />)
    screen.getByRole('link', { name: 'Send feedback on GitHub' })

    rerender(
      <FolderRail {...railProps({ folders: [folder('Work', 'granted', 'a')], onAdd: vi.fn() })} />,
    )
    screen.getByRole('link', { name: 'Send feedback on GitHub' })
  })

  it('holds one control: the tour while App offers it, feedback otherwise', () => {
    const { rerender } = render(<FolderRail {...railProps({ onTour: vi.fn() })} />)
    // The demo's rail carries the tour and no feedback anchor
    // (tour-lives-in-the-demo): the slot holds one control, never both.
    screen.getByRole('button', { name: 'Take the tour' })
    expect(screen.queryByRole('link', { name: 'Send feedback on GitHub' })).toBeNull()

    rerender(<FolderRail {...railProps()} />)
    screen.getByRole('link', { name: 'Send feedback on GitHub' })
    expect(screen.queryByRole('button', { name: 'Take the tour' })).toBeNull()
  })

  it('puts the bottom control last', () => {
    render(<FolderRail {...railProps({ onTour: vi.fn() })} />)
    const nav = screen.getByRole('navigation', { name: 'Open folders' })
    const controls = nav.querySelectorAll('button')
    expect(controls[controls.length - 1]).toBe(
      screen.getByRole('button', { name: 'Take the tour' }),
    )
  })

  it('renders no tour control when App offers none', () => {
    render(<FolderRail {...railProps()} />)
    expect(screen.queryByRole('button', { name: 'Take the tour' })).toBeNull()
    // The bottom group then holds the feedback control, so the rail keeps its
    // way out to the issue tracker.
    screen.getByRole('link', { name: 'Send feedback on GitHub' })
  })
})

describe('FolderRail experimental switch (add-agent-activity-log)', () => {
  const gated = [{ flag: 'agentTools' as const, label: 'Agent tools', detail: 'Records it' }]

  it('flips the switch and reports its state', () => {
    const onTogglePrerelease = vi.fn()
    const { rerender } = render(
      <FolderRail {...railProps({ prerelease: false, onTogglePrerelease, experimental: gated })} />,
    )
    const control = screen.getByRole('button', { name: 'Experimental features' })
    expect(control.getAttribute('aria-pressed')).toBe('false')
    fireEvent.click(control)
    expect(onTogglePrerelease).toHaveBeenCalledTimes(1)

    rerender(
      <FolderRail {...railProps({ prerelease: true, onTogglePrerelease, experimental: gated })} />,
    )
    expect(
      screen.getByRole('button', { name: 'Experimental features' }).getAttribute('aria-pressed'),
    ).toBe('true')
  })

  it('renders the switch only when App offers it', () => {
    render(<FolderRail {...railProps()} />)
    expect(screen.queryByRole('button', { name: 'Experimental features' })).toBeNull()
  })

  it('takes its own slot above the bottom group, keeping the tour last', () => {
    render(
      <FolderRail
        {...railProps({
          prerelease: true,
          onTogglePrerelease: vi.fn(),
          experimental: gated,
          onTour: vi.fn(),
        })}
      />,
    )
    const nav = screen.getByRole('navigation', { name: 'Open folders' })
    const controls = [...nav.querySelectorAll('button')]
    const switchAt = controls.indexOf(screen.getByRole('button', { name: 'Experimental features' }))
    const tourAt = controls.indexOf(screen.getByRole('button', { name: 'Take the tour' }))
    expect(switchAt).toBeGreaterThanOrEqual(0)
    expect(switchAt).toBe(tourAt - 1)
    expect(tourAt).toBe(controls.length - 1)
  })

  it('shows the descriptions on hover and on keyboard focus', () => {
    render(
      <FolderRail
        {...railProps({ prerelease: false, onTogglePrerelease: vi.fn(), experimental: gated })}
      />,
    )
    const control = screen.getByRole('button', { name: 'Experimental features' })
    expect(screen.queryByRole('tooltip')).toBeNull()

    fireEvent.mouseEnter(control)
    screen.getByRole('tooltip')
    screen.getByText('Agent tools')
    screen.getByText('Records it')
    // The control is described by what it shows, so the popup adds a
    // description rather than a second name.
    expect(control.getAttribute('aria-describedby')).toBe(
      screen.getByRole('tooltip').getAttribute('id'),
    )

    fireEvent.mouseLeave(control)
    expect(screen.queryByRole('tooltip')).toBeNull()

    fireEvent.focus(control)
    screen.getByRole('tooltip')
    fireEvent.blur(control)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('shows no popup when the build gates nothing', () => {
    render(<FolderRail {...railProps({ prerelease: false, onTogglePrerelease: vi.fn() })} />)
    fireEvent.mouseEnter(screen.getByRole('button', { name: 'Experimental features' }))
    expect(screen.queryByRole('tooltip')).toBeNull()
  })
})
