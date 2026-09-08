# Tasks — add-status-bar

## 1. Status bar component

- [x] 1.1 Create `src/components/StatusBar.tsx` (+ `StatusBar.module.css`): a presentational component taking `pagePath`, `saveState`, `newPage`, `indexing`, `vaultName`, `fileCount`, `onHelp`, `helpOpen`; render three groups — path breadcrumb (left, walking the dirs-wrapper + file-name pattern from EditorPane), status text + `?` button (center, reusing the existing button `id`/`aria-controls` for the shortcuts dialog), vault name · file count (right); verify `npm test` passes with the component compiling
- [x] 1.2 Style the bar: shell row uses Kami tokens — stone 12px text, hairline `--border` top border, parchment surface, no shadow; each group `min-width: 0` with `overflow: hidden; text-overflow: ellipsis`; root-level paths render the single name segment; verify a root path and a deeply nested path both render through the component test

## 2. Shell integration

- [x] 2.1 Add the third grid row in `src/index.css` (`.app-shell` → `grid-template-rows: auto 1fr auto`) and render `<StatusBar>` in `App.tsx` after the workspace, passing the existing state (`page?.path`, `saveState`, `newPage`, `indexing`, `activeFolder` name + `graph`/folders file count, `onHelp`, `helpOpen`); verify the bar renders in the dev app in empty, indexing, page-open-clean, and page-open-dirty states
- [x] 2.2 Remove the crumb, the `<SaveIndicator>`, and the "Indexing notes…" label from `EditorPane.tsx` (pane keeps the editor, gutter, drop handling, and decorative `aria-hidden` skeleton lines); remove the now-unused `saveState`/`newPage` props and `SaveIndicator` import; verify the editor pane tests still pass with those surfaces removed
- [x] 2.3 Strip the vault status and help button from `Header.tsx` (drop `vaultName`/`fileCount`/`onHelp`/`helpOpen` props and the slot content; keep the empty right column and column mirroring); verify header tests pass after the change

## 3. Contract tests

- [x] 3.1 Move the breadcrumb and save-indicator test scenarios from `EditorPane.test.tsx` to a new `StatusBar.test.tsx`, extending them for the spec: path group shows the breadcrumb for nested/root/no-file-yet paths, path group empty with no page, save lifecycle texts ("Unsaved changes", "Saving…", "Save failed"), indexing label, vault name · file count, `?` button present in every state including empty, and the bar performing no actions on its text/segments; verify `npm test` passes with the moved and new cases
- [x] 3.2 Verify a11y intent: status text keeps `role="status"`, the indexing label is announced as an in-progress status, the crumb stays real text in the tree (no `aria-hidden`), the `?` keeps its `aria-expanded`/`aria-controls` wiring to the shortcuts dialog, and the dialog's focus-return target still resolves
- [x] 3.3 Add outside-click dismissal to the shortcuts dialog: activating the scrim area outside the dialog closes it (clicks inside the dialog do not), on top of Escape and the close control; add ShortcutsDialog tests for both scrim-close and inside-does-not-close, and verify `npm test` passes

## 4. Whole-change verification

- [x] 4.1 Run `npm run lint` and `npm run build` clean; run `npm test` green; manually exercise the spec scenarios in the browser — bar present on the empty state showing only `?`, indexing label in the bar while a folder opens, breadcrumb + save status for an open page, vault info on the right, and the bar fixed while panes scroll — before archiving