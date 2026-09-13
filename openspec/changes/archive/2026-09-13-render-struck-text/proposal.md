## Why

Writing `~~text~~` in a page shows the tildes and nothing else: the editor loads Milkdown's commonmark preset, which has no strikethrough, and the shortcuts reference records the omission as deliberate ("links and strikethrough have no keymap"). So the common note-taking gesture — crossing out an item that is done or cancelled — has no display in Folio, even though every other Markdown tool renders the same file crossed. The cheapest honest fix is the one the app already uses for `#word` references: decorate the literal text, and leave the file alone.

## What Changes

- A struck run — `~~`, then at least one character with no tilde and no leading or trailing space, then `~~` — renders with a line through it, anywhere in a page's text: paragraphs, headings, list items, quotes.
- The decoration is presentational, exactly like a reference badge: the document, the saved Markdown, the clipboard, and the index keep the tildes as written. Nothing toggles, nothing is hidden, and no formatting mark exists to round-trip.
- Text inside inline code or a fenced code block stays literal, as do a lone tilde, an empty pair, a pair padded with spaces, and a run containing a tilde inside it.
- The scan rides the decoration pass the editor already runs for references, so a keystroke costs what it costs today.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `page-editing`: "Struck text renders crossed" — new requirement covering which runs are decorated, that the decoration is presentational, and what is deliberately not decorated.

## Impact

- `src/editor/referenceBadges.ts` — renamed to `inlineDecorations.ts`, because the module now owns two decorations over literal text rather than badges alone; the reference-specific exports keep their names. Its test file and the two importers (`src/editor/milkdown.ts`, `src/components/shortcuts.test.ts`) follow the rename.
- One CSS rule in `src/components/EditorPane.module.css` for the decoration's line.
- No dependency, no schema, parser, serializer, storage, or index change.
- Non-goals: no strikethrough *mark* (no toggle chord, no input rule, no schema — `~~` stays text, so there is nothing to turn on or off), no hiding of the tildes, and no GFM preset (tables, task lists, autolinks, footnotes remain out).
