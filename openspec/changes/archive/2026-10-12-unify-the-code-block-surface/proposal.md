# Proposal

## Why

The panel `make-code-blocks-visible` added does not read as a panel. Two fills
stack on every code line: the full-width panel in `#faf9f5` (ivory, ~5/255
lighter than the parchment page, so invisible) and the inline-code pill from
`tags.monospace` in `#f0efe8`, which is text-width with a 3px radius. The pill
is the only visible layer, so a fence reads as scattered text-width boxes, not
a block — worst on a bare ` ``` ` fence, where the pill is the only thing on
screen. Ivory cannot be made more visible by going lighter (DESIGN.md bans
white surfaces), so the block should share the one warm-gray surface the app
already uses for code.

## What Changes

- The code block panel's fill becomes `--inline-code-bg` (`#f0eee6`), the same
  surface inline code carries, so the block reads as one full-width code
  surface.
- The code text's own pill background is aligned to that same token, so the
  pill and the panel are one surface: its text-width box and 3px radius no
  longer show, because they sit on the same colour.
- No structural change: still per-line decorations, padding, 8px radius, no
  border, fence lines visible and editable, source untouched.
- DESIGN.md's Code entry and the `--inline-code-bg` token description change to
  say inline and block code share the warm-gray surface.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `editing`: the fenced block's panel fill is stated to be the app's code
  surface, shared with inline code, so the block reads as one surface.

## Non-goals

- Hiding the fence lines, or adding a border or left accent rule.
- Changing syntax-highlight token colours, or the inline-code pill's shape.
- Reverting the block to a lifted ivory card, or adding a new colour token.
- Any change to the Markdown on disk.

## Impact

- `src/editor/codemirror.ts`: the `.folio-cm-code` theme fill and the
  `tags.monospace` highlight fill both become `#f0eee6`.
- `DESIGN.md`: the Code entry and the `--inline-code-bg` row.
- ADRs: **ADR-0029** is unchanged. Relates to the same view-only decoration
  approach; no new ADR is needed.
- No dependency, vault, save, or editing-path change.
