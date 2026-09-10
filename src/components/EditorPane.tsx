import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, DragEvent } from 'react'
import { FolioMark } from '../FolioMark'
import type { EditorAdapter } from '../editor/editor'
import { MilkdownAdapter } from '../editor/milkdown'
import type { Page } from '../page'
import type { Suggestion } from '../vault/suggest'
import { collectDropFiles, linkForAsset } from './dropAssets'
import { updateGutterDom } from '../editor/gutter'
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

// Line-number gutter (line-numbers change, design D3): the single shared
// anchor rule (src/lineAnchors.ts) provides one canonical start line per
// top-level block; this module binds those lines to the block DOM. Numbers
// are dimmed 12px markers in the document's left margin, inert to input, and
// recentered on every edit / reflow.

export function EditorPane({
  page,
  initialContent,
  onChange,
  emptyHint = 'notes',
  loading = false,
  onDropFiles,
  onOpenReference,
  suggest,
}: {
  page: Page | null
  initialContent: string
  onChange: (markdown: string) => void
  emptyHint?: 'notes' | 'open-folder'
  /** The active folder's index is building (indexing-loading-state). */
  loading?: boolean
  /** Copy dropped files into the vault and resolve with the landed asset paths. */
  onDropFiles?: (files: File[]) => Promise<string[]>
  /** Open the page a reference badge points at (add-reference-badges). */
  onOpenReference?: (target: string) => void
  /** Completion candidates for the reference being typed
   *  (add-reference-autocomplete); the app answers by page name. */
  suggest?: (query: string) => Suggestion[]
}) {
  const paneRef = useRef<HTMLElement>(null)
  const mountRef = useRef<HTMLDivElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)
  const adapterRef = useRef<EditorAdapter | null>(null)

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

  // Gutter (line-numbers, design D3): one dimmed number per top-level block at
  // its canonical start line (adapter.getBlockLines), centred on the block's
  // first text line. The placement lives in editor/gutter.ts, which measures
  // every block before writing any number so an update costs one layout instead
  // of one per block (bound-editor-per-keystroke-work, design D2).
  const updateGutter = () => {
    const host = gutterRef.current
    const el = mountRef.current
    const adapter = adapterRef.current
    if (!host || !el || !adapter) return
    updateGutterDom(
      host,
      [...el.querySelectorAll('.ProseMirror > *')],
      adapter.getBlockLines(),
      styles.gutterNum,
    )
  }

  // Reference activation reads through a ref: the mount effect runs once, but
  // App's handler is recreated as the graph changes (every save), and a badge
  // click must resolve against the live graph, not the mount-time one.
  const openReferenceRef = useRef(onOpenReference)
  useEffect(() => {
    openReferenceRef.current = onOpenReference
  })

  // Same reason for the completion source: the app's pool is replaced on every
  // save, and the editor mounts once per page.
  const suggestRef = useRef(suggest)
  useEffect(() => {
    suggestRef.current = suggest
  })

  // Mount the editor once per page instance (App keys by page path, so the
  // props captured here are this page's for the editor's whole life). Content
  // is applied after the editor exists (mount -> setContent). The cleanup
  // tears it down, so a remount (page switch or React StrictMode) starts
  // clean. Re-running on `onChange`'s per-render identity would remount the
  // editor mid-edit, and its behavior keys off the stable page path anyway,
  // so the dep list below is deliberately empty.
  /* oxlint-disable react/exhaustive-deps */
  useEffect(() => {
    const el = mountRef.current
    if (!el) return
    let cancelled = false
    const adapter = new MilkdownAdapter()
    adapterRef.current = adapter
    // Placeholder bookkeeping rides the same edit stream that reaches App:
    // markdown empty ⇒ the doc is empty ⇒ show the hint.
    adapter.onChange((markdown) => {
      setIsEmpty(markdown.trim() === '')
      onChange(markdown)
      updateGutter()
    })
    adapter.onReferenceClick((target) => openReferenceRef.current?.(target))
    adapter.setSuggestionSource((query) => suggestRef.current?.(query) ?? [])
    void adapter
      .mount(el)
      .then(() => {
        if (cancelled) return
        return adapter.setContent(initialContent).then(() => updateGutter())
      })
      .catch(() => {
        // Mount failure keeps the pane as-is (empty surface, no error UI).
      })

    // Reflow: window resizes and font loads change block heights, so the
    // numbers must re-glue to their blocks. jsdom has no ResizeObserver; the
    // effect guards so tests run without one (the doc-change path above is
    // what tests drive).
    let observer: ResizeObserver | null = null
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => updateGutter())
      observer.observe(el)
    }
    return () => {
      cancelled = true
      observer?.disconnect()
      adapterRef.current = null
      void adapter.destroy()
    }
  }, [])
  /* oxlint-enable react/exhaustive-deps */

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
        {loading ? (
          // Loading state (indexing-loading-state): decorative body-line
          // placeholders in place of the empty hint. The in-progress
          // "Indexing notes…" status is announced in the status bar, not here
          // (add-status-bar); the blocks themselves stay aria-hidden.
          <div className={styles.loadingState}>
            <div className={styles.skeletonDoc} aria-hidden="true">
              <span className={`skeleton ${styles.headingLine}`} />
              <span className={`skeleton ${styles.bodyLine}`} />
              <span className={`skeleton ${styles.bodyLine}`} />
              <span className={`skeleton ${styles.bodyLineShort}`} />
              <span className={`skeleton ${styles.bodyLine}`} />
              <span className={`skeleton ${styles.bodyLineShort}`} />
            </div>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <FolioMark className={styles.mark} />
            <p className={styles.tagline}>
              {emptyHint === 'open-folder' ? 'Open a folder to begin.' : 'Your notes appear here.'}
            </p>
          </div>
        )}
      </main>
    )
  }

  return (
    <main ref={paneRef} onDragOver={handleDragover} onDrop={handleDrop} className={styles.pane}>
      <article className={styles.document}>
        {/* Line numbers (line-numbers): presentational only — aria-hidden and
            pointer-events: none, so the document owns every interaction. */}
        <div ref={gutterRef} className={styles.gutter} aria-hidden="true" />
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
    </main>
  )
}
