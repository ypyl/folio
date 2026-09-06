// Test-support fake of the editor seam (design D1), same role as
// vault/fakeHandle: implements exactly the contract EditorPane depends on,
// with a test hook to simulate user edits. Tests inject it by mocking the
// MilkdownAdapter module.

import type { EditorAdapter } from './editor'

export class FakeEditor implements EditorAdapter {
  content = ''
  destructed = false
  mounted = false
  /** Every setContent call, in order — lets tests assert what the pane loaded. */
  readonly setContents: string[] = []
  private listeners: ((markdown: string) => void)[] = []

  async mount(_el: HTMLElement): Promise<void> {
    this.mounted = true
  }

  async destroy(): Promise<void> {
    this.destructed = true
    this.listeners = []
  }

  async setContent(markdown: string): Promise<void> {
    this.content = markdown
    this.setContents.push(markdown)
  }

  getContent(): string {
    return this.content
  }

  onChange(listener: (markdown: string) => void): void {
    this.listeners.push(listener)
  }

  /** Test hook: simulate a user edit producing `markdown`. */
  emitChange(markdown: string): void {
    this.content = markdown
    for (const listener of this.listeners) listener(markdown)
  }
}