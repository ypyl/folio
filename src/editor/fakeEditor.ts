// Test-support fake of the editor seam (design D1), same role as
// vault/fakeHandle: implements exactly the contract EditorPane depends on,
// with a test hook to simulate user edits. Tests inject it by mocking the
// MilkdownAdapter module.

import type { DropPoint, EditorAdapter, SuggestionSources } from './editor'
import { blockStartLines } from '../lineAnchors'
import type { ReferenceKind } from '../vault/parse'
import type { Suggestion } from '../vault/suggest'

export class FakeEditor implements EditorAdapter {
  content = ''
  destructed = false
  mounted = false
  /** Every setContent call, in order — lets tests assert what the pane loaded. */
  readonly setContents: string[] = []
  /** Every insertMarkdown call, in order — lets tests assert what was inserted. */
  readonly insertions: string[] = []
  /** The drop point each insertMarkdown call carried, in the same order;
   *  `null` for a call that had none (drag-references-into-editor). */
  readonly insertionPoints: (DropPoint | null)[] = []
  /** Every applyChord call, in order — lets tests assert which key
   *  combination a click sent to the editor (apply-shortcuts-on-click). */
  readonly chords: string[] = []
  private listeners: ((markdown: string) => void)[] = []
  private layoutListeners: (() => void)[] = []
  private referenceListeners: ((target: string, kind: ReferenceKind) => void)[] = []
  private boardLinkListeners: ((path: string) => void)[] = []
  /** Every attached vault reader, in order (open-vault-assets) — lets pane
   *  tests assert the pane wired one, and read a vault file as it would. */
  readonly assetReaders: ((path: string) => Promise<Blob>)[] = []
  private suggestionSources: SuggestionSources | null = null
  private host: HTMLElement | null = null

  /** Mirror the editor's top-level block DOM so pane tests can measure the
   *  gutter binding (real ProseMirror is replaced by this fake). A block whose
   *  markdown carries an image reference renders an `<img>` for the first one,
   *  as the real adapter does — that is what vault-image resolution operates
   *  on. */
  private syncDoc(): void {
    if (!this.host) return
    this.host.querySelector('.ProseMirror')?.remove()
    const pm = document.createElement('div')
    pm.className = 'ProseMirror'
    const lines = this.content.split('\n')
    for (const line of this.getBlockLines()) {
      const block = document.createElement('div')
      const match = /!\[([^\]]*)\]\(([^)\s]+)\)/.exec(lines[line - 1] ?? '')
      if (match) {
        const img = document.createElement('img')
        img.setAttribute('src', match[2])
        img.setAttribute('alt', match[1])
        block.appendChild(img)
      }
      pm.appendChild(block)
    }
    this.host.appendChild(pm)
  }

  async mount(el: HTMLElement): Promise<void> {
    this.mounted = true
    this.host = el
    this.syncDoc()
  }

  async destroy(): Promise<void> {
    this.destructed = true
    this.listeners = []
    this.layoutListeners = []
    this.referenceListeners = []
    this.boardLinkListeners = []
    this.suggestionSources = null
  }

  async setContent(markdown: string): Promise<void> {
    this.content = markdown
    this.setContents.push(markdown)
    this.syncDoc()
  }

  getBlockLines(): number[] {
    // The real adapter zips anchors to doc blocks and maps an empty doc's
    // single placeholder block to line 1; mirror that contract here.
    if (this.content.trim() === '') return [1]
    return blockStartLines(this.content)
  }

  insertMarkdown(markdown: string, point?: DropPoint): void {
    this.emitChange(this.content + markdown)
    this.insertions.push(markdown)
    this.insertionPoints.push(point ?? null)
  }

  // The real adapter replays the chord through the editor's keymap; the fake
  // records it and reports that something claimed it.
  applyChord(chord: string): boolean {
    this.chords.push(chord)
    return true
  }

  onChange(listener: (markdown: string) => void): void {
    this.listeners.push(listener)
  }

  onLayoutChange(listener: () => void): void {
    this.layoutListeners.push(listener)
  }

  onReferenceClick(listener: (target: string, kind: ReferenceKind) => void): void {
    this.referenceListeners.push(listener)
  }

  onBoardLink(listener: (path: string) => void): void {
    this.boardLinkListeners.push(listener)
  }

  setAssetReader(reader: (path: string) => Promise<Blob>): void {
    this.assetReaders.push(reader)
  }

  setSuggestionSource(sources: SuggestionSources): void {
    this.suggestionSources = sources
  }

  /** Test hook: what the adapter would offer for `query` right now. */
  suggest(query: string): Suggestion[] {
    return this.suggestionSources?.pages(query) ?? []
  }

  /** Test hook: what the destination picker would offer for `query` right now. */
  suggestFiles(query: string, onlyImages: boolean): Suggestion[] {
    return this.suggestionSources?.files(query, onlyImages) ?? []
  }

  /** Test hook: simulate activating a reference badge. */
  emitReferenceClick(target: string, kind: ReferenceKind = 'page'): void {
    for (const listener of this.referenceListeners) listener(target, kind)
  }

  /** Test hook: simulate activating a link whose destination is a board file. */
  emitBoardLink(path: string): void {
    for (const listener of this.boardLinkListeners) listener(path)
  }

  /** Test hook: simulate a layout-only change, as a fold makes. */
  emitLayoutChange(): void {
    for (const listener of this.layoutListeners) listener()
  }

  /** Test hook: simulate a user edit producing `markdown`. */
  emitChange(markdown: string): void {
    this.content = markdown
    this.syncDoc()
    for (const listener of this.listeners) listener(markdown)
  }
}
