## Why

The rail's numbers and fold arrows sit on top of each other: the rail is 32px wide, the arrow is 20px of it, and the number is pushed underneath the arrow so the two do not collide. The number is also 10px, below the 12px floor the rest of the app's metadata keeps. The rail should read as two quiet columns — the number on the left, the arrow on the right nearest the prose — on the item's own line.

## What Changes

- The rail gains **two side-by-side columns**: line numbers in a left column, fold arrows in a right column, both on the block's or item's first line. The number-under-arrow stack goes away.
- The **line number grows from 10px to 12px**, matching the metadata floor the gutter already shares with the rest of the rail (DESIGN.md).
- The rail widens to hold both columns, and the document's left padding grows with it, so the prose shifts right by the added width. Nothing else about the document's geometry changes.
- Fold semantics, fold state, the adapter seam, and the arrow's behavior are unchanged (ADR-0026). The native marker is still untouched (ADR-0020).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `page-editing`: the line-number requirement changes — a foldable top-level block shows its number in a column to the left of its control instead of beneath it, and the rail is described as two columns.

## Impact

- `src/components/EditorPane.module.css`: the rail's and document's width, the number column and size, the arrow column, and the chevron's size.
- `src/editor/gutter.ts`: drop the stacking shift; numbers and arrows are placed on their line with no adjustment.
- `src/editor/gutter.test.ts`: the stacking case becomes a same-line case.
- `DESIGN.md`: the Lists and Document-line-numbers entries describe two columns and the 12px number.
- No change to `VaultStorage`, the index, search, references, the serializer, or any saved bytes.
