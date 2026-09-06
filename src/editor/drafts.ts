// Per-page edit state (design C1): one entry per page that has been opened or
// edited, holding the working text, the last text written to disk, and the
// save status. Session-scoped and disposable — the app clears it when the
// active folder changes (ADR-0004 parallelism: the index is disposable too).

export type DraftStatus = 'clean' | 'dirty' | 'saving' | 'failed'

export type Draft = {
  content: string
  saved: string
  status: DraftStatus
}

export class DraftStore {
  private drafts = new Map<string, Draft>()

  get(path: string): Draft | undefined {
    return this.drafts.get(path)
  }

  /** Seed a page's draft: keep any unsaved draft (returning to a page is not
   *  a reset), otherwise start clean from the content currently on disk. */
  open(path: string, savedContent: string): Draft {
    let draft = this.drafts.get(path)
    if (!draft) {
      draft = { content: savedContent, saved: savedContent, status: 'clean' }
      this.drafts.set(path, draft)
    }
    return draft
  }

  /** Record an edit on an opened page. Returns the new status; an edit that
   *  matches the saved text (an undo) returns to clean. */
  edit(path: string, content: string): DraftStatus {
    const draft = this.drafts.get(path)
    if (!draft) return 'clean'
    draft.content = content
    draft.status = content === draft.saved ? 'clean' : 'dirty'
    return draft.status
  }

  beginSave(path: string): void {
    const draft = this.drafts.get(path)
    if (draft) draft.status = 'saving'
  }

  succeed(path: string): void {
    const draft = this.drafts.get(path)
    if (!draft) return
    draft.saved = draft.content
    draft.status = 'clean'
  }

  fail(path: string): void {
    const draft = this.drafts.get(path)
    if (draft) draft.status = 'failed'
  }

  clear(): void {
    this.drafts.clear()
  }
}