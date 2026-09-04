import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { EditorPane } from './components/EditorPane'
import { MetaPanel } from './components/MetaPanel'

function App() {
  return (
    <div className="app-shell">
      <Header />
      <div className="workspace">
        <Sidebar />
        <EditorPane />
        <MetaPanel />
      </div>
    </div>
  )
}

export default App