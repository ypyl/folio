## Why

Folio's keyboard-shortcuts reference documents every chord the app binds, but the
chords only exist on the keyboard: there is no toolbar, and nothing tells a user
how to un-format text. A user who types `**x**` and regrets it cannot type their
way out — the Markdown input rules only ever *add* formatting, and the WYSIWYG
view hides the markers that would let them remove it by hand. Reading `Ctrl+B` in
a list is not the same as having it in reach.

This change makes the reference's key combinations act: clicking one applies it,
exactly as pressing it would. The un-format case — select bold text, click
`Ctrl+B`, get plain — is the payload, not a side effect.

## What Changes

- Every row in the keyboard-shortcuts reference whose key combination is a live
  keydown binding becomes a control. Each key combination is its own button;
  three rows carry two chords each, so the label stays text and the chords are
  the buttons.
- Activating one applies that combination to the editor. The reference becomes
  the dispatch surface rather than gaining a second copy of the commands, so the
  behaviour is whatever the chord does — including toggling: `Ctrl+B` over bold
  text yields plain, and clicking again restores it.
- `Heading 1-6` splits from one key-range row into six rows, one per level, each
  with its own button. The range existed because six chips on one row measured
  522px; six rows each fit on one line at the panel's width.
- Rows are disabled (dimmed) when their surface is unavailable: editor rows with
  no editor mounted (brand empty state, results view, while the index builds),
  the search row with no vault open.
- `Paste as plain text` stays a plain, non-interactive row. `Mod+Shift+V` is a
  modifier read inside the paste handler, not a keydown binding, so a click
  cannot reach it — a click is not a paste.
- Applying a combination leaves focus in the editor (or in the search input, for
  the search row), so the user can keep typing.
- A new ADR records the mechanism: editor commands are applied by replaying
  their key chord, not through a chord→command table.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ui-shell`: the keyboard-shortcuts reference's rows become controls that apply
  their key combination; heading levels one through six change from a single
  key-range entry to one row per level; rows whose surface is unavailable are
  disabled.

## Impact

Relates to ADR-0010 (editor separate from knowledge management — this extends the
existing editor seam rather than crossing it) and ADR-0006 (keep it small: no
toolbar, no remappable keymap). Adds ADR-0016, which records the replay decision
and its rejected alternative.

- `src/components/shortcuts.ts` — `ShortcutItem` gains `replayable`;
  `SHORTCUT_GROUPS` gains a per-group `target ('editor' | 'app')`; `Heading 1-6`
  becomes six entries.
- `src/editor/chord.ts` (new) — `chordToKeyEventInit`, the inverse of
  `displayKeys`, shared by the editor seam and the app-level row.
- `src/editor/editor.ts` — `EditorAdapter` gains `applyChord(chord): boolean`.
  `src/editor/milkdown.ts` implements it: focus the surface the caret is in,
  dispatch, return `defaultPrevented`; it also remembers the last focused surface
  inside the editor so the two CodeMirror-bound chords (Exit code block, Cancel
  code block) land where they are actually bound. `src/editor/fakeEditor.ts`
  records applied chords.
- `src/components/ShortcutsList.tsx` + `.module.css` — chips become buttons with
  hover, focus-visible, and disabled treatments; `src/components/MetaPanel.tsx`
  takes the reference as a node prop; `src/components/EditorPane.tsx` exposes
  `applyChord` through an imperative handle; `src/App.tsx` holds that handle and
  routes app-level chords to `document`.
- `adr/0016-apply-commands-by-key-chord.md` (new) plus a row in `adr/README.md`.
- No document-model change, no new dependency, no new persistence, no filesystem
  access. Cost on the keystroke path: none (design.md answers this in full).

## Non-goals

- No formatting toolbar, floating menu, or command palette in or over the editor
  pane. The reference stays where it is: the right panel's last section.
- No editable, remappable, or user-configurable keybindings, and no preferences
  surface.
- No new commands. The change only makes already-documented, already-bound chords
  clickable.
- No clipboard-driven action for `Paste as plain text`, and no
  `navigator.clipboard` permission flow.
- No pressed/active state on the rows: no subscription to editor selection, no
  `aria-pressed`, no live toggling appearance.
- No tooltip or hint line explaining that the rows are clickable.
- No change to search's keyboard behaviour; the search row routes through the
  existing `Cmd/Ctrl+K` handler, so the `search` capability is unchanged.
