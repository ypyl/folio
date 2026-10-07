# Design

## Context

See proposal.md — Why. The pieces already exist:

- The trail lives in `src/App.tsx` (`trail`, `handleBack`, `handleForward`,
  `canStep`); the status bar's controls call the handlers and use `canStep` for
  their disabled states.
- The shortcuts reference is data (`SHORTCUT_GROUPS` in
  `src/components/shortcuts.ts`) rendered by `ShortcutsList`, and each row is
  already a control: `App.applyShortcut` replays an editor row at the editor's
  key surface and an app row by dispatching a `keydown` on `document`, where the
  app's own listeners live.
- The editor is CodeMirror. Its `defaultKeymap` binds `Mod-[` to `indentLess`
  and `Mod-]` to `indentMore`, and `indentWithTab` binds `Tab` / `Shift+Tab`.

## Goals / Non-Goals

**Goals:**

- One implementation of stepping: the chord calls the same handler the status
  bar control calls.
- One place that owns the chord, covering editor and non-editor focus.
- The reference row and the status bar control agree on when stepping is
  available.

**Non-Goals:**

- No change to the trail's model, the adapter seam (`EditorAdapter`), or the
  editor's own key surface beyond superseding the two chords.
- No `Alt+←/→` binding (see proposal.md — Non-goals).

## Decisions

**D1 — Claim the chord at the document, in the capture phase.** One listener on
`document` maps `Mod+[` / `Mod+]` to `handleBack` / `handleForward`. Capture
runs before CodeMirror's `contentDOM` handler, so `preventDefault()` and
`stopPropagation()` keep the editor's `indentLess` / `indentMore` binding from
acting, and the same listener covers focus outside the editor. The alternative —
an editor keymap entry plus a separate document listener — needs the adapter to
expose a history callback, changing the seam (ADR-0010) and splitting one action
across two files. The listener is registered with the handlers and `trail` in
its deps, so it re-registers on a navigation and never on a keystroke; it reads
`e.ctrlKey || e.metaKey`, `e.key`, and the trail, allocates nothing, and touches
no vault data.

**D2 — Claim the chords whenever a vault is open; do nothing at the trail's
ends.** This is Logseq's behavior for the same chords: they are always the
history chords, so a user's muscle memory always means the same thing, and at
the ends they are inert exactly as the status bar controls are disabled there.
The alternative — claim only when `canStep` — makes the editor's list indent
appear and disappear as the trail grows and shrinks, which is harder to predict.
With no vault open the app does not claim the chord at all: the landing screen
is a plain page with no history to browse, and on macOS `Cmd+[` is the
browser's own Back, which should keep working there.

**D3 — A history row disables on its own, via an optional per-row surface.**
`ShortcutItem` gains an optional `surface`, and `canApply` widens from
`{ editor, app }` to a record keyed by surface including `back` and `forward`
(App passes `canStep(trail, -1)` / `canStep(trail, 1)`). A row's gate is its
`surface`, falling back to its group's `target`, so no other row changes. The
alternative — leave both rows enabled — would let a click silently do nothing
while the status bar's matching control is disabled, which contradicts the
reference's existing "unavailable rows are disabled" rule. `onApply` keeps the
group's `target`, so a history row still applies through the existing document
dispatch.

## Risks / Trade-offs

- **`Mod+[` / `Mod+]` no longer indent lists.** `Tab` and `Shift+Tab` still do
  (`indentWithTab`), and Logseq does not use those chords for indent either →
  stated in the `history` requirement so it is a decision, not a silent loss.
- **macOS `Cmd+[` is the browser's Back.** While a vault is open, capture
  swallows it, so the compact shell's browser-Back step is no longer reached
  through that chord; the on-screen controls and the Android Back gesture still
  are → accepted, since the in-app chord must win to be useful.
- **A document capture listener sees every keydown.** It returns on the first
  modifier check for ordinary typing → no allocation, no vault data, no render.
- **The reference's synthetic keydown targets `document`.** Its capture and
  bubble listeners on `document` are both at-target and run in registration
  order, so the listener receives it → covered by an integration test that
  activates the row's control.
