# ADR-0036: An agent's action is an app action with an actor and a record

- Status: Accepted (2026-11-21: the record and the tool surface both shipped,
  and the surface's registration was checked against a real model-context
  interface, not only a fake)
- Date: 2026-11-14

## Context

Folio is about to expose a tool surface to browser agents through WebMCP
(`document.modelContext.registerTool`, Chrome 149 origin trial): an installed
assistant can then ask the app to tidy a page, add a reminder, or find a note,
instead of guessing at the DOM of a CodeMirror surface inside a File System Access
app.

Three facts shape how such a surface should sit in the app.

First, the app is the only thing that knows its own conventions. A date-shaped
name is a journal day (ADR-0019), a reference is `#word` or `#[[Page]]`
(ADR-0012), a reminder is a rule line in app-owned `.folio/` state with a fixed
grammar (ADR-0031), and a task marker is `- [ ]` (ADR-0033). An agent writing
files directly produces text the app silently ignores, which is the worst failure
mode: not an error, a no-op that looks like success.

Second, the app is the only thing that keeps its derived view true. A page's text
passes through the draft store, the debounced saver, and the write-through
function that updates the in-memory index (ADR-0004). A write that skips that path
leaves the sidebar, the backlinks, and the search corpus lying to the next caller.

Third, WebMCP is not a security boundary. An installed extension with host
permissions can already run JavaScript in the page, with or without it, and the
API exposes no client identity: the page cannot tell which agent is calling. So
whatever the app does, it cannot sandbox the agent, and it cannot reconstruct
attribution after the fact. A file's modification time can never say "an agent did
this".

## Decision

**An agent acts as the user. Its actions are the app's own actions, performed on
the user's behalf, recorded with an actor, and gated behind the experimental
switch.**

- **Tools are app actions with a schema on top.** A tool resolves names by the
  app's naming rule, writes through the app's write-through functions, and renders
  app-owned files through their own writers. No tool is a filesystem wrapper, and
  no tool takes a page path where a page name would do.
- **Two write shapes, chosen by whether the page is open.** A change to the open
  page is one editor transaction matched against the live document, so it merges
  with the user's typing, undoes with `Mod-z`, and keeps the caret. A change to any
  other page is a write through the write-through path. Writing the file of an open
  page would be overwritten by the debounced saver, and reading it would match text
  the user has already changed.
- **Attribution is recorded when the call happens.** Each action appends one entry
  to a session-scoped record and mirrors it as one line in the session trace
  (ADR-0035), naming the tool, the path, and the counts. The record holds no page
  text, and it is not a ledger: later edits do not revise it.
- **The record is the acceptance mechanism, not a permission system.** Review
  only: an agent's action is reviewable and, if the page was not open, not undoable
  in the app. Git is the undo. There is no per-action approval, no consent dialog,
  and no claim that the surface enforces anything; WebMCP's consent API is still a
  draft.
- **Nothing can be removed.** `VaultStorage.remove` exists for the trace's pruner
  and nothing else (ADR-0030, ADR-0035), so the worst an agent can do is write bad
  text.
- **The whole surface ships off.** A build-time flag in `src/features.ts` plus the
  app's experimental switch gate it, and with both off the page registers no tool
  at all, so an agent that lists tools sees an empty set.

Rejected alternatives:

- **A filesystem-facing MCP server over the folder.** It works with any agent
  without a browser, but it would re-derive the naming rule, the reference forms,
  the reminder grammar, and the derived index outside the app, which is exactly
  the silent-failure class this decision removes, and it would be the app's first
  backend.
- **A read-only surface.** Reads are the exfiltration direction and writes are the
  data-loss direction, so read-only is not automatically the safer half. What makes
  the surface acceptable is that every change is visible and every change leaves an
  actor's record, and a read-only surface would buy neither.
- **A whole-page write tool (`set_note`).** It cannot compose with typing, it
  invites a truncated rewrite, and it turns a small edit into a large payload. An
  exact-string replace composes, fails loudly when the text moved, and makes the
  record a real "what changed".
- **Storing the previous text for a one-click revert.** It would put page text
  into `.folio/`, which ADR-0035 refused, and it would need retention of its own,
  for a repair the user can already do with the file and with git.

## Consequences

- An agent's edit and a user's edit travel the same path, so the draft, the save,
  the index, and the trace are updated by one mechanism rather than two.
- The activity record is the price of admission: without it, an agent's write is
  indistinguishable from the user's, and the app has no answer to "what changed
  while I was away".
- Visibility is per-session and in memory, with the durable half in the trace's
  plain-text lines. A user who wants the full story after seven days has git and
  the files themselves, not the app.
- Two tabs on one folder remain a hole: the second tab's document and saver know
  nothing about the first, so a tool's write to an open page can be overwritten by
  another tab's save. The surfaced record makes it legible after the fact; closing
  the hole needs a cross-tab story this decision does not provide.
- Replacing the editor (ADR-0008's supersession shows how often that changes) puts
  the open-page shape on new ground: the transaction seam must exist in the next
  editor, or the merge with typing is lost and the write shapes collapse to one.
- If WebMCP's shape moves or the trial ends, only the registration module is
  thrown away; the actions, the record, and the review surface are the app's own.
  The shape has already moved once: this machine's Chromium 145 exposes the
  preview on `navigator.modelContext`, while the origin trial moved it to
  `document.modelContext`. The app reads both, and a browser with neither
  registers nothing.
