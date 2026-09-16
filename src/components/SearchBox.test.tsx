import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { SearchBox } from './SearchBox'
import styles from './SearchBox.module.css'
import matchStyles from './MatchBody.module.css'
import type { Page } from '../page'

// The search box is prop-driven (components never import the vault): docs
// arrive via props, selection reports through onSelect. All behavior is
// exercised without the editor or the index.

const page = (path: string, content = ''): Page => ({
  path,
  title: path.replace(/\.md$/, '').split('/').pop()!,
  kind: 'page',
  content,
})

const journal = (path: string, content = ''): Page => ({
  path,
  title: path.split('/').pop()!.replace('.md', ''),
  kind: 'journal',
  content,
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
        disabled={false}
      />,
    )
    await type('docker')
    const marks = listbox().querySelectorAll(`mark.${matchStyles.hit}`)
    expect(marks.length).toBeGreaterThan(0)
    expect(marks[0].textContent).toBe('docker')
  })

  it('shows an empty state when nothing matches', async () => {
    render(<SearchBox docs={[page('Welcome.md', 'hello')]} onSelect={() => {}} disabled={false} />)
    fireEvent.change(input(), { target: { value: 'xyzzy' } })
    await waitFor(() => expect(screen.getByText('No matches for \u201Cxyzzy\u201D.')).toBeTruthy())
  })

  it('caps a group in the dropdown and offers the see-all row', async () => {
    const docs: Page[] = []
    for (let i = 0; i < 23; i++) docs.push(page(`p${i}.md`, 'docker body'))
    render(<SearchBox docs={docs} onSelect={() => {}} disabled={false} />)
    await type('docker')
    expect(options()).toHaveLength(20)
    expect(screen.getByRole('button', { name: 'See all 23 results' })).toBeTruthy()
  })

  it('shows the see-all row whenever a query matches', async () => {
    render(
      <SearchBox
        docs={[page('Alpha.md', 'docker one'), page('Beta.md', 'docker two')]}
        onSelect={() => {}}
        disabled={false}
      />,
    )
    await type('docker')
    expect(screen.getByRole('button', { name: 'See all 2 results' })).toBeTruthy()
  })

  it('hides the see-all row when nothing matches', async () => {
    render(<SearchBox docs={[page('Welcome.md', 'hello')]} onSelect={() => {}} disabled={false} />)
    fireEvent.change(input(), { target: { value: 'xyzzy' } })
    await waitFor(() => expect(screen.getByText('No matches for \u201Cxyzzy\u201D.')).toBeTruthy())
    expect(screen.queryByRole('button', { name: /See all/ })).toBeNull()
  })

  it('shows the snippet for a title-only match (opening lines)', async () => {
    render(
      <SearchBox
        docs={[page('Docker.md', 'First line\nSecond line')]}
        onSelect={() => {}}
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
      <SearchBox docs={[page('Welcome.md', 'docker here')]} onSelect={() => {}} disabled={false} />,
    )
    fireEvent.change(input(), { target: { value: 'doc' } })
    expect(screen.queryByRole('listbox')).toBeNull()
    await waitFor(() => expect(screen.getByRole('listbox')).toBeTruthy())
    expect(screen.getByText('Welcome')).toBeTruthy()
  })

  it('closes on outside click keeping the query; refocus restores results', async () => {
    render(
      <SearchBox docs={[page('Welcome.md', 'docker here')]} onSelect={() => {}} disabled={false} />,
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
    const docs: Page[] = []
    for (let i = 0; i < 23; i++) docs.push(page(`p${i}.md`, 'docker body'))
    render(
      <SearchBox docs={docs} onSelect={() => {}} disabled={false} onQueryResult={onQueryResult} />,
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
      <SearchBox docs={[page('Welcome.md', 'docker here')]} onSelect={() => {}} disabled={false} />,
    )
    await type('docker')
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect((input() as HTMLInputElement).value).toBe('')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(document.activeElement).toBe(input())
  })

  it('Escape clears the query and closes', async () => {
    render(
      <SearchBox docs={[page('Welcome.md', 'docker here')]} onSelect={() => {}} disabled={false} />,
    )
    await type('docker')
    fireEvent.keyDown(input(), { key: 'Escape' })
    expect((input() as HTMLInputElement).value).toBe('')
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('a disabled input does not deploy a dropdown', async () => {
    render(<SearchBox docs={[page('Welcome.md', 'docker')]} onSelect={() => {}} disabled />)
    expect((input() as HTMLInputElement).disabled).toBe(true)
    fireEvent.change(input(), { target: { value: 'docker' } })
    expect(screen.queryByRole('listbox')).toBeNull()
  })
})

describe('SearchBox keyboard (search spec: Cmd/Ctrl+K, arrows, enter)', () => {
  it('Cmd/Ctrl+K focuses and selects the input', () => {
    render(<SearchBox docs={[page('Welcome.md', 'x')]} onSelect={() => {}} disabled={false} />)
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
      <SearchBox docs={[page('Alpha.md', 'docker one')]} onSelect={onSelect} disabled={false} />,
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
