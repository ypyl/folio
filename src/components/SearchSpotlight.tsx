import { useEffect, useRef, useState, type ReactNode } from 'react'
import Fuse from 'fuse.js'
import {
  SEARCH_OPERATORS,
  fuseOptions,
  parseQuery,
  searchDocs,
  sectionsOf,
  topPerGroup,
  type OperatorDef,
  type SearchDoc,
  type SearchOperator,
  type SearchResult,
} from '../search/core'
import { MatchBody } from './MatchBody'
import { listKeyDown } from './listNav'
import styles from './SearchSpotlight.module.css'

/** The operator row glyphs, keyed by operator: the catalogue carries the tokens
 *  and the copy, the icon is a view concern. The same hairline stroke style as
 *  the rest of the app's icons. */
const ICON_PROPS = {
  viewBox: '0 0 24 24',
  width: 18,
  height: 18,
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const

const OPERATOR_ICONS: Record<SearchOperator, ReactNode> = {
  page: (
    <svg {...ICON_PROPS}>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4" />
    </svg>
  ),
  journal: (
    <svg {...ICON_PROPS}>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M4 10h16" />
    </svg>
  ),
  board: (
    <svg {...ICON_PROPS}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M9 4v16M15 4v16" />
    </svg>
  ),
  asset: (
    <svg {...ICON_PROPS}>
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4M9 13h6M9 17h6" />
    </svg>
  ),
  title: (
    <svg {...ICON_PROPS}>
      <path d="M4 7V5h16v2M12 5v14M9 19h6" />
    </svg>
  ),
}

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
  /** Close the spotlight (backdrop click, Escape, or a selection). */
  onClose: () => void
  onSelect: (path: string, blocks: number[]) => void
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
  const dialogRef = useRef<HTMLDialogElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const timer = useRef<number | undefined>(undefined)
  const [query, setQuery] = useState('')
  // null while no results computed yet (empty query, typing before the debounce
  // fires): the dropdown stays hidden until a run lands, so the empty state
  // never flashes during typing.
  const [results, setResults] = useState<SearchResult[] | null>(null)
  const [active, setActive] = useState(-1)
  // Bumped when a chosen operator row inserts its token; the effect below then
  // moves the caret to the end once the controlled value has painted. Kept in
  // state, not a ref, so the row handler stays a pure state update.
  const [caretTick, setCaretTick] = useState(0)
  // The match-case toggle (match-case-search): off by default, kept with the
  // query across a close, reset when the query is cleared.
  const [caseSensitive, setCaseSensitive] = useState(false)

  // One Fuse per case mode, built lazily and kept until the corpus identity
  // changes: Fuse folds case when it builds its index, so the mode is part of
  // the index's identity. A press therefore pays a build at most once per mode
  // per corpus, and typing never pays one, because the current mode's index is
  // already there.
  const indexes = useRef<{ docs: SearchDoc[]; byMode: Map<boolean, Fuse<SearchDoc>> } | null>(null)
  const fuseFor = (cased: boolean): Fuse<SearchDoc> => {
    if (indexes.current?.docs !== docs) indexes.current = { docs, byMode: new Map() }
    const byMode = indexes.current.byMode
    let index = byMode.get(cased)
    if (!index) {
      index = new Fuse(docs, fuseOptions(cased))
      byMode.set(cased, index)
    }
    return index
  }
  // The query's operator, if any: it decides the group order both surfaces use.
  const { operator } = parseQuery(query)

  const run = (value: string, cased = caseSensitive) => {
    const found = searchDocs(fuseFor(cased), value, cased)
    // A short query that matches nothing deploys nothing: the empty state is
    // for real queries, and one or two characters are usually a word still
    // being typed (search-short-terms).
    setResults(found.length === 0 && value.trim().length < 3 ? null : found)
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
    // Clearing means starting over, so the case rule starts over with it.
    setCaseSensitive(false)
    window.clearTimeout(timer.current)
  }

  // Flip the case rule and re-run the query on the press, with the index for the
  // new mode: a press is a complete instruction about a query that is already
  // typed, so it does not go through the debounce. The list stays on screen
  // until the new run lands, so a press never blanks the dropdown.
  const toggleCase = () => {
    const next = !caseSensitive
    setCaseSensitive(next)
    setActive(-1)
    window.clearTimeout(timer.current)
    // A press is not a keystroke: the caret goes back to the input so the next
    // character continues the query instead of landing on the control.
    inputRef.current?.focus()
    // An empty query has nothing to re-run; the operator list stays as it is.
    if (query.trim() !== '') run(query, next)
  }

  // Choosing an operator row inserts its token and leaves the caret after it, so
  // the user finishes the query without reaching back for the field. No run is
  // scheduled: an operator alone has no term and should not show an empty state.
  const chooseOperator = (op: OperatorDef) => {
    setQuery(`${op.token} `)
    setResults(null)
    setActive(-1)
    setCaretTick((n) => n + 1)
  }

  // Move the caret to the end of a just-inserted operator token, once React has
  // painted the new query into the controlled input. The tick is the trigger,
  // since the value here is whatever the query just became.
  useEffect(() => {
    if (caretTick === 0) return
    const input = inputRef.current
    input?.focus()
    input?.setSelectionRange(input.value.length, input.value.length)
  }, [caretTick])

  // A result opens what it names (search-assets-by-name): a page or journal day
  // navigates, a file is opened in place and nothing navigates. The spotlight
  // closes either way, keeping the query so reopening restores the matches.
  const activate = (result: SearchResult) => {
    if (result.kind === 'asset') onOpenAsset(result.path)
    else if (result.kind === 'board') onOpenBoard?.(result.path)
    else onSelect(result.path, result.blocks)
    onClose()
  }

  // Focus the input on open and restore the previously focused element on
  // close, so a chord from the editor returns the caret there. The native
  // dialog restores focus too; doing it here keeps the behavior testable in
  // jsdom and independent of the platform's support.
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    inputRef.current?.focus()
    inputRef.current?.select()
    return () => previous?.focus?.()
  }, [open])

  // The native modal owns the top layer, the backdrop, the focus trap, and
  // Escape. jsdom has no modal API; tests stub the two methods.
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  }, [open])

  // Ctrl/Cmd+P and Ctrl/Cmd+K open the spotlight from anywhere. The chord is
  // claimed before `disabled` is consulted, because Ctrl/Cmd+P is the
  // browser's Print dialog: bailing out first let the dialog open during the
  // indexing window, when the graph is not built yet. With no usable vault the
  // chord is swallowed and nothing happens. preventDefault is what suppresses
  // Print; without it the key falls through to the browser.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return
      const key = e.key.toLowerCase()
      if (key !== 'k' && key !== 'p') return
      e.preventDefault()
      if (disabled) return
      onOpen()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [disabled, onOpen])

  const openResults = () => {
    onSeeAll?.(query)
    onClose()
  }

  // Escape clears the query and closes; the shared list handler owns the rest.
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      // Claiming the key is reported by preventDefault (chord.ts): the app's
      // frame-dismiss listens for Escape and must see the spotlight owned it.
      // The spotlight closes through onClose below, so suppressing the key's
      // default does not leave the dialog open.
      e.preventDefault()
      clear()
      onClose()
      return
    }
    navKeyDown(e)
  }

  const empty = query.trim() === ''
  // The operator list is what an empty query deploys (search operators); a
  // disabled spotlight (no usable vault) deploys nothing.
  const showOperators = open && !disabled && empty
  const shown = open && (results !== null || showOperators)
  // The dropdown stays a bounded launcher: the per-group slice of the full
  // list, regrouped by the active operator; the see-all row hands the rest to
  // the results view.
  const visible = results === null ? [] : topPerGroup(results)
  const sections = sectionsOf(visible, operator)
  // The active row's index by path, once: the row loop below otherwise scans
  // the list per rendered row.
  const positions = new Map(visible.map((result, index) => [result.path, index]))
  const navLength = shown ? (showOperators ? SEARCH_OPERATORS.length : visible.length) : 0
  const navKeyDown = listKeyDown({
    // 0 while the dropdown is hidden, so a hidden list claims no key.
    length: navLength,
    active,
    setActive,
    onEnter: (index) =>
      showOperators ? chooseOperator(SEARCH_OPERATORS[index]) : activate(visible[index]),
  })

  return (
    <dialog
      ref={dialogRef}
      className={styles.dialog}
      aria-label="Search"
      onCancel={(event) => {
        // Escape clears the query and closes, matching the input's own handler.
        event.preventDefault()
        clear()
        onClose()
      }}
      onClick={(event) => {
        // A click on the backdrop targets the dialog element itself.
        if (event.target === dialogRef.current) onClose()
      }}
    >
      <div className={styles.box}>
        <div className={styles.field}>
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
        <button
          type="button"
          className={styles.case}
          aria-label="Match case"
          aria-pressed={caseSensitive}
          title="Match case"
          disabled={disabled}
          onClick={toggleCase}
        >
          {'Aa'}
        </button>
      </div>
      {shown && (
        <div className={styles.drop}>
          {showOperators ? (
            <div id="search-results" role="listbox" aria-label="Search operators">
              {SEARCH_OPERATORS.map((op, index) => (
                <button
                  key={op.id}
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  className={`${styles.command}${index === active ? ` ${styles.active}` : ''}`}
                  onClick={() => chooseOperator(op)}
                  onMouseEnter={() => setActive(index)}
                >
                  <span className={styles.commandIcon}>{OPERATOR_ICONS[op.id]}</span>
                  <span className={styles.commandBody}>
                    <span className={styles.commandLabel}>{op.label}</span>
                    <span className={styles.commandDesc}>{op.description}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <>
              <div id="search-results" role="listbox" aria-label="Search results">
                {sections.length === 0 && (
                  <div
                    className={styles.empty}
                  >{`No matches for \u201C${query.trim()}\u201D.`}</div>
                )}
                {sections.map((sec) => (
                  <section key={sec.label}>
                    <div className={styles.head}>{sec.label}</div>
                    {sec.items.map((r) => {
                      const index = positions.get(r.path) ?? -1
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
                          <MatchBody result={r} compact limit={2} />
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
            </>
          )}
        </div>
      )}
    </dialog>
  )
}
