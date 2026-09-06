import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, DragEvent } from 'react'
import { FolioMark } from '../FolioMark'
import type { DraftStatus } from '../editor/drafts'
import type { EditorAdapter } from '../editor/editor'
import { MilkdownAdapter } from '../editor/milkdown'
import type { Page } from '../page'
import { SaveIndicator } from './SaveIndicator'
import { collectDropFiles, linkForAsset } from './dropAssets'
import styles from './EditorPane.module.css'

// The editor surface for an open page (design D1/D2). The pane owns the DOM
// element and the lifecycle; the MilkdownAdapter owns the editor. App keys
// this component by page path, so each page gets a fresh editor seeded with
// its initial content (draft-or-index), and switching pages remounts rather
// than mutating a live ProseMirror doc.

// The hint shown at the document start while a page has no content
// (journal-home, page-editing spec); it lives only in the pane, never in the
// document or the serialized markdown.
const PLACEHOLDER = 'Start typing…'

export function EditorPane({
  page,
  initialContent,
  onChange,
  saveState = 'clean',
  emptyHint = 'notes',
  newPage = false,
  onDropFiles,
}: {
  page: Page | null
  initialContent: string
  onChange: (markdown: string) => void
  saveState?: DraftStatus
  emptyHint?: 'notes' | 'open-folder'
  /** The open page has no file yet; its first save creates it (links-pane). */
  newPage?: boolean
  /** Copy dropped files into the vault and resolve with the landed asset paths. */
  onDropFiles?: (files: File[]) => Promise<string[]>
}) {
  const paneRef = useRef<HTMLElement>(null)
  const mountRef = useRef<HTMLDivElement>(null)
  const adapterRef = useRef<EditorAdapter | null>(null)
  const latestProps = useRef({ onChange, initialContent })
  // Keep the mount-captured props fresh without re-running the mount effect:
  // writing a ref in an effect (not during render) is lint-clean.
  useEffect(() => {
    latestProps.current = { onChange, initialContent }
  })

  // Empty-page placeholder (journal-home): seeded from the mount content and
  // kept current on every edit, so an empty page invites typing and emptying
  // a page brings the hint back (data-empty gates the CSS ::before).
  const [isEmpty, setIsEmpty] = useState(initialContent.trim() === '')

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
    adapterRef.current = adapter
    // Placeholder bookkeeping rides the same edit stream that reaches App:
    // markdown empty ⇒ the doc is empty ⇒ show the hint.
    adapter.onChange((markdown) => {
      setIsEmpty(markdown.trim() === '')
      onChange(markdown)
    })
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
      adapterRef.current = null
      void adapter.destroy()
    }
  }, [])

  // Drop hygiene (D5): preventDefault on both pane states so the browser never
  // navigates to the dropped file; the copy happens only with a page open.
  const handleDragover = (e: DragEvent<HTMLElement>): void => {
    e.preventDefault()
  }
  const handleDrop = (e: DragEvent<HTMLElement>): void => {
    e.preventDefault()
    if (page === null || !onDropFiles) return
    const files = collectDropFiles(e.dataTransfer)
    if (files.length === 0) return
    void onDropFiles(files).then((paths) => {
      for (const path of paths) {
        adapterRef.current?.insertMarkdown(linkForAsset(path))
      }
    })
  }

  if (page === null) {
    return (
      <main ref={paneRef} onDragOver={handleDragover} onDrop={handleDrop} className={styles.pane}>
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
    <main ref={paneRef} onDragOver={handleDragover} onDrop={handleDrop} className={styles.pane}>
      <article className={styles.document}>
        <div
          ref={mountRef}
          className={styles.editor}
          // Empty pages get an inline hint (journal-home): the CSS ::before on
          // the empty paragraph reads it through the inheriting
          // --placeholder variable. Plain attr() would look on the <p> itself,
          // which Milkdown owns — it never reads ancestor attributes.
          data-empty={isEmpty || undefined}
          style={{ '--placeholder': `'${PLACEHOLDER}'` } as CSSProperties}
        />
      </article>
      <SaveIndicator status={saveState} newPage={newPage} />
    </main>
  )
}