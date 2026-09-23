import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { FolderRail } from './FolderRail'
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
    expect(screen.getByRole('button', { name: 'Folio, go home' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Open search' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Add folder' })).toBeNull()
  })

  it('renders the brand and search trigger in every state', () => {
    const { rerender } = render(<FolderRail {...railProps({ onAdd: vi.fn() })} />)
    expect(screen.getByRole('button', { name: 'Folio, go home' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Open search' })).toBeTruthy()

    rerender(
      <FolderRail
        {...railProps({ folders: [folder('Work', 'granted', 'a')], searchDisabled: true })}
      />,
    )
    expect(screen.getByRole('button', { name: 'Folio, go home' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Open search' })).toBeTruthy()
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
    expect(screen.getByRole('button', { name: 'Add folder' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Open folder Work' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Open folder Home' })).toBeTruthy()
  })

  it('renders the add button only when the browser can open folders', () => {
    const folders = [folder('Work', 'granted', 'a')]
    render(<FolderRail {...railProps({ folders })} />)
    expect(screen.queryByRole('button', { name: 'Add folder' })).toBeNull()
    // The column and its entries stay: only the add control is gated.
    expect(screen.getByRole('navigation', { name: 'Open folders' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Open folder Work' })).toBeTruthy()
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
    expect(screen.getByRole('button', { name: 'Close folder Work' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Close folder Home' })).toBeTruthy()
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
    expect(screen.getByRole('button', { name: 'Close folder Work' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Close folder Work' }))
    expect(onClose).toHaveBeenCalledWith('a')
    expect(onActivate).not.toHaveBeenCalled()
  })

  it('shows a close control on pending entries too', () => {
    const folders = [folder('Work', 'prompt', 'a')]
    render(<FolderRail {...railProps({ folders, onAdd: vi.fn() })} />)
    expect(screen.getByRole('button', { name: 'Close folder Work' })).toBeTruthy()
  })
})
