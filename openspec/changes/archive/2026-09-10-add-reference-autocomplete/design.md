## Context

Completion builds on three things that already exist. `src/vault/parse.ts` defines the canonical reference regex (`REF`) and both reference forms; `src/vault/index.ts` builds `byName`, the lowercased name to path map the whole app resolves references through; `src/editor/referenceBadges.ts` shows the pattern for an editor-layer ProseMirror plugin (pure document scan, activation reported across the seam, no React). Resolution from a name to a page stays in `App.handleOpenReference`, never in the editor (ADR-0010).

Two existing facts shape the design:

- `#rea` is already a valid, complete reference token while it is still being typed, so "the text is a token" cannot distinguish typing from done.
- Milkdown registers its entire keymap (commonmark plus the base keymap, `Enter` and `Tab` included) as one plugin whose `props.handleKeyDown` is resolved by plugin order. A plugin added after `commonmark` loses `Enter` and `Tab` outright.

## Goals / Non-Goals

**Goals**

- Offer existing pages while a reference is typed, and insert the canonical token on accept.
- Insert exactly what typing the same name by hand would produce, so Markdown stays canonical (ADR-0001, ADR-0009) and every other surface of the app behaves as before.
- Keep the knowledge-management side (which names exist, how they match, how they resolve) outside the editor (ADR-0010).
- No new dependency, no new ADR, no change to parsing or indexing.

**Non-Goals**

- No prefix index or trie, no fuzzy matching library, no alias or i18n handling, no screen-reader announcement of the popup.
- No second creation path: an unknown name stays an unmaterialized reference, as today.

## Decisions

### D1 Trigger: the token prefix that ends at the caret

Scan backwards from the caret to the last `#`. The character before it must not be a word character (so `word#tag` is not a reference, mirroring `REF`'s lookbehind). The text between `#` and the caret must then be either `[[` plus text without `]`, or a `[\w-]*` run. The text after the caret must not extend the token: a word character or `/` after a word-form trigger, or `]` after a bracketed trigger, means the caret is not at the token's end and there is no trigger. An empty typed text is no trigger, which keeps bare `#` from flickering while a Markdown heading is being typed.

Text reads use `doc.textBetween(..., leafText)`, so a hard break cannot join a `#` on one line to text on the next. Inline code is excluded by the mark on the text node before the caret (not `$from.marks()`, which reports the wrong node at a boundary), and a `code_block` parent excludes fenced code. Two openers on one line resolve to the last one, which is what typing intends.

Alternatives rejected: a forward-anchored regex over `[^\]]*$` (matches from the first opener and produces nonsense queries); `$from.marks()` for the code check (wrong at text boundaries).

### D2 Candidates: the index's own resolution map

The pool is built from `graph.byName`, one row per resolvable name, in `orderPages` order (pinned first, then last modified). Using the resolution map means the pool cannot disagree with the index: a case collision is already resolved, journals are included with no special case, and the invariant "every row resolves to the path it shows" is directly testable. Names that no reference token can express (containing `]`, or with whitespace that reference parsing would trim) are dropped, so every row is insertable as well as resolvable. The pool is memoized per graph change, never rebuilt per keystroke.

Ranking is a two-bucket stable partition over the pre-ordered pool: names starting with the query first, then names with a word starting with it (word boundaries are space, `-`, `_`), capped at 8 rows. No sort runs at query time, tier 0 cannot be starved by tier 1, and the matcher reports where it matched so the popup highlights that span instead of re-deriving it (`indexOf` disagrees with word-start matching, e.g. `read` in `bread read`).

The query still visits every pool row, so the row holds everything the matcher needs: the lowercased name and the offsets of its word starts, both computed once per pool build. The word-start loop compares the first character before calling `startsWith`, because that comparison is what fails for almost every row. Measured per keystroke on 30-character names, for a query that matches nothing (the worst case, and the common one while a name is being typed): 0.24 ms at 10k pages, 1.5 ms at 50k, against a floor of 0.22 ms and 1.06 ms for a bare `startsWith` per row, which is what any scan of the pool costs before it does any work. The first version of the matcher scanned each name's characters with a regex test and cost 10.2 ms at 10k pages; the precomputed offsets are what make the visit affordable, not the tiers.

Alternatives rejected: any-substring matching (cannot be described as completing forward, and it is where noise comes from); Fuse (already in the bundle, but its `minMatchCharLength: 3` and search-tuned threshold are wrong for 1-2 character completion queries); alphabetical or shortest-name ordering (a second ordering rule; the app already has a canonical page order); a prefix or word-start index (sorted names plus word-start entries would make the query sublinear, but it is real machinery and real per-graph-change build cost to remove ~0.2 ms at 10k pages from a scan that only runs while a reference is being typed).

### D3 Insertion: the trigger's form, the page's casing

`referenceToken(name, form)` lives next to `REF` in `parse.ts` and is guarded by a round-trip test: `findReferenceRanges(referenceToken(name, form))[0].target === name`. The form comes from the trigger, so a `#[[` trigger always inserts brackets and no pick ever deletes characters the user typed; a `#` trigger writes `#name` only when the name is a single word, escalating to `#[[name]]` otherwise. "Word" is exactly `REF`'s `[\w-]+`, which is ASCII, so `café` and `2.0` complete in bracketed form. The name inserted is the page's on-disk casing, not the typed casing.

Alternatives rejected: letting the name alone decide the form (it silently rewrites `#[[reading` into `#reading`); a friendlier "is it one word" test (it can insert a token the parser will not read back).

### D4 The pick: one transaction, and it suppresses itself

Accepting dispatches a single `insertText(token, from, to)` carrying a plugin meta value with the accepted token text. ProseMirror maps the selection, so the caret lands after the token with no explicit selection and no trailing space (the suffix guard in D1 already guarantees nothing after the caret can merge into a word-form name). Because the completed token is itself a valid trigger, suppression is what closes the popup: the popup is visible only when the current token text differs from the last accepted or dismissed token text. The same rule serves `Escape`, and it needs no clearing logic: typing changes the text, undo restores it, and both re-enable the popup.

Dismissal and arrow navigation are meta-only transactions (zero steps). Both the history plugin (`if (tr.steps.length == 0) return history`) and the listener plugin (`if (!(tr.docChanged || tr.storedMarksSet)) return`) already ignore them, so no arrow key and no `Escape` can dirty the page or trigger a save. `addToHistory: false` must never be set on the accept transaction, since it would suppress the very `markdownUpdated` the save depends on.

Mouse picks use `mousedown` with `preventDefault`, so the editor never blurs.

### D5 Popup surface: plain DOM, fixed positioning, no new dependency

The popup is a `div` the plugin creates and appends to `view.dom.parentElement` (the pane's editor element, which Milkdown's own tooltip provider does too, falling back to `document.body`). It never goes inside `view.dom`, which ProseMirror owns. Rows are plain elements with `role="option"` inside a `role="listbox"`, mirroring the search dropdown. `destroy()` removes the element: in StrictMode the pane double-mounts, so a leftover element would sit in the pane for the session.

Positioning is `position: fixed` from `view.coordsAtPos`, which already returns viewport coordinates, so the two coordinate spaces match and no offsetParent arithmetic is needed. What remains (flip above when short of room below, clamp horizontally, hide when the caret is off screen) is a pure function over rects, testable without a browser. Repositioning happens on every state update plus one capture-phase `scroll` and one `resize` listener, because ProseMirror scrolls the pane itself while typing near the bottom edge; hiding there would break the picker exactly when a long note is being written.

Alternatives rejected: `@floating-ui/dom` (already in the bundle through the code-block's language picker, but that case anchors to an element inside a positioned ancestor, which is what earns the library; ours anchors to a caret in viewport space, and its `offset`/`flip`/`shift`/`autoUpdate` are not bundled today); a React-rendered popup (it would push suggestions, active index, and key handling across a ProseMirror-to-React boundary and back, once per keystroke).

Styling mirrors the language picker in the same pane (`--ivory`, 8px radius, whisper shadow, no border, `--warm-sand` active row), with styles in a small CSS module beside the plugin, since these elements are ours rather than a third party's.

### D6 Keys: `handleDOMEvents`, and own the preventDefault

`runCustomHandler` (which serves `props.handleDOMEvents`) runs before `editHandlers.keydown`, before any `handleKeyDown` prop, and regardless of plugin order, so `keydown` is registered there. While the popup is visible it claims five unmodified keys: `ArrowUp`/`ArrowDown` (move, wrapping), `Enter`/`Tab` (accept), `Escape` (dismiss). Everything else, including all modified keys, `Shift+Tab`, and the caret keys, is untouched, so `Mod+Enter` keeps activating the reference at the caret. The first row is active from the start, so `Enter` alone completes the best match; the active index resets when the typed text changes.

Because a claimed key short-circuits `editHandlers.keydown`, nothing else calls `preventDefault` for it, so the handler must do it itself or `Tab` moves focus out of the editor and `Enter` inserts a newline in addition to accepting. jsdom does not act on those defaults, so only an explicit `event.defaultPrevented` assertion holds this line.

Guards: not visible, composing (the composition check in `editHandlers.keydown` is bypassed), or an event target inside `.cm-editor` (the code-block component's CodeMirror surface, the same guard `handlePaste` uses).

### D7 State: plugin state for what is shown, the view hook for the DOM

Plugin state holds the trigger, the suggestions, the active index, and the suppressed token text, so every transition is a transaction and the popup is a pure function of the state. `apply` returns the previous state unchanged when the transaction changed neither document, selection, nor meta, which keeps unrelated transactions (Milkdown emits plenty) from re-running the provider. The `view` hook writes the DOM in `update`, skipping when the state object is unchanged by reference, and the key handler only dispatches. Nothing touches the DOM from `apply` and nothing mutates state from the view.

Visibility is derived, not stored: `trigger !== null && suggestions.length > 0 && token !== suppressed`, plus editor focus. Blur hides the element directly without state (it is not a dismissal), so refocusing on an untouched token brings the picker back.

This plugin is separate from `referenceBadges` on purpose. Badges must not depend on the caret at all, and their `apply` therefore ignores selection-only transactions; the picker is entirely caret-driven. Two plugins, two keys, no shared state, and the badges' guarantee stays structurally true.

### D8 Seam: one read-only method in the app-to-editor direction

`setSuggestionSource(source: (query: string) => Suggestion[])` joins `EditorAdapter` (implemented by `MilkdownAdapter` and `FakeEditor`). It is the first live app-to-editor input (setContent is a directive, not a query) and it is read-only: names, paths, and match offsets cross the seam, never paths as destinations, never pages, never a resolution. The editor still reports edits back only as Markdown. With `Mod-Enter` untouched, the plugin has no outbound call at all, so the popup cannot navigate or create anything.

`App` memoizes the pool on the graph and passes a `suggest` callback to `EditorPane`, which holds it in a ref and hands the adapter `(query) => suggestRef.current?.(query) ?? []`, the same mount-once pattern as `onReferenceClick`. `editor.ts` gains its first import, the `Suggestion` type from the vault layer, which is the seam being typed in the vault's vocabulary; `referenceBadges.ts` already imports `findReferenceRanges` from the same layer.

No ADR: ADR-0010 already places the page list and resolution on the application side, and this adds a read-only query across a seam that exists. The rejected alternatives above (Fuse, floating-ui, React popup, name-decides insertion, forward regex) are design decisions, not architecture.

## Risks / Trade-offs

- [The candidate scan visits every pool row on each keystroke] → measured (D2): 0.24 ms at 10k pages and 1.5 ms at 50k in the worst case, one allocation-free pass with the word offsets precomputed per pool build and bucket allocation bounded by the row cap, and it runs only while the picker is visible, which is a small fraction of keystrokes. The `AGENTS.md` budget allows one pass over already-built in-memory data and asks for its measurement; both hold here.
- [`Enter` and `Tab` do something different while the popup is visible] → the popup is visible only while a token is being typed at the caret, the active row is visible, and `Escape` opts out for that token. Hidden, both keys are unchanged, which is a spec scenario.
- [A missing `preventDefault` passes every jsdom test and breaks in a browser] → assert `event.defaultPrevented` for claimed keys and for unclaimed ones in the plugin tests.
- [StrictMode double-mount leaves a popup element in the pane] → remove the element in the view's `destroy`, and assert its absence after unmount in the existing mount tests.
- [`suppressed` compares token text only, so the same text typed elsewhere in the note is also suppressed] → the popup returns as soon as the text changes, and the case needs an identical, fully typed token elsewhere in a note to matter. Accepted.
- [The popup is invisible to screen readers, since focus stays in the editor] → recorded as a non-goal. Fixing it properly needs `aria-activedescendant` on the contenteditable plus a live region, which is a separate change.

