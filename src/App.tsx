import { useEffect, useRef, useState } from 'react'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { EditorPane } from './components/EditorPane'
import { MetaPanel } from './components/MetaPanel'
import { FolderRail } from './components/FolderRail'
import { useVault } from './vault/useVault'
import { useIndex } from './vault/useIndex'
import type { IndexPage } from './vault/index'

function App() {
  const { status, folders, activeId, addFolder, activate } = useVault()
  const activeFolder = folders.find((f) => f.id === activeId)
  const { graph } = useIndex(activeFolder?.storage)
  const [activePath, setActivePath] = useState<string | null>(null)
  // Last content shown for the open path: if the file vanished in a
  // refresh, keep showing it instead of yanking the page (design D6).
  const lastKnown = useRef<IndexPage | null>(null)

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
          page={displayed}
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