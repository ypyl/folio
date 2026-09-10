// Test-support fake of the editor seam (design D1), same role as
// vault/fakeHandle: implements exactly the contract EditorPane depends on,
// with a test hook to simulate user edits. Tests inject it by mocking the
// MilkdownAdapter module.

import type { EditorAdapter } from './editor'
import { blockStartLines } from '../lineAnchors'
import type { Suggestion } from '../vault/suggest'

export class FakeEditor implements EditorAdapter {
  content = ''
  destructed = false
  mounted = false
  /** Every setContent call, in order — lets tests assert what the pane loaded. */
  readonly setContents: string[] = []
  /** Every insertMarkdown call, in order — lets tests assert what was inserted. */
  readonly insertions: string[] = []
  private listeners: ((markdown: string) => void)[] = []
  private referenceListeners: ((target: string) => void)[] = []
  private suggestionSources: ((query: string) => Suggestion[])[] = []
  private host: HTMLElement | null = null

  /** Mirror the editor's top-level block DOM so pane tests can measure the
   *  gutter binding (real ProseMirror is replaced by this fake). */
  private syncDoc(): void {
    if (!this.host) return
    this.host.querySelector('.ProseMirror')?.remove()
    const pm = document.createElement('div')
    pm.className = 'ProseMirror'
    for (const _line of this.getBlockLines()) {
      pm.appendChild(document.createElement('div'))
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
    this.referenceListeners = []
    this.suggestionSources = []
  }

  async setContent(markdown: string): Promise<void> {
    this.content = markdown
    this.setContents.push(markdown)
    this.syncDoc()
  }

  getContent(): string {
    return this.content
  }

  getBlockLines(): number[] {
    // The real adapter zips anchors to doc blocks and maps an empty doc's
    // single placeholder block to line 1; mirror that contract here.
    if (this.content.trim() === '') return [1]
    return blockStartLines(this.content)
  }

  insertMarkdown(markdown: string): void {
    this.emitChange(this.content + markdown)
    this.insertions.push(markdown)
  }

  onChange(listener: (markdown: string) => void): void {
    this.listeners.push(listener)
  }

  onReferenceClick(listener: (target: string) => void): void {
    this.referenceListeners.push(listener)
  }

  setSuggestionSource(source: (query: string) => Suggestion[]): void {
    this.suggestionSources.push(source)
  }

  /** Test hook: what the adapter would offer for `query` right now. */
  suggest(query: string): Suggestion[] {
    return this.suggestionSources.at(-1)?.(query) ?? []
  }

  /** Test hook: simulate activating a reference badge. */
  emitReferenceClick(target: string): void {
    for (const listener of this.referenceListeners) listener(target)
  }

  /** Test hook: simulate a user edit producing `markdown`. */
  emitChange(markdown: string): void {
    this.content = markdown
    this.syncDoc()
    for (const listener of this.listeners) listener(markdown)
  }
}
