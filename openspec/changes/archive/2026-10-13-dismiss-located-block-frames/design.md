# Design

## Context

The located-block frame is a single slot of App state,
`matchHighlight = { path, blocks, nonce } | null`. A locate sets it; `EditorPane`
is handed it only when its `path` matches the open page, and the editor frames
those blocks. The seam already clears: `highlightBlocks([])` unframes everything,
and the pane clears on a null `highlight`. Nothing ever sets the slot back to
null, so the frames outlive every interaction. See `proposal.md — Why`.

`Escape` is the app's busiest key. It is already claimed by the search spotlight
(clear query and close), the results view (close), the app tour (end), the
presentation deck (exit fullscreen, then close), the row context menu (close),
and the editor's completion popup. Those are the surfaces this gesture must not
break.

## Goals / Non-Goals

**Goals:**

- One gesture clears the frames, with the key ordering correct so no existing
  surface loses its `Escape`.
- The frame's lifetime rules stay exactly as they are; only an end is added.

**Non-Goals:**

- Changing what a locate frames, or when a frame is set.
- Any editor or adapter change; the clear path already exists.
- Chrome, a shortcut-sheet row, or persisted state.

## Decisions

### D1. `Escape` is the gesture

It is the search-dismiss convention (browser find, VS Code search), and the
frames are search residue, so it is the key users already reach for while
looking at them. Rejected: a dismiss control (adds chrome to a mark that
deliberately has none), a `Mod`-chord (unconventional here and only discoverable
if the sheet lists it), and click-to-clear (a caret click is not "I am done",
and it would fight the frame's job of staying glued to a block through edits).

### D2. The listener lives in `App`, at the document, gated

`matchHighlight` is App state, so the clear is one `setMatchHighlight(null)`.
The listener is on `document` rather than the editor because the frames are
visible whatever holds focus, and requiring editor focus would make the gesture
silently fail after a search closes. Gating:

- Ignore the key when `event.defaultPrevented` is set. This is the real gate: a
  surface that claims `Escape` reports it by `preventDefault()`, the same
  contract `chord.ts` states for claimed chords. The search spotlight and the
  shared result-list handler gained that call; the row context menu, the app
  tour, and the editor's completion popup already had it. The spotlight still
  closes through its own `onClose`, so suppressing the key's default does not
  leave the dialog open.
- Also ignore it while a surface App tracks is open: `searchOpen`, `tourOpen`,
  `importView !== null`, `slides !== null`, or `mode === 'results'`. This covers
  a surface that closes on a separate event, such as the presentation deck's
  fullscreen step.
- Otherwise clear.

Rejected: guarding on state alone. In a browser React flushes a discrete event's
state before the native event reaches `document`, so by the time this listener
runs the spotlight has already closed and `searchOpen` is false — it would clear
the frames it was meant to leave. `defaultPrevented` is set during the surface's
own handling, before any flush, so it survives the ordering.

`setMatchHighlight(null)` when the slot is already null is a no-op React bails
out of, so pressing `Escape` with no frames is free.

### D3. Clearing is session-scoped, to the empty slot

Because there is one slot, "clear" means the page is no longer remembered as
framed: coming back to it shows nothing, and the next locate sets the slot
again. Rejected: hiding the frames but keeping the slot (they would reappear on
return, which is the surprise being fixed) and a per-page map (there is nothing
to keep).

## Risks / Trade-offs

- **Escape is overloaded.** A mis-ordered listener could drop frames or eat an
  overlay's key. Mitigation: claiming surfaces report the claim with
  `preventDefault`, so `defaultPrevented` is the primary gate and the explicit
  open-surface checks back it up; each is covered by a test, and the frame-clear
  is the lowest priority in the stack.
- **A habitual Escape loses a reference the reader wanted.** Mitigation: the
  spotlight keeps the query, so re-locating is open the spotlight and click the
  result — cheap and already specified.
- **Compact shell.** The editor is one of three views; the frames belong to it,
  and the same guards apply. `Escape` in another compact view still clears a
  frame the user cannot see, which is harmless because the slot is empty
  thereafter. Recorded, not solved.

## Migration Plan

No data migration; nothing is persisted. Rollback is reverting the commit.

## Open Questions

None.
