# Proposal

## Why

A browser agent asked to tidy a page, add a reminder, or find a note has one way
into Folio today: act on the DOM. Folio is close to the worst case for that. The
page surface is the Markdown text itself in CodeMirror (ADR-0029), the app is a
File System Access PWA whose folder grant no agent can re-establish, and the
conventions it depends on are invisible in the files: a date-shaped name is a
journal day (ADR-0019), a reference is `#word` or `#[[Page]]` (ADR-0012), a
reminder is a rule line with a fixed shape in app-owned `.folio/` state
(ADR-0031), task markers are `- [ ]` (ADR-0033). An agent that guesses writes a
file the app silently ignores.

WebMCP is the browser's answer to exactly this: the page declares tools with a
name, a description, and a JSON Schema, and an installed agent calls them
(`document.modelContext.registerTool`, Chrome 149 origin trial). That turns the
app's own seams into the agent's interface, so conventions are enforced by the
code that already implements them, and a change goes through the path that keeps
the index true. It ships off: the same experimental switch that gates the
activity record (`add-agent-activity-log`) gates every tool.

What this change does not buy, and says so: enforcement. An extension the user
installed can already run JavaScript in the page. The tools make an agent's
intent legible and recordable, not limited (ADR-0036).

## What Changes

- **The app exposes a small tool surface, registered only while the gate is on.**
  Nine tools over existing seams: four reads (`search_notes`, `read_note`,
  `note_links`, `app_state`), one navigation (`open_note`), four writes
  (`create_note`, `edit_note`, `append_note`, `add_reminder`). Turning the gate
  off aborts the registration and retires every tool immediately.
- **The tools are app actions with schemas, not a filesystem wrapper.** Each call
  runs the same code path a surface uses: page names resolve by the app's own
  rule, a write goes through the write path that updates the index, and a
  reminder goes through the app's rule writer so the file keeps its canonical
  form.
- **A write to the open page is one editor transaction.** The change merges with
  the user's typing, undoes with `Mod-z`, keeps the caret, and reaches the draft,
  the debounced save, and the trace like a keystroke.
- **A write to any other page is a file write through the app's write path**, so
  the Files listing, the backlinks, and the search corpus are true when the call
  returns, and the next action sees what the last one wrote.
- **A stale match fails loudly.** `edit_note` takes an exact string to replace;
  when the text has moved it writes nothing and says so, so the agent re-reads
  rather than guessing at a whole page.
- **Refusals are named.** The generic text tools refuse `.folio/` paths and
  non-Markdown paths, and nothing in the surface can remove, rename, or move a
  file.
- **Every write lands in the activity record**, with the tool's name, the path,
  and the counts, and the tools declare their hints (`readOnlyHint`,
  `consequentialHint`, `untrustedContentHint`).

## Capabilities

### New Capabilities

- `agent-tools`: the tool surface an installed browser agent calls on the user's
  behalf: which tools exist, what they may touch, how a change reaches the open
  page and every other page, what a result may contain, and how the gate retires
  the whole surface.

### Modified Capabilities

None. The record this change writes into is `agent-activity`'s requirement
already: an action taken on the user's behalf is recorded.

## Non-goals

- **No removal, rename, or move.** `VaultStorage.remove` exists for the trace's
  pruner and nothing else (ADR-0030, ADR-0035); no tool deletes anything.
- **No board or asset editing.** A board is a board file (ADR-0024) and an asset
  is a file, not a page (ADR-0022); the agent may reference a path, not rewrite
  one.
- **No bulk enumeration.** No `list_notes` tool: an agent finds notes through
  search, so reading the whole vault is not one call.
- **No approval step, no consent dialog, no per-tool permission.** An agent acts
  as the user; the record is the acceptance mechanism (ADR-0036), and WebMCP's
  consent API is still a draft.
- **No revert.** Review only, as `add-agent-activity-log` states.
- **No second transport.** No MCP server, no stdio, no local process: filesystem
  agents already read and write the folder, and giving them a second face is a
  different change.
- **No file watching and no staleness protocol.** The vault already refreshes on
  window focus, tab visibility, and folder open.
- **No declarative form annotations**: the app has no forms worth annotating.
- **No prompt-injection defence beyond hints and caps.** A note is untrusted
  content, the tools say so, and a capped result limits what one call can carry.

## Impact

- `src/agent/tools.ts` (new): the tool declarations (names, descriptions, input
  schemas, annotations) and their char budgets.
- `src/agent/actions.ts` (new): the app actions the tools run, including the
  open-page and closed-page write shapes, the name resolution, and the refusals.
- `src/agent/modelContext.ts` (new): the registration and its `AbortController`,
  reading the API defensively so a browser without it is a no-op.
- `src/App.tsx`: the gate, the actions bound to the live vault, index, editor,
  drafts, and session sink.
- Tests: a fake `document.modelContext` (the `fakeHandle.ts` / `fakeEditor.ts`
  precedent) for registration, revocation, and each refusal; `actions` tests for
  both write shapes and the stale match.
- e2e: with `VITE_AGENT_TOOLS=1` and the fake in place, a tool call's change is
  visible in the app; the shipped build registers nothing.
- Version bump: minor, because an agent can now change notes.
