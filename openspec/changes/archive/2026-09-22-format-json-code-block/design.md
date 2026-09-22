## Context

See proposal.md — Why. The code block's editing surface is a CodeMirror 6 editor owned by `@milkdown/components` (ADR-0014); `src/editor/codeBlockSetup.ts` supplies its extensions and theme, and `src/editor/milkdown.ts` (the `MilkdownAdapter`) already installs a capture-phase key handler on the editor mount root for the one key ProseMirror's keymaps get wrong. Two facts shape the approach:

- The code block's node view implements `stopEvent() { return true }` (`@milkdown/components/src/code-block/view/node-view.ts`), so ProseMirror treats every DOM event originating inside the block as the block's own. A ProseMirror keymap chord never fires while the caret is in a code block.
- CodeMirror's own keymaps cannot own the chord either. Its `searchKeymap` binds `Mod-f` in the editor scope, and CodeMirror resolves a character chord by trying the *unshifted* key first: `Mod-Shift-f` reaches the search binding before the shifted one. `Mod-f` must keep opening search, so the shifted chord cannot be layered on top of it from inside CodeMirror.

Meanwhile the code surface keeps ProseMirror's selection synced into the block (`forwardUpdate`), so at the moment a chord is pressed, the code block node — its language attribute and its text — is reachable from the ProseMirror state. The command is therefore a ProseMirror command, and only its *invocation* needs a home outside both keymaps.

## Goals / Non-Goals

**Goals:**

- Reformat a JSON code block in place, on demand, with the standard library alone.
- Keep the agreed chord (`Mod-Shift-f`) and make it work from a real keypress and from the shortcuts reference's replay.
- Leave the typing path untouched: nothing runs per keystroke, on paste, on save, or on open.
- Keep Markdown canonical: the formatted text is the block's content and serializes through the same fence.

**Non-Goals:**

- Any language other than JSON, and any formatter dependency.
- Repairing, validating, or reporting on malformed JSON.
- A toolbar button, menu entry, or settings toggle.

## Decisions

**D1. The adapter claims the chord in the capture phase; the format is a ProseMirror command.**
`MilkdownAdapter` already listens for `keydown` on the mount root in the capture phase, ahead of both surfaces, for forward-delete in list items. The JSON format chord joins it: when the caret is in a code block, the adapter claims `Mod-Shift-f`, runs the ProseMirror command against the synced selection, and stops the event so CodeMirror's search never sees it. Outside a code block the adapter declines and the chord is left alone.
*Alternatives rejected:* a ProseMirror keymap (never receives the key — the node view stops events); a CodeMirror keymap (the search binding wins the unshifted lookup, so a real keypress works but the shortcuts replay does not, and moving the chord onto `Mod-f` would hijack search); a different chord (the one the user chose is `Mod-Shift-f`, and no other candidate is both mnemonic and free).

**D2. The command reads the node's language attribute, not the loaded grammar.**
The fence carries the language on the node (` ```json ` or the picker's `JSON`), and that attribute is the canonical on-disk form (ADR-0001). Comparing it case-insensitively is enough; there is no need to reach into the code surface's language state.
*Alternative rejected:* reading CodeMirror's `language` facet through the node view — that couples the command to the component's internals for no behavioral gain.

**D3. Formatting is `JSON.parse` then `JSON.stringify(value, null, 2)`.**
The standard library does exactly what was asked: two-space indent, key order and values preserved. No dependency, no bundle weight, no per-language registry.
*Alternative rejected:* Prettier standalone with only its JSON parser. It costs on the order of a megabyte and its parser support, against ADR-0006's keep-it-small guardrail, for a transformation `JSON` already performs.

**D4. Write-back is one ProseMirror transaction over the block's content.**
The command replaces the code block's text with the formatted string and puts the caret at the block's start. The component's node view then syncs its CodeMirror document from that node, so the surface shows the formatted text and the Markdown listener serializes it. One path to the document, so the on-disk contract cannot drift.
*Alternative rejected:* editing the CodeMirror document and letting its update listener write back — it works, but it puts the transformation behind the component's sync instead of in front of it, and needs the chord inside CodeMirror, which D1 rules out.

**D5. The command declines when it cannot change anything, and the adapter claims the chord for every code block.**
The command returns `false` when the caret is not in a code block, when the language is not JSON, when the text does not parse, or when the formatted text equals the current text; a decline writes nothing and records no undo step. The adapter still claims the chord whenever the caret is inside *any* code block, so an attempted format on a non-JSON or invalid block does nothing at all rather than falling through to CodeMirror's search binding.

**D6. Two-space indent.**
`JSON.stringify`'s conventional indent, and what the user means by "readable". No setting.

## Risks / Trade-offs

- **A chord claimed outside both keymaps is invisible to the shortcuts drift guard**, which reads ProseMirror keymaps from the editor context. → Register the chord in the guard's `CHORDS_BOUND_ELSEWHERE` set with a comment naming the adapter's key handler, and cover the command, the chord match, and the no-op cases with tests.
- **The adapter's key handler now owns two chords.** → Keep the match narrow (primary modifier, shift, `f`, no Alt) and the comment in the handler explains why the chord cannot live in a keymap, as the forward-delete branch already does.
- **The format chord shadows CodeMirror's search for a shifted `Mod-f` inside a code block.** → Accepted and deliberate: inside a code block the chord means format; search stays on `Mod-f`.
- **The chord is not claimed with the caret in prose.** → Intended; the adapter declines there and leaves the chord to the app.
- **The command relies on the code surface keeping ProseMirror's selection inside the block.** → It does so on every update (`forwardUpdate`), and a unit test covers the command directly against a selection in the block; if that sync ever breaks, the chord becomes a no-op rather than a wrong edit.
