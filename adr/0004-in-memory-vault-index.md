# ADR-0004: In-memory vault index, rebuilt on open, updated incrementally

- Status: Accepted (amended 2026-09-05: path-keyed pages, resident content, diff-rescan mechanism; amended 2026-09-06: write-through upsert mechanics)
- Date: 2026-09-03

## Context

Page references, backlinks, and search all need to know what pages exist and how they relate. Storing this in a backend or database contradicts ADR-0001. The folder can be large, so a full rescan on every keystroke is too slow, but the folder is the source of truth and can change outside the app.

## Decision

Maintain an **in-memory index** over the vault, shaped like:

```ts
type Link = {
  target: string       // page name; one namespace, no tags vs pages (ADR-0012)
  via: 'word' | 'bracketed'  // lexical form, display only
}

type Page = {
  path: string         // vault-relative path; the stable identity
  title: string        // filename stem
  kind: 'page' | 'journal'
  links: Link[]        // every reference target: #word, #[[Page]]
  content: string      // full text, resident in memory
}

type Graph = {
  pages: Map<string, Page>         // keyed by path
  byName: Map<string, string>      // lowercase name -> path (reference resolution)
  backlinks: Map<string, string[]> // lowercase target -> referring paths, self excluded
}
```

- Pages are keyed by **path**, not title (two files can share a case-insensitive name; paths never collide). References resolve through `byName` by lowercased name, first-by-path winning case-only collisions.
- **Content is resident**: page open, write-through updates, and search answer without folder reads.
- Rebuild the index when the vault is opened, **diff-rescan on changes**: walk `list('')`, compare a `Map<path, lastModified>` snapshot, re-read only new/changed files, drop removed ones. `VaultStorage` gains a `stat(path)` operation (last-modified time) so the diff never reads unchanged content (ADR-0013 seam).
- **Write-through upsert**: the app's own saves run `write(path, content)` → `stat(path)` → rebuild that page (content, `parseLinks`) → re-fold it into `byName`/backlinks → overwrite the snapshot mtime from the stat so the next diff-refresh skips the file it just wrote. Upsert is **non-optimistic**: the graph changes only after the write resolves; a failed write leaves the page and the index unchanged.
- Refresh triggers: window focus, visibility becoming visible, and a visibility-gated periodic timer, bound to the active folder.
- IndexedDB may optionally cache the index to speed up reopening, but never as the source of truth (ADR-0001).

## Consequences

- Backlinks and search are answered from memory — no network, no disk latency. There is no separate tag index: `#word` and `#[[Page]]` are page references (ADR-0012).
- The index is disposable: it can always be re-derived from the folder.
- Incremental updates stay correct when files change externally: the File System Access API does not notify automatically, so the app re-scans on the refresh triggers above. Staleness is bounded by the trigger gap and self-heals on every trigger; FileSystemObserver was rejected for replacing only the trigger while keeping the diff (ADR-0006).
- Editor and knowledge-management logic stay separate (ADR-0010): components receive pages via props and never touch storage or the index directly.