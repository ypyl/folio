import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { EditorPane, type EditorPaneHandle } from './components/EditorPane'
import { MetaPanel, type LinkRow } from './components/MetaPanel'
import { ShortcutsList } from './components/ShortcutsList'
import { FolderRail } from './components/FolderRail'
import { SearchBox } from './components/SearchBox'
import { SearchResultsView } from './components/SearchResultsView'
import { StatusBar } from './components/StatusBar'
import { DraftStore } from './editor/drafts'
import { chordToKeyEventInit } from './editor/chord'
import { createDebouncedSaver } from './editor/saver'
import { copyDroppedFiles } from './vault/assets'
import { openVaultPath } from './vault/assetOpen'
import { EMPTY_TRAIL, appendTrail, canStep, stepTrail, trailPath, type Trail } from './history'
import { useVault } from './vault/useVault'
import { useIndex } from './vault/useIndex'
import { canOpenFolders } from './vault/fs'
import {
  assetName,
  kindOf,
  localDayString,
  orderPages,
  pageAssets,
  resolveReferencePath,
  stem,
  type IndexPage,
} from './vault/index'
import { candidateNames, suggestPages, type Suggestion } from './vault/suggest'
import type { SearchResult } from './search/core'

const SAVE_DELAY_MS = 1000

/** One shared empty assets list for the no-graph state (add-asset-navigation):
 *  the sidebar is memoized, so a fresh [] on every render would defeat the memo
 *  while the index builds. */
const EMPTY_ASSETS: string[] = []

function App() {
  const { status, folders, activeId, addFolder, activate, closeFolder, goHome } = useVault()
  // Browser capability (warn-unsupported-browser): probed once per render and
  // spent twice — the rail's add control exists only where the picker does,
  // and the brand screen states the requirement where it does not.
  const canOpen = canOpenFolders()
  const activeFolder = folders.find((f) => f.id === activeId)
  const { graph, savePage, pins, togglePin } = useIndex(activeFolder?.storage)
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
  const [mode, setMode] = useState<'page' | 'results'>('page')
  // Mirror of the latest landed search run (search-results-view): SearchBox
  // owns the Fuse and the debounce, and reports the uncapped result set up;
  // this feeds the results pane and stays current for the see-all handoff.
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  // Last content shown for the open path: if the file vanished in a
  // refresh, keep showing it instead of yanking the page (design D6).
  const lastKnown = useRef<IndexPage | null>(null)

  const resetSearch = useCallback(() => {
    setSearchQuery('')
    setSearchResults([])
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

  // Stable identity so the memoized Sidebar can skip re-rendering on every
  // keystroke (add-page-history, design D8). The memo only bails while this
  // keeps its identity, so it must depend on exactly what it reads: the index
  // (which changes on save/refresh) and the draft store (session state) - and
  // never on the open page, which it does not read.
  const handleSelect = useCallback(
    (path: string) => {
      // Opening anything leaves the results view (search-results-view); the
      // query stays in the header so the see-all row returns to it later.
      setMode('page')
      lastKnown.current = null
      setActivePath(path)
      // Baseline the draft against the index's content for this page. An
      // existing draft (unsaved edits from earlier in the session) wins.
      drafts.open(path, graph?.pages.get(path)?.content ?? '')
      setDraftVersion((v) => v + 1)
    },
    [graph, drafts],
  )

  // Back and Forward move the cursor and open the page it then marks; they
  // never add an entry (add-history-navigation, D2). Both are stable across
  // keystrokes - they depend on the trail and the select handler, and neither
  // changes while typing - which keeps the memoized Sidebar memoized.
  const handleBack = useCallback(() => {
    const next = stepTrail(trail, -1)
    if (next === trail) return
    stepped.current = true
    setTrail(next)
    handleSelect(trailPath(next) as string)
  }, [trail, handleSelect])

  const handleForward = useCallback(() => {
    const next = stepTrail(trail, 1)
    if (next === trail) return
    stepped.current = true
    setTrail(next)
    handleSelect(trailPath(next) as string)
  }, [trail, handleSelect])

  // Today (move-today-into-nav-controls): the current day's journal is just
  // another page to open, so it goes through handleSelect and inherits the
  // trail recording, the draft baseline, and the blank-page-on-first-save
  // rule. The day is read at activation, not at mount, so a session left open
  // across midnight goes to the new day. The grid's re-anchor is the sidebar's
  // own concern: it owns both the control and the calendar (design D3).
  const handleToday = useCallback(() => {
    handleSelect(`journals/${localDayString(new Date())}.md`)
  }, [handleSelect])

  // Opening a reference badge (add-reference-badges): resolve the name through
  // the shared resolver (date-references-resolve-to-journals) — a date names
  // the journal day, every other name the existing page, else a blank page
  // under `pages/` that materializes on first save — skip a link back to the
  // open page, and route through handleSelect. Resolution stays here, never in
  // the editor (ADR-0010).
  const handleOpenReference = (target: string) => {
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
      const store = activeFolder?.storage
      if (!store) return
      void openVaultPath(path, (assetPath) => store.readBinary(assetPath))
    },
    [activeFolder],
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
        ? (graph.backlinks.get(page.title.toLowerCase()) ?? []).map((path) => {
            const p = graph.pages.get(path)
            return { title: p ? p.title : path, path, materialized: true }
          })
        : [],
    [graph, page],
  )
  const forwardlinkRows = useMemo<LinkRow[]>(
    () =>
      graph && page
        ? page.links
            .map((l) => {
              const targetPath = resolveReferencePath(l.target, graph.byName)
              const p = graph.pages.get(targetPath)
              if (p) return { title: p.title, path: targetPath, materialized: true }
              // No page matches the reference: it is unmaterialized. A name
              // that is not a date materializes under `pages/`, preserving any
              // directory part in bracketed names; a date name is the journal
              // day, which materializes under `journals/`.
              return { title: l.target, path: targetPath, materialized: false }
            })
            .filter(
              // A page's link to itself isn't useful navigation (mirrors the
              // index's backlink self-exclusion).
              (r) => r.path !== page.path,
            )
        : [],
    [graph, page],
  )
  // The page's files (vault-assets, design D1), labelled with the file's name
  // and kept out of Forwardlinks so each panel section holds one kind of row.
  // Whether one exists is read from the vault's own listing, so a file deleted
  // outside the app drops out on the next scan even though this page's record
  // is carried over untouched. Same [graph, page] deps as the rows above: a
  // keystroke re-renders but re-derives neither.
  const referenceRows = useMemo<LinkRow[]>(
    () =>
      graph && page
        ? pageAssets(page, graph).map((path) => ({
            title: assetName(path),
            path,
            materialized: true,
          }))
        : [],
    [graph, page],
  )

  // The vault's assets, path-ordered (vault-assets): App hands the index's own
  // array through, so the memoized sidebar sees a new one only on a scan.
  const assets = graph ? graph.assets : EMPTY_ASSETS

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

  // Whether either control has anywhere to step (add-history-navigation).
  const canBack = canStep(trail, -1)
  const canForward = canStep(trail, 1)

  // Loading state (indexing-loading-state): while an active folder with
  // storage is building its index, the graph is null — the panes show
  // placeholders instead of empty content. No active folder (brand empty
  // state) and pending-permission folders (no storage) stay outside it.
  const indexing = graph === null && activeFolder?.storage !== undefined

  // Search corpus: pages with content from the live graph, memoized on graph
  // identity so the Fuse inside SearchBox rebuilds on save/refresh (search-
  // notes, design: Fuse lifecycle).
  const searchDocs = useMemo(() => (graph ? [...graph.pages.values()] : []), [graph])

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

  return (
    <div className="app-shell">
      <Header
        // The brand returns home (close-folders): no active folder, folders
        // stay on the rail. The activeFolder?.id effect resets the page.
        onHome={() => void goHome()}
        search={
          // Keyed on the folder so a folder switch remounts the search and
          // resets its query (search-notes: folder-switch reset). Disabled
          // without a vault (no-inert-UI rule).
          <SearchBox
            key={activeFolder?.id ?? 'none'}
            docs={searchDocs}
            disabled={graph === null}
            onSelect={handleSelect}
            onQueryResult={handleQueryResult}
            onSeeAll={handleOpenResults}
          />
        }
      />
      <div className="workspace">
        <FolderRail
          status={status}
          folders={folders}
          activeId={activeId}
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
        />
        <Sidebar
          pages={pages}
          journalEntries={journalEntries}
          assets={assets}
          activePath={activePath}
          onSelect={handleSelect}
          onOpenAsset={handleOpenAsset}
          pinnedPaths={pins}
          hasVault={graph !== null}
          loading={indexing}
          canBack={canBack}
          canForward={canForward}
          onBack={handleBack}
          onForward={handleForward}
          onToday={handleToday}
        />
        {mode === 'results' ? (
          <SearchResultsView
            // Keyed on the query: editing the query while the view is open
            // remounts it, resetting page and active row to the new set.
            key={searchQuery}
            query={searchQuery}
            results={searchResults}
            onOpen={handleSelect}
            onClose={() => setMode('page')}
          />
        ) : (
          <EditorPane
            // Keyed by path: each page gets a fresh editor seeded with its
            // draft-or-index content; switching pages remounts it.
            key={page?.path}
            ref={editorRef}
            page={page}
            initialContent={initialContent}
            onChange={handleEdit}
            onOpenReference={handleOpenReference}
            suggest={suggest}
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
            loading={indexing}
          />
        )}
        <MetaPanel
          // The meta panel is page metadata: empty while the results view
          // is open (search-results-view design D7). Both `page` reads below
          // derive from the last-known ref (the same quirk the StatusBar props
          // suppress).
          /* oxlint-disable react/refs */
          pageOpen={mode === 'page' && page !== null}
          backlinks={mode === 'page' ? backlinkRows : []}
          forwardlinks={mode === 'page' ? forwardlinkRows : []}
          references={mode === 'page' ? referenceRows : []}
          activePath={mode === 'page' ? activePath : null}
          onSelect={handleSelect}
          onOpenAsset={handleOpenAsset}
          loading={indexing}
          shortcuts={<ShortcutsList onApply={applyShortcut} canApply={canApply} />}
          /* oxlint-enable react/refs */
        />
      </div>
      <StatusBar
        pagePath={page?.path ?? null}
        saveState={saveState}
        newPage={newPage}
        indexing={indexing}
        // The active vault's name and live index-based file count; falls
        // back to the open-time snapshot while the index builds (design D6).
        vaultName={activeFolder?.storage ? activeFolder.name : undefined}
        fileCount={graph ? graph.pages.size : activeFolder?.fileCount}
        // Pin toggle (add-pinned-pages): enabled only for a file-backed
        // page — not a journal day, an unmaterialized page, or the results
        // view. `page` derives from the lastKnown ref (existing react/refs
        // quirk, suppressed as on the MetaPanel props below).
        /* oxlint-disable-next-line react/refs */
        pinned={page !== null && pins.includes(page.path)}
        /* oxlint-disable react/refs */
        canPin={
          mode === 'page' &&
          page !== null &&
          page.kind === 'page' &&
          (graph?.pages.has(page.path) ?? false)
        }
        /* oxlint-enable react/refs */
        onTogglePin={() => {
          if (page !== null) void togglePin(page.path)
        }}
      />
    </div>
  )
}

export default App
