# indexing-loading-state

## Why

Opening or switching to a vault with 500+ Markdown files takes seconds: `buildIndex` recursively lists the folder and serially reads and parses every page before the graph resolves. During that wait the app shows no work in progress — the sidebar renders nothing, the editor shows "Your notes appear here.", and only the header's folder name hints that a folder was opened. The user cannot tell the app is indexing versus broken.

## What Changes

- The app SHALL show a Kami-styled loading state (placeholders, not a spinner) while the active folder's index is being built, replacing the misleading empty content:
  - **Editor pane**: skeleton body lines in place of the "Your notes appear here." hint.
  - **Sidebar**: skeleton rows in the Journal and Pages sections in place of the empty/absent listing.
  - **Meta panel**: skeleton rows in the Backlinks and Forwardlinks sections in place of the placeholder copy.
  - **Header**: unchanged — the folder name and open-time file count are real data and stay visible.
- The loading state SHALL be reachable on first open, on folder switch (each switch rebuilds the disposable index, ADR-0004), and on re-grant of a stored folder.
- The loading state SHALL end when the index resolves; existing behavior after resolution is unchanged (today's journal auto-opens, search enables, sidebar and editor render real content).
- The loading state SHALL be announced accessibly (`role="status"`/`aria-busy` with a "Indexing notes…" label); the placeholder blocks themselves are decorative.
- No loading state when no folder is active (the brand empty state is unchanged).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ui-shell`: The shell's center/editor and sidebar panes currently render empty content while the active folder's index is building. Add a requirement: while the index builds, those panes show loading placeholders instead of empty content, ending when the index resolves.

## Non-goals

- **No progress reporting.** No "Indexing 342/500" bar or percentage — that would require instrumenting `buildIndex` to emit progress. A skeleton communicates "working" without touching the index internals. If the wait remains painful after this, real progress can be a follow-up change.
- **No spinner or loading animations** beyond a subtle opacity pulse on the placeholders (Kami restraint: warm fills, no brand accent, no gradients, no shadows).
- **No change to indexing speed, the scan algorithm, or the refresh cycle** — this change only surfaces the already-existing wait.
- **No change to boot-restore**, the folder rail, or the search disabled state.

## Impact

- `src/App.tsx`: derive an `indexing` flag (`graph === null` while an active folder with storage exists) and pass it to the panes.
- `src/components/EditorPane.tsx` + `.module.css`: `loading` prop; render skeleton in place of the notes hint.
- `src/components/Sidebar.tsx` + `.module.css`: `loading` prop; render skeleton rows in place of the empty listing.
- `src/components/MetaPanel.tsx` + `.module.css`: `loading` prop; render skeleton rows in place of the placeholder copy.
- `src/components/MetaPanel.test.tsx` updated for the loading prop.
- `src/index.css`: shared skeleton placeholder styles (Kami tokens).
- Tests: `EditorPane.test.tsx`, `Sidebar.test.tsx` updated for the loading prop; no new dependencies.
- ADRs: none needed — follows ADR-0004 (disposable per-folder index), ADR-0005 (three-pane UI), ADR-0011 (Kami tokens).