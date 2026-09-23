import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import type {
  CSSProperties,
  ClipboardEvent,
  DragEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
  Ref,
} from 'react'
import { FolioMark } from '../FolioMark'
import type { EditorAdapter, FoldTarget } from '../editor/editor'
import { MilkdownAdapter } from '../editor/milkdown'
import type { Page } from '../page'
import type { ReferenceKind } from '../vault/parse'
import type { Suggestion } from '../vault/suggest'
import { collectFiles, withPastedName } from './dropAssets'
import { dragRefText, hasDragRef, readDragRef } from './dragRefs'
import { linkForAsset } from '../vault/link'
import { FOLD_ARROW_CLASS, updateGutterDom } from '../editor/gutter'
import {
  createAssetImages,
  releaseAssetImages,
  syncAssetImages,
  type AssetImages,
} from '../editor/assetImages'
import { noVaultReader } from '../vault/assetOpen'
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

// The brand screen's copy when the browser cannot open a local folder at all
// (warn-unsupported-browser): the picker is Chromium-only, so the screen names
// the requirement and the browsers that meet it rather than telling the user to
// open a folder they have no way to open.
const BROWSER_REQUIREMENT =
  'Folio needs a Chromium-based browser to open a local folder. Use Chrome, Edge, or Brave.'

// The brand screen's line, by hint variant.
const EMPTY_HINTS: Record<'notes' | 'open-folder' | 'browser-unsupported', string> = {
  notes: 'Your notes appear here.',
  'open-folder': 'Open a folder to begin.',
  'browser-unsupported': BROWSER_REQUIREMENT,
}

// Line-number gutter (line-numbers change, design D3): the single shared
// anchor rule (src/lineAnchors.ts) provides one canonical start line per
// top-level block; this module binds those lines to the block DOM. Numbers
// are dimmed 12px markers in the document's left margin, inert to input, and
// recentered on every edit / reflow.

// Keyboard-shortcuts reference (apply-shortcuts-on-click): the app applies a
// chord by asking the editor to replay it, and this is the whole surface it
// reaches through — one method, so App never depends on the editor's contract.
export type EditorPaneHandle = {
  /** Apply a keyboard chord to the editor, as pressing it would. */
  applyChord: (chord: string) => boolean
}

export function EditorPane({
  page,
  initialContent,
  onChange,
  emptyHint = 'notes',
  brandAction,
  loading = false,
  onAttachFiles,
  onOpenReference,
  onBoardLink,
  readAsset,
  suggest,
  suggestBoards,
  suggestFiles,
  ref,
}: {
  page: Page | null
  initialContent: string
  onChange: (markdown: string) => void
  /** Which copy the brand screen shows when no page is open: the notes hint,
   *  the open-a-folder instruction, or — where the browser has no local-folder
   *  picker — the browser requirement instead of an instruction that cannot be
   *  followed (warn-unsupported-browser). */
  emptyHint?: 'notes' | 'open-folder' | 'browser-unsupported'
  /** Optional control rendered under the tagline on the brand screen
   *  (add-logseq-import): the Import from Logseq action. Presentational only —
   *  the pane owns no import state. */
  brandAction?: ReactNode
  /** The active folder's index is building (indexing-loading-state). */
  loading?: boolean
  /** Copy files into the vault and resolve with the landed asset paths; fed by
   *  both the drop and the paste gesture. */
  onAttachFiles?: (files: File[]) => Promise<string[]>
  /** Read a vault file's bytes, so a vault image reference can render
   *  (render-vault-images). Absent without a vault: references then render as
   *  they did before, and no read is attempted. */
  readAsset?: (path: string) => Promise<Blob>
  /** Open the page a reference badge points at (add-reference-badges), or the
   *  board a board badge points at (add-whiteboards). `kind` says which. */
  onOpenReference?: (target: string, kind: ReferenceKind) => void
  /** Open the board a link to a `.excalidraw` path points at (add-whiteboards:
   *  the extension decides the view). */
  onBoardLink?: (path: string) => void
  /** Completion candidates for the reference being typed
   *  (add-reference-autocomplete); the app answers by page name. */
  suggest?: (query: string) => Suggestion[]
  /** Completion candidates for a `#!` board reference being typed
   *  (add-whiteboards); the app answers by board name. */
  suggestBoards?: (query: string) => Suggestion[]
  /** Completion candidates for a link destination being typed
   *  (add-asset-references); the app answers with the vault's files, narrowed
   *  to images when an image's destination is being written. */
  suggestFiles?: (query: string, onlyImages: boolean) => Suggestion[]
  /** The app's handle on the editor (apply-shortcuts-on-click). */
  ref?: Ref<EditorPaneHandle>
}) {
  const paneRef = useRef<HTMLElement>(null)
  const mountRef = useRef<HTMLDivElement>(null)
  const gutterRef = useRef<HTMLDivElement>(null)
  const adapterRef = useRef<EditorAdapter | null>(null)
  // Vault image URLs for this page (render-vault-images): created when this
  // pane's editor mounts, revoked when it is torn down. A ref, because the pass
  // runs from the adapter's change listener rather than from render — and one
  // allocation per mount, not per render.
  const assetsRef = useRef<AssetImages | null>(null)
  // The reader is captured once per mount but must read through the live prop:
  // a folder switch changes the vault behind it.
  const readAssetRef = useRef(readAsset)
  useEffect(() => {
    readAssetRef.current = readAsset
  })

  // Read at call time, so a page switch (which remounts this pane) simply swaps
  // the adapter the handle forwards to.
  useImperativeHandle(
    ref,
    () => ({
      applyChord: (chord: string) => adapterRef.current?.applyChord(chord) ?? false,
    }),
    [],
  )

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
  // The rail's fold controls, kept in a ref so the delegated click can map a
  // control's index back to the item it toggles without re-reading the editor
  // (move-list-folds-to-the-left-rail).
  const foldTargetsRef = useRef<FoldTarget[]>([])
  const updateGutter = () => {
    const host = gutterRef.current
    const el = mountRef.current
    const adapter = adapterRef.current
    if (!host || !el || !adapter) return
    const folds = adapter.getFoldTargets()
    foldTargetsRef.current = folds
    updateGutterDom(
      host,
      [...el.querySelectorAll('.ProseMirror > *')],
      adapter.getBlockLines(),
      styles.gutterNum,
      folds,
    )
  }

  // A press on a fold control must not move the caret out of the document; the
  // click then toggles the item through the adapter, which re-measures the rail.
  const onRailMouseDown = (event: ReactMouseEvent) => {
    if (event.target instanceof Element && event.target.closest(`.${FOLD_ARROW_CLASS}`)) {
      event.preventDefault()
    }
  }
  const onRailClick = (event: ReactMouseEvent) => {
    if (!(event.target instanceof Element)) return
    const arrow = event.target.closest(`.${FOLD_ARROW_CLASS}`)
    if (!(arrow instanceof HTMLElement)) return
    event.preventDefault()
    const target = foldTargetsRef.current[Number(arrow.dataset.foldIndex)]
    if (target) adapterRef.current?.toggleFold(target.element)
  }

  // Vault images (render-vault-images): the document's image references point
  // at vault paths the browser cannot fetch, so the rendered element is pointed
  // at the file's bytes instead. Driven where the gutter is driven — a document
  // change and the seed — and a no-op without a vault reader. Resolved paths
  // cost one lookup, so a keystroke reads nothing (design D3).
  const updateImages = () => {
    const el = mountRef.current
    const read = readAssetRef.current
    const assets = assetsRef.current
    if (!el || !read || !assets) return
    syncAssetImages(el, assets, read)
  }

  // Reference activation reads through a ref: the mount effect runs once, but
  // App's handler is recreated as the graph changes (every save), and a badge
  // click must resolve against the live graph, not the mount-time one.
  const openReferenceRef = useRef(onOpenReference)
  const boardLinkRef = useRef(onBoardLink)
  const suggestBoardsRef = useRef(suggestBoards)
  useEffect(() => {
    openReferenceRef.current = onOpenReference
    boardLinkRef.current = onBoardLink
  })

  // Same reason for the completion sources: the app's pools are replaced on
  // every save, and the editor mounts once per page.
  const suggestRef = useRef(suggest)
  useEffect(() => {
    suggestRef.current = suggest
  })
  const suggestFilesRef = useRef(suggestFiles)
  useEffect(() => {
    suggestFilesRef.current = suggestFiles
  })
  useEffect(() => {
    suggestBoardsRef.current = suggestBoards
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
    const assets = createAssetImages()
    assetsRef.current = assets
    // Placeholder bookkeeping rides the same edit stream that reaches App:
    // markdown empty ⇒ the doc is empty ⇒ show the hint.
    adapter.onChange((markdown) => {
      setIsEmpty(markdown.trim() === '')
      onChange(markdown)
      updateGutter()
      updateImages()
    })
    // A fold moves the document's blocks without changing its text, so the
    // gutter is re-measured on the editor's layout notification
    // (add-collapsible-list-items), exactly as it is on a markdown change.
    adapter.onLayoutChange(() => updateGutter())
    adapter.onReferenceClick((target, kind) => openReferenceRef.current?.(target, kind))
    adapter.onBoardLink((path) => boardLinkRef.current?.(path))
    // Vault links (open-vault-assets): the bytes behind a link that points into
    // the vault, read at activation time through the live prop, exactly as the
    // image pass reads it. A pane with no reader leaves the adapter's own
    // reader in place, which answers nothing.
    adapter.setAssetReader((path) => readAssetRef.current?.(path) ?? noVaultReader(path))
    adapter.setSuggestionSource({
      pages: (query) => suggestRef.current?.(query) ?? [],
      boards: (query) => suggestBoardsRef.current?.(query) ?? [],
      files: (query, onlyImages) => suggestFilesRef.current?.(query, onlyImages) ?? [],
    })
    void adapter
      .mount(el)
      .then(() => {
        if (cancelled) return
        return adapter.setContent(initialContent).then(() => {
          updateGutter()
          updateImages()
        })
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
      // Release this page's image URLs with its editor (design D5).
      assetsRef.current = null
      releaseAssetImages(assets)
      void adapter.destroy()
    }
  }, [])
  /* oxlint-enable react/exhaustive-deps */

  // File and reference intake (D5): something is always prevented so the
  // browser never navigates to a dropped file; anything that lands happens only
  // with a page open.
  const handleDragover = (e: DragEvent<HTMLElement>): void => {
    e.preventDefault()
    // A row dragged from the sidebar is a copy, not a move: it writes text and
    // leaves the vault alone, and the cursor should say so
    // (drag-references-into-editor).
    if (hasDragRef(e.dataTransfer)) e.dataTransfer.dropEffect = 'copy'
  }

  // Everything a drop inserts lands at the point it was released, not at the
  // caret (ADR-0023). The point is captured here and resolved by the editor,
  // which falls back to the caret when the document cannot hold the payload
  // there — including after an async copy, where the point is resolved when the
  // link is written (ponytail: a scroll during a second-scale asset copy lands
  // the link where the pointer is then; anchor mapping if that ever bites).
  const dropPoint = (e: DragEvent<HTMLElement>) => ({ left: e.clientX, top: e.clientY })

  const handleDrop = (e: DragEvent<HTMLElement>): void => {
    e.preventDefault()
    if (page === null) return
    // A row dragged from the sidebar names something the vault already holds,
    // so there is nothing to copy: it is written straight into the page
    // (drag-references-into-editor, design D5).
    const ref = readDragRef(e.dataTransfer)
    if (ref) {
      adapterRef.current?.insertMarkdown(dragRefText(ref), dropPoint(e))
      return
    }
    if (!onAttachFiles) return
    const files = collectFiles(e.dataTransfer)
    if (files.length === 0) return
    const point = dropPoint(e)
    void onAttachFiles(files).then((paths) => {
      for (const path of paths) {
        adapterRef.current?.insertMarkdown(linkForAsset(path), point)
      }
    })
  }

  // Paste intake (attach-pasted-files): a clipboard carrying files and no text
  // is a screenshot or a copied file, and is attached exactly as a drop would
  // be. A clipboard with text belongs to the editor's markdown-aware paste,
  // whether or not files ride along, so this returns before touching it — a
  // decision made from the clipboard's content rather than from whether
  // ProseMirror already called preventDefault (design D2).
  const handlePaste = (e: ClipboardEvent<HTMLElement>): void => {
    if (page === null || !onAttachFiles) return
    if (e.clipboardData.getData('text/plain') !== '') return
    const files = collectFiles(e.clipboardData)
    if (files.length === 0) return
    e.preventDefault()
    void onAttachFiles(files.map(withPastedName)).then((paths) => {
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
            <p
              className={`${styles.tagline}${emptyHint === 'browser-unsupported' ? ` ${styles.notice}` : ''}`}
            >
              {EMPTY_HINTS[emptyHint]}
            </p>
            {brandAction}
          </div>
        )}
      </main>
    )
  }

  return (
    <main
      ref={paneRef}
      onDragOver={handleDragover}
      onDrop={handleDrop}
      onPaste={handlePaste}
      className={styles.pane}
    >
      <article className={styles.document}>
        {/* The left rail (line-numbers; move-list-folds-to-the-left-rail):
            line numbers plus the fold controls. The numbers stay inert and
            aria-hidden; the controls are the rail's only interactive part, so
            the rail itself is not hidden from assistive technology. */}
        <div
          ref={gutterRef}
          className={styles.gutter}
          onMouseDown={onRailMouseDown}
          onClick={onRailClick}
        />
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
