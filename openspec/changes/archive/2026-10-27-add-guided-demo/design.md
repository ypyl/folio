# Design

## Context

See proposal.md - Why. `App` composes the workspace from `useVault`, which owns
the rail's folder rows, and `useIndex`, which scans a `VaultStorage` into the
in-memory graph (ADR-0004). Every feature - pages, links, search, journal,
reminders, boards, assets - already talks to that storage seam and to the graph;
none reads a folder directly. The brand screen is the only place a newcomer
without a vault can act, and the tour is presentational and never opens a vault.

## Goals / Non-Goals

**Goals:**

- One click from the brand screen to a fully working vault with every kind of
  content, in every browser.
- A table of contents as the demo's landing page, with every feature explained
  and demonstrated on the demo's own files.
- Real behavior (auto-save, links, pins, reminders, boards, drops) with zero disk
  or persistent-storage writes.
- No cost to a real vault's open, scan, or typing path.

**Non-Goals:**

- No demo persistence, export, or promotion to a real folder.
- No second tour, no new route, no new shell region.
- No change to the real-file transport or to how a folder opens.

## Decisions

**D1 - A demo is a `VaultStorage`, not a fake directory handle.** The demo storage
holds a `Map<path, string | Blob>` plus a monotonic mtime per write and implements
the existing five-method contract. Every feature then works unchanged, and the
demo cannot reach the filesystem by construction. A fake
`FileSystemDirectoryHandle` was rejected: it would pull FSA semantics into a
sandbox and make "no disk access" a convention instead of a type. `App` - the
composition layer ADR-0003 names - is the only place that constructs it.

**D2 - The demo joins the rail as a handle-less virtual folder.** `VaultFolder`
gains an optional `handle` and a `demo` flag. A new `addVirtualFolder` adds and
activates storage directly, and every path that persists a handle skips a demo
row: no `handleStore` write, no last-active pointer, no restore on reload.
Closing the row drops it and its in-memory contents; returning home keeps the row
for the session. This is the smallest change that lets the existing rail,
switcher, status bar, and index treat the demo like any other vault.

**D3 - The demo lands on its Welcome page.** The auto-open effect that normally
opens today's journal chooses `pages/Welcome.md` when the active folder is the
demo. Seeding today's journal as the landing page was rejected: a journal day is
not a page in Files, and the guide's table of contents belongs on a page whose
backlinks and forwardlinks can demonstrate the link graph.

**D4 - The guide is real Markdown in the repository.** The seed is a directory of
`.md`, `.excalidraw`, `.svg`, and `.txt` files under `src/demo/vault/`, imported as
raw strings. A seed function fills `{{today}}`, `{{yesterday}}`, and
`{{twoDaysAgo}}`, and returns the file map for the demo storage. Keeping the
guide as Markdown rather than TS string literals makes it reviewable, keeps the
vault shape visible, and leaves Markdown canonical inside the demo too. The
imports are static and the storage is constructed only on the demo's first open,
so a real vault never pays for the seed.

**D5 - The Welcome page is the table of contents and the guide pages are the
chapters.** Welcome lists one reference per guide page - mixing `#word` and
`#[[Page name]]` forms - and each guide page opens with a reference back to
Welcome, so backlinks and forwardlinks are populated by the demo itself. The
right panel's Contents section supplies the in-page outline, so the TOC and the
feature that mirrors headings are the same thing seen twice. The demo's reminder
rules anchor on today and target two seeded pages; no guide page references those
pages on today's journal, so opening Today demonstrates the write-on-open rule.

**D6 - The demo action is a primary control on the brand screen.** `EditorPane`
takes an `onDemo` callback and renders a `btn-primary` button in every no-folder
state, including the unsupported-browser copy. The Logseq import stays the
optional `brandAction` beneath it. A rail control was rejected for this change:
the newcomer's first screen is the brand screen, and a rail control would be a
second entry point to design and test. The demo button is core, not a plugin, so
it does not ride in `brandAction`.

**D7 - The tour keeps five steps and points at the demo.** The editor step's copy
names the guided demo as the place to try every feature. A sixth step or a
separate guide overlay would duplicate the demo and break the tour's
one-region-per-step shape.

**D8 - Nothing writes outside memory.** The demo storage's `write` and
`writeBinary` mutate its map; `App`'s saver, board saver, pins, reminders, and
asset drops all go through that storage. The only app-owned persistence is
`handleStore`, and the demo never calls it. No `localStorage`, no IndexedDB, no
file handle.

**D9 - The typing budget is untouched.** The demo is another `VaultStorage`, so a
keystroke still does one pass over the open document and its memos; the demo
adds no per-keystroke work. Its scan is 18 small notes and runs only when the
demo opens. Building the seed on click is one map of strings and one index scan,
not a vault-proportional cost on any other folder.

## Risks / Trade-offs

- [The guide can drift from app behavior] -> the feature pages are short and
  describe behavior the specs already own; the seed test checks the link graph,
  the reminder match, and that every reference resolves.
- [A `.md` file in `src/` can be mistaken for app data] -> the directory is
  `src/demo/vault/` and is imported as raw content, never scanned at runtime.
- [Session-only edits surprise a user who reloads] -> the Welcome page and the
  brand copy say so, and the demo is named "Demo vault" in the rail and status
  bar.
- [Excalidraw and blob images must work without the File System Access API] ->
  they already resolve through storage and object URLs; the Playwright demo test
  removes the picker and opens both.
- [Adds ~30 KB of seed Markdown to the bundle] -> static, compressed, and far
  smaller than the Excalidraw chunk the app already lazy-loads.

## Migration Plan

None. The feature adds an in-memory vault and a brand-screen control; no stored
state, schema, or existing vault changes. Removing the control and the seed
restores the previous behavior.
