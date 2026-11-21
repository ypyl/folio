# Design

## Context

See `proposal.md` for why. The seams this change composes, and what they already
guarantee:

- `EditorAdapter` (ADR-0010) exposes `setContent`, `insertMarkdown`,
  `appendMarkdown`, `onChange`, and `highlightBlocks`. `CodeMirrorAdapter`
  dispatches a real transaction for all of them, so `history()` sees the change
  and `onChange` reaches the draft and the save. `setContent` replaces the whole
  document and resets the selection to `0`, which is why it is not the edit path
  this surface uses.
- `DraftStore` holds the working and saved text per page; `createDebouncedSaver`
  queues writes sequentially so two flushes never interleave; `upsertPage` and
  `upsertReminders` are the write-through functions that keep the index true
  (`src/vault/index.ts`).
- `resolveReferencePath(name, byName)` is the naming rule: a valid calendar date
  is a journal day (ADR-0019), otherwise `pages/<Name>.md`.
- `parseReminders` / `renderReminders` / `upsertReminders` own the reminder file's
  grammar (ADR-0031) and re-render it canonically.
- `VaultStorage.remove` exists for the trace's pruner only (ADR-0030, ADR-0035),
  so no tool can delete.
- `document.modelContext.registerTool(tool, { signal })` retires a tool on abort;
  annotations (`readOnlyHint`, `consequentialHint`, `untrustedContentHint`) are
  hints to the agent; the page learns nothing about which client called it.

## Goals / Non-Goals

**Goals:**

- One envelope per tool, one action per tool, no logic that a surface does not
  also have.
- The two write shapes stated once, so no tool has to re-decide them.
- A gate that removes the whole surface, not just its UI.

**Non-Goals:**

- No tool that takes a path where a name would do, and no tool whose result is the
  page it just wrote.
- No transaction log, no per-call approval, no undo stack of our own.

## Decisions

**D1: One declaration module, one action module.**
`src/agent/tools.ts` declares `{ name, description, inputSchema, annotations,
action }` per tool; `src/agent/actions.ts` implements the actions against passed
collaborators (storage, index, drafts, editor handle, sink). The declaration module
carries no behavior, so its char budgets and schemas are testable without a vault.
Alternative rejected: a tool class per tool, which would repeat the envelope nine
times.

**D2: Every write goes through a write-through function, never `storage.write`.**
`create_note`, `edit_note`, and `append_note` end in `upsertPage`; `add_reminder`
ends in `upsertReminders`. That is what makes the app's own view true when the call
returns, and it is the reason the tools belong in the app rather than in a wrapper
over the folder.

**D3: Two write shapes, chosen by whether the page is open.**

```
  target open      -> one editor transaction, matched against the live document
                      (draft text, one dispatch, caret mapped, one undo step)
  target closed    -> read the file, replace the match, upsertPage
```

The match and the mutation read the same snapshot. Writing the file of an open
page would be overwritten by the debounced saver within a second, and reading the
file of an open page would match text the user has already changed away from.
`edit_note` uses exact-string replacement (`old_string`, `new_string`) rather than
whole-page replacement: it composes with typing, cannot truncate a page by
accident, and fails loudly when the text moved.

**D4: Results are summaries.**
A write returns `{ ok, path, added, removed }` and never the new text. A read
returns one page, or a capped row list from search, and a window of lines with a
character cap. `app_state` returns the open path, the folder's name, today's
journal day, and the day's reminder count. Alternative rejected: returning whole
notes, which spends the agent's output budget, invites a hallucinated rewrite, and
turns one read into a vault dump.

**D5: Refusals are typed, not silent.**
The text tools refuse a path under `.folio/` (its files have their own writers),
a name that is shaped like a path, a path that is not Markdown (assets are files,
ADR-0022), a match that is absent or not unique, an unknown tool, and a tool
called with no folder open. Each returns a distinguishable failure the agent can
act on, because a silent no-op is what makes an agent retry blindly.
`create_note` also refuses a page that already has text: its name says create,
and the alternative is erasing a page the caller did not read.

**D6: The gate owns the registration, and revocation is immediate.**
While the gate is on, `App` registers the tools once with one `AbortController`;
turning the gate off or unmounting aborts it, which retires every tool before the
next frame. With the gate off the page registers nothing at all: an agent that
lists tools sees an empty set. The API is read defensively
(`document.modelContext?.registerTool`), so a browser without WebMCP is a no-op
rather than an error, and tests drive a fake `modelContext` the way
`fakeHandle.ts` drives storage.

**D7: Annotations are honest, and the app claims no enforcement.**
Reads carry `readOnlyHint`, writes `consequentialHint`, and every tool that returns
note text carries `untrustedContentHint`, because the vault holds imported and
pasted content. The app does not add a confirmation dialog: the spec does not
enforce consent yet, and the record plus reviewability is the acceptance
mechanism ADR-0036 records.

## Keystroke budget

What does this add to the typing path, and what does that cost scale with?

- Nothing. A tool call is an event handler like any other; the typing path is
  unchanged, and a keystroke triggers no registration, no schema work, and no
  tool lookup.
- Registration costs nine `registerTool` calls once per gate flip, not per
  keystroke. A tool call costs one page read (none when the target is open), one
  string match, and one dispatch or one write; nothing scales with the vault.
- The activity record's append is bounded at 200 entries (`add-agent-activity-log`).

Measurement: `actions` tests pin that `edit_note` on the open page performs one
editor dispatch and no storage write, and that a closed-page edit performs one
write and one index upsert. `tools.test.ts` pins the char budgets (name ≤ 30,
description ≤ 500, parameter description ≤ 150).

## Testing

- Unit: the declarations' budgets and schemas; each action's success and each
  refusal; `edit_note`'s stale match; `add_reminder`'s canonical re-render.
- Integration: registration while the gate is on, nothing while it is off, and
  revocation on a gate flip against the fake `modelContext`; an open-page edit
  reaching the draft and the save; a closed-page edit reaching the index.
- Browser check: the same registration and one call with Chrome's
  `chrome://flags/#enable-webmcp-testing` enabled, so the real API shape is
  exercised once outside the fake.
