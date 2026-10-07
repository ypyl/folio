# Proposal

## Why

The reference-completion popup is the app's most-seen floating surface — it
opens every time a user links to a page, board, or file — but it still wears
CodeMirror's stock tooltip theme: a cool-gray box with the library's own
spacing, type, and selection color. It is the one visible piece of the editor
that is not Folio. The change that fixed the popup's behavior
(`fix-reference-completion-popup`) called a token pass "separate work if it is
wanted"; this is that work.

## What Changes

- The completion popup takes the app's floating-surface recipe (DESIGN.md): an
  `--ivory` surface, no border, 4px padding, 8px radius, and the whisper shadow
  reserved for surfaces that float (menus, dialogs, popovers).
- Its rows take the app's menu-row recipe: 6px 8px padding, 6px radius, the
  app's UI type, and `--near-black` ink; the active or hovered row gets a
  `--warm-sand` fill, the same treatment as the search dropdown and the row
  context menu — not a brand fill, so ink-blue stays the app's ≤5% accent.
- The popup's own list keeps the platform scrollbar: it is an overlay whose
  width comes from its content, so it opts out of the reserved gutter lane and
  the custom thumb, exactly as DESIGN.md's scroll-region rule says and as the
  code block's language picker already does.
- Styling rides the existing `folioTheme` in `src/editor/codemirror.ts`, which
  is where the editor's palette already lives. No DOM, no component, no option
  is added.

Everything the popup does is unchanged: which rows appear, their order and cap,
the triggers, the keyboard contract, and the token accepting a row writes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `editing`: the completion-popup requirements gain a requirement for the
  popup's presentation, so "reads as app chrome" is specified rather than left
  to the library's default. Its behavior requirements (which pages are offered,
  no popup inside code, the keyboard contract, the written token) are unchanged.

## Impact

- `src/editor/codemirror.ts`: `folioTheme` gains the tooltip rules, mirroring
  the hex values DESIGN.md's tokens define (the same mirroring the file already
  does for headings, fences, and syntax colors).
- `src/editor/codemirror.integration.test.ts`: one mounted-adapter assertion
  that the popup carries the app's surface, so a future CodeMirror upgrade that
  renames its tooltip classes fails the build instead of silently reverting the
  popup to the stock theme.
- Related ADRs: ADR-0010 (editor presentation stays in the editor layer; the
  app's knowledge logic is untouched) and ADR-0011 (the Kami design language).
  No new ADR: this applies existing DESIGN.md rules to one surface.
- Unchanged: the trigger grammar, the candidate pools and ranking, the
  completion seam, the Markdown written to the vault, and every non-popup
  surface (the code-block language picker and the search dropdown keep their
  own styling).
- Version: a patch bump — the popup's look is polish on an existing surface, not a
  new user-facing capability.

## Non-goals

- No new row content: no page icons, no modified dates, no path or board
  badges. A row still shows the page's name as it exists on disk.
- No change to the popup's behavior: not the triggers, not the matching or
  ordering, not the cap, not the keyboard handling, and not the token form.
- No change to any other surface — the code-block language picker, the search
  dropdown, and the row context menu keep their styling, even though the popup
  now shares their recipe.
- No theme toggle or dark variant; the app is light-only today.
- No new dependency, no backend, no database, no block-based document model.
