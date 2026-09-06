import { useEffect, useMemo, useRef, useState } from 'react'
import Fuse from 'fuse.js'
import type { Page } from '../page'
import { journalDate } from '../vault/index'
import {
  FUSE_OPTIONS,
  PER_GROUP,
  searchDocs,
  snippetSegments,
  type SearchResult,
} from '../search/core'
import { MONTHS } from './months'
import styles from './SearchBox.module.css'

const DEBOUNCE_MS = 120

/** Pretty label for a journal-day path: "September 2, 2026" via the
 *  calendar's month names. Non-date journal files fall back to the stem. */
function journalLabel(path: string): string {
  const date = journalDate(path)
  if (!date) return path.slice(path.lastIndexOf('/') + 1).replace(/\.md$/, '')
  const [y, m, d] = date.split('-').map(Number)
  return `${MONTHS[m - 1]} ${d}, ${y}`
}

function rowLabel(r: SearchResult): string {
  return r.kind === 'journal' ? journalLabel(r.path) : r.title
}

/** Header content search (search-notes): owns the input, clear ✕, and the
 *  results dropdown below it. Dumb and prop-driven like every component —
 *  docs arrive via props; the Fuse rebuilds only when the docs identity
 *  changes (the graph is replaced on every save/refresh), never per keystroke. */
export function SearchBox({
  docs,
  onSelect,
  disabled,
}: {
  docs: Page[]
  onSelect: (path: string) => void
  /** No vault open: the input is disabled (no-inert-UI rule). */
  disabled: boolean
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const [query, setQuery] = useState('')
  // null while no results computed yet (empty query, typing before the
  // debounce fires, cleared): the dropdown stays hidden until a run lands,
  // so the empty state never flashes during typing (osv behaviour).
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  const fuse = useMemo(
    () =>
      new Fuse(
        docs.map((p) => ({ path: p.path, title: p.title, kind: p.kind, text: p.content })),
        FUSE_OPTIONS,
      ),
    [docs],
  )

  const run = (value: string) => setResults(searchDocs(fuse, value))

  const handleChange = (value: string) => {
    setQuery(value)
    setResults(null)
    setActive(-1)
    setOpen(true)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => run(value), DEBOUNCE_MS)
  }

  const clear = () => {
    setQuery('')
    setResults(null)
    setOpen(false)
    setActive(-1)
    window.clearTimeout(timer.current)
  }

  const openPath = (path: string) => {
    onSelect(path)
    setOpen(false) // keep the query; refocus or typing restores the dropdown
  }

  // Cmd/Ctrl+K focuses search from anywhere (command-palette convention).
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) return
      if (disabled) return
      e.preventDefault()
      inputRef.current?.focus()
      inputRef.current?.select()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [disabled])

  // Outside click closes the dropdown, keeping the query; refocus restores.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  const shown = open && results !== null
  const visible = results ?? []
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      clear()
      return
    }
    if (!shown || !results) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => (results.length ? (i + 1) % results.length : -1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : -1))
    } else if (e.key === 'Enter' && results.length) {
      const idx = active >= 0 ? active : 0
      openPath(results[idx].path)
    }
  }

  const sections = ([
    ['Pages', 'page'],
    ['Journal', 'journal'],
  ] as const)
    .map(([label, kind]) => ({
      label,
      items: visible.filter((r) => r.kind === kind),
    }))
    .filter((s) => s.items.length > 0)
  const capped = sections.some((s) => s.items.length >= PER_GROUP)

  return (
    <div ref={rootRef} className={styles.root}>
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
          onFocus={() => setOpen(true)}
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
        <div id="search-results" className={styles.drop} role="listbox" aria-label="Search results">
          {sections.length === 0 && (
            <div className={styles.empty}>{`No matches for \u201C${query.trim()}\u201D.`}</div>
          )}
          {sections.map((sec) => (
            <section key={sec.label}>
              <div className={styles.head}>{sec.label}</div>
              {sec.items.map((r) => {
                const index = visible.indexOf(r)
                const segments = snippetSegments(r.text, r.ranges)
                return (
                  <button
                    key={r.path}
                    type="button"
                    role="option"
                    aria-selected={index === active}
                    className={`${styles.item}${index === active ? ` ${styles.active}` : ''}`}
                    onClick={() => openPath(r.path)}
                    onMouseEnter={() => setActive(index)}
                  >
                    <span className={styles.label}>{rowLabel(r)}</span>
                    {segments.length > 0 && (
                      <span className={styles.snip}>
                        {segments.map((s, j) =>
                          s.hit ? (
                            <mark key={j} className={styles.hit}>
                              {s.text}
                            </mark>
                          ) : (
                            <span key={j}>{s.text}</span>
                          ),
                        )}
                      </span>
                    )}
                  </button>
                )
              })}
            </section>
          ))}
          {capped && <div className={styles.more}>{`Showing up to ${PER_GROUP} matches per section.`}</div>}
        </div>
      )}
    </div>
  )
}