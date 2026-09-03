# ADR-0001: The Markdown folder is the database

- Status: Accepted
- Date: 2026-09-03

## Context

Folio should preserve the simplicity and portability of plain Markdown files rather than building a complex database-backed knowledge-management application. A user's knowledge base already exists as a folder of `.md` files, often edited by other tools.

## Decision

**The Markdown folder is the database. The application is just a UI and an index over it.**

- The source of truth is the set of `.md` files on disk.
- Pages, wikilinks, backlinks, tags, and journals are derived from these files.
- There is no backend and no application database.

## Consequences

- Any Markdown tool can read and edit the vault; Folio never locks data in a proprietary format.
- All state must be rebuildable by scanning the folder — nothing may exist only inside the app.
- Every write path must go to the files themselves, keeping the files and the UI consistent.
- IndexedDB (or similar) may cache derived data but must never become the source of truth.