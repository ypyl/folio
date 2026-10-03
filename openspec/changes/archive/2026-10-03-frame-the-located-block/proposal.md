# Proposal

## Why

Opening a search result marks the block it found with a `--brand-tint` wash that fades to transparent over about two seconds. `--brand-tint` is DESIGN.md's lightest fill, defined for a chip that must recede, so the mark is faint from its first frame and it is at its faintest exactly while the reader's eye is travelling to the scroll position. By the time the block is read, nothing marks it at all.

Two smaller problems come with it. The mark covers only the block's first line, so a wrapped paragraph or a list is marked by a tinted band that spans the text column rather than by a shape that says "this block". And a whole-document re-serialization was not the only place the old surface spent effort: a fill that fades cannot be re-read, so the reader who looks away has lost the location.

## What Changes

- A located block is marked with a persistent frame around its **whole extent**: from the block's start line to its last non-blank line, with the sides drawn on every line and the top and bottom on its first and last. It does not fade.
- The frame is drawn in `--brand` at 1px, four sides, with a technique that adds no layout, because the existing requirement forbids moving or reflowing the page's text and a CSS border narrows the content box and re-wraps long lines.
- The mark is cleared only by a later locate. It survives edits (its positions are mapped through the change), and it survives leaving the page and returning, including Back and Forward. It is no longer cleared by the next document change, and a navigation naming no block no longer clears it.
- The requirement's "mark it with a highlight" and its two-second fade are replaced. Its scenario named "The mark fades" is false by construction, so the requirement is redefined rather than edited.
- No word mark inside the frame, no move of the caret, and no revealing of source a construct hides: the frame always lands, because a block's lines always exist, so those were not needed.
- The Contents panel keeps using the same mark, which its own requirement already delegates to ("the editor's existing block-locate highlight").

Not in scope: how search answers are ranked, what the result rows show, and any change to what activating a link or a reference opens.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `page-editing`: the block-locate mark becomes a persistent frame around the block's whole extent, cleared only by a later locate, and no longer cleared by a document change.
- `search`: only if the redefined requirement has to take a new name, because its requirement names the old one. The preferred route keeps the name, which leaves this capability untouched.

## Impact

- `src/App.tsx`: the locate state carries the page it belongs to, so it can survive a navigation, and a block-less navigation stops clearing it.
- `src/editor/codemirror.ts`: the mark maps through document changes instead of clearing on them, and draws per-line edges for a line range rather than one line.
- `src/lineAnchors.ts`: a pure helper for a block's line range, beside the rule the search and the Contents panel already share.
- `src/components/EditorPane.module.css`: the fill and its fade keyframes become the frame; the comment naming the file deleted in the editor swap is corrected.
- `DESIGN.md`: the Search match section states a persistent brand frame drawn without layout, replacing the fading `--brand-tint` wash.
- No dependency, no vault read, no file write, and nothing on the typing path beyond mapping a small line range.
