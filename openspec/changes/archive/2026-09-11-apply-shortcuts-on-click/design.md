## Context

See proposal.md — Why.

- The reference is `ShortcutsList` in the right meta panel's last accordion section,
  fed by `SHORTCUT_GROUPS` in `src/components/shortcuts.ts`. `shortcuts.test.ts`
  already holds a drift guard: it mounts a real `MilkdownAdapter` and asserts the
  sheet's rows match the editor's live keymap (Bold, heading levels 1-6, Open
  reference). Today that guard protects documentation.
- The editor sits behind `EditorAdapter` (`src/editor/editor.ts`); ProseMirror
  lives in `MilkdownAdapter`. `App` composes panes and never touches ProseMirror
  (ADR-0010).
- The commonmark preset binds the sheet's chords through ProseMirror `keymap`
  plugins, one ctx key each; there is no chord→command registry to look a command
  up in. The code-block component binds `Mod-Enter` and `Backspace` inside its own
  CodeMirror surface, not on the ProseMirror DOM.
- `Shift+Mod+V` is not a binding at all: the markdown-aware paste handler reads
  the modifier from the paste event.
- Relevant requirements: ui-shell's keyboard-shortcuts reference (rows, the
  key-range entry for heading levels, "a disclosure, not a modal surface").

## Goals / Non-Goals

**Goals:**

- Clicking a documented chord does exactly what pressing it does, including
  toggling off — the un-format case is the point.
- One mechanism, so the sheet's chords cannot drift from the commands they claim.
- Zero cost on the typing path.

**Non-Goals:**

- No new commands, no toolbar or palette, no remapping (proposal Non-goals).
- No pressed state on the rows, and no subscription to editor state.
- No new derived data, index work, or filesystem access.

## Decisions

**D1 — Uniform: every row whose chord is a live keydown binding becomes a control.**
One button per chord, `<kbd>` inside it; the label stays text. Three rows carry two
chords each, so a whole-row button could only replay one of them arbitrarily.
*Alternative:* make only the toggle rows clickable — same code, but two affordance
classes in a 280px column with nothing to tell them apart at rest.
*Alternative:* disable rows proactively by caret context — needs the panel
subscribed to editor selection, i.e. a re-render per keystroke and rows flickering
while typing.

**D2 — Replay the chord as a synthetic `KeyboardEvent`; the outcome is
`event.defaultPrevented`.**
ProseMirror's keydown path has no `isTrusted` check (`prosemirror-view`
`editHandlers.keydown` → `someProp("handleKeyDown")`, `prosemirror-keymap`
`keydownHandler`), and it calls `preventDefault()` when a handler claims the key,
so a replay resolves exactly like a real keypress and reports whether anything
claimed it.
*Alternative:* a hand-wired chord→command table. Rejected: it would have to
re-derive `toggleMark`'s `removeWhenPresent` (the feature's payload),
`ToggleInlineCode`'s empty-selection no-op and strip-other-marks rule, and would
need its own drift guard, while replaying makes the live keymap the single source —
so the existing guard now protects runtime behaviour.
`cancelable: true` is required: `preventDefault()` on a non-cancelable event does
nothing, and the signal would silently report "not applicable" for every chord.

**D3 — `Heading 1-6` splits into six rows, one per level.**
The range existed because six chips on one row measured 522px and the alternative
considered then — letting the row wrap to three lines — was rejected as visibly
broken. Six separate rows were never weighed, because rows were inert labels then.
Every heading row is narrower than the "Paste as plain text" row, which the spec
already requires to fit on one line.
*Alternative:* click expands the range to six in place — a two-step interaction in
a list where every other click is one step, plus new widget state.
Splitting also deletes the range rendering case, the `expandRange` test helper, and
the parser's `..` branch.

**D4 — `Paste as plain text` stays a plain, non-interactive row (`replayable: false`).**
`Mod+Shift+V` is read inside the paste handler, not bound on keydown, and an
untrusted event cannot trigger a browser paste or carry clipboard data.
*Alternative:* read the clipboard and insert literally — async, permission-gated,
and a different kind of action from every other row, for a case the paste rule
already handles (it inserts literally whenever the clipboard does not look like
Markdown). *Alternative:* remove the row — it is the only in-app documentation of
the chord, and no spec requires it, so a flag is cheaper than the loss.

**D5 — Coarse gating, silent no-ops.**
Editor rows are disabled when no editor is mounted (`mode === 'page' && page !== null`,
which also covers the brand empty state, the results view, and indexing, where the
graph is null so no page is open); the search row is disabled when no vault is open,
matching `SearchBox`. Disabled uses the app's existing treatment (`opacity: .45`,
`cursor: default`, `:hover:not(:disabled)`) and stays a *dimmed button*, not a plain
chip — "unavailable right now" and "never a control" are different facts. Fine-grained
no-ops (Indent outside a list, `wrapIn` already wrapped, Inline code with no selection,
Undo with empty history) are silent, with the native `:active` press as the only
feedback: the contract is "click = press that key", and the document on screen
explains the result. `defaultPrevented` is therefore a test/observability signal, not
something the UI reacts to.

**D6 — Focus the editor, then dispatch; the selection survives without a
`mousedown` trick.**
ProseMirror never touches `state.selection` on blur (`handlers.blur`), ignores DOM
selection changes while unfocused (`hasFocusAndSelection`), and `view.focus()` writes
`state.selection` back to the DOM (`selectionToDOM`). So the adapter focuses, then
dispatches, and the command reads the range the user selected — which is what lets
the toggle land on it and what keeps the button a real button (`:active`,
`:focus-visible`, native focus).
*Alternative:* `preventDefault` on `mousedown` so the editor never blurs. Rejected:
it can suppress `:active` in some browsers, which would quietly remove D5's only
click feedback, and it would make the mouse and keyboard paths diverge.

**D7 — The adapter remembers the surface the caret is in.**
`Mod-Enter` and `Backspace` are bound inside the code block's CodeMirror surface,
which owns the caret while the caret is in a code block; `view.focus()` targets the
ProseMirror root and would lose that. The adapter records the last `focusin` target
inside its mount root and dispatches there, falling back to `view.dom` when the
element is gone (a deleted code block).
*Alternative:* mark those two rows non-interactive — they are genuinely replayable,
so that would hide our dispatch limitation rather than describe the app.
*Alternative:* blind fallback dispatch at any `.cm-editor` — dangerous: a stray
"Cancel code block" click could rewrite an unrelated code block.

**D8 — The seam.**
- `SHORTCUT_GROUPS` gains a per-group `target: 'editor' | 'app'`; `ShortcutsList`
  calls `onApply(chord, target)` and learns nothing about ProseMirror.
- `EditorAdapter` gains `applyChord(chord): boolean` (focus the caret's surface,
  dispatch, return `defaultPrevented`). `EditorPane` exposes it through
  `useImperativeHandle` (React 19 ref-as-prop), so `App` never depends on the editor
  contract for one method.
- `MetaPanel` takes the reference as a node prop, following the `search` prop `App`
  already passes to `Header`, so the panel stays layout and knows nothing about
  shortcuts.
- `chordToKeyEventInit` lives in `src/editor/chord.ts`: the adapter is its primary
  consumer and `App` already imports editor modules (`DraftStore`,
  `createDebouncedSaver`). `displayKeys` stays with the display data in
  `src/components/shortcuts.ts`.
- App-level rows dispatch on `document`, which is where `SearchBox` already listens —
  so the `search` capability is unchanged.

**Keystroke budget (AGENTS.md).** Nothing is added to the typing path.
`applyChord` runs on click only. The one new listener is `focusin` on the editor
mount root: it fires on focus changes, not per keystroke, and costs O(1). The panel
does not subscribe to editor selection — that rejection in D1/D5 is what keeps it
out of the keystroke path. `ShortcutsList` already re-renders whenever `App` renders,
including per keystroke through `setDraftVersion`; the added buttons change nothing
about that, and `memo` on `ShortcutsList` (a stable callback plus two booleans) would
make it strictly cheaper than today — optional, not required. No derived data is
introduced, and nothing in the change scales with vault or document size.

**Markdown stays canonical.** The applied commands write through the existing
serializer like any edit: un-bolding removes `**` from the file on save and the
change lands in the undo history. No parallel representation, no shadow state.

## Risks / Trade-offs

- [Untrusted event means no browser default action] → By design. Tab cannot move
  focus and Backspace cannot delete natively; it also means a synthetic Backspace
  can never delete text, which is what makes the context-gating in D5/D7 sufficient.
- [A row that is a button but no-ops in the current context] → Accepted. The
  contract is "click = press that key"; the document on screen explains the result
  and `:active` confirms the click landed.
- [`defaultPrevented` is not used by the UI] → Recorded as a test and observability
  signal only, so it is not later cited as the reason for a feature.
- [The paste chip looks like a live chip at rest] → The absence of `cursor: pointer`
  and of any hover response is the cue; recorded as a known limitation rather than
  decorated with a resting style for one row.
- [A keyboard user who activates a row is moved into the editor] → Correct
  destination for a formatting command and consistent with the mouse path. If it
  proves annoying, the fallback is to keep focus on the button for the keyboard
  path only, at the cost of two paths. Needs no spec or task change.
- [Non-ASCII keyboard layouts] → The replay sets an explicit `key` and has no
  `keyCode`, so it is layout-independent; a real keypress on a non-Latin layout
  relies on a keyCode fallback the replay does not need.
- [Two keymap plugins claim one chord] → First in plugin order wins, exactly as for
  a real keypress. No new failure mode.
- [jsdom has no CodeMirror] → The two code-block rows (D7) are verified manually.
- [A preset upgrade rebinds a chord] → The existing live-keymap drift guard covers
  the sheet, and since the sheet's chords now drive dispatch, that guard protects
  behaviour rather than documentation.

## Verification

What the tests must pin, beyond the usual unit coverage:

- `chordToKeyEventInit` for every chord shape, including that the event is
  `cancelable` (without it, D2's signal can never be true).
- The payload: a bold run, selected, `applyChord('Mod-b')` removes the `**` from the
  serialized document; applying it again puts it back.
- Drift: every interactive row's chord resolves in the live keymap.
- Gating: editor rows disabled with no page open, the search row with no vault.
- Focus: after a row applies, `document.activeElement` is inside the editor.
- `FakeEditor` records applied chords, so pane and App tests can assert a click
  reached the editor without mounting ProseMirror.
- Manual: the two CodeMirror-bound rows with the caret inside a code block.
