import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Sidebar, type SidebarHandle, type SidebarRow } from './components/Sidebar'
import { EditorPane, type EditorPaneHandle } from './components/EditorPane'
import { MetaPanel, type LinkRow } from './components/MetaPanel'
import { ShortcutsList } from './components/ShortcutsList'
import { FolderRail } from './components/FolderRail'
import { PaneCollapseToggle } from './components/PaneCollapseToggle'
import { SearchSpotlight } from './components/SearchSpotlight'
import { SearchResultsView } from './components/SearchResultsView'
import { StatusBar } from './components/StatusBar'
import { Tour } from './components/Tour'
import { PresentationView } from './components/PresentationView'
import { DraftStore } from './editor/drafts'
import { BoardView } from './editor/boardView'
import { chordToKeyEventInit } from './editor/chord'
import { createDebouncedSaver } from './editor/saver'
import { deriveSlides } from './presentation/slides'
import { deriveContents } from './vault/contents'
import { copyDroppedFiles } from './vault/assets'
import { isBoardTarget, openVaultPath } from './vault/assetOpen'
import { boardToken, isBoardReferenceable, type ReferenceKind } from './vault/parse'
import { EMPTY_TRAIL, appendTrail, canStep, stepTrail, trailPath, type Trail } from './history'
import { useCompact, type CompactView } from './compact'
import { useVault } from './vault/useVault'
import { useIndex } from './vault/useIndex'
import {
  canOpenFolders,
  FileSystemVaultStorage,
  pickSourceFolder,
  pickVaultFolder,
} from './vault/fs'
import { runLogseqImport } from './vault/logseqImport'
import { LogseqImportButton, LogseqImportPanel, type ImportView } from './components/LogseqImport'
import {
  assetName,
  boardName,
  boardReferrers,
  boardStem,
  kindOf,
  localDayString,
  orderPages,
  pageAssets,
  resolveBoardPath,
  resolveReferencePath,
  stem,
  type Graph,
  type IndexPage,
} from './vault/index'
import {
  boardCandidates,
  candidateNames,
  fileCandidates,
  suggestBoards,
  suggestFiles,
  suggestPages,
  type Suggestion,
} from './vault/suggest'
import { assetSearchDoc, boardSearchDoc, type SearchResult } from './search/core'

const SAVE_DELAY_MS = 1000

/** One shared empty assets list for the no-graph state (add-asset-navigation):
 *  the sidebar is memoized, so a fresh [] on every render would defeat the memo
 *  while the index builds. */
const EMPTY_ASSETS: string[] = []

/** One shared empty boards list, for the same reason as `EMPTY_ASSETS`. */
const EMPTY_BOARDS: string[] = []

/** The rows the meta panel's Links list shows for the open page
 *  (vault-assets, board-references-in-panel, merge-link-sections): one per file
 *  the page points at,
 *  plus one per board it references with a `#!` token, deduped by path — a board
 *  row winning, so a token and a path link to one board are one row, and the
 *  board's own view is what activating it opens. A board the vault does not
 *  hold yet is unmaterialized, so its row dims. Pure and vault-shaped, so the
 *  memo above it can stay a one-liner. */
/** Order a "who references this" list (reorder-meta-panel-lists): the most
 *  recently edited page first, path ascending as the tiebreak — the sidebar's
 *  own rule (orderPages) minus pins. Returns a copy, because the index's
 *  arrays are shared. */
function orderByLastEdited(graph: Graph, paths: string[]): string[] {
  return [...paths].sort(
    (a, b) =>
      (graph.pages.get(b)?.lastModified ?? 0) - (graph.pages.get(a)?.lastModified ?? 0) ||
      a.localeCompare(b),
  )
}

function pageReferenceRows(page: IndexPage, graph: Graph): LinkRow[] {
  const rows = new Map<string, LinkRow>()
  for (const path of pageAssets(page, graph)) {
    rows.set(path, { kind: 'asset', badge: 'a', title: assetName(path), path, materialized: true })
  }
  for (const ref of page.boards) {
    const path = resolveBoardPath(ref.target, graph.boardsByName)
    rows.set(path, {
      kind: 'board',
      badge: 'b',
      title: boardName(path),
      path,
      materialized: graph.files.has(path),
    })
  }
  return [...rows.values()]
}

function App() {
  const {
    status,
    folders,
    activeId,
    addFolder,
    addFolderFromHandle,
    activate,
    closeFolder,
    goHome,
  } = useVault()
  // Browser capability (warn-unsupported-browser): probed once per render and
  // spent twice — the rail's add control exists only where the picker does,
  // and the brand screen states the requirement where it does not.
  const canOpen = canOpenFolders()
  const activeFolder = folders.find((f) => f.id === activeId)
  const { graph, savePage, saveBoard, pins, togglePin } = useIndex(activeFolder?.storage)
  const [activePath, setActivePath] = useState<string | null>(null)
  // Session trail of the pages opened so far, plus the cursor marking the open
  // one (add-history-navigation). In memory only, and cleared when the active
  // folder changes (design D3/D5): every route into a page funnels through
  // activePath, so one effect below records them all without touching each
  // handler.
  const [trail, setTrail] = useState<Trail>(EMPTY_TRAIL)
  // Pane mode (search-results-view): the main slot hosts either a page (the
  // editor) or the transient full-results view. ActivePath is untouched in
  // results mode, so closing it returns to the previously open page.
  const [mode, setMode] = useState<'page' | 'results' | 'board'>('page')
  // The no-folder Logseq import (add-logseq-import): the whole flow's view state.
  // Non-null means the center pane hosts the import instead of the editor.
  const [importView, setImportView] = useState<ImportView | null>(null)
  // Mirror of the latest landed search run (search-results-view): SearchBox
  // owns the Fuse and the debounce, and reports the uncapped result set up;
  // this feeds the results pane and stays current for the see-all handoff.
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  // The blocks something asked to locate (mark-search-matches-on-the-page,
  // frame-every-matching-block), with the page they belong to and a nonce so
  // locating the same blocks twice re-triggers the frames. The page is carried
  // because the frames belong to it rather than to the visit: leaving the page
  // and coming back finds them still framed, and a page that was never located
  // is never framed. A search result names every block holding a match; a
  // Contents row names one. Null until something is located.
  const [matchHighlight, setMatchHighlight] = useState<{
    path: string
    blocks: number[]
    nonce: number
  } | null>(null)
  // The search spotlight (replace-header-with-spotlight): a modal overlay App
  // owns. The chord listener and the rail's search trigger both set it; a
  // selection, Escape, or a scrim click clears it.
  const [searchOpen, setSearchOpen] = useState(false)
  // The app tour (add-app-tour): a modal overlay App owns, opened from the
  // rail's tour control on wide viewports. Session-only; nothing is written.
  const [tourOpen, setTourOpen] = useState(false)
  // Pane collapse (add-collapsible-sidebars): session-only, so a reload brings
  // both panes back. The classes on the shell zero the pane's grid track,
  // which only the workspace grid reads.
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  // The compact shell (add-compact-mobile-shell, design D3/D6): which of its
  // three views is shown, one at a time. Session-only, like the fold state
  // beside it, so a reload re-derives it and nothing is written anywhere. The
  // choice is stored with the item it was made for; the landing rule below says
  // why.
  const [chosenView, setChosenView] = useState<{ view: CompactView; item: string } | null>(null)
  const compact = useCompact()
  // The calendar's Today re-anchor tick (move-nav-controls-to-status-bar):
  // Today now lives in the status bar, but the calendar it re-anchors stays in
  // the sidebar. App owns the tick and passes it down; it changes only on a
  // Today activation, so it never touches the keystroke path.
  const [todayTick, setTodayTick] = useState(0)
  // Last content shown for the open path: if the file vanished in a
  // refresh, keep showing it instead of yanking the page (design D6).
  const lastKnown = useRef<IndexPage | null>(null)

  const resetSearch = useCallback(() => {
    setSearchQuery('')
    setSearchResults([])
    setSearchOpen(false)
    setMode('page')
  }, [])

  // Leave the open page behind: no page, no last-known fallback, and no results
  // view. A folder switch, a folder add, and the folder-change effect all start
  // here. Stable identity so the folder-change effect runs only on folder change.
  const resetOpenPage = useCallback(() => {
    setActivePath(null)
    lastKnown.current = null
    resetSearch()
  }, [resetSearch])

  // Per-page drafts (design C1): session-scoped edit state; mutations bump
  // a render version so the editor's initial content and the indicator
  // update. useState holds the store so render reads need no ref.
  const [drafts] = useState(() => new DraftStore())
  const [, setDraftVersion] = useState(0)
  const saverRef = useRef<ReturnType<typeof createDebouncedSaver> | null>(null)
  // Board saves (add-whiteboards, design D7): a second debounced writer for the
  // open board's scene. The board's text is read on open into `boardScene`, and
  // the save state feeds the status bar. Kept apart from the page drafts, which
  // are text and carry a compare-skip the scene does not need.
  const boardSaverRef = useRef<ReturnType<typeof createDebouncedSaver> | null>(null)
  const [boardScene, setBoardScene] = useState<string | null>(null)
  const [boardSaveState, setBoardSaveState] = useState<'clean' | 'saving' | 'failed'>('clean')
  // The presentation deck (add-presentations, design D2/D3): derived once from
  // the open page's blocks when the Present control is activated, and held
  // until the deck closes. Null means no presentation.
  const [slides, setSlides] = useState<string[] | null>(null)
  // The editor, reached through its one-method handle so the reference's rows
  // can apply a key combination (apply-shortcuts-on-click, design D8).
  const editorRef = useRef<EditorPaneHandle | null>(null)
  // A Back or Forward step changes the open page without being a navigation
  // (add-history-navigation, D2): the recording effect below skips the append
  // it would otherwise make, and clears this again. Steps always change the
  // open page, so the effect always runs to consume it.
  const stepped = useRef(false)

  const handleActivate = (id: string) => {
    // Switching folders resets the open page (F5); re-granting the already
    // active folder is not a switch, so it keeps the page.
    if (id !== activeId) resetOpenPage()
    void activate(id)
  }

  // The Logseq import (add-logseq-import): pick a read-only source, a read-write
  // destination, run the transform, then open the destination. Both picker
  // cancellations end the flow silently; the panel hosts progress and result.
  const handleImport = async () => {
    if (!canOpen) return
    let sourceHandle: FileSystemDirectoryHandle
    let destHandle: FileSystemDirectoryHandle
    try {
      sourceHandle = await pickSourceFolder()
    } catch {
      return
    }
    try {
      destHandle = await pickVaultFolder()
    } catch {
      return
    }
    setImportView({ kind: 'running', progress: { phase: 'scanning', done: 0, total: 0 } })
    const result = await runLogseqImport(
      new FileSystemVaultStorage(sourceHandle),
      new FileSystemVaultStorage(destHandle),
      {
        sourceName: sourceHandle.name,
        onProgress: (progress) => setImportView({ kind: 'running', progress }),
      },
    )
    if (!result.ok) {
      setImportView({ kind: 'error', message: result.error })
      return
    }
    setImportView({ kind: 'done', report: result.report })
    await addFolderFromHandle(destHandle)
  }

  // Stable identity so the memoized Sidebar can skip re-rendering on every
  // keystroke (add-page-history, design D8). The memo only bails while this
  // keeps its identity, so it must depend on exactly what it reads: the index
  // (which changes on save/refresh) and the draft store (session state) - and
  // never on the open page, which it does not read.
  const handleSelect = useCallback(
    (path: string, blocks: number[] = []) => {
      // Opening anything leaves the results view (search-results-view); the
      // spotlight keeps the query, so its see-all row returns to it later.
      setMode('page')
      lastKnown.current = null
      setActivePath(path)
      // Baseline the draft against the index's content for this page. An
      // existing draft (unsaved edits from earlier in the session) wins.
      drafts.open(path, graph?.pages.get(path)?.content ?? '')
      setDraftVersion((v) => v + 1)
      // A search result names the blocks to frame. A navigation that names none
      // leaves any frame alone (frame-the-located-block): the frames are
      // replaced by a later locate, not by leaving the page they belong to.
      if (blocks.length > 0) {
        setMatchHighlight((prev) => ({ path, blocks, nonce: (prev?.nonce ?? 0) + 1 }))
      }
    },
    [graph, drafts],
  )

  // Locating a heading from the Contents section (add-page-contents): set the
  // same state a search result sets, so the editor scrolls and frames the block.
  // A heading is one block, so this caller passes one. It never re-opens the
  // page, so the draft and caret are untouched and nothing is written.
  const handleLocate = useCallback(
    (block: number) => {
      if (activePath === null) return
      setMatchHighlight((prev) => ({
        path: activePath,
        blocks: [block],
        nonce: (prev?.nonce ?? 0) + 1,
      }))
    },
    [activePath],
  )

  // Opening a board (add-whiteboards, design D5): the main pane switches to the
  // board editor and the board's text is read once into `boardScene`. The path
  // is the open thing's identity, exactly as a page path is, so the trail
  // records it and Back/Forward reopen it (page-history). A board with no file
  // yet opens blank; its file is written by the first save (design D3).
  const handleOpenBoard = useCallback(
    (path: string) => {
      setMode('board')
      lastKnown.current = null
      setActivePath(path)
      setBoardSaveState('clean')
      setBoardScene(null)
      const store = activeFolder?.storage
      if (!store) {
        setBoardScene('')
        return
      }
      void store
        .read(path)
        .then((text) => setBoardScene(text))
        .catch(() => setBoardScene(''))
    },
    [activeFolder],
  )

  // A board reference badge names a board; resolve the name in the board
  // namespace (never the page one) to the path it names, or the path it would
  // create (add-whiteboards, design D2/D3).
  const handleOpenBoardName = useCallback(
    (name: string) => {
      if (!graph) return
      handleOpenBoard(resolveBoardPath(name, graph.boardsByName))
    },
    [graph, handleOpenBoard],
  )

  // A trail entry is a page path or a board path; the extension decides which
  // (add-whiteboards: the extension decides the view).
  const handleOpenPath = useCallback(
    (path: string) => {
      if (isBoardTarget(path)) handleOpenBoard(path)
      else handleSelect(path)
    },
    [handleSelect, handleOpenBoard],
  )

  // Back and Forward move the cursor and open the page or board it then marks;
  // they
  // never add an entry (add-history-navigation, D2). Both are stable across
  // keystrokes - they depend on the trail and the select handler, and neither
  // changes while typing - which keeps the memoized Sidebar memoized.
  const handleBack = useCallback(() => {
    const next = stepTrail(trail, -1)
    if (next === trail) return
    const path = trailPath(next)
    if (path === null) return
    stepped.current = true
    setTrail(next)
    handleOpenPath(path)
  }, [trail, handleOpenPath])

  const handleForward = useCallback(() => {
    const next = stepTrail(trail, 1)
    if (next === trail) return
    const path = trailPath(next)
    if (path === null) return
    stepped.current = true
    setTrail(next)
    handleOpenPath(path)
  }, [trail, handleOpenPath])

  // Today (move-nav-controls-to-status-bar): the current day's journal is just
  // another page to open, so it goes through handleSelect and inherits the
  // trail recording, the draft baseline, and the blank-page-on-first-save
  // rule. The day is read at activation, not at mount, so a session left open
  // across midnight goes to the new day. The status bar owns the control; the
  // calendar stays in the sidebar, so App bumps the tick that re-anchors it.
  const handleToday = useCallback(() => {
    setTodayTick((t) => t + 1)
    handleSelect(`journals/${localDayString(new Date())}.md`)
  }, [handleSelect])

  // Opening a reference badge (add-reference-badges): resolve the name through
  // the shared resolver (date-references-resolve-to-journals) — a date names
  // the journal day, every other name the existing page, else a blank page
  // under `pages/` that materializes on first save — skip a link back to the
  // open page, and route through handleSelect. Resolution stays here, never in
  // the editor (ADR-0010).
  const handleOpenReference = (target: string, kind: ReferenceKind) => {
    if (kind === 'board') {
      handleOpenBoardName(target)
      return
    }
    if (!graph) return
    const path = resolveReferencePath(target, graph.byName)
    if (path === activePath) return
    handleSelect(path)
  }

  // Activating an asset (vault-assets): open the file and change nothing else —
  // no navigation, no draft, no trail entry, no search state. Stable identity
  // (it reads only the active folder) so the memoized Sidebar and MetaPanel skip
  // re-rendering while typing.
  const handleOpenAsset = useCallback(
    (path: string) => {
      // The extension decides the view (add-whiteboards): a `.excalidraw` file
      // opens in the board editor wherever the row came from — a board row, a
      // path link in References, the Assets band, or a search result.
      if (isBoardTarget(path)) {
        handleOpenBoard(path)
        return
      }
      const store = activeFolder?.storage
      if (!store) return
      void openVaultPath(path, (assetPath) => store.readBinary(assetPath))
    },
    [activeFolder, handleOpenBoard],
  )

  // Every landed run updates the pane's source; a run with no matches leaves
  // nothing to browse, so the results mode closes back to the open page and
  // the dropdown shows its empty state (search-results-view spec).
  const handleQueryResult = (query: string, results: SearchResult[]) => {
    setSearchQuery(query)
    setSearchResults(results)
    if (mode === 'results' && results.length === 0) setMode('page')
  }

  const handleOpenResults = (query: string) => {
    setSearchQuery(query)
    setMode('results')
  }

  // Applying a key combination from the reference (apply-shortcuts-on-click,
  // design D2/D8): an editor row asks the editor to replay the chord at its own
  // key surface, an app row dispatches on the document, where the app's own key
  // listeners already live. One mechanism, two targets, no command table.
  // Stable identity (it reads only refs) so the memoized reference does not
  // re-render on an ordinary edit.
  const applyShortcut = useCallback((chord: string, target: 'editor' | 'app') => {
    if (target === 'editor') {
      editorRef.current?.applyChord(chord)
      return
    }
    document.dispatchEvent(new KeyboardEvent('keydown', chordToKeyEventInit(chord)))
  }, [])

  // A folder switch resets the open page: the previously open page belongs
  // to the old folder and must never surface in the new one (journal-home,
  // spec: ui-shell folder-rail). The rail handler clears it synchronously;
  // addFolder resolves asynchronously (openNewFolder), so the reset also keys
  // on folder identity — every switch arrives here with no stale page, letting
  // the auto-open effect below land on the new folder's today journal once
  // its graph is ready. Re-activating the same folder keeps the page.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    resetOpenPage()
    // The trail belongs to one folder (add-page-history): a page from the
    // previous vault must never be reachable by Back or Forward, so it clears
    // here with the open page, the last-known page, and search.
    // oxlint-disable-next-line react/set-state-in-effect
    setTrail(EMPTY_TRAIL)
  }, [activeFolder?.id, resetOpenPage])

  // The journal is the home (journal-home, spec: static-navigation today-
  // journal load): whenever a folder's graph is ready and no page is open —
  // app boot, a folder switch, or adding a folder — open that folder's today
  // journal note. Waiting for the graph keeps the seed correct: an existing
  // today file is never masked by an empty draft (design D1). Re-activating
  // the already-active folder keeps activePath non-null, so the open page is
  // preserved. A day with no file stays unmaterialized: the draft seeds from
  // '' and pendingBlank renders it, materializing on first save like a
  // calendar day.
  useEffect(() => {
    if (graph === null || activePath !== null) return
    const today = `journals/${localDayString(new Date())}.md`
    // oxlint-disable-next-line react/set-state-in-effect
    setActivePath(today)
    drafts.open(today, graph.pages.get(today)?.content ?? '')
    setDraftVersion((v) => v + 1)
  }, [graph, activePath, drafts])

  // Record every page the app opens (add-page-history, design D3). Keyed on
  // the open page, so the sidebar, the calendar, the links pane, the search
  // surfaces, reference badges, and the journal the app opens by itself are all
  // covered by one hook. Runs once per navigation, never per keystroke; the
  // append is O(cap) over cap <= 20 entries. A Back or Forward step is not a
  // navigation and must not append (add-history-navigation, D2): the handler
  // that moved the cursor set `stepped`, which is consumed here instead.
  useEffect(() => {
    if (activePath === null) return
    if (stepped.current) {
      stepped.current = false
      return
    }
    // oxlint-disable-next-line react/set-state-in-effect
    setTrail((prev) => appendTrail(prev, activePath))
  }, [activePath])

  // The page to show: fresh from the active graph, else the last-known
  // content for that path, else nothing. The ref read is the
  // usePrevious-style fallback: it only matters on renders already caused
  // by a graph/selection change, so it never needs to trigger one itself.
  // oxlint-disable-next-line react/refs
  const displayed =
    // oxlint-disable-next-line react/refs
    activePath === null ? null : (graph?.pages.get(activePath) ?? lastKnown.current ?? null)

  // Remember what we rendered so the vanish case can fall back to it.
  useEffect(() => {
    if (displayed) lastKnown.current = displayed
  }, [displayed])

  // The open page's draft, if this session has one for it.
  const openDraft = activePath === null ? undefined : drafts.get(activePath)

  // Unmaterialized page (links-pane, D2): a path deliberately opened this
  // session that has no file on disk, seeded clean from nothing. A path is
  // new-page iff its draft was seeded from an absent file (`saved === ''`),
  // which distinguishes it from a page deleted externally after opening. The
  // blank page disappears the moment its first save lands: `upsertPage`
  // creates the file and the graph gains the page, so `displayed` resolves
  // to the real page above. No separate pending-set bookkeeping to leak.
  const pendingBlank: IndexPage | null =
    activePath !== null &&
    !isBoardTarget(activePath) &&
    graph !== null &&
    !graph.pages.has(activePath) &&
    openDraft !== undefined &&
    openDraft.saved === ''
      ? {
          path: activePath,
          title: stem(activePath),
          kind: kindOf(activePath),
          content: '',
          links: [],
          assets: [],
          boards: [],
          lastModified: 0,
        }
      : null
  const page = displayed ?? pendingBlank

  // Which surfaces the reference's rows can act on (design D5): editor rows need
  // a mounted editor — no page open also covers the brand empty state, the
  // results view, and indexing, where the graph is null and no adapter exists —
  // and the search row needs the vault that enables search itself.
  /* oxlint-disable react/refs */
  const canEdit = mode === 'page' && page !== null
  const canSearch = graph !== null
  // One identity for the reference's availability, so the memoized list
  // re-renders only when a surface's availability actually changes — never per
  // keystroke (AGENTS.md: the keystroke budget).
  const canApply = useMemo(() => ({ editor: canEdit, app: canSearch }), [canEdit, canSearch])
  /* oxlint-enable react/refs */

  const handleEdit = (markdown: string) => {
    if (activePath === null) return
    if (drafts.edit(activePath, markdown) === 'dirty') {
      saverRef.current?.schedule(activePath, markdown)
    }
    setDraftVersion((v) => v + 1)
  }

  // Presenting a page (add-row-context-menu; presentations spec): the deck is
  // derived once from the live editor document, so unsaved draft edits present
  // and no vault file is read. The open page is live now; another page is
  // opened first, and its deck is derived when the editor reports ready
  // (navigate-then-present) rather than from a second Markdown render path.
  const pendingPresent = useRef<string | null>(null)
  const activePathRef = useRef(activePath)
  /* oxlint-disable-next-line react/refs */
  activePathRef.current = activePath

  const handlePresent = useCallback(
    (path: string) => {
      if (path === activePath) {
        setSlides(deriveSlides(editorRef.current?.staticBlocks() ?? []))
        return
      }
      pendingPresent.current = path
      handleSelect(path)
    },
    [activePath, handleSelect],
  )

  // The target page's editor has mounted and applied its content: derive its
  // deck. The pending path is consumed once, and a mount for any other page is
  // a no-op, so React's StrictMode double-mount cannot present twice.
  const handleEditorReady = useCallback(() => {
    const target = pendingPresent.current
    if (target === null || target !== activePathRef.current) return
    pendingPresent.current = null
    setSlides(deriveSlides(editorRef.current?.staticBlocks() ?? []))
  }, [])

  // Favorite a page from its row's context menu (add-row-context-menu). This is
  // the pin store the status-bar star used, now keyed by the row's own path.
  const handleFavorite = useCallback(
    (path: string) => {
      void togglePin(path)
    },
    [togglePin],
  )

  // The compact landing rule (design D6): with nothing open the navigation view
  // leads, so a first run lands where the folder picker's control lives; once
  // an item is open the editor leads. While a vault is restoring a page is about
  // to open, so the editor leads and the navigation view does not flash.
  const mainPaneHasItem = activePath !== null || mode !== 'page' || importView !== null
  const itemKey = JSON.stringify([activePath, mode, importView?.kind ?? null])
  const landingView: CompactView = status === 'restoring' || mainPaneHasItem ? 'editor' : 'nav'
  const compactView: CompactView = chosenView?.item === itemKey ? chosenView.view : landingView

  // Folding belongs to the wide composition: the compact shell has no strips, so
  // a fold left over from a wider window does not apply there.
  const leftFolded = leftCollapsed && !compact
  const rightFolded = rightCollapsed && !compact

  // Showing a view pushes a history entry, so the device's Back button and Back
  // gesture close the view instead of leaving the app (design D3). An entry is
  // pushed only when a view is opened, so repeated taps cannot stack them.
  const showCompactView = useCallback(
    (view: CompactView) => {
      setChosenView({ view, item: itemKey })
      if (view !== 'editor') history.pushState({ folioView: view }, '')
    },
    [itemKey],
  )

  const toggleCompactView = useCallback(
    (view: 'nav' | 'meta') => {
      // The shown view's own control closes it. Only a view the user opened has
      // an entry to pop: a landing view was never pushed, so it just gives way
      // to the editor.
      if (compactView === view && chosenView?.item === itemKey) {
        setChosenView({ view: 'editor', item: itemKey })
        history.back()
        return
      }
      showCompactView(compactView === view ? 'editor' : view)
    },
    [compactView, chosenView, itemKey, showCompactView],
  )

  // Back closes the view. The listener never pushes, so the first Back with the
  // editor shown is still the browser's to handle (design D3).
  useEffect(() => {
    const onPopState = () => setChosenView(null)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  // Focus follows the view (design D1): a covered editor leaves the tab order,
  // so the platform drops focus on the body when the row that held it is
  // hidden. Returning to the editor restores it. Wide viewports never take this
  // path, so the desktop focus behavior is unchanged.
  const previousView = useRef(compactView)
  useEffect(() => {
    if (compact && previousView.current !== 'editor' && compactView === 'editor') {
      editorRef.current?.focus()
    }
    previousView.current = compactView
  }, [compact, compactView])

  // Reveal the open page's row in the Files listing (reveal-open-page-in-files,
  // ui-shell spec). The status bar offers this only while the open item is a
  // page with a Files row; the sidebar performs it. A folded left pane is
  // display: none, so nothing inside it can take focus: unfold first, then
  // reveal after the commit that expanded it. View-only — no navigation, no
  // re-open, no vault write. On the compact shell the listing is a view of its
  // own rather than a folded pane, and the same two-step applies to it.
  const sidebarRef = useRef<SidebarHandle | null>(null)
  const pendingReveal = useRef(false)

  const handleRevealPage = useCallback(() => {
    // The compact shell keeps the listing in a view of its own (design D6):
    // show that view first, then reveal after the commit that made the row
    // focusable — the same two-step a folded pane needs, for the same reason.
    if (compact && compactView !== 'nav') {
      pendingReveal.current = true
      showCompactView('nav')
      return
    }
    if (!compact && leftCollapsed) {
      pendingReveal.current = true
      setLeftCollapsed(false)
      return
    }
    sidebarRef.current?.revealActive()
  }, [compact, compactView, leftCollapsed, showCompactView])

  useEffect(() => {
    if (!pendingReveal.current) return
    if (!compact && leftCollapsed) return
    if (compact && compactView !== 'nav') return
    pendingReveal.current = false
    sidebarRef.current?.revealActive()
  }, [compact, compactView, leftCollapsed])

  // A board's element change (add-whiteboards, design D7): schedule the scene
  // for the debounced board writer. Panning never reaches here (the board view
  // filters camera-only changes), so this runs once per real edit.
  const handleBoardEdit = (scene: string) => {
    if (activePath === null) return
    setBoardSaveState('saving')
    boardSaverRef.current?.schedule(activePath, scene)
  }

  // Clear drafts and rebuild the saver whenever the active storage changes
  // (drafts are disposable like the index, ADR-0004). savePage is a stable
  // identity from useIndex, so this effect runs once per folder.
  useEffect(() => {
    drafts.clear()
    saverRef.current?.dispose()
    const saver = createDebouncedSaver(async (path, content) => {
      // Compare-skip (design C2): if the draft went back to the saved text
      // before the timer fired (an undo), there is nothing to write.
      const draft = drafts.get(path)
      if (!draft || draft.content === draft.saved) return true
      drafts.beginSave(path)
      setDraftVersion((v) => v + 1)
      const ok = await savePage(path, content)
      if (ok) drafts.succeed(path)
      else drafts.fail(path)
      setDraftVersion((v) => v + 1)
      return ok
    }, SAVE_DELAY_MS)
    saverRef.current = saver
    return () => {
      saver.dispose()
      saverRef.current = null
    }
  }, [activeFolder?.storage, drafts, savePage])

  // Board writer (add-whiteboards, design D7): the same debounced-saver shape
  // as the page writer, over the active folder's storage. Rebuilt per folder,
  // disposed on unmount.
  useEffect(() => {
    boardSaverRef.current?.dispose()
    const saver = createDebouncedSaver(async (path, scene) => {
      const ok = await saveBoard(path, scene)
      setBoardSaveState(ok ? 'clean' : 'failed')
      return ok
    }, SAVE_DELAY_MS)
    boardSaverRef.current = saver
    return () => {
      saver.dispose()
      boardSaverRef.current = null
    }
  }, [activeFolder?.storage, saveBoard])

  // The open page's draft feeds the editor's initial content (existing draft
  // wins) and the indicator (dirty/saving/failed, else clean). `page` is
  // `displayed ?? pendingBlank` (set above): a real graph page, a vanished
  // page's last-known content, or the blank page for a not-yet-created path.
  const initialContent = openDraft?.content ?? page?.content ?? ''
  const saveState = openDraft?.status ?? 'clean'
  // A page with no file yet is "new": its save indicator reads as creating it.
  const newPage = pendingBlank !== null

  // Resolve the open page's place in the link graph (links-pane): backlinks
  // come from the folded reverse index; forwardlinks resolve each reference
  // target to a page, or stay unmaterialized when no page exists yet.
  // Memoized on graph/page identity: a keystroke bumps the draft version and
  // re-renders, but the graph does not change until a save lands, so typing
  // must not re-walk the link graph (vault-proportional work stays off the
  // typing path).
  const backlinkRows = useMemo<LinkRow[]>(
    () =>
      graph && page
        ? orderByLastEdited(graph, graph.backlinks.get(page.title.toLowerCase()) ?? []).map(
            (path) => {
              const p = graph.pages.get(path)
              return {
                kind: 'page' as const,
                badge: 'in' as const,
                title: p ? p.title : path,
                path,
                materialized: true,
              }
            },
          )
        : [],
    [graph, page],
  )
  // The pages that reference the open board (add-whiteboards: Referenced by),
  // built from the index's reverse map. Same row shape as the page rows above,
  // and recomputed only when the graph or the open board changes.
  const boardReferrerRows = useMemo<LinkRow[]>(
    () =>
      graph && activePath !== null && mode === 'board'
        ? orderByLastEdited(graph, boardReferrers(graph, activePath)).map((path) => {
            const p = graph.pages.get(path)
            return {
              kind: 'page' as const,
              badge: 'in' as const,
              title: p ? p.title : path,
              path,
              materialized: p !== undefined,
            }
          })
        : [],
    [graph, activePath, mode],
  )

  // Forwardlinks (merge-forwardlinks-groups): the page references the open page
  // makes (document order), then the files it points at — assets then boards.
  // One list now, badged by kind; the order is unchanged from the two former
  // groups. Memoized on [graph, page]: a keystroke bumps the draft version and
  // re-renders, but the graph does not change until a save lands, so typing must
  // not re-walk the link graph (vault-proportional work stays off the typing
  // path).
  const forwardlinkRows = useMemo<LinkRow[]>(
    () =>
      graph && page
        ? [
            ...page.links
              .map((l) => {
                const targetPath = resolveReferencePath(l.target, graph.byName)
                const p = graph.pages.get(targetPath)
                if (p) {
                  return {
                    kind: 'page' as const,
                    badge: 'out' as const,
                    title: p.title,
                    path: targetPath,
                    materialized: true,
                  }
                }
                // No page matches the reference: it is unmaterialized. A name
                // that is not a date materializes under `pages/`, preserving any
                // directory part in bracketed names; a date name is the journal
                // day, which materializes under `journals/`.
                return {
                  kind: 'page' as const,
                  badge: 'out' as const,
                  title: l.target,
                  path: targetPath,
                  materialized: false,
                }
              })
              .filter(
                // A page's link to itself isn't useful navigation (mirrors the
                // index's backlink self-exclusion).
                (r) => r.path !== page.path,
              ),
            // The page's files (vault-assets, design D1) follow the page rows,
            // labelled with the file's name and badged by kind. Whether one
            // exists is read from the vault's own listing, so a file deleted
            // outside the app drops out on the next scan even though this page's
            // record is carried over untouched.
            ...pageReferenceRows(page, graph),
          ]
        : [],
    [graph, page],
  )
  // The open page's headings for the Contents section (add-page-contents),
  // derived from the page's saved content and keyed on the content string, so
  // it rebuilds after auto-save and never on a keystroke.
  /* oxlint-disable-next-line react/refs */
  const contentsRows = useMemo(() => deriveContents(page?.content ?? ''), [page?.content])

  // The vault's assets, path-ordered (vault-assets): App hands the index's own
  // array through, so the memoized sidebar sees a new one only on a scan.
  const assets = graph ? graph.assets : EMPTY_ASSETS

  // The vault's boards, path-ordered (add-whiteboards): the index's own array,
  // so the memoized sidebar sees a new one only on a scan.
  const boards = graph ? graph.boards : EMPTY_BOARDS

  // Ordered pages for the sidebar (add-pinned-pages, design D5): pinned
  // first in pin order, then the rest by last-modified descending — the
  // pages array was previously order-unspecified (alphabetical by accident).
  // Memoized on graph/pins identity: the sort is vault-sized and must not run
  // on every keystroke.
  const pages = useMemo(
    () => (graph ? orderPages(graph.pages.values(), pins).filter((p) => p.kind === 'page') : []),
    [graph, pins],
  )
  const journalEntries = useMemo(
    () => (graph ? [...graph.pages.values()].filter((p) => p.kind === 'journal') : []),
    [graph],
  )

  // The Links list (merge-link-sections): the open page's incoming pages, then
  // its outgoing pages and files, as one memoized array. The two source arrays
  // are already memoized, so combining them stays off the keystroke path.
  const linkRows = useMemo(
    () => (mode === 'page' ? [...backlinkRows, ...forwardlinkRows] : []),
    [mode, backlinkRows, forwardlinkRows],
  )

  // The sidebar's single listing (merge-sidebar-sections): pages lead (pinned
  // then recency, from the ordered `pages`), then boards, then assets — each
  // labelled by kind. Memoized on its inputs' identity so the memoized Sidebar
  // bails on every keystroke (App.test: the sidebar memo), and so the
  // vault-sized ordering never runs per keystroke.
  const sidebarRows = useMemo<SidebarRow[]>(() => {
    const pinned = new Set(pins)
    return [
      ...pages.map((p) => ({
        kind: 'page' as const,
        path: p.path,
        label: p.title,
        pinned: pinned.has(p.path),
      })),
      ...boards.map((path) => ({ kind: 'board' as const, path, label: boardName(path) })),
      ...assets.map((path) => ({ kind: 'asset' as const, path, label: assetName(path) })),
    ]
  }, [pages, boards, assets, pins])

  // The status bar offers the reveal (reveal-open-page-in-files) only when the
  // open item is a page that has a row here: a board's and a journal day's
  // breadcrumb stay inert text. Memoized on the rows' identity, so it costs
  // nothing per keystroke.
  const canRevealPage = useMemo(
    () => sidebarRows.some((row) => row.kind === 'page' && row.path === activePath),
    [sidebarRows, activePath],
  )

  // Whether either control has anywhere to step (add-history-navigation).
  const canBack = canStep(trail, -1)
  const canForward = canStep(trail, 1)

  // Loading state (indexing-loading-state): while an active folder with
  // storage is building its index, the graph is null — the panes show
  // placeholders instead of empty content. No active folder (brand empty
  // state) and pending-permission folders (no storage) stay outside it.
  const indexing = graph === null && activeFolder?.storage !== undefined

  // Search corpus: pages with content from the live graph, plus one document
  // per vault asset (search-assets-by-name, design D1) — the same `assets/`
  // inventory the sidebar lists, matched by label and never read. Memoized on
  // graph identity so the Fuse inside SearchSpotlight rebuilds on save/refresh
  // (search-notes, design: Fuse lifecycle).
  const searchCorpus = useMemo(
    () =>
      graph
        ? [
            ...[...graph.pages.values()].map((page) => ({
              path: page.path,
              title: page.title,
              kind: page.kind,
              text: page.content,
            })),
            ...graph.assets.map(assetSearchDoc),
            ...graph.boards.map(boardSearchDoc),
          ]
        : [],
    [graph],
  )

  // Reference-completion pool (add-reference-autocomplete, design D2/D8): the
  // index's resolvable names in page order, rebuilt only when the graph or the
  // pins change, never per keystroke. The editor asks this through the adapter.
  const suggestPool = useMemo(() => (graph ? candidateNames(graph, pins) : []), [graph, pins])
  const suggest = useMemo(
    () =>
      (query: string): Suggestion[] =>
        suggestPages(query, suggestPool),
    [suggestPool],
  )

  // Destination-completion pool (add-asset-references, design D4): every vault
  // path that is not a page, labelled as the sidebar labels it and carrying the
  // image flag an image's destination narrows by. Built once per graph, never
  // per keystroke, exactly like the page pool above.
  const filePool = useMemo(() => (graph ? fileCandidates(graph) : []), [graph])
  const suggestFileRows = useMemo(
    () =>
      (query: string, onlyImages: boolean): Suggestion[] =>
        suggestFiles(query, filePool, onlyImages),
    [filePool],
  )

  // Board-completion pool (add-whiteboards, design D2): one row per resolvable
  // board name, built once per graph, exactly like the page and file pools.
  const boardPool = useMemo(() => (graph ? boardCandidates(graph) : []), [graph])
  const suggestBoardRows = useMemo(
    () =>
      (query: string): Suggestion[] =>
        suggestBoards(query, boardPool),
    [boardPool],
  )

  const shellClass = `app-shell${leftFolded ? ' left-collapsed' : ''}${
    rightFolded ? ' right-collapsed' : ''
  }${compact ? ` view-${compactView}` : ''}`

  return (
    <div className={shellClass}>
      <div className="workspace">
        {/* The strips are the wide composition's: the compact shell shows one
            view at a time and has nothing to fold (design D1). */}
        {!compact && (
          <PaneCollapseToggle
            side="left"
            collapsed={leftCollapsed}
            controls="folder-rail sidebar-pane"
            onToggle={() => setLeftCollapsed((v) => !v)}
          />
        )}
        <div className="view-layer layer-nav">
          <FolderRail
            status={status}
            folders={folders}
            activeId={activeId}
            // The brand returns home (close-folders): no active folder, folders
            // stay on the rail. The activeFolder?.id effect resets the page.
            onHome={() => void goHome()}
            // The rail's search trigger opens the spotlight; it is disabled while
            // no vault is usable, matching search's scoped rule.
            onSearch={() => setSearchOpen(true)}
            searchDisabled={!canSearch}
            // The tour is a wide-viewport surface (add-app-tour): the compact
            // shell shows one view at a time, so App passes no callback there
            // and the rail renders no tour control.
            onTour={compact ? undefined : () => setTourOpen(true)}
            // Closing a folder forgets it; closing the active one returns home
            // (close-folders). The activeFolder?.id effect resets the page.
            onClose={(id) => void closeFolder(id)}
            onAdd={
              canOpen
                ? () => {
                    resetOpenPage()
                    void addFolder()
                  }
                : undefined
            }
            onActivate={handleActivate}
            collapsed={leftFolded}
          />
          <Sidebar
            ref={sidebarRef}
            collapsed={leftFolded}
            rows={sidebarRows}
            journalEntries={journalEntries}
            activePath={activePath}
            onSelect={handleSelect}
            onOpenAsset={handleOpenAsset}
            onOpenBoard={handleOpenBoard}
            onFavorite={handleFavorite}
            onPresent={handlePresent}
            hasVault={graph !== null}
            loading={indexing}
            todayTick={todayTick}
          />
        </div>
        <div className="view-layer layer-main">
          {importView !== null ? (
            <LogseqImportPanel view={importView} onContinue={() => setImportView(null)} />
          ) : mode === 'results' ? (
            <SearchResultsView
              // Keyed on the query: editing the query while the view is open
              // remounts it, resetting page and active row to the new set.
              key={searchQuery}
              query={searchQuery}
              results={searchResults}
              onOpen={handleSelect}
              onOpenAsset={handleOpenAsset}
              onOpenBoard={handleOpenBoard}
              onClose={() => setMode('page')}
            />
          ) : mode === 'board' ? (
            // A board opens in the main pane (add-whiteboards, design D5). The
            // scene is read on open; until it lands, the pane shows an empty
            // board-shaped placeholder rather than the editor's notes hint.
            boardScene === null ? (
              <div className="board-placeholder" aria-busy="true" />
            ) : (
              <BoardView
                // Keyed by path: switching boards remounts rather than mutating.
                key={activePath ?? 'board'}
                initialScene={boardScene}
                // The blank-board note's token (add-board-empty-state-note): the
                // board's filename stem, which is what a `#!` reference resolves
                // to — not the `boardName` label (the path inside `boards/`).
                boardToken={
                  activePath !== null && isBoardReferenceable(boardStem(activePath))
                    ? boardToken(boardStem(activePath), 'word')
                    : null
                }
                onChange={handleBoardEdit}
              />
            )
          ) : (
            <EditorPane
              // Keyed by path: each page gets a fresh editor seeded with its
              // draft-or-index content; switching pages remounts it.
              key={page?.path}
              ref={editorRef}
              page={page}
              initialContent={initialContent}
              onChange={handleEdit}
              onReady={handleEditorReady}
              // The frame belongs to the page it was located on, so a pane
              // showing any other page is handed no mark.
              highlight={matchHighlight?.path === activePath ? matchHighlight : null}
              onOpenReference={handleOpenReference}
              onBoardLink={handleOpenBoard}
              suggest={suggest}
              suggestBoards={suggestBoardRows}
              suggestFiles={suggestFileRows}
              onAttachFiles={
                activeFolder?.storage
                  ? (files) => copyDroppedFiles(activeFolder.storage!, files)
                  : undefined
              }
              // Vault images (render-vault-images): the pane resolves a page's
              // asset references through the active folder's storage, and does
              // nothing without one.
              readAsset={
                activeFolder?.storage ? (path) => activeFolder.storage!.readBinary(path) : undefined
              }
              // While restoring, avoid a one-frame "open a folder" flash; once
              // settled, only an actually usable folder keeps the notes hint,
              // and a browser with no folder picker gets the requirement instead
              // of an instruction it cannot follow (warn-unsupported-browser).
              emptyHint={
                status === 'restoring' || activeFolder?.storage
                  ? 'notes'
                  : canOpen
                    ? 'open-folder'
                    : 'browser-unsupported'
              }
              brandAction={
                canOpen && status === 'ready' && activeFolder?.storage === undefined ? (
                  <LogseqImportButton onClick={() => void handleImport()} />
                ) : undefined
              }
              loading={indexing}
            />
          )}
        </div>
        <div className="view-layer layer-meta">
          <MetaPanel
            // The meta panel is page metadata in page mode; in board mode it
            // shows the board's referrers instead (add-whiteboards). Both `page`
            // reads below derive from the last-known ref (the same quirk the
            // StatusBar props suppress).
            /* oxlint-disable react/refs */
            pageOpen={mode === 'page' && page !== null}
            contents={mode === 'page' ? contentsRows : []}
            links={linkRows}
            activePath={mode === 'page' ? activePath : null}
            boardOpen={mode === 'board'}
            boardReferrers={boardReferrerRows}
            onSelect={handleSelect}
            onLocate={handleLocate}
            onOpenAsset={handleOpenAsset}
            loading={indexing}
            shortcuts={<ShortcutsList onApply={applyShortcut} canApply={canApply} />}
            /* oxlint-enable react/refs */
            collapsed={rightFolded}
          />
        </div>
        {!compact && (
          <PaneCollapseToggle
            side="right"
            collapsed={rightCollapsed}
            controls="meta-panel"
            onToggle={() => setRightCollapsed((v) => !v)}
          />
        )}
      </div>
      <StatusBar
        pagePath={activePath}
        saveState={mode === 'board' ? boardSaveState : saveState}
        newPage={newPage}
        indexing={indexing}
        compact={compact}
        view={compactView}
        onShowView={toggleCompactView}
        // The active vault's name and live index-based file count; falls
        // back to the open-time snapshot while the index builds (design D6).
        vaultName={activeFolder?.storage ? activeFolder.name : undefined}
        fileCount={graph ? graph.pages.size : activeFolder?.fileCount}
        canBack={canBack}
        canForward={canForward}
        onBack={handleBack}
        onForward={handleForward}
        canToday={graph !== null}
        onToday={handleToday}
        onRevealPage={canRevealPage ? handleRevealPage : undefined}
      />
      {/* Search spotlight (replace-header-with-spotlight): a modal overlay in
          every app state. Keyed on the folder so a switch remounts it and
          clears the query (search: scoped to the active vault). */}
      <SearchSpotlight
        key={activeFolder?.id ?? 'none'}
        open={searchOpen}
        docs={searchCorpus}
        // The search chord lives on `document`, so it can fire over the tour;
        // closing the tour first keeps two overlays from stacking (add-app-tour).
        onOpen={() => {
          setTourOpen(false)
          setSearchOpen(true)
        }}
        onClose={() => setSearchOpen(false)}
        disabled={graph === null}
        onSelect={handleSelect}
        onOpenAsset={handleOpenAsset}
        onOpenBoard={handleOpenBoard}
        onQueryResult={handleQueryResult}
        onSeeAll={handleOpenResults}
      />
      {/* The app tour (add-app-tour): a modal overlay over the shell while
          open. Closing is a state flip, so nothing about the shell changes. */}
      <Tour open={tourOpen} onClose={() => setTourOpen(false)} />
      {/* The presentation deck (add-presentations): a modal overlay over the
          shell while open. Closing is a state flip, so the editor underneath
          returns exactly as it was, and nothing is written to the vault. */}
      {slides !== null ? (
        <PresentationView
          slides={slides}
          onClose={() => setSlides(null)}
          readAsset={
            activeFolder?.storage ? (path) => activeFolder.storage!.readBinary(path) : undefined
          }
        />
      ) : null}
    </div>
  )
}

export default App
