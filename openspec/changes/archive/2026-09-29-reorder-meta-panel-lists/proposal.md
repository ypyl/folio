## Why

The meta panel's link lists sort alphabetically, so the page edited a minute ago sits at the bottom of Backlinks and the reference order the author wrote is lost in Forwardlinks. Recency and document order carry meaning here that letter order throws away: Backlinks answers "what touched this page last?", and Forwardlinks should read in the order the open page makes its references.

## What Changes

- **Backlinks** list the open page's referrers ordered by last-edited time descending, with a path-ascending tiebreak for equal timestamps. Pins do not affect this order.
- The board's **Referenced by** section follows the same rule: last-edited descending, path-ascending tiebreak.
- **Forwardlinks** lists its rows in document order: the Pages group in the order the page's references appear, and the Files group in document order within itself (assets first, then boards, each in its own appearance order).
- **BREAKING** (behavioral): the ordering requirements in `ui-shell` and `whiteboards` change from alphabetical to the rules above. These are observable list orders, so the specs change with the code.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ui-shell`: the meta panel row-listing requirement and its Backlinks/Forwardlinks ordering scenarios move from alphabetical to last-edited-desc (Backlinks) and document order (Forwardlinks groups).
- `vault-assets`: the Files-group requirement moves from "ordered by label within the group" to document order.
- `whiteboards`: the Referenced by ordering requirement and scenario move from row-label order to last-edited-desc, and the Files-group requirement/scenario move from alphabetical to document order.

## Non-goals

- No change to the sidebar Pages ordering (pinned first, then last-modified descending) — that rule stays as specified in `static-navigation`.
- No pins in Backlinks or Referenced by: a pinned page does not hoist its row in the panel.
- No recency ordering in Forwardlinks; it is document order, and its timestamp-less (unmaterialized) rows need no special rule.
- No change to the Contents ordering, row labels, dimming, empty-state copy, or row navigation.
- No revisit-history or "recently viewed" notion: ordering reads only a file's last-modified time, which the index already carries.
- No new dependency, backend, database, or block model.

## Impact

- **UI**: `src/components/MetaPanel.tsx` — `LinkList` stops sorting internally, so callers own each list's order. `src/App.tsx` — the Backlinks and board-referrer memos order their rows by last-modified descending with a path tiebreak; the Forwardlinks Pages and Files rows keep their existing (document) order.
- **Specs**: deltas to `ui-shell` and `whiteboards`.
- **ADRs**: reverses the alphabetical rule of the archived `links-pane` design (D5). Consistent with ADR-0001 (the vault is the source of truth: ordering comes from file metadata the index already holds) and ADR-0006 (a small, contained change).
