// The restore window is a loading state (show-what-is-loading, design D1/D2).
//
// The app reopens its stored folder at start: a registry read, a permission
// query, and a scan. This suite owns that window by mocking the folder registry,
// because the real one settles too fast to observe and because the app's other
// integration suite must keep the real restore path.

import { render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { buildTree, type FakeDirectoryHandle } from './vault/fakeHandle'

// The registry the hook reads at start. `delayMs` holds `listVaultHandles` open,
// which is the window under test; `handles` is what it answers with.
const registry = vi.hoisted(() => ({
  delayMs: 0,
  started: false,
  handles: [] as unknown[],
  lastActiveId: null as string | null,
}))

vi.mock('./vault/handleStore', () => ({
  listVaultHandles: async () => {
    registry.started = true
    if (registry.delayMs > 0) await new Promise((resolve) => setTimeout(resolve, registry.delayMs))
    return registry.handles
  },
  saveVaultHandle: async () => {},
  clearVaultHandle: async () => {},
  getLastActiveId: async () => registry.lastActiveId,
  setLastActiveId: async () => {},
  clearLastActiveId: async () => {},
}))

const FIXTURE = { pages: { 'Welcome.md': 'Start here.' } }

/** A stored folder the app can reopen without a picker: granted, with a handle. */
function storedFolder(tree: FakeDirectoryHandle = buildTree(FIXTURE)) {
  tree.name = 'notes'
  return { id: 'v1', name: 'notes', handle: tree }
}

afterEach(() => {
  registry.delayMs = 0
  registry.started = false
  registry.handles = []
  registry.lastActiveId = null
  localStorage.clear()
})

describe('reopening the stored folder at start', () => {
  it('says what it is doing while a slow restore runs', async () => {
    registry.delayMs = 400
    registry.handles = [storedFolder()]
    registry.lastActiveId = 'v1'

    render(<App />)

    // After the hold, not before: the phrase and the placeholders belong to a
    // start that is actually slow.
    const phrase = await screen.findByText('Opening your notes…', undefined, { timeout: 2000 })
    expect(phrase).toBeTruthy()
    // The shell's own placeholders, in the pane and in the sidebar.
    expect(document.querySelectorAll('.skeleton').length).toBeGreaterThan(0)

    // And it ends: the folder resolves and the shell shows its content.
    expect(await screen.findByRole('button', { name: 'Welcome' }, { timeout: 4000 })).toBeTruthy()
    expect(screen.queryByText('Opening your notes…')).toBeNull()
  })

  it('shows no placeholder for a start that settles at once', async () => {
    registry.delayMs = 0
    registry.handles = [storedFolder()]
    registry.lastActiveId = 'v1'

    render(<App />)

    // The listing lands without the loading state ever being shown.
    expect(await screen.findByRole('button', { name: 'Welcome' }, { timeout: 4000 })).toBeTruthy()
    expect(screen.queryByText('Opening your notes…')).toBeNull()
    expect(document.querySelectorAll('.skeleton').length).toBe(0)
  })

  it('names the reopening before the indexing, never both', async () => {
    registry.delayMs = 400
    registry.handles = [storedFolder()]
    registry.lastActiveId = 'v1'

    render(<App />)

    await screen.findByText('Opening your notes…', undefined, { timeout: 2000 })
    // One phase at a time in the status slot: the index phrase follows the
    // reopening, it does not sit beside it.
    expect(screen.queryByText('Indexing notes…')).toBeNull()
    const status = screen.getAllByRole('status')[0]
    expect(within(status).queryByText('Opening your notes…')).toBeTruthy()
  })
})
