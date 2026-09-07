# Tasks

## 1. Shared skeleton style

- [x] 1.1 Add a `.skeleton` placeholder class to `src/index.css`: warm-gray fill (`--warm-sand`), 8px radius, 4px-grid spacing rhythm, and a subtle opacity-pulse `@keyframes` (~1.2s). Verify by building the app (`npm run build`) and confirming the class uses only Kami tokens (no white, cool grays, brand accent, gradients, or shadows).

## 2. Component loading states

- [x] 2.1 Add a `loading: boolean` prop to `EditorPane`; when `true`, render skeleton body lines plus a muted "Indexing notes…" caption with `role="status"` in place of the `emptyHint` content (`'Your notes appear here.'` / open-folder copy), and keep the existing content for `false`. Verify `EditorPane.test.tsx` covers the loading render (caption present, hint absent) and `npm run test` passes.
- [x] 2.2 Add a `loading: boolean` prop to `Sidebar`; when `true`, render a few `aria-hidden` skeleton rows inside the Journal and Pages sections in place of the calendar and page list, keeping the `hasVault` gating for real content. Verify `Sidebar.test.tsx` covers the loading render (skeleton rows present, no page rows) and `npm run test` passes.
- [x] 2.3 Add a `loading: boolean` prop to `MetaPanel`; when `true`, render `aria-hidden` skeleton rows in the Backlinks and Forwardlinks sections in place of the placeholder copy and link lists. Verify `MetaPanel.test.tsx` covers the loading render (skeleton rows present, no placeholder copy) and `npm run test` passes.

## 3. Wire the loading state in App

- [x] 3.1 In `App.tsx`, derive `indexing = graph === null && activeFolder?.storage !== undefined` and pass `loading={indexing}` to `Sidebar`, `EditorPane`, and `MetaPanel` (header and search untouched). Verify manual behavior: opening a large vault (500+ files) shows skeletons in all three panes until its index resolves, then the today journal opens and search enables; switching folders re-enters the loading state; returning home via the brand shows the empty state, never skeletons.
- [x] 3.2 Run `npm run lint` and `npm run build` and confirm both pass clean.