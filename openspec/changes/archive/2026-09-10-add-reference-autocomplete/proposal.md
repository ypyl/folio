## Why

Writing a reference today means recalling an exact page name and typing it in full. The vault index already knows every page name, and the editor already recognizes both reference forms for badges and click-through, so the app knows the name while the typist still has to spell it. Journal days are the worst case: a date nobody remembers precisely is the name you must type exactly.

## What Changes

- While a reference is being typed at the caret (`#` plus text, or `#[[` plus text), the editor offers a popup listing existing pages whose names match: names starting with the typed text first, then names with a word starting with it.
- Candidates are exactly the names the index can resolve, in the app's page order (pinned first, then last edited), capped at 8 rows. Journals are included with no special case, and rows show the page's real name, because a row previews the text that accepting it will type.
- The popup claims five plain keys while it is visible: `ArrowUp` / `ArrowDown` move the active row, `Enter` / `Tab` accept it, `Escape` dismisses it. The first row is active from the start, so type, `Enter` is enough. While the popup is not visible, every binding behaves exactly as it does today.
- Accepting replaces the in-progress token with the full reference token, in the page's on-disk casing, in the form the user was typing (brackets stay brackets) and escalating to `#[[name]]` only when the name cannot be a `#word` token. The caret lands after the token, and the edit flows through the existing draft and debounced-save path untouched.
- Names that have no insertable token form (a name containing `]`, or one whose reference would not resolve back to it) are never offered.

## Capabilities

### New Capabilities

None. This adds behavior to capabilities that already exist.

### Modified Capabilities

- `page-editing`: the editor pane gains reference completion: a popup of existing pages while a reference is typed, the five keys it claims while visible, and the rule that the popup changes nothing while hidden.
- `page-references`: the reference model gains the completion's inserted-form rule and the rule that a name with no valid reference token is never offered as a completion.

## Non-goals

- No "create this page" row and no "create today's journal" affordance. Candidates are existing pages only; a reference to a page that does not exist stays valid and materializes on first save, as it does today.
- No completion for plain `[[Page]]`. It is not a reference form (ADR-0012), and offering it would silently bless a non-form.
- No tags UI and no tag namespace. `#word` remains a page reference (ADR-0012).
- No slash commands, no general completion framework, no path disambiguation between identically titled pages in different folders.
- No new dependency, no change to Markdown parsing, the index, backlinks, or reference resolution.
- No screen-reader announcement of the popup: focus never leaves the editor, and `aria-activedescendant` support on the contenteditable is out of scope.

## Impact

- New: `src/vault/suggest.ts` (candidate pool and ranking), `src/editor/referenceSuggest.ts` and its stylesheet (the editor plugin and the popup).
- Modified: `src/vault/parse.ts` (trigger detection and token formatting next to the canonical `REF`), `src/editor/editor.ts`, `src/editor/milkdown.ts` and `src/editor/fakeEditor.ts` (one new seam method, `setSuggestionSource`), `src/components/EditorPane.tsx`, `src/App.tsx` (the memoized candidate pool).
- Architecture: relates to ADR-0010 (the editor keeps knowledge-management logic outside itself: it receives names across the seam and applies text), ADR-0012 (both reference forms, one namespace), and ADR-0006 (no new dependency). No new ADR is needed; the seam addition is a read-only query in a direction ADR-0010 already allows, and it is recorded in `design.md`.
- Performance: reviewed against the editor-responsiveness rule in `AGENTS.md`. Emptied of derived-data rebuilds (the pool is memoized per index change) and with a reference-equality fast path in the per-transaction hook, one linear pass over the in-memory page pool per keystroke remains. `design.md` records that cost and the two fixes that bound it, since the rule as written does not permit a pass over the vault at all.
