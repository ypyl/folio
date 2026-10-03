# Proposal

## Why

A markdown link reads as its own Markdown: `[site](https://learn.microsoft.com/en-us/graph/api/resources/site?view=graph-rest-1.0)` fills the pane with a destination nobody is reading, while the words that matter are a small part of it. Every other inline construct already reads as its result at rest and shows its source when the caret enters it, so a link is the one inconsistency left in the prose.

## What Changes

- A markdown link displays as its own link text while the selection is outside it: the opening `[`, the closing `]`, and the destination with it are not shown, so the construct reads as `site` in the app's link style (brand ink, no underline, per DESIGN.md).
- The whole construct is shown again as soon as the selection touches the link, so it is edited as Markdown, exactly as bold, italic, strikethrough, and inline code already behave.
- An autolink (`<https://example.com>`) displays without its angle brackets, on the same rule.
- Hiding is presentational: the document keeps every character, a save writes the construct as it was, and the destination the user never sees is still what Ctrl+Click opens.
- A link with no link text keeps showing its source, because hiding its marks would leave nothing visible.

Not in scope: underlining links. DESIGN.md's Links rule is one behavior app-wide, brand color with no underline, and it forbids per-component exceptions.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `page-editing`: a new requirement says how a markdown link is displayed; the existing click requirements are unchanged and still govern what activating one opens.

## Impact

- `src/editor/codemirror.ts`: two more hidden ranges in the decoration pass, with the reveal rule the inline runs already use.
- No styling change: the link's text is already brand ink from the syntax theme's `tags.link`, so hiding the marks is the whole visible change.
- No dependency, no vault, and no editing-path change: the ranges are computed from the syntax tree the pass already reads.
