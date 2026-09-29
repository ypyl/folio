## Why

With Contents added above the link sections (add-page-contents), collapsing Backlinks and Forwardlinks leaves their summary rows directly beneath Contents and a large empty gap between them and the keyboard-shortcuts row pinned at the panel's bottom. The panel reads as broken: the sections that are open, or the empty space, sit where a reader expects the collapsed rows to be — next to the shortcuts reference they are stacked above.

## What Changes

- When the link sections (Backlinks and Forwardlinks) are collapsed, their summary rows SHALL sit at the panel's **bottom edge, directly above the keyboard-shortcuts row**, with the free space left above them, below Contents.
- The link sections SHALL be treated as one group that takes the panel's remaining height: while a section is open it keeps sharing that height as today, and a collapsed section among them sits at the group's bottom edge.
- This changes only where collapsed link-section rows sit. A section's open/closed state, the panel's fallback scrolling, and the rule that a collapsed section occupies exactly its summary row are unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ui-shell`: adds a requirement for where the meta panel's collapsed link sections sit (bottom-aligned above the keyboard-shortcuts row).

## Non-goals

- No change to the panel's sections, their order, or their defaults (Contents and Backlinks open, Forwardlinks collapsed, Keyboard shortcuts collapsed).
- No change to how a section shares height while open, to the panel's fallback scroll, or to the keyboard-shortcuts reference.
- No change to Contents, Backlinks, Forwardlinks content, or row behavior.
- No new dependency or animation.

## Impact

- **UI**: `MetaPanel` wraps the Backlinks and Forwardlinks sections in one group element; the group takes the remaining height and bottom-aligns its collapsed children. A small CSS change plus a wrapper in `MetaPanel.tsx`.
- **Specs**: a delta to `ui-shell`.
- **ADRs**: none; consistent with ADR-0011 (Kami) and ADR-0006 (keep it small).
