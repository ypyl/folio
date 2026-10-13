# Proposal

## Why

Opening a search result — or a Contents heading — frames every block that holds
the match, and the frames are deliberately sticky: they survive edits, they
survive leaving the page and returning, and they never fade. There is no way to
dismiss them. Once the reader has answered "where does this term appear?", the
frames become noise on the page with no way out. This adds one gesture to clear
them.

## What Changes

- Pressing `Escape` when no other surface claims the key clears the locate
  frames. `Escape` is the search-dismiss convention, and the frames are the
  residue of a search; it needs no new chrome and no new chord.
- The clear is app-level (the frames are visible whatever holds focus) and
  session-scoped: the page stays unmarked when it is opened again, and the next
  locate re-arms it. Nothing is written.
- `Escape` yields to every surface that already claims it: the search spotlight,
  the results view, the app tour, the presentation deck, the row context menu,
  and the editor's own completion popup.
- The frame's existing lifetime is unchanged: an edit does not clear it, leaving
  the page and returning keeps it, and it never fades.

Not in scope (non-goals):

- No dismiss button or any other chrome on the frame.
- No clear on edit, no clear on navigation, no auto-fade, no timeout.
- No new keyboard chord, and no shortcut-sheet row: `Escape` is an ambient
  gesture the sheet does not list.
- No change to what a locate frames, to search ranking, or to snippets.
- No persistence: a reload shows no frames.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `editing`: "The editor frames the located block" gains the dismissal —
  `Escape` clears the frames unless another surface claims it, and a cleared
  page stays unmarked when reopened.

## Impact

- `src/App.tsx`: one `Escape` handler that clears `matchHighlight` when no
  overlay is open.
- `src/components/EditorPane.tsx` and `src/editor/`: no change — the seam
  already clears on an empty block list, and no editor behavior changes.
- `DESIGN.md`: the Search match rule names `Escape` as the way out.
- Cost: nothing on the keystroke path — the handler runs only on `Escape` and
  writes one state slot. No ADR is needed; the change adds a gesture to an
  existing rule and touches no architectural decision (ADR-0010 keeps the
  editor and the app's locate state where they already are).
