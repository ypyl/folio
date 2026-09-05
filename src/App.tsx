import { useState } from 'react'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { EditorPane } from './components/EditorPane'
import { MetaPanel } from './components/MetaPanel'
import { FolderRail } from './components/FolderRail'
import { mockPages, mockJournal, type MockPage } from './mockVault'
import { useVault } from './vault/useVault'

function App() {
  const [active, setActive] = useState<MockPage | null>(null)
  const { status, folders, activeId, addFolder, activate } = useVault()
  const activeFolder = folders.find((f) => f.id === activeId)

  // Switching folders resets the open page (F5); re-granting the already
  // active folder is not a switch, so it keeps the page.
  const handleActivate = (id: string) => {
    if (id !== activeId) setActive(null)
    void activate(id)
  }

  return (
    <div className="app-shell">
      <Header
        vaultName={activeFolder?.storage ? activeFolder.name : undefined}
        fileCount={activeFolder?.fileCount}
      />
      <div className="workspace">
        <FolderRail
          status={status}
          folders={folders}
          activeId={activeId}
          onAdd={() => {
            setActive(null)
            void addFolder()
          }}
          onActivate={handleActivate}
        />
        <Sidebar
          pages={mockPages}
          journalEntries={mockJournal}
          active={active}
          onSelect={setActive}
        />
        <EditorPane page={active} />
        <MetaPanel />
      </div>
    </div>
  )
}

export default App