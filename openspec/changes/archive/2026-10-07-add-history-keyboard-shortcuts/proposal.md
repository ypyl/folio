# Proposal

## Why

The app has Back and Forward controls in the status bar, but no keyboard
shortcut for them: the pointer is the only way to step through the session
history. Logseq, the app Folio is an alternative to, binds `Ctrl+[` / `Ctrl+]`
for exactly this (`Cmd+[` / `Cmd+]` on macOS), so a user coming from Logseq
already reaches for those chords and finds nothing. Adding them closes the one
gap a switching user notices first, and it costs no new surface.

## What Changes

- The app binds `Mod+[` to Back and `Mod+]` to Forward on the session history
  trail, matching Logseq's chord: `Mod` is `Ctrl` on Windows and Linux and `Cmd`
  on macOS. Stepping from the keyboard is exactly what the status bar's Back and
  Forward controls already do — the cursor moves one entry, the page or board it
  then marks opens, and no trail entry is added.
- The chords act wherever focus is, including inside the editor. This supersedes
  the editor's own binding for those two combinations (list outdent and indent);
  `Tab` and `Shift+Tab` remain the indent chords, and nothing else about the
  editor's keys changes.
- The app claims the chords while a vault is open. With no vault open the
  landing screen leaves them to the browser. When the trail has nowhere to step
  in that direction the chord does nothing, exactly as the corresponding status
  bar control is disabled there; it never falls through to another action.
- The Keyboard shortcuts reference gains a Back row and a Forward row, one key
  each, under its App section. Each is a control that applies its chord, like
  every other row, and each is disabled when the trail has nowhere to step in
  its direction — the same rule the status bar controls follow.

Nothing else changes: the trail's contents, cap, session lifetime, and
folder-switch reset are untouched, as are the status bar controls, the pointer
paths, and every route that records a trail entry.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `history`: a new requirement that the trail is navigable from the keyboard,
  binding `Mod+[` and `Mod+]` and defining their scope and their no-op at the
  trail's ends.
- `workspace`: the keyboard-shortcuts reference requirement gains the two
  history chords in its list, and the "a shortcut row applies its key
  combination" requirement gains the history rows — what activating one does,
  and when one is disabled.

## Impact

- `src/App.tsx`: one document-level key listener (capture phase, so it claims
  the chord before the editor does) mapped to the existing `handleBack` and
  `handleForward`; the shortcut availability it passes down gains the two
  per-row gates.
- `src/components/shortcuts.ts`: two rows (Back, Forward) in the App group, and
  an optional per-row availability gate so each disables on its own.
- `src/components/ShortcutsList.tsx`: read the per-row gate, defaulting to the
  group's surface.
- `src/App.integration.test.tsx` and `src/components/shortcuts.integration.test.ts`:
  the pinned sheet inventory and the new chord behavior.
- Related ADRs: ADR-0010 (the app owns its own key listeners; the editor keeps
  its key surface) and ADR-0012 is untouched. No new ADR: this binds an existing
  action to a key.
- No vault, storage, index, parser, or Markdown change. Nothing is written and
  the keystroke path gains no work: the listener is one document listener and
  reads state that already exists.
- Version: a minor bump (a new user-facing shortcut).

## Non-goals

- No `Alt+←` / `Alt+→` binding: Logseq's alternate chord collides with the
  editor's own caret movement and with the browser's Back/Forward, and the
  `Mod+[` / `Mod+]` pair is Logseq's primary chord.
- No change to the status bar's Back and Forward controls, their order, or their
  disabled states.
- No change to the trail itself: not its cap of 20, not its session-only
  lifetime, not its reset on a folder switch, and not when an entry is recorded.
- No new configurable shortcuts or settings screen, and no Vim-style or
  go-to chords (`g h`, `g j`, and the like).
- No backend, no database, no block-based document model.
