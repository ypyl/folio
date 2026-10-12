# Proposal

## Why

A fenced code block is invisible as a block today. Its fill is `#f5f4ed`, which
is exactly `--parchment`, the page colour, so it has no contrast; and the fill
is an inline `Decoration.mark`, so it paints only the text's box, with no
continuous panel, no padding, and no radius. DESIGN.md's Code entry already
specifies the intended look — "a quiet ivory fill — no border, 8px radius" — so
the app drifted from its own design rather than never having one. Inline code
is more visible than block code, which is backwards.

## What Changes

- A fenced code block renders as a full-width panel: every line of the fence —
  the opening line, the code lines, and the closing line — carries the panel's
  fill across the whole line, not just the text.
- The fill is `--ivory` (`#faf9f5`, brighter than the page) as DESIGN.md's Code
  entry specifies, replacing the current page-coloured `#f5f4ed`.
- The panel is padded (horizontal inset on every line, vertical padding on the
  first and last line) and rounds its top and bottom corners at 8px.
- The fence lines stay visible and editable, as they are today; a fence with no
  language stays monochrome.
- No border and no shadow: fill, padding, and radius only, per DESIGN.md rules 4
  and 6.
- The document is unchanged. This is presentational; a save writes the same
  Markdown, and no keystroke does more work than it does today.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `editing`: the "A fenced block is highlighted source" scenario gains the
  panel's rendering — full-width fill, padding, rounded ends — while keeping the
  fence lines visible and editable and a language-less fence monochrome.

## Non-goals

- **Hiding the fence lines.** Explored and rejected for this change; the ````` ```` `````
  lines and the language stay visible and editable.
- A left accent rule or any border around the panel. DESIGN.md's Code entry says
  no border; adding one is a separate design decision.
- Switching the fill to the darker `--inline-code-bg`. Block code stays "lifted
  ivory", distinct from the inline pill.
- A language picker, copy button, per-block folding, or reformatting. ADR-0029
  accepted their absence.
- Any change to syntax-highlight token colours, to the presentation view, or to
  search snippet rendering.
- Any change to the Markdown on disk.

## Impact

- `src/editor/codemirror.ts`: the `render(view)` pass gains line decorations
  (with first/last roles) for the lines of each visible fenced block, alongside
  the existing `Decoration.mark`; the `folioTheme` fence rule changes fill and
  gains the panel classes.
- `DESIGN.md`: no change. The Code entry already specifies the ivory fill, no
  border, and 8px radius; this change implements it.
- ADRs: relates to **ADR-0029** (the page surface is the Markdown text, rendered
  by view-only decorations) and reuses the line-decoration pattern of
  `frameDecorations` (search frames). No new ADR is needed; no existing decision
  is reversed.
- No dependency, vault, save, or editing-path change.
