import { useEffect, useRef, useState } from 'react'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { EditorPane } from './components/EditorPane'
import { MetaPanel } from './components/MetaPanel'
import { FolderRail } from './components/FolderRail'
import { DraftStore } from './editor/drafts'
import { createDebouncedSaver } from './editor/saver'
import { useVault } from './vault/useVault'
import { useIndex } from './vault/useIndex'
import type { IndexPage } from './vault/index'

const SAVE_DELAY_MS = 1000

function App() {
  const { status, folders, activeId, addFolder, activate } = useVault()
  const activeFolder = folders.find((f) => f.id === activeId)
  const { graph, savePage } = useIndex(activeFolder?.storage)
  const [activePath, setActivePath] = useState<string | null>(null)
  // Last content shown for the open path: if the file vanished in a
  // refresh, keep showing it instead of yanking the page (design D6).
  const lastKnown = useRef<IndexPage | null>(null)

  // Per-page drafts (design C1): session-scoped edit state; mutations bump
  // a render version so the editor's initial content and the indicator
  // update. useState holds the store so render reads need no ref.
  const [drafts] = useState(() => new DraftStore())
  const [, setDraftVersion] = useState(0)
  const saverRef = useRef<ReturnType<typeof createDebouncedSaver> | null>(null)

  const handleActivate = (id: string) => {
    if (id !== activeId) {
      // Switching folders resets the open page (F5); re-granting the already
      // active folder is not a switch, so it keeps the page.
      setActivePath(null)
      lastKnown.current = null
    }
    void activate(id)
  }

  const handleSelect = (path: string) => {
    lastKnown.current = null
    setActivePath(path)
    // Baseline the draft against the index's content for this page. An
    // existing draft (unsaved edits from earlier in the session) wins.
    drafts.open(path, graph?.pages.get(path)?.content ?? '')
    setDraftVersion((v) => v + 1)
  }

  // The page to show: fresh from the active graph, else the last-known
  // content for that path, else nothing. The ref read is the
  // usePrevious-style fallback: it only matters on renders already caused
  // by a graph/selection change, so it never needs to trigger one itself.
  // oxlint-disable-next-line react/refs
  const displayed = activePath === null ? null : (graph?.pages.get(activePath) ?? lastKnown.current ?? null)

  // Remember what we rendered so the vanish case can fall back to it.
  useEffect(() => {
    if (displayed) lastKnown.current = displayed
  }, [displayed])

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
  // wins) and the indicator (dirty/saving/failed, else clean).
  const page = displayed
  const openDraft = activePath === null ? undefined : drafts.get(activePath)
  const initialContent = openDraft?.content ?? page?.content ?? ''
  const saveState = openDraft?.status ?? 'clean'

  const pages = graph ? [...graph.pages.values()].filter((p) => p.kind === 'page') : []
  const journalEntries = graph
    ? [...graph.pages.values()].filter((p) => p.kind === 'journal')
    : []

  return (
    <div className="app-shell">
      <Header
        vaultName={activeFolder?.storage ? activeFolder.name : undefined}
        // The active folder's count goes live from the index once built;
        // otherwise fall back to the open-time snapshot (design D6).
        fileCount={graph ? graph.pages.size : activeFolder?.fileCount}
      />
      <div className="workspace">
        <FolderRail
          status={status}
          folders={folders}
          activeId={activeId}
          onAdd={() => {
            setActivePath(null)
            lastKnown.current = null
            void addFolder()
          }}
          onActivate={handleActivate}
        />
        <Sidebar
          pages={pages}
          journalEntries={journalEntries}
          activePath={activePath}
          onSelect={handleSelect}
        />
        <EditorPane
          // Keyed by path: each page gets a fresh editor seeded with its
          // draft-or-index content; switching pages remounts it.
          key={page?.path}
          page={page}
          initialContent={initialContent}
          onChange={handleEdit}
          saveState={saveState}
          // While restoring, avoid a one-frame "open a folder" flash; once
          // settled, only an actually usable folder keeps the notes hint.
          emptyHint={status === 'restoring' || activeFolder?.storage ? 'notes' : 'open-folder'}
        />
        <MetaPanel />
      </div>
    </div>
  )
}

export default App