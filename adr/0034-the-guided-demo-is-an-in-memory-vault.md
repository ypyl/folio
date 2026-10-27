# ADR-0034: The guided demo is an in-memory vault

- Status: Accepted
- Date: 2026-10-27

## Context

Folio's model is a Markdown folder the user owns (ADR-0001), reached through the
`VaultStorage` seam (ADR-0003). A newcomer who opens the live build has neither:
the brand screen asks them to find a folder on disk before they can see anything,
and a browser without the File System Access API cannot open one at all. The app
tour explains the shell's regions but cannot show a reference, a backlink, a
reminder, or a board working.

The app therefore needs a vault that is not a folder: a seeded, one-click
sandbox that runs every feature on content it ships with. That is a deliberate
exception to "the folder is the database", and it has to be bounded so it never
becomes a second place where a user's notes can live.

## Decision

**The guided demo is a `VaultStorage` over an in-memory file map.** The demo
implements the same five-method contract as the File System Access transport, so
the index, editor, links, search, reminders, boards, and assets run unchanged.
It has no folder handle, so no code path can reach the filesystem through it.

**The demo is session-only and never persisted.** Its writes mutate the map;
closing the demo or reloading the tab discards every change. The app stores no
handle for it, writes no `lastActiveId` pointer for it, and does not restore it
on boot. Activating the demo again while its rail row is still listed returns to
the same in-memory copy; closing the row discards that copy, and the next open
starts from the seed.

**The seed is repository content, built on first open.** The demo's pages,
journal days, board scene, SVG, and text file live under `src/demo/vault/` as
real files of the same kinds a vault holds, imported as raw strings. A seed
function fills the current dates into three journal templates and returns the
file map. Nothing is constructed for a real vault, and the seed is not fetched
from a server; the app remains backend-free and works offline.

**The demo's Welcome page is the guide's table of contents.** The demo lands on
that page instead of today's journal, and every guide page explains one feature
using the demo's own references, links, headings, days, reminders, board, and
assets. This is the detailed walkthrough; the app tour stays a five-step
explanation of the shell and points at the demo.

## Consequences

- Markdown remains canonical inside the demo too: its pages are real Markdown,
  its links are the app's reference syntax, and its board is a real
  `.excalidraw` scene. The only difference is where the bytes live.
- The demo is available in every browser, including Firefox and Safari, because
  it needs no File System Access API. The brand screen offers it where it cannot
  offer a folder picker.
- Demo edits can be lost without warning beyond the Welcome page's notice. That
  is the cost of a sandbox that writes nothing; a persistent demo would be a
  second database and is rejected.
- A real folder is untouched by anything the demo does. The demo cannot see a
  user's disk, and the app never writes its content to one.
- The seed adds static Markdown and a small SVG to the bundle, and the demo's
  index is one small scan. Neither sits on a real vault's typing path.
- The demo is not a migration target and has no export. Moving from the demo to
  a real vault means opening a folder, not promoting the sandbox.
- The exception is narrow by construction: exactly one virtual vault, created by
  the app's composition layer, with no handle and no persistence path.
