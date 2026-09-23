import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { SearchSpotlight } from './SearchSpotlight'
import styles from './SearchSpotlight.module.css'
import matchStyles from './MatchBody.module.css'
import type { SearchDoc } from '../search/core'

// The spotlight is prop-driven (components never import the vault): docs arrive
// via props, selection reports through onSelect, and App owns the `open` flag.
// Every test renders through a small stateful wrapper so close/reopen behavior
// is real rather than a fixed prop.

const page = (path: string, content = ''): SearchDoc => ({
  path,
  title: path.replace(/\.md$/, '').split('/').pop()!,
  kind: 'page',
  text: content,
})

const journal = (path: string, content = ''): SearchDoc => ({
  path,
  title: path.split('/').pop()!.replace('.md', ''),
  kind: 'journal',
  text: content,
})

/** A vault file document (search-assets-by-name): labelled by its path inside
 *  `assets/`, and carrying no text — the app never reads a file's bytes. */
const asset = (path: string): SearchDoc => ({
  path,
  title: path.replace(/^assets\//, ''),
  kind: 'asset',
  text: '',
})

const input = () => screen.getByRole('textbox', { name: 'Search notes' })
const listbox = () => screen.getByRole('listbox', { name: 'Search results' })
const options = () => within(listbox()).getAllByRole('option')
const scrim = () => document.querySelector(`.${styles.scrim}`) as HTMLElement

async function type(value: string) {
  fireEvent.change(input(), { target: { value } })
  await waitFor(() => expect(options().length).toBeGreaterThan(0))
}

interface SpotlightProps {
  docs: SearchDoc[]
  disabled?: boolean
  onSelect?: (path: string, block: number | null) => void
  onOpenAsset?: (path: string) => void
  onOpenBoard?: (path: string) => void
  onQueryResult?: (query: string, results: SearchResult[]) => void
  onSeeAll?: (query: string) => void
}

type SearchResult = import('../search/core').SearchResult

/** Render the spotlight with App-owned open state. Returns the `onClose` spy
 *  and the initial-open flag the wrapper used. */
function renderSpotlight(props: SpotlightProps, initialOpen = true) {
  const onClose = vi.fn()
  function Wrapper() {
    const [open, setOpen] = useState(initialOpen)
    return (
      <>
        <button type="button" onClick={() => setOpen(true)}>
          reopen
        </button>
        <SearchSpotlight
          open={open}
          docs={props.docs}
          disabled={props.disabled ?? false}
          onOpen={() => setOpen(true)}
          onClose={() => {
            onClose()
            setOpen(false)
          }}
          onSelect={props.onSelect ?? (() => {})}
          onOpenAsset={props.onOpenAsset ?? (() => {})}
          onOpenBoard={props.onOpenBoard}
          onQueryResult={props.onQueryResult}
          onSeeAll={props.onSeeAll}
        />
      </>
    )
  }
  render(<Wrapper />)
  return { onClose }
}

describe('SearchSpotlight rendering (search spec: groups, labels, snippets)', () => {
  it('renders Pages and Journal groups with their rows', async () => {
    renderSpotlight({
      docs: [
        page('Welcome.md', 'docker is used in ops'),
        journal('journals/2026-09-02.md', 'docker setup notes'),
      ],
    })
    await type('docker')
    expect(within(listbox()).getByText('Pages')).toBeTruthy()
    expect(within(listbox()).getByText('Journal')).toBeTruthy()
    expect(options()).toHaveLength(2)
    expect(screen.getByText('Welcome')).toBeTruthy()
  })

  it('labels journal days with their pretty date, not the raw stem', async () => {
    renderSpotlight({ docs: [journal('journals/2026-09-02.md', 'docker body')] })
    await type('docker')
    expect(screen.getByText('September 2, 2026')).toBeTruthy()
    expect(screen.queryByText('2026-09-02')).toBeNull()
  })

  it('highlights the matched span in the snippet', async () => {
    renderSpotlight({ docs: [page('Ops.md', 'We run docker in production daily')] })
    await type('docker')
    const marks = listbox().querySelectorAll(`mark.${matchStyles.hit}`)
    expect(marks.length).toBeGreaterThan(0)
    expect(marks[0].textContent).toBe('docker')
  })

  it('shows an empty state when nothing matches', async () => {
    renderSpotlight({ docs: [page('Welcome.md', 'hello')] })
    fireEvent.change(input(), { target: { value: 'xyzzy' } })
    await waitFor(() => expect(screen.getByText('No matches for \u201Cxyzzy\u201D.')).toBeTruthy())
  })

  it('caps a group in the dropdown and offers the see-all row', async () => {
    const docs: SearchDoc[] = []
    for (let i = 0; i < 23; i++) docs.push(page(`p${i}.md`, 'docker body'))
    renderSpotlight({ docs })
    await type('docker')
    expect(options()).toHaveLength(20)
    expect(screen.getByRole('button', { name: 'See all 23 results' })).toBeTruthy()
  })

  it('shows the see-all row whenever a query matches', async () => {
    renderSpotlight({ docs: [page('Alpha.md', 'docker one'), page('Beta.md', 'docker two')] })
    await type('docker')
    expect(screen.getByRole('button', { name: 'See all 2 results' })).toBeTruthy()
  })

  it('hides the see-all row when nothing matches', async () => {
    renderSpotlight({ docs: [page('Welcome.md', 'hello')] })
    fireEvent.change(input(), { target: { value: 'xyzzy' } })
    await waitFor(() => expect(screen.getByText('No matches for \u201Cxyzzy\u201D.')).toBeTruthy())
    expect(screen.queryByRole('button', { name: /See all/ })).toBeNull()
  })

  it('shows the snippet for a title-only match (opening lines)', async () => {
    renderSpotlight({ docs: [page('Docker.md', 'First line\nSecond line')] })
    await type('docker')
    expect(within(listbox()).getByText(/First line/)).toBeTruthy()
  })
})

describe('SearchSpotlight action flow (search spec: debounce, outside click, clear, escape)', () => {
  it('stays hidden until results are computed (no empty-state flash while typing)', async () => {
    renderSpotlight({ docs: [page('Welcome.md', 'docker here')] })
    fireEvent.change(input(), { target: { value: 'doc' } })
    expect(screen.queryByRole('listbox')).toBeNull()
    await waitFor(() => expect(screen.getByRole('listbox')).toBeTruthy())
    expect(screen.getByText('Welcome')).toBeTruthy()
  })

  it('closes on a scrim click keeping the query; reopening restores results', async () => {
    const { onClose } = renderSpotlight({ docs: [page('Welcome.md', 'docker here')] })
    await type('docker')
    fireEvent.click(scrim())
    expect(onClose).toHaveBeenCalled()
    expect(screen.queryByRole('textbox', { name: 'Search notes' })).toBeNull()

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    await waitFor(() => expect(screen.getByRole('listbox')).toBeTruthy())
    expect((input() as HTMLInputElement).value).toBe('docker')
  })

  it('see-all keeps the query, closes the spotlight, and reports the query up', async () => {
    const onSeeAll = vi.fn()
    const { onClose } = renderSpotlight({ docs: [page('Alpha.md', 'docker one')], onSeeAll })
    await type('docker')
    fireEvent.click(screen.getByRole('button', { name: 'See all 1 result' }))
    expect(onSeeAll).toHaveBeenCalledWith('docker')
    expect(onClose).toHaveBeenCalled()
    expect(screen.queryByRole('textbox', { name: 'Search notes' })).toBeNull()
  })

  it('reports the full uncapped match set on every run', async () => {
    const onQueryResult = vi.fn()
    const docs: SearchDoc[] = []
    for (let i = 0; i < 23; i++) docs.push(page(`p${i}.md`, 'docker body'))
    renderSpotlight({ docs, onQueryResult })
    await type('docker')
    // The dropdown still slices to PER_GROUP; the full list goes up.
    expect(options()).toHaveLength(20)
    expect(onQueryResult).toHaveBeenCalled()
    const last = onQueryResult.mock.calls[onQueryResult.mock.calls.length - 1]
    expect(last[1]).toHaveLength(23)
  })

  it('the clear x resets the query and refocuses the input', async () => {
    renderSpotlight({ docs: [page('Welcome.md', 'docker here')] })
    await type('docker')
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect((input() as HTMLInputElement).value).toBe('')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(document.activeElement).toBe(input())
  })

  it('Escape clears the query and closes', async () => {
    const { onClose } = renderSpotlight({ docs: [page('Welcome.md', 'docker here')] })
    await type('docker')
    fireEvent.keyDown(input(), { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
    expect(screen.queryByRole('textbox', { name: 'Search notes' })).toBeNull()

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    await waitFor(() => expect(input()).toBeTruthy())
    expect((input() as HTMLInputElement).value).toBe('')
  })

  it('a disabled input does not deploy a dropdown', async () => {
    renderSpotlight({ docs: [page('Welcome.md', 'docker')], disabled: true })
    expect((input() as HTMLInputElement).disabled).toBe(true)
    fireEvent.change(input(), { target: { value: 'docker' } })
    expect(screen.queryByRole('listbox')).toBeNull()
  })
})

describe('SearchSpotlight keyboard (search spec: Cmd/Ctrl+K/P, arrows, enter)', () => {
  it('Cmd/Ctrl+K opens the spotlight and focuses/selects the input', async () => {
    renderSpotlight({ docs: [page('Welcome.md', 'x')] }, false)
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    await waitFor(() => expect(input()).toBeTruthy())
    const el = input() as HTMLInputElement
    expect(document.activeElement).toBe(el)
    expect(el.selectionStart).toBe(0)
  })

  it('Cmd/Ctrl+P opens the spotlight too', async () => {
    renderSpotlight({ docs: [page('Welcome.md', 'x')] }, false)
    fireEvent.keyDown(document, { key: 'p', ctrlKey: true })
    await waitFor(() => expect(input()).toBeTruthy())
    expect(document.activeElement).toBe(input())
  })

  it('does not open on the chord without a usable vault', () => {
    renderSpotlight({ docs: [], disabled: true }, false)
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    expect(screen.queryByRole('textbox', { name: 'Search notes' })).toBeNull()
  })

  it('returns focus to the previously focused element on close', async () => {
    // A button standing in for the editor's caret surface.
    const trigger = document.createElement('button')
    document.body.appendChild(trigger)
    trigger.focus()
    try {
      renderSpotlight({ docs: [page('Welcome.md', 'x')] }, false)
      fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
      await waitFor(() => expect(document.activeElement).toBe(input()))
      fireEvent.keyDown(input(), { key: 'Escape' })
      await waitFor(() => expect(document.activeElement).toBe(trigger))
    } finally {
      trigger.remove()
    }
  })

  it('contains Tab within the overlap', async () => {
    renderSpotlight({ docs: [page('Alpha.md', 'docker one')] })
    await type('docker')
    const focusables = within(screen.getByRole('dialog')).getAllByRole('button')
    const last = focusables[focusables.length - 1]
    last.focus()
    fireEvent.keyDown(last, { key: 'Tab' })
    expect(document.activeElement).toBe(input())
  })

  it('arrows move the active row and hover syncs to it', async () => {
    renderSpotlight({
      docs: [
        page('Alpha.md', 'docker one'),
        page('Beta.md', 'docker two'),
        page('Gamma.md', 'docker three'),
      ],
    })
    await type('docker')
    fireEvent.keyDown(input(), { key: 'ArrowDown' })
    expect(options()[0].classList.contains(styles.active)).toBe(true)
    fireEvent.keyDown(input(), { key: 'ArrowDown' })
    expect(options()[1].classList.contains(styles.active)).toBe(true)
    fireEvent.keyDown(input(), { key: 'ArrowUp' })
    expect(options()[0].classList.contains(styles.active)).toBe(true)
    fireEvent.mouseEnter(options()[2])
    expect(options()[2].classList.contains(styles.active)).toBe(true)
  })

  it('Enter opens the active row, closes the spotlight, and keeps the query', async () => {
    const onSelect = vi.fn()
    const { onClose } = renderSpotlight({
      docs: [page('Alpha.md', 'docker one'), page('Beta.md', 'docker two')],
      onSelect,
    })
    await type('docker')
    fireEvent.keyDown(input(), { key: 'ArrowDown' })
    fireEvent.keyDown(input(), { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith('Alpha.md', expect.any(Number))
    expect(onClose).toHaveBeenCalled()
    expect(screen.queryByRole('textbox', { name: 'Search notes' })).toBeNull()
  })

  it('clicking a row opens its page', async () => {
    const onSelect = vi.fn()
    const { onClose } = renderSpotlight({ docs: [page('Alpha.md', 'docker one')], onSelect })
    await type('docker')
    fireEvent.click(options()[0])
    expect(onSelect).toHaveBeenCalledWith('Alpha.md', expect.any(Number))
    expect(onClose).toHaveBeenCalled()
  })

  it('a new query resets the active row', async () => {
    renderSpotlight({
      docs: [page('Alpha.md', 'docker one'), page('Beta.md', 'docker two')],
    })
    await type('docker')
    fireEvent.keyDown(input(), { key: 'ArrowDown' })
    expect(options()[0].classList.contains(styles.active)).toBe(true)
    fireEvent.change(input(), { target: { value: 'docker two' } })
    await waitFor(() => expect(options().length).toBe(1))
    expect(options()[0].classList.contains(styles.active)).toBe(false)
  })
})

// search-assets-by-name: a vault file appears under its own group, labelled as
// the sidebar labels it, and activating it opens the file instead of navigating.
describe('SearchSpotlight asset results (search-assets-by-name)', () => {
  it('renders an Assets group and labels the file by its path inside assets/', async () => {
    renderSpotlight({ docs: [asset('assets/2026/q3-report.pdf')] })
    await type('q3-report')
    expect(within(listbox()).getByText('Assets')).toBeTruthy()
    expect(screen.getByText('2026/q3-report.pdf')).toBeTruthy()
  })

  it('shows no snippet for a file row', async () => {
    renderSpotlight({ docs: [asset('assets/q3-report.pdf')] })
    await type('q3-report')
    expect(options()[0].querySelector(`.${matchStyles.snip}`)).toBeNull()
  })

  it('opens the file rather than selecting a page', async () => {
    const onSelect = vi.fn()
    const onOpenAsset = vi.fn()
    renderSpotlight({ docs: [asset('assets/q3-report.pdf')], onSelect, onOpenAsset })
    await type('q3-report')
    fireEvent.click(options()[0])
    expect(onOpenAsset).toHaveBeenCalledWith('assets/q3-report.pdf')
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('groups pages, journal days, and files in that order', async () => {
    renderSpotlight({
      docs: [
        page('Ops.md', 'docker in production'),
        journal('journals/2026-09-02.md', 'docker notes'),
        asset('assets/docker-notes.pdf'),
      ],
    })
    await type('docker')
    const heads = within(listbox())
      .getAllByText(/^(Pages|Journal|Assets)$/)
      .map((h) => h.textContent)
    expect(heads).toEqual(['Pages', 'Journal', 'Assets'])
  })
})
