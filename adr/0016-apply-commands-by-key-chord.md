# ADR-0016: Apply editor commands by replaying their key chord

- Status: Accepted
- Date: 2026-09-11

## Context

The keyboard-shortcuts reference lists every chord the app binds. Making its rows act means the app must be able to run an editor command from a click, and two facts shape how. First, ProseMirror exposes no chord→command registry: each keymap is its own `ctx` key, and `prosemirror-keymap` closes its binding map over the plugin's `handleKeyDown`, so a chord cannot be looked up. Second, the payload of the feature is the *toggle* — `toggleMark`'s `removeWhenPresent` rule is what turns "select bold text, click `Ctrl+B`" into plain text, and nothing in a hand-written command list would reproduce it by accident.

The editor seam already exists (ADR-0010): the application never touches ProseMirror, it talks to `EditorAdapter`.

## Decision

Apply a chord by replaying it — dispatch a synthetic `KeyboardEvent` at the surface the caret is in, and let ProseMirror's or CodeMirror's own keymap resolve the command.

- The adapter chooses the target: the last element that took focus inside the editor's mount root (which is the CodeMirror surface while the caret is inside a code block), otherwise the ProseMirror root, focusing it first so the selection is restored.
- The event is `cancelable`, and the outcome is reported as `event.defaultPrevented`: ProseMirror calls `preventDefault()` only when a handler claims the key, so the return value is a truthful "applied / not applicable".
- App-level chords use the same mechanism pointed at `document`, where the app's own key listeners already live.
- A chord that is not bound on keydown cannot be applied this way. The paste shortcut's shift modifier is read from the paste gesture rather than bound, so that row stays documentation.

Rejected alternative: a chord→command table behind the adapter. It would have to re-derive `toggleMark`'s sticky-toggle rule, `ToggleInlineCode`'s empty-selection no-op and its strip-other-marks behavior, and would need a drift guard of its own — while the live keymap already *is* the command registry, and the guard in `shortcuts.test.ts` already reads it.

## Consequences

- Toggle semantics come for free: the command owns the toggle and the button is a stateless pipe. The sheet's chord strings become a runtime dispatch table, so the existing drift guard now protects behaviour rather than documentation.
- Reach is limited to keydown-bound commands. Clipboard-driven behaviour is unreachable by construction, not by oversight.
- The event is untrusted, so no browser default action runs: `Tab` cannot move focus and `Backspace` cannot delete text natively. That also means a synthetic Backspace can never delete anything, which is what keeps the contextual rows safe.
- The replay sets an explicit `key` and carries no `keyCode`, so it is layout-independent — unlike a real keypress on a non-Latin layout, which relies on a keyCode fallback the replay does not need.
- The app gained one narrow imperative seam (`EditorPane` exposing `applyChord`); it still does not depend on the editor's own contract.
- If the editor is ever replaced, this decision must be revisited: a different editor may expose real commands, in which case the table rejected here becomes the better shape.
