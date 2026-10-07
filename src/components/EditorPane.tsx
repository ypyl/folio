import { useEffect, useImperativeHandle, useRef, useState } from 'react'
import type { CSSProperties, ClipboardEvent, DragEvent, ReactNode, Ref } from 'react'
import { FolioMark } from '../FolioMark'
import type { EditorAdapter, StaticBlock } from '../editor/editor'
import { CodeMirrorAdapter } from '../editor/codemirror'
import type { Page } from '../page'
import type { ReferenceKind } from '../vault/parse'
import type { Suggestion } from '../vault/suggest'
import { collectFiles, withPastedName } from './dropAssets'
import { dragRefText, hasDragRef, readDragRef } from './dragRefs'
import { linkForAsset } from '../vault/link'
import {
  createAssetImages,
  releaseAssetImages,
  syncAssetImages,
  type AssetImages,
} from '../editor/assetImages'
import { noVaultReader } from '../vault/assetOpen'
import styles from './EditorPane.module.css'

// The editor surface for an open page (design D1/D2). The pane owns the DOM
// element and the lifecycle; the adapter behind `EditorAdapter` owns the editor
// (ADR-0010). App keys this component by page path, so each page gets a fresh
// editor seeded with its initial content (draft-or-index), and switching pages
// remounts rather than mutating a live document.

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

// The brand screen's introduction (add-landing-page-info): what Folio is and
// what it does, shown under the tagline once the no-folder state has settled.
// The facts mirror the tour's editor step and ADR-0024's board form, so the two
// do not drift.
const BRAND_DESCRIPTION =
  'Folio is a local-first notes app. Your Markdown folder is the database: open it in the browser and your notes stay on your machine.'
const BRAND_FACTS =
  'Pages and journals are plain Markdown. Link a page with #word or #[[Page]], and a whiteboard with #!board.'

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
  /** The open document's top-level blocks for a presentation
   *  (add-presentations); reading them changes nothing. */
  staticBlocks: () => StaticBlock[]
  /** Take focus back into the caret's surface (add-compact-mobile-shell): the
   *  compact shell covers the editor with a view of its own, and the platform
   *  drops focus when the control that held it is hidden. */
  focus: () => void
}

export function EditorPane({
  page,
  initialContent,
  onChange,
  emptyHint = 'notes',
  brandAction,
  onTour,
  onReady,
  loading = false,
  onAttachFiles,
  onOpenReference,
  onBoardLink,
  readAsset,
  suggest,
  suggestBoards,
  suggestFiles,
  highlight,
  ref,
}: {
  page: Page | null
  initialContent: string
  onChange: (markdown: string) => void
  /** The blocks to frame on open (frame-every-matching-block), with a nonce so
   *  the same blocks can be located again. Null, or an empty list, clears the
   *  frames. */
  highlight?: { blocks: number[]; nonce: number } | null
  /** Which copy the brand screen shows when no page is open: the notes hint,
   *  the open-a-folder instruction, or — where the browser has no local-folder
   *  picker — the browser requirement instead of an instruction that cannot be
   *  followed (warn-unsupported-browser). */
  emptyHint?: 'notes' | 'open-folder' | 'browser-unsupported'
  /** Optional control rendered under the tagline on the brand screen
   *  (add-logseq-import): the Import from Logseq action. Presentational only —
   *  the pane owns no import state. */
  brandAction?: ReactNode
  /** Opens the app tour from the brand screen (add-landing-page-info). App
   *  supplies it only on wide viewports, where the tour is available, the same
   *  optional-callback shape `FolderRail.onTour` uses; absent, the brand screen
   *  shows its copy without the tour reference. */
  onTour?: () => void
  /** The editor has mounted and applied its initial content. App uses this to
   *  present a page it just opened (add-row-context-menu, navigate-then-
   *  present): the document is live, so its blocks are ready to derive. Fires
   *  once per mount, after the seed lands. */
  onReady?: () => void
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
      staticBlocks: () => adapterRef.current?.staticBlocks() ?? [],
      focus: () => adapterRef.current?.focus(),
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

  // A search match is marked after the content settles (mark-search-matches-on-
  // the-page). `ready` gates the same-page effect so a remount does not mark
  // before the editor holds the page.
  const highlightRef = useRef(highlight)
  highlightRef.current = highlight
  const readyRef = useRef(false)

  // Vault images (render-vault-images, bound-image-render-cost): the document's
  // image references point at vault paths the browser cannot fetch, so the
  // rendered element is pointed at the file's bytes instead. This pass only
  // registers images with the pane's viewport observer and re-applies bytes
  // already read; the reads themselves happen as images enter view, so a
  // keystroke reads nothing and an off-screen image holds no bytes (design
  // D1-D3). A no-op without a vault reader.
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
    // One editor, behind the seam (ADR-0010): the pane knows only
    // `EditorAdapter`, so the surface can change again without the pane
    // learning about it.
    const adapter: EditorAdapter = new CodeMirrorAdapter()
    adapterRef.current = adapter
    // The pane is the scroll container whose viewport decides which images are
    // needed (bound-image-render-cost, design D1): resolution follows what is
    // on screen, not every reference the page happens to contain.
    const assets = createAssetImages({ root: paneRef.current })
    assetsRef.current = assets
    // Placeholder bookkeeping rides the same edit stream that reaches App:
    // markdown empty ⇒ the doc is empty ⇒ show the hint.
    adapter.onChange((markdown) => {
      setIsEmpty(markdown.trim() === '')
      onChange(markdown)
      updateImages()
    })
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
          readyRef.current = true
          adapter.highlightBlocks(highlightRef.current?.blocks ?? [])
          updateImages()
          onReady?.()
        })
      })
      .catch(() => {
        // Mount failure keeps the pane as-is (empty surface, no error UI).
      })

    return () => {
      cancelled = true
      adapterRef.current = null
      // Release this page's image URLs with its editor (design D5).
      assetsRef.current = null
      releaseAssetImages(assets)
      void adapter.destroy()
    }
  }, [])
  /* oxlint-enable react/exhaustive-deps */

  // Locating a block on a page already open: the pane does not remount, so a
  // new request re-marks here, and a cleared highlight clears the mark.
  useEffect(() => {
    if (!readyRef.current) return
    adapterRef.current?.highlightBlocks(highlight?.blocks ?? [])
  }, [highlight])

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
  // decision made from the clipboard's content rather than from whether the
  // editor already handled the paste (design D2).
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
      <main
        ref={paneRef}
        data-tour="editor"
        onDragOver={handleDragover}
        onDrop={handleDrop}
        className={styles.pane}
      >
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
            {/* The app's introduction (add-landing-page-info): what Folio is
                and what it does. Shown once the no-folder state has settled —
                not during the transitional `notes` hint, which exists to keep
                a stored folder's restore from flashing the open-folder copy. */}
            {emptyHint !== 'notes' && (
              <div className={styles.brandInfo}>
                <p className={styles.description}>
                  {BRAND_DESCRIPTION} {BRAND_FACTS}
                  {onTour && (
                    <>
                      {' '}
                      New here?{' '}
                      <button type="button" className={styles.tourLink} onClick={onTour}>
                        Take the tour
                      </button>
                      , or use the ? in the left rail.
                    </>
                  )}
                </p>
              </div>
            )}
            {brandAction}
            {/* The issue-reporting line (add-issue-report-note): where bugs and
                feature requests go, with the repository link inline. Shown in
                every no-folder state, in place of the bare repository link. */}
            <p className={styles.repoNote}>
              Found a bug or have a feature request? Report it on{' '}
              <a
                className={styles.repoLink}
                href="https://github.com/ypyl/folio"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Folio on GitHub"
              >
                GitHub
              </a>
              .
            </p>
          </div>
        )}
      </main>
    )
  }

  return (
    <main
      ref={paneRef}
      data-tour="editor"
      onDragOver={handleDragover}
      onDrop={handleDrop}
      onPaste={handlePaste}
      className={styles.pane}
    >
      <article className={styles.document}>
        <div
          ref={mountRef}
          className={styles.editor}
          // Empty pages get an inline hint (journal-home): the surface's
          // CSS ::before reads it through the inheriting `--placeholder`
          // variable set here.
          data-empty={isEmpty || undefined}
          style={{ '--placeholder': `'${PLACEHOLDER}'` } as CSSProperties}
        />
      </article>
    </main>
  )
}
