// The editor seam (design D1, ADR-0010): the pane and the draft/save logic
// depend on this interface; ProseMirror lives behind MilkdownAdapter. Mirrors
// the VaultStorage/fakeHandle asymmetry: logic is tested against a fake, the
// real transport gets a thin smoke test.

import type { Suggestion } from '../vault/suggest'

export interface EditorAdapter {
  /** Attach the editor to a DOM element. Call once per instance, before use. */
  mount(el: HTMLElement): Promise<void>
  /** Tear the editor down and detach change listeners. Safe to call twice. */
  destroy(): Promise<void>
  /** Replace the document with the given Markdown (resets to that text). */
  setContent(markdown: string): Promise<void>
  /** Insert Markdown at the editor's current selection (cursor). */
  insertMarkdown(markdown: string): void
  /** The canonical start line of each top-level block, in doc order. */
  getBlockLines(): number[]
  /** Subscribe to document changes; the callback receives serialized Markdown. */
  onChange(listener: (markdown: string) => void): void
  /** Subscribe to reference activation (badge click or Mod+Enter); the callback
   *  receives the target page name, never a resolved path (ADR-0010). */
  onReferenceClick(listener: (target: string) => void): void
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
   *  Attach at any time; the source is read at query time, so one bound to the
   *  live vault index stays current. */
  setSuggestionSource(source: (query: string) => Suggestion[]): void
  /** Apply a keyboard shortcut to the editor exactly as pressing it would
   *  (apply-shortcuts-on-click, ADR-0016): the chord is replayed at the surface
   *  the caret is in, so the editor's own keymap resolves it and a formatting
   *  combination keeps its toggling behaviour. The app asks with the chord it
   *  displays; it never learns what the command is. Returns whether anything
   *  claimed the chord, so a caller can tell “applied” from “not applicable
   *  here”. */
  applyChord(chord: string): boolean
}
