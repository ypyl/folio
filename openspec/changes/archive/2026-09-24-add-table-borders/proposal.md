## Why

The editor renders a table editorially: no framed box, no vertical rules, only hairline row separators (`DESIGN.md`, Tables). On the parchment surface that reads as loose text with faint lines under it, so a table is hard to tell apart from the paragraphs around it. A table is a structured object and should read as one at a glance.

## What Changes

- Give every table cell a visible border, so the table draws a grid and an outer frame.
- Give the header row a quiet fill (`--warm-sand`) behind the existing muted uppercase labels, so the header reads apart from the body.
- Use symmetric cell padding (6px vertical, 10px horizontal) now that cells are boxed, instead of the right-flush padding the editorial style used.
- Drop the empty-cell trailing hairline: with a grid on every cell, an empty cell is already visible, so the special case is dead.
- Update `DESIGN.md`'s Tables section to describe the bordered grid instead of the borderless editorial style.
- No change to how a table is parsed, edited, saved, or made. This is a rendering change only.

## Non-goals

- No change to table creation, editing, structural controls, or the canonical Markdown.
- No change to the alignment, empty-cell, or header-only serialization rules.
- No change to the search, gutter, or keystroke-path behavior of a table.
- No new dependency and no backend.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `page-editing`: "A Markdown table is a table in the editor" gains a visible-borders requirement and a rendering scenario.

## Impact

- `src/components/EditorPane.module.css`: the table cell and header rules.
- `DESIGN.md`: the Tables section.
- No change to `src/editor/milkdown.ts`, the table slice, or any test fixture.
- No ADR change: this is a visual treatment inside the existing table capability, not a new architectural decision.
