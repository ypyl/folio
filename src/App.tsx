import { useState } from 'react'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { EditorPane } from './components/EditorPane'
import { MetaPanel } from './components/MetaPanel'
import { mockPages, mockJournal, type MockPage } from './mockVault'

function App() {
  const [active, setActive] = useState<MockPage | null>(null)

  return (
    <div className="app-shell">
      <Header />
      <div className="workspace">
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