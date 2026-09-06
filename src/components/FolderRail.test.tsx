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

describe('FolderRail', () => {
  it('renders no entries while restoring', () => {
    render(
      <FolderRail status="restoring" folders={[]} activeId={null} onAdd={vi.fn()} onActivate={vi.fn()} onClose={vi.fn()} />,
    )
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('renders the add button and one avatar per folder', () => {
    const folders = [
      folder('Work', 'granted', 'a'),
      folder('Home', 'granted', 'b'),
    ]
    render(
      <FolderRail status="ready" folders={folders} activeId="b" onAdd={vi.fn()} onActivate={vi.fn()} onClose={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: 'Add folder' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Open folder Work' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Open folder Home' })).toBeTruthy()
  })

  it('marks the active folder and fires activate on click', () => {
    const folders = [
      folder('Work', 'granted', 'a'),
      folder('Home', 'granted', 'b'),
    ] as unknown as Parameters<typeof FolderRail>[0]['folders']
    const onActivate = vi.fn()
    render(
      <FolderRail status="ready" folders={folders} activeId="a" onAdd={vi.fn()} onActivate={onActivate} onClose={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: 'Open folder Work' }).getAttribute('aria-current')).toBe('page')
    expect(screen.getByRole('button', { name: 'Open folder Home' }).getAttribute('aria-current')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Open folder Home' }))
    expect(onActivate).toHaveBeenCalledWith('b')
  })

  it('renders pending folders with the pending marker', () => {
    const folders = [
      folder('Work', 'prompt', 'a'),
    ]
    render(
      <FolderRail status="ready" folders={folders} activeId={null} onAdd={vi.fn()} onActivate={vi.fn()} onClose={vi.fn()} />,
    )
    const work = screen.getByRole('button', { name: 'Open folder Work' })
    expect(work.className).toContain('pending')
  })

  it('falls back to a question mark for a nameless folder', () => {
    const folders = [
      folder('', 'granted', 'x'),
    ]
    render(
      <FolderRail status="ready" folders={folders} activeId={null} onAdd={vi.fn()} onActivate={vi.fn()} onClose={vi.fn()} />,
    )
    expect(screen.getAllByRole('button')[1].textContent).toContain('?')
  })

  it('fires add on the + button', () => {
    const onAdd = vi.fn()
    render(<FolderRail status="ready" folders={[]} activeId={null} onAdd={onAdd} onActivate={vi.fn()} onClose={vi.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add folder' }))
    expect(onAdd).toHaveBeenCalled()
  })

  it('renders a close control on every entry and closes without activating', () => {
    const folders = [
      folder('Work', 'granted', 'a'),
      folder('Home', 'granted', 'b'),
    ] as unknown as Parameters<typeof FolderRail>[0]['folders']
    const onActivate = vi.fn()
    const onClose = vi.fn()
    render(
      <FolderRail status="ready" folders={folders} activeId="a" onAdd={vi.fn()} onActivate={onActivate} onClose={onClose} />,
    )
    expect(screen.getByRole('button', { name: 'Close folder Work' })).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Close folder Home' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Close folder Home' }))
    expect(onClose).toHaveBeenCalledWith('b')
    expect(onActivate).not.toHaveBeenCalled()
  })

  it('closes the active entry without switching', () => {
    const folders = [folder('Work', 'granted', 'a')] as unknown as Parameters<typeof FolderRail>[0]['folders']
    const onActivate = vi.fn()
    const onClose = vi.fn()
    render(
      <FolderRail status="ready" folders={folders} activeId="a" onAdd={vi.fn()} onActivate={onActivate} onClose={onClose} />,
    )
    expect(screen.getByRole('button', { name: 'Close folder Work' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Close folder Work' }))
    expect(onClose).toHaveBeenCalledWith('a')
    expect(onActivate).not.toHaveBeenCalled()
  })

  it('shows a close control on pending entries too', () => {
    const folders = [folder('Work', 'prompt', 'a')]
    render(
      <FolderRail status="ready" folders={folders} activeId={null} onAdd={vi.fn()} onActivate={vi.fn()} onClose={vi.fn()} />,
    )
    expect(screen.getByRole('button', { name: 'Close folder Work' })).toBeTruthy()
  })
})