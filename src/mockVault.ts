import type { Page } from './page'

// Mock vault: disposable sample data for the static-navigation step.
// Only the app composition layer imports this; when the real index lands
// (plan task 6) this file is deleted and App imports the vault instead.
// Content is authored as portable Markdown so it can be lifted into real
// .md files later as the scan/index test fixture.

export type MockPage = Page

export const mockPages: MockPage[] = [
  {
    title: 'Welcome',
    kind: 'page',
    content:
      'This is Folio, a lightweight way to work with a folder of Markdown notes. The folder is your library; this app is just a window over it.\n\nOpen a note from the sidebar, or read the [[Inbox]] to see what arrived. Everything you write is saved as you write it.\n\n#notes #intro',
  },
  {
    title: 'Inbox',
    kind: 'page',
    content:
      'A place to drop thoughts before they find a home.\n\n- Review the [[Reading]] list\n- Draft a project page for [[Folio]]\n\n#inbox #capture',
  },
  {
    title: 'Ideas',
    kind: 'page',
    content:
      'Half-formed thoughts worth keeping.\n\n- [[Folio]] could show daily notes in a calendar\n- Backlinks make old notes resurface naturally\n- A #tag is just a link to a page\n\n#ideas',
  },
  {
    title: 'Folio',
    kind: 'page',
    content:
      'Notes on building Folio itself.\n\nDesign principles live in the #architecture notes. The whole vault is a folder of Markdown files - no backend, no database.\n\nSee [[Ideas]] for what might come next, and [[Welcome]] to start again.',
  },
  {
    title: 'Reading',
    kind: 'page',
    content:
      'A running list of things to read.\n\n- Essays on plain text and durable notes\n- Local-first software, why it matters\n\n#reading',
  },
]

export const mockJournal: MockPage[] = [
  {
    title: '2026-09-02',
    kind: 'journal',
    content: 'Started a fresh vault. First note: [[Welcome]].',
  },
  {
    title: '2026-09-03',
    kind: 'journal',
    content: 'Sketching how backlinks should behave. Added to [[Ideas]].',
  },
  {
    title: '2026-09-04',
    kind: 'journal',
    content: 'Built the shell. Next: make it navigable. Tagged #architecture.',
  },
]