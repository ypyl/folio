import { useEffect, useMemo, useRef, useState } from 'react'
import Fuse from 'fuse.js'
import {
  FUSE_OPTIONS,
  searchDocs,
  topPerGroup,
  type SearchDoc,
  type SearchResult,
} from '../search/core'
import { MatchBody } from './MatchBody'
import { listKeyDown } from './listNav'
import styles from './SearchSpotlight.module.css'

const DEBOUNCE_MS = 120

/** The search spotlight (replace-header-with-spotlight): a modal overlay
 *  holding the input and the grouped results dropdown. Owned by App, opened by
 *  `Ctrl/Cmd+P`, `Ctrl/Cmd+K`, or the folder rail's search trigger. It stays
 *  mounted and returns null while closed, so the query survives a close and
 *  reopening restores the matches (search spec). The Fuse rebuilds only when
 *  the corpus identity changes, never per keystroke. */
export function SearchSpotlight({
  open,
  docs,
  onOpen,
  onClose,
  onSelect,
  onOpenAsset,
  onOpenBoard,
  disabled,
  onQueryResult,
  onSeeAll,
}: {
  /** Whether the overlay is showing. App owns it; the chord listener and the
   *  rail trigger both set it. */
  open: boolean
  /** The whole corpus, built once per graph by App. */
  docs: SearchDoc[]
  /** Open the spotlight from the global chord listener. */
  onOpen: () => void
  /** Close the spotlight (scrim click, Escape, or a selection). */
  onClose: () => void
  onSelect: (path: string, block: number | null) => void
  /** Activating an asset result: open the file, do not navigate (ADR-0021). */
  onOpenAsset: (path: string) => void
  /** Activating a board result: open the board in the main pane. */
  onOpenBoard?: (path: string) => void
  /** No usable vault: the chord and the input are inert. */
  disabled: boolean
  /** Every landed search run, uncapped (search-results-view). */
  onQueryResult?: (query: string, results: SearchResult[]) => void
  /** Activation of the pinned see-all row (search-results-view). */
  onSeeAll?: (query: string) => void
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const [query, setQuery] = useState('')
  // null while no results computed yet (empty query, typing before the debounce
  // fires): the dropdown stays hidden until a run lands, so the empty state
  // never flashes during typing.
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [active, setActive] = useState(-1)

  const fuse = useMemo(() => new Fuse(docs, FUSE_OPTIONS), [docs])

  const run = (value: string) => {
    const found = searchDocs(fuse, value)
    setResults(found)
    onQueryResult?.(value, found)
  }

  const handleChange = (value: string) => {
    setQuery(value)
    setResults(null)
    setActive(-1)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => run(value), DEBOUNCE_MS)
  }

  const clear = () => {
    setQuery('')
    setResults(null)
    setActive(-1)
    window.clearTimeout(timer.current)
  }

  // A result opens what it names (search-assets-by-name): a page or journal day
  // navigates, a file is opened in place and nothing navigates. The spotlight
  // closes either way, keeping the query so reopening restores the matches.
  const activate = (result: SearchResult) => {
    if (result.kind === 'asset') onOpenAsset(result.path)
    else if (result.kind === 'board') onOpenBoard?.(result.path)
    else onSelect(result.path, result.block)
    onClose()
  }

  // Focus the input on open; restore the previously focused element on close,
  // so a chord from the editor returns the caret there.
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    inputRef.current?.focus()
    inputRef.current?.select()
    return () => previous?.focus?.()
  }, [open])

  // Ctrl/Cmd+P and Ctrl/Cmd+K open the spotlight from anywhere; preventDefault
  // stops the browser's Print dialog for Ctrl+P. Inert without a usable vault.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      const key = e.key.toLowerCase()
      if (key !== 'k' && key !== 'p') return
      if (disabled) return
      e.preventDefault()
      onOpen()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [disabled, onOpen])

  // Tab is contained within the overlay so focus cannot reach the shell behind
  // the scrim (design: the modal keeps its own focus).
  const onDialogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return
    const dialog = dialogRef.current
    if (!dialog) return
    const focusables = dialog.querySelectorAll<HTMLElement>('input, button:not([disabled])')
    if (focusables.length === 0) return
    const first = focusables[0]
    const last = focusables[focusables.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }

  const openResults = () => {
    onSeeAll?.(query)
    onClose()
  }

  // Escape clears the query and closes; the shared list handler owns the rest.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      clear()
      onClose()
      return
    }
    navKeyDown(e)
  }

  const shown = open && results !== null
  // The dropdown stays a bounded launcher: the per-group slice of the full
  // list; the see-all row hands the rest to the results view.
  const visible = results === null ? [] : topPerGroup(results)
  const navKeyDown = listKeyDown({
    // 0 while the dropdown is hidden, so a hidden list claims no key.
    length: shown && results ? visible.length : 0,
    active,
    setActive,
    onEnter: (index) => activate(visible[index]),
  })

  const sections = (
    [
      ['Pages', 'page'],
      ['Journal', 'journal'],
      ['Boards', 'board'],
      ['Assets', 'asset'],
    ] as const
  )
    .map(([label, kind]) => ({
      label,
      items: visible.filter((r) => r.kind === kind),
    }))
    .filter((s) => s.items.length > 0)

  if (!open) return null

  return (
    <div className={styles.scrim} onClick={onClose}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onDialogKeyDown}
      >
        <div className={styles.box}>
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            placeholder="Search notes"
            aria-label="Search notes"
            autoComplete="off"
            spellCheck={false}
            disabled={disabled}
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={onKeyDown}
            aria-expanded={shown}
            aria-controls="search-results"
          />
          <button
            type="button"
            className={styles.clear}
            aria-label="Clear search"
            title="Clear search"
            hidden={disabled || query === ''}
            onClick={() => {
              clear()
              inputRef.current?.focus()
            }}
          >
            {'\u2715'}
          </button>
        </div>
        {shown && (
          <div className={styles.drop}>
            <div id="search-results" role="listbox" aria-label="Search results">
              {sections.length === 0 && (
                <div className={styles.empty}>{`No matches for \u201C${query.trim()}\u201D.`}</div>
              )}
              {sections.map((sec) => (
                <section key={sec.label}>
                  <div className={styles.head}>{sec.label}</div>
                  {sec.items.map((r) => {
                    const index = visible.indexOf(r)
                    return (
                      <button
                        key={r.path}
                        type="button"
                        role="option"
                        aria-selected={index === active}
                        className={`${styles.item}${index === active ? ` ${styles.active}` : ''}`}
                        onClick={() => activate(r)}
                        onMouseEnter={() => setActive(index)}
                      >
                        <MatchBody result={r} compact />
                      </button>
                    )
                  })}
                </section>
              ))}
            </div>
            {results !== null && results.length > 0 && (
              <button type="button" className={styles.more} onClick={openResults}>
                {`See all ${results.length} ${results.length === 1 ? 'result' : 'results'}`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
