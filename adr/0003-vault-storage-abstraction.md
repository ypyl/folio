# ADR-0003: Abstract filesystem access behind a `VaultStorage` interface

- Status: Accepted
- Date: 2026-09-03

## Context

Folio starts as a PWA (ADR-0002) but may later need to run as a desktop application (e.g., Tauri) to broaden browser support. If filesystem access is called directly throughout the code, either of these paths forces a rewrite of the knowledge-management core.

## Decision

Keep filesystem access behind a narrow abstraction:

```ts
interface VaultStorage {
  read(path: string): Promise<string>;
  write(path: string, content: string): Promise<void>;
  delete(path: string): Promise<void>;
  list(path: string): Promise<Entry[]>;
}
```

Implementations today and later:

```text
PWA
 └── File System Access API

Tauri
 └── Native filesystem API
```

The rest of the application must not care where the files come from.

## Consequences

- The core logic (parsing, indexing, wikilinks, journal, search) is transport-agnostic and testable against a mock storage.
- A Tauri desktop build later is additive: one new `VaultStorage` implementation, no core rewrite.
- Adds a small layer of indirection; acceptable because the interface stays tiny.