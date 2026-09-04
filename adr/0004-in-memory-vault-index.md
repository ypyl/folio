# ADR-0004: In-memory vault index, rebuilt on open, updated incrementally

- Status: Accepted
- Date: 2026-09-03

## Context

Wikilinks, backlinks, tags, and search all need to know what pages exist and how they relate. Storing this in a backend or database contradicts ADR-0001. The folder can be large, so a full rescan on every keystroke is too slow, but the folder is the source of truth and can change outside the app.

## Decision

Maintain an **in-memory index** over the vault, shaped like:

```ts
type Link = {
  target: string       // page title; one namespace, no tags vs pages (ADR-0012)
  via: 'wikilink' | 'tag'  // lexical form, display only
}

type Page = {
  path: string
  title: string
  links: Link[]    // every reference target: [[Page]], #word, #[[Page]]
}

type Graph = {
  pages: Map<string, Page>
  backlinks: Map<string, string[]>
}
```

- Rebuild the index when the vault is opened.
- Update it **incrementally** when files change.
- IndexedDB may optionally cache the index to speed up reopening, but never as the source of truth (ADR-0001).

## Consequences

- Backlinks, tags, and search are answered from memory — no network, no disk latency. Tags are page references (ADR-0012); there is no separate tag index.
- The index is disposable: it can always be re-derived from the folder.
- Incremental updates must stay correct when files change externally, so the app must also watch or re-scan for external edits (the File System Access API does not notify automatically).