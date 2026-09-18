import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { SearchBox } from './SearchBox'
import styles from './SearchBox.module.css'
import matchStyles from './MatchBody.module.css'
import type { SearchDoc } from '../search/core'

// The search box is prop-driven (components never import the vault): docs
// arrive via props, selection reports through onSelect. All behavior is
// exercised without the editor or the index.

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

async function type(value: string) {
  fireEvent.change(input(), { target: { value } })
  await waitFor(() => expect(options().length).toBeGreaterThan(0))
}

describe('SearchBox rendering (search spec: groups, labels, snippets)', () => {
  it('renders Pages and Journal groups with their rows', async () => {
    render(
      <SearchBox
        docs={[
          page('Welcome.md', 'docker is used in ops'),
          journal('journals/2026-09-02.md', 'docker setup notes'),
        ]}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        disabled={false}
      />,
    )
    await type('docker')
    expect(within(listbox()).getByText('Pages')).toBeTruthy()
    expect(within(listbox()).getByText('Journal')).toBeTruthy()
    expect(options()).toHaveLength(2)
    expect(screen.getByText('Welcome')).toBeTruthy()
  })

  it('labels journal days with their pretty date, not the raw stem', async () => {
    render(
      <SearchBox
        docs={[journal('journals/2026-09-02.md', 'docker body')]}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        disabled={false}
      />,
    )
    await type('docker')
    expect(screen.getByText('September 2, 2026')).toBeTruthy()
    expect(screen.queryByText('2026-09-02')).toBeNull()
  })

  it('highlights the matched span in the snippet', async () => {
    render(
      <SearchBox
        docs={[page('Ops.md', 'We run docker in production daily')]}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        disabled={false}
      />,
    )
    await type('docker')
    const marks = listbox().querySelectorAll(`mark.${matchStyles.hit}`)
    expect(marks.length).toBeGreaterThan(0)
    expect(marks[0].textContent).toBe('docker')
  })

  it('shows an empty state when nothing matches', async () => {
    render(
      <SearchBox
        docs={[page('Welcome.md', 'hello')]}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        disabled={false}
      />,
    )
    fireEvent.change(input(), { target: { value: 'xyzzy' } })
    await waitFor(() => expect(screen.getByText('No matches for \u201Cxyzzy\u201D.')).toBeTruthy())
  })

  it('caps a group in the dropdown and offers the see-all row', async () => {
    const docs: SearchDoc[] = []
    for (let i = 0; i < 23; i++) docs.push(page(`p${i}.md`, 'docker body'))
    render(<SearchBox docs={docs} onSelect={() => {}} onOpenAsset={() => {}} disabled={false} />)
    await type('docker')
    expect(options()).toHaveLength(20)
    expect(screen.getByRole('button', { name: 'See all 23 results' })).toBeTruthy()
  })

  it('shows the see-all row whenever a query matches', async () => {
    render(
      <SearchBox
        docs={[page('Alpha.md', 'docker one'), page('Beta.md', 'docker two')]}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        disabled={false}
      />,
    )
    await type('docker')
    expect(screen.getByRole('button', { name: 'See all 2 results' })).toBeTruthy()
  })

  it('hides the see-all row when nothing matches', async () => {
    render(
      <SearchBox
        docs={[page('Welcome.md', 'hello')]}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        disabled={false}
      />,
    )
    fireEvent.change(input(), { target: { value: 'xyzzy' } })
    await waitFor(() => expect(screen.getByText('No matches for \u201Cxyzzy\u201D.')).toBeTruthy())
    expect(screen.queryByRole('button', { name: /See all/ })).toBeNull()
  })

  it('shows the snippet for a title-only match (opening lines)', async () => {
    render(
      <SearchBox
        docs={[page('Docker.md', 'First line\nSecond line')]}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        disabled={false}
      />,
    )
    await type('docker')
    expect(within(listbox()).getByText(/First line/)).toBeTruthy()
  })
})

describe('SearchBox action flow (search spec: debounce, outside click, clear, escape)', () => {
  it('stays hidden until results are computed (no empty-state flash while typing)', async () => {
    render(
      <SearchBox
        docs={[page('Welcome.md', 'docker here')]}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        disabled={false}
      />,
    )
    fireEvent.change(input(), { target: { value: 'doc' } })
    expect(screen.queryByRole('listbox')).toBeNull()
    await waitFor(() => expect(screen.getByRole('listbox')).toBeTruthy())
    expect(screen.getByText('Welcome')).toBeTruthy()
  })

  it('closes on outside click keeping the query; refocus restores results', async () => {
    render(
      <SearchBox
        docs={[page('Welcome.md', 'docker here')]}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        disabled={false}
      />,
    )
    await type('docker')
    fireEvent.click(document.body)
    expect(screen.queryByRole('listbox')).toBeNull()
    expect((input() as HTMLInputElement).value).toBe('docker')
    fireEvent.focus(input())
    await waitFor(() => expect(screen.getByRole('listbox')).toBeTruthy())
  })

  it('see-all keeps the query, closes the dropdown, and reports the query up', async () => {
    const onSeeAll = vi.fn()
    render(
      <SearchBox
        docs={[page('Alpha.md', 'docker one')]}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        disabled={false}
        onSeeAll={onSeeAll}
      />,
    )
    await type('docker')
    fireEvent.click(screen.getByRole('button', { name: 'See all 1 result' }))
    expect(onSeeAll).toHaveBeenCalledWith('docker')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect((input() as HTMLInputElement).value).toBe('docker')
  })

  it('reports the full uncapped match set on every run', async () => {
    const onQueryResult = vi.fn()
    const docs: SearchDoc[] = []
    for (let i = 0; i < 23; i++) docs.push(page(`p${i}.md`, 'docker body'))
    render(
      <SearchBox
        docs={docs}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        disabled={false}
        onQueryResult={onQueryResult}
      />,
    )
    await type('docker')
    // The dropdown still slices to PER_GROUP; the full list goes up.
    expect(options()).toHaveLength(20)
    expect(onQueryResult).toHaveBeenCalled()
    const last = onQueryResult.mock.calls[onQueryResult.mock.calls.length - 1]
    expect(last[1]).toHaveLength(23)
  })

  it('the clear x resets the query and refocuses the input', async () => {
    render(
      <SearchBox
        docs={[page('Welcome.md', 'docker here')]}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        disabled={false}
      />,
    )
    await type('docker')
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect((input() as HTMLInputElement).value).toBe('')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(document.activeElement).toBe(input())
  })

  it('Escape clears the query and closes', async () => {
    render(
      <SearchBox
        docs={[page('Welcome.md', 'docker here')]}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        disabled={false}
      />,
    )
    await type('docker')
    fireEvent.keyDown(input(), { key: 'Escape' })
    expect((input() as HTMLInputElement).value).toBe('')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('a disabled input does not deploy a dropdown', async () => {
    render(
      <SearchBox
        docs={[page('Welcome.md', 'docker')]}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        disabled
      />,
    )
    expect((input() as HTMLInputElement).disabled).toBe(true)
    fireEvent.change(input(), { target: { value: 'docker' } })
    expect(screen.queryByRole('listbox')).toBeNull()
  })
})

describe('SearchBox keyboard (search spec: Cmd/Ctrl+K, arrows, enter)', () => {
  it('Cmd/Ctrl+K focuses and selects the input', () => {
    render(
      <SearchBox
        docs={[page('Welcome.md', 'x')]}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        disabled={false}
      />,
    )
    fireEvent.keyDown(document, { key: 'k', ctrlKey: true })
    const el = input() as HTMLInputElement
    expect(document.activeElement).toBe(el)
    expect(el.selectionStart).toBe(0)
  })

  it('arrows move the active row and hover syncs to it', async () => {
    render(
      <SearchBox
        docs={[
          page('Alpha.md', 'docker one'),
          page('Beta.md', 'docker two'),
          page('Gamma.md', 'docker three'),
        ]}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        disabled={false}
      />,
    )
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

  it('Enter opens the active row, closes the dropdown, and keeps the query', async () => {
    const onSelect = vi.fn()
    render(
      <SearchBox
        docs={[page('Alpha.md', 'docker one'), page('Beta.md', 'docker two')]}
        onSelect={onSelect}
        onOpenAsset={() => {}}
        disabled={false}
      />,
    )
    await type('docker')
    fireEvent.keyDown(input(), { key: 'ArrowDown' })
    fireEvent.keyDown(input(), { key: 'Enter' })
    expect(onSelect).toHaveBeenCalledWith('Alpha.md')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect((input() as HTMLInputElement).value).toBe('docker')
  })

  it('clicking a row opens its page', async () => {
    const onSelect = vi.fn()
    render(
      <SearchBox
        docs={[page('Alpha.md', 'docker one')]}
        onSelect={onSelect}
        onOpenAsset={() => {}}
        disabled={false}
      />,
    )
    await type('docker')
    fireEvent.click(options()[0])
    expect(onSelect).toHaveBeenCalledWith('Alpha.md')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('a new query resets the active row', async () => {
    render(
      <SearchBox
        docs={[page('Alpha.md', 'docker one'), page('Beta.md', 'docker two')]}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        disabled={false}
      />,
    )
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
describe('SearchBox asset results (search-assets-by-name)', () => {
  it('renders an Assets group and labels the file by its path inside assets/', async () => {
    render(
      <SearchBox
        docs={[asset('assets/2026/q3-report.pdf')]}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        disabled={false}
      />,
    )
    await type('q3-report')
    expect(within(listbox()).getByText('Assets')).toBeTruthy()
    expect(screen.getByText('2026/q3-report.pdf')).toBeTruthy()
  })

  it('shows no snippet for a file row', async () => {
    render(
      <SearchBox
        docs={[asset('assets/q3-report.pdf')]}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        disabled={false}
      />,
    )
    await type('q3-report')
    expect(options()[0].querySelector(`.${matchStyles.snip}`)).toBeNull()
  })

  it('opens the file rather than selecting a page', async () => {
    const onSelect = vi.fn()
    const onOpenAsset = vi.fn()
    render(
      <SearchBox
        docs={[asset('assets/q3-report.pdf')]}
        onSelect={onSelect}
        onOpenAsset={onOpenAsset}
        disabled={false}
      />,
    )
    await type('q3-report')
    fireEvent.click(options()[0])
    expect(onOpenAsset).toHaveBeenCalledWith('assets/q3-report.pdf')
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('groups pages, journal days, and files in that order', async () => {
    render(
      <SearchBox
        docs={[
          page('Ops.md', 'docker in production'),
          journal('journals/2026-09-02.md', 'docker notes'),
          asset('assets/docker-notes.pdf'),
        ]}
        onSelect={() => {}}
        onOpenAsset={() => {}}
        disabled={false}
      />,
    )
    await type('docker')
    const heads = within(listbox())
      .getAllByText(/^(Pages|Journal|Assets)$/)
      .map((h) => h.textContent)
    expect(heads).toEqual(['Pages', 'Journal', 'Assets'])
  })
})
