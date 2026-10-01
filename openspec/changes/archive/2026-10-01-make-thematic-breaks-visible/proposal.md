# Proposal

## Why

A `---` in a page is a thematic break, and the editor draws it as a `1px` line in `--border` (`#e8e6dc`) on the `--parchment` surface (`#f5f4ed`). At that contrast the rule is all but invisible, so a break the author wrote reads as blank space: the page's own structure disappears, and there is no way to tell a rule from a gap between paragraphs. This is the last construct left below the threshold of sight — the table change (`add-table-borders`) fixed the other one by giving a faint element a visible edge.

## What Changes

- Draw the editor's thematic break in `--stone` (`#6b6a64`), the palette's tertiary ink, instead of `--border`, so the rule is clearly visible on parchment while staying subordinate to text.
- Keep the rule's weight and margin as they are: `1px`, `24px` above and below. The change is the line's colour, not its geometry.
- Record the treatment in `DESIGN.md`'s Editor document section: a thematic break is ink, not a border.
- No change to how a thematic break is parsed, edited, saved, or written; no change to its role as a slide divider in presentations. This is a rendering change only.

## Non-goals

- No change to the Markdown: the file keeps `---` exactly as written, and no new syntax is introduced.
- No change to the block's identity for the gutter, the search, or the caret, and no change to the keystroke path.
- No thicker or longer rule, no centred ornament, and no new token; the rule keeps the `1px` weight and the full block width it has today, and uses an existing token.
- No change to the presentation view's nested thematic break. A slide is a different surface at a different scale; if it should match, that is its own change.
- No new dependency, no backend, no ADR.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `page-editing`: the editor's rendering gains a requirement that a thematic break draws a visible rule, with a scenario for its visibility and one for the file keeping its dashes.

## Impact

- `src/components/EditorPane.module.css`: the `hr` rule, and the comment beside it.
- `DESIGN.md`: the Editor document section.
- No change to `src/editor/milkdown.ts`, the block parse, the serialization, or any test fixture or existing test.
- No ADR change: a visual treatment inside the existing `page-editing` capability. It sits inside ADR-0011's Kami palette (existing tokens only) and does not touch ADR-0001 or ADR-0009, since the Markdown stays canonical and no derived state is added.
