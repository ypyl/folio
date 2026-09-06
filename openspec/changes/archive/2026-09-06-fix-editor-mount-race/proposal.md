## Why

Under React StrictMode (the dev default, `src/main.tsx`), every page open mounts the editor twice: the first `MilkdownAdapter.mount()` is still awaiting `Editor.create()` when the pane cleanup calls `destroy()`, which is a no-op on a not-yet-created editor. The cancelled editor resolves later, mounts an empty `.milkdown` div into the pane, and is never torn down — the pane shows an empty editor slot above the real one, and fast page switches leak more.

## What Changes

- Make `MilkdownAdapter.destroy()` neutralize an in-flight `mount()`: a `destroyed` flag checked after `create()` resolves, so the cancelled editor tears itself down instead of rendering.
- The pane now renders exactly one live editor per open page, always seeded with that page's content; the empty leaked surface disappears.
- Add regression tests: a StrictMode render leaves a single `.milkdown` root, and an unmount-before-create-resolution (fast page switch) tears the pending editor down.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `page-editing`: the editor surface gains the requirement that opening a page renders exactly one editor instance with that page's content — no stale or empty editors.