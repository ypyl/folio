import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { SearchSpotlight } from './SearchSpotlight'
import styles from './SearchSpotlight.module.css'
import matchStyles from './MatchBody.module.css'
import type { SearchDoc } from '../search/core'

// jsdom 30 has no <dialog> modal API, so showModal()/close() are stubbed to
// toggle the `open` attribute, the way PresentationView.test.tsx does. The
// focus trap and Escape-to-cancel the element provides are the platform's, and
// are not asserted here.
Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
  configurable: true,
  writable: true,
  value(this: HTMLDialogElement) {
    this.setAttribute('open', '')
  },
})
Object.defineProperty(HTMLDialogElement.prototype, 'close', {
  configurable: true,
  writable: true,
  value(this: HTMLDialogElement) {
    this.removeAttribute('open')
  },
})

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

/** A board search document (add-whiteboards): labelled by its path inside
 *  `boards/`, carrying no text. */
const board = (path: string): SearchDoc => ({
  path,
  title: path.replace(/^boards\//, ''),
  kind: 'board',
  text: '',
})

const input = () => screen.getByRole('textbox', { name: 'Search notes' })
const listbox = () => screen.getByRole('listbox', { name: 'Search results' })
const operatorList = () => screen.getByRole('listbox', { name: 'Search operators' })
const options = () => within(listbox()).getAllByRole('option')

async function type(value: string) {
  fireEvent.change(input(), { target: { value } })
  await waitFor(() => expect(options().length).toBeGreaterThan(0))
}

interface SpotlightProps {
  docs: SearchDoc[]
  disabled?: boolean
  onSelect?: (path: string, blocks: number[]) => void
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
    screen.getByText('Welcome')
  })

  it('labels journal days with their pretty date, not the raw stem', async () => {
    renderSpotlight({ docs: [journal('journals/2026-09-02.md', 'docker body')] })
    await type('docker')
    screen.getByText('September 2, 2026')
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
    await waitFor(() => screen.getByText('No matches for \u201Cxyzzy\u201D.'))
  })

  it('deploys a short query that matches a whole word', async () => {
    renderSpotlight({ docs: [page('UX.md', 'notes'), page('Linux.md', 'kernel')] })
    await type('ux')
    expect(options()).toHaveLength(1)
    expect(within(listbox()).getByText('UX')).toBeTruthy()
  })

  it('deploys nothing for a short query that matches nothing', async () => {
    renderSpotlight({ docs: [page('Welcome.md', 'hello')] })
    fireEvent.change(input(), { target: { value: 'zz' } })
    // Past the debounce: the run has landed, and a short miss stays hidden.
    await new Promise((resolve) => setTimeout(resolve, 200))
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('caps a group in the dropdown and offers the see-all row', async () => {
    const docs: SearchDoc[] = []
    for (let i = 0; i < 23; i++) docs.push(page(`p${i}.md`, 'docker body'))
    renderSpotlight({ docs })
    await type('docker')
    expect(options()).toHaveLength(20)
    screen.getByRole('button', { name: 'See all 23 results' })
  })

  it('shows the see-all row whenever a query matches', async () => {
    renderSpotlight({ docs: [page('Alpha.md', 'docker one'), page('Beta.md', 'docker two')] })
    await type('docker')
    screen.getByRole('button', { name: 'See all 2 results' })
  })

  it('hides the see-all row when nothing matches', async () => {
    renderSpotlight({ docs: [page('Welcome.md', 'hello')] })
    fireEvent.change(input(), { target: { value: 'xyzzy' } })
    await waitFor(() => screen.getByText('No matches for \u201Cxyzzy\u201D.'))
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
    await waitFor(() => screen.getByRole('listbox'))
    screen.getByText('Welcome')
  })

  it('closes on a backdrop click keeping the query; reopening restores results', async () => {
    const { onClose } = renderSpotlight({ docs: [page('Welcome.md', 'docker here')] })
    await type('docker')
    // A backdrop click targets the dialog element itself.
    fireEvent.click(screen.getByRole('dialog', { name: 'Search' }))
    expect(onClose).toHaveBeenCalled()
    expect(screen.queryByRole('textbox', { name: 'Search notes' })).toBeNull()

    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    await waitFor(() => screen.getByRole('listbox'))
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

  it('the clear x resets the query, refocuses the input, and lists the operators', async () => {
    renderSpotlight({ docs: [page('Welcome.md', 'docker here')] })
    await type('docker')
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect((input() as HTMLInputElement).value).toBe('')
    screen.getByRole('listbox', { name: 'Search operators' })
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

  it('claims the chord without a usable vault, so the browser never prints', () => {
    // The indexing window has a folder open but no graph yet. Ctrl/Cmd+P must
    // not reach the browser's Print dialog even though the spotlight stays shut.
    renderSpotlight({ docs: [], disabled: true }, false)
    const event = new KeyboardEvent('keydown', {
      key: 'p',
      ctrlKey: true,
      cancelable: true,
      bubbles: true,
    })
    document.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
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
    expect(onSelect).toHaveBeenCalledWith('Alpha.md', expect.any(Array))
    expect(onClose).toHaveBeenCalled()
    expect(screen.queryByRole('textbox', { name: 'Search notes' })).toBeNull()
  })

  it('clicking a row opens its page', async () => {
    const onSelect = vi.fn()
    const { onClose } = renderSpotlight({ docs: [page('Alpha.md', 'docker one')], onSelect })
    await type('docker')
    fireEvent.click(options()[0])
    expect(onSelect).toHaveBeenCalledWith('Alpha.md', expect.any(Array))
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
    screen.getByText('2026/q3-report.pdf')
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

describe('dropdown snippet budget (show-every-match-per-result)', () => {
  const spread = (n: number) =>
    Array.from({ length: n * 8 }, (_, i) => (i % 8 === 0 ? `docker ${i}` : `line ${i}`)).join('\n')

  it('shows two snippets and notes the rest, counting occurrences', async () => {
    renderSpotlight({ docs: [page('notes.md', spread(4))] })
    await type('docker')
    const row = options()[0]
    expect(within(row).getAllByText('docker')).toHaveLength(2)
    expect(within(row).getByText('+2 more on this page')).toBeTruthy()
  })
})

// search operators: an empty query offers the operators; an operator reorders
// the results without hiding any, and `title:` promotes name matches.
describe('SearchSpotlight operators (search operators)', () => {
  it('lists the five operators for an empty query', () => {
    renderSpotlight({ docs: [page('Welcome.md', 'docker here')] })
    expect(within(operatorList()).getAllByRole('option')).toHaveLength(5)
  })

  it('lists no operators while the vault is unusable', () => {
    renderSpotlight({ docs: [], disabled: true })
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('choosing an operator inserts its token and leaves the caret after it', () => {
    renderSpotlight({ docs: [page('Welcome.md', 'docker here')] })
    fireEvent.click(within(operatorList()).getByRole('option', { name: /Boards first/ }))
    const el = input() as HTMLInputElement
    expect(el.value).toBe('board: ')
    expect(document.activeElement).toBe(el)
    expect(el.selectionStart).toBe(7)
  })

  it('promotes the operator kind above the other groups', async () => {
    renderSpotlight({
      docs: [page('Ops.md', 'docker in production'), board('boards/docker-map.excalidraw')],
    })
    await type('board: docker')
    const heads = within(listbox())
      .getAllByText(/^(Pages|Boards)$/)
      .map((h) => h.textContent)
    expect(heads).toEqual(['Boards', 'Pages'])
    // Promotion reorders, it does not filter: the page is still listed.
    expect(within(listbox()).getByText('Ops')).toBeTruthy()
  })

  it('leads with a Names section for a title query', async () => {
    renderSpotlight({
      docs: [page('Docker.md', 'plain body'), page('Notes.md', 'docker in the body')],
    })
    await type('title: docker')
    const heads = within(listbox())
      .getAllByText(/^(Names|Pages)$/)
      .map((h) => h.textContent)
    expect(heads).toEqual(['Names', 'Pages'])
    expect(within(listbox()).getByText('Docker')).toBeTruthy()
  })
})
