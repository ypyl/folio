## 1. Reference lexing (`src/vault/parse.ts`)

- [x] 1.1 Add `referenceTrigger(before, after)` returning the in-progress token (kind, raw token text, typed query, and offsets) or `null`, next to the canonical `REF` regex: backwards scan to the last `#`, lookbehind check, `[[...` or `[\w-]*` rest, and the suffix guard that the caret is at the token's end. Verify with unit tests covering both forms, the `word#tag` lookbehind, `#a/b`, a space closing the word form, a bracketed query with spaces, empty typed text, a caret inside `#[[reading list]]`, and two openers on one line resolving to the last.
- [x] 1.2 Add `referenceToken(name, form)` (sticky brackets, word form only for a single `[\w-]+` name) and verify it round-trips: `findReferenceRanges(referenceToken(name, form))[0].target === name` for `reading`, `reading list`, `read-2`, `2.0`, `café`, `a[b`, `a#b`, `weird]name`, and a whitespace-padded name, with the last two asserting the failure that makes them uninsertable.

## 2. Candidate pool and ranking (`src/vault/suggest.ts`)

- [x] 2.1 Add `candidateNames(graph, pins)`: one row per `byName` entry in `orderPages` order, carrying the name, path, and the precomputed lowercased name, dropping names that fail the 1.2 round-trip so every row is insertable. Verify with tests asserting every row resolves (`byName.get(lower) === path`), a case-colliding pair yields one row, journal days are present, and a `]`-containing name is absent.
- [x] 2.2 Add `suggestPages(query, pool, limit = 8)`: stable two-bucket partition (name prefix, then word-start at space/`-`/`_`), no substring tier, match offsets returned for highlighting, and each bucket ceases accumulating at `limit` rows while the scan still visits the whole pool. Verify with tests for tier order, stability against the pool order, real on-disk casing, the cap holding under more than 8 tier-0 matches, `list` finding `reading list`, `09` finding `2026-09-10`, and `eading` finding nothing.

## 3. Popup placement and styles

- [x] 3.1 Add `popupPlacement(caret, size, viewport, gap, pad)` (`src/editor/popupPlacement.ts`): fits below the caret, flips above when short of room, clamps horizontally, and returns `null` when the caret is outside the viewport. Verify with unit tests for each branch, no DOM needed.
- [x] 3.2 Add `src/editor/referenceSuggest.module.css` mirroring the pane's language picker (ivory surface, 8px radius, whisper shadow, no border, `--warm-sand` active row, single-line rows with ellipsis, a maximum width, `user-select: none`) and the matched-span highlight using the same two declarations as the search dropdown's hit mark. Verify by dev-mode inspection that the popup matches the language picker's surface and uses only `DESIGN.md` tokens.

## 4. Editor plugin (`src/editor/referenceSuggest.ts`)

- [x] 4.1 Add the plugin with its own `PluginKey` and the state shape (trigger, suggestions, active, suppressed), an `apply` that returns the previous state when neither document, selection, nor meta changed, the `code_block` and inline-code guards, the provider call, and a `popupVisible` helper that also compares against the suppressed token text. Verify with hand-built-schema state tests (the `referenceBadges.test.ts` pattern): trigger appears and disappears with the caret, the fast path returns the same state object, suppression hides the popup for that token text, and the active index resets when the typed text changes.
- [x] 4.2 Add the `view` hook: create the element once and append it to `view.dom.parentElement` (falling back to `document.body`), render rows with `role="listbox"`/`role="option"`, the matched span, and the active row, position it with 3.1 on every update, reposition on capture-phase `scroll` and `resize`, and remove the element in `destroy`. Verify with a jsdom test that rows and the active row match the state, and that no popup element remains after unmount.
- [x] 4.3 Add focus handling: hide on blur without touching state, re-show on focus via the update path. Verify with a test that a blurred popup is hidden and an untouched token shows it again on refocus.
- [x] 4.4 Add the `handleDOMEvents.keydown` handler: bail when not visible, composing, or the target is inside `.cm-editor`; claim only unmodified `ArrowUp`, `ArrowDown`, `Enter`, `Tab`, and `Escape`; accept with a single `insertText` transaction carrying the suppress meta; move and dismiss with meta-only transactions. Verify with tests for each key's state transition and explicit `event.defaultPrevented === true` assertions for the claimed keys and `false` for `Mod+Enter`, `Shift+Tab`, and the caret keys.

## 5. Seam (`src/editor/editor.ts`, `fakeEditor.ts`, `milkdown.ts`)

- [x] 5.1 Add `setSuggestionSource` to `EditorAdapter` with a comment stating the direction (app to editor, read-only, names only), implement it in `FakeEditor` with a recorder and a test hook, and register the plugin in `MilkdownAdapter` behind the same late-bound closure pattern as `onReferenceClick`. Verify with typecheck plus the existing editor tests, and by driving the pane tests through the fake.

## 6. Wiring (`src/App.tsx`, `src/components/EditorPane.tsx`)

- [x] 6.1 In `App`, memoize `candidateNames(graph, pins)` per graph change, build the `suggest` callback over it, and pass it to `EditorPane`. Verify with a test that a save (new graph) is reflected in the next provider call and that no pool is rebuilt on a keystroke or page switch.
- [x] 6.2 In `EditorPane`, accept the `suggest` prop, keep it current in a ref, and hand the adapter `(query) => suggestRef.current?.(query) ?? []` at mount. Verify with an EditorPane test using `FakeEditor` that the provider the pane supplies reaches the adapter and resolves current values after a prop change.

## 7. Integration and verification

- [x] 7.1 Add a mount-level test through `EditorPane` with the real `MilkdownAdapter`: type `#re`, assert rows appear, press `Enter`, assert the document holds the completed token and the popup is gone, then unmount and assert no popup element is left behind.
- [x] 7.2 Check the behavior in the dev app against a real vault: completion for a page and for a journal day, a bracketed trigger keeping its brackets, no popup inside a code block, arrows and `Escape` leaving the save indicator clean (no dirty state, no write), `Mod+Enter` still activating the literal reference, and no popup while scrolling.
- [x] 7.3 Finish with `npx oxlint --fix`, `npm run fmt`, `npx oxlint --deny-warnings --format=agent`, and `npm test`, all clean.
