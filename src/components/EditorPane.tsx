import { useEffect, useRef } from 'react'
import { FolioMark } from '../FolioMark'
import type { DraftStatus } from '../editor/drafts'
import { MilkdownAdapter } from '../editor/milkdown'
import type { Page } from '../page'
import { SaveIndicator } from './SaveIndicator'
import styles from './EditorPane.module.css'

// The editor surface for an open page (design D1/D2). The pane owns the DOM
// element and the lifecycle; the MilkdownAdapter owns the editor. App keys
// this component by page path, so each page gets a fresh editor seeded with
// its initial content (draft-or-index), and switching pages remounts rather
// than mutating a live ProseMirror doc.

export function EditorPane({
  page,
  initialContent,
  onChange,
  saveState = 'clean',
  emptyHint = 'notes',
}: {
  page: Page | null
  initialContent: string
  onChange: (markdown: string) => void
  saveState?: DraftStatus
  emptyHint?: 'notes' | 'open-folder'
}) {
  const paneRef = useRef<HTMLElement>(null)
  const mountRef = useRef<HTMLDivElement>(null)
  const latestProps = useRef({ onChange, initialContent })
  // Keep the mount-captured props fresh without re-running the mount effect:
  // writing a ref in an effect (not during render) is lint-clean.
  useEffect(() => {
    latestProps.current = { onChange, initialContent }
  })

  // Reset scroll only when the open page actually changes (`path` is the
  // navigation identity, ADR-0013 — the page object reference changes on
  // every index rebuild, which would yank the pane to the top after a save).
  useEffect(() => {
    if (paneRef.current) paneRef.current.scrollTop = 0
  }, [page?.path])

  // Mount the editor once per page instance (App keys by page path, so the
  // props captured here are this page's). Content is applied after the
  // editor exists (mount -> setContent). The cleanup tears it down, so a
  // remount (page switch or React StrictMode) starts clean.
  useEffect(() => {
    const el = mountRef.current
    if (!el) return
    const { onChange, initialContent } = latestProps.current
    let cancelled = false
    const adapter = new MilkdownAdapter()
    adapter.onChange((markdown) => onChange(markdown))
    void adapter
      .mount(el)
      .then(() => {
        if (cancelled) return
        return adapter.setContent(initialContent)
      })
      .catch(() => {
        // Mount failure keeps the pane as-is (empty surface, no error UI).
      })
    return () => {
      cancelled = true
      void adapter.destroy()
    }
  }, [])

  if (page === null) {
    return (
      <main ref={paneRef} className={styles.pane}>
        <div className={styles.emptyState}>
          <FolioMark className={styles.mark} />
          <p className={styles.tagline}>
            {emptyHint === 'open-folder'
              ? 'Open a folder to begin.'
              : 'Your notes appear here.'}
          </p>
        </div>
      </main>
    )
  }

  return (
    <main ref={paneRef} className={styles.pane}>
      <article className={styles.document}>
        <div ref={mountRef} className={styles.editor} />
      </article>
      <SaveIndicator status={saveState} />
    </main>
  )
}