## Why

Saving a page that is scrolled down (edits near the end of a long file) jumps the pane back to the top. The pane's reset-to-top effect keys on the `page` object reference, which changes on every index refresh — including the app's own save (write-through upsert rebuilds the graph). The cursor is untouched; the scroll container is what jumps.

## What Changes

- Re-key the scroll-to-top effect on `page?.path` (the identity that changes only on page switch) instead of the `page` object reference, so saves and index refreshes never reset the pane's scroll position.
- Page switching still scrolls the pane to the top as before.
- Add a regression test: a re-render with a rebuilt page object (same path) keeps the pane's scroll position; switching to another page resets it.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `page-editing`: the editor pane preserves its scroll position across saves and index refreshes, and resets it only when the open page changes.