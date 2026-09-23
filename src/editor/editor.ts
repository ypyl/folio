// The editor seam (design D1, ADR-0010): the pane and the draft/save logic
// depend on this interface; ProseMirror lives behind MilkdownAdapter. Mirrors
// the VaultStorage/fakeHandle asymmetry: logic is tested against a fake, the
// real transport gets a thin smoke test.

import type { ReferenceKind } from '../vault/parse'
import type { Suggestion } from '../vault/suggest'

/** The app's completion sources (add-reference-autocomplete,
 *  add-asset-references): page names for a reference being typed, and the
 *  vault's files for a link destination. Both are read at query time, so a
 *  source bound to the live vault index stays current without re-registering. */
export type SuggestionSources = {
  pages: (query: string) => Suggestion[]
  /** Board-name candidates for a `#!` reference being typed (add-whiteboards).
   *  Absent means no board suggestions. */
  boards?: (query: string) => Suggestion[]
  /** `onlyImages` is the narrowing an image's destination asks for: a file the
   *  browser cannot render as an image is never offered for `![](`. */
  files: (query: string, onlyImages: boolean) => Suggestion[]
}

/** A point in the viewport — the coordinates a drop was released at
 *  (drag-references-into-editor, ADR-0023). */
export type DropPoint = { left: number; top: number }

/** A foldable list item, as the pane's left rail sees it (list folding): the
 *  item's DOM element to measure and toggle, whether it is folded, and how
 *  deeply it nests (1 = first level). No editor position crosses this seam. */
export type FoldTarget = { element: HTMLElement; folded: boolean; depth: number }

export interface EditorAdapter {
  /** Attach the editor to a DOM element. Call once per instance, before use. */
  mount(el: HTMLElement): Promise<void>
  /** Tear the editor down and detach change listeners. Safe to call twice. */
  destroy(): Promise<void>
  /** Replace the document with the given Markdown (resets to that text). */
  setContent(markdown: string): Promise<void>
  /** Insert Markdown at the editor's current selection (cursor). `point`, when
   *  given, is where the pointer released what is being inserted: the editor
   *  inserts there instead, and falls back to the selection when the point
   *  names no position the document can hold it at (ADR-0023). */
  insertMarkdown(markdown: string, point?: DropPoint): void
  /** Scroll the `index`-th top-level block into view and mark it for a
   *  moment; null clears the mark (mark-search-matches-on-the-page). A view
   *  operation: it never changes the document, so it is not an undo step and
   *  never reaches serialization. An index the document does not hold is
   *  ignored. */
  highlightBlock(index: number | null): void
  /** Subscribe to document changes; the callback receives serialized Markdown. */
  onChange(listener: (markdown: string) => void): void
  /** Subscribe to changes that move the document's blocks without changing its
   *  text — today a list item being folded or expanded (add-collapsible-list-
   *  items). The pane re-measures the rail on this, because the rail is
   *  otherwise driven by the markdown change stream and a fold produces none. */
  onLayoutChange(listener: () => void): void
  /** The page's foldable list items, in document order, for the left rail's
   *  controls (move-list-folds-to-the-left-rail). Read at render time; the
   *  elements are the editor's own DOM. */
  getFoldTargets(): FoldTarget[]
  /** Fold or expand the list item `element` belongs to, then announce the
   *  layout change a fold makes. A no-op when the element is no longer in the
   *  document. */
  toggleFold(element: HTMLElement): void
  /** Subscribe to reference activation (badge click or Mod+Enter); the callback
   *  receives the target name and which namespace it names — a page or a board —
   *  never a resolved path (ADR-0010). */
  onReferenceClick(listener: (target: string, kind: ReferenceKind) => void): void
  /** Subscribe to activation of a link whose destination is a board file
   *  (add-whiteboards: the extension decides the view). The callback receives
   *  the vault path; the app opens the board editor for it. */
  onBoardLink(listener: (path: string) => void): void
  /** The app supplies the vault's file bytes through this, for a link that
   *  points at a vault path (open-vault-assets). Runs the other way, like the
   *  suggestion source: the editor asks when a link is activated, the app
   *  answers with the file's bytes, and nothing is read before then. Read-only:
   *  the editor never writes through it, so the file on disk stays canonical
   *  (ADR-0001), and a folder switch simply replaces the reader. */
  setAssetReader(reader: (path: string) => Promise<Blob>): void
  /** The app supplies completion candidates through this. Unlike the `on*`
   *  methods this runs the other way: the editor asks, the app answers, and the
   *  editor never calls back out for a suggestion. Read-only and names only
   *  (a name, its path, and the matched span), never a page or a destination.
   *  Attach at any time; the sources are read at query time. */
  setSuggestionSource(sources: SuggestionSources): void
  /** Apply a keyboard shortcut to the editor exactly as pressing it would
   *  (apply-shortcuts-on-click, ADR-0016): the chord is replayed at the surface
   *  the caret is in, so the editor's own keymap resolves it and a formatting
   *  combination keeps its toggling behaviour. The app asks with the chord it
   *  displays; it never learns what the command is. Returns whether anything
   *  claimed the chord, so a caller can tell “applied” from “not applicable
   *  here”. */
  applyChord(chord: string): boolean
}
