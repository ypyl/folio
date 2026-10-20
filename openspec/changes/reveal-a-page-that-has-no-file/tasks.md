# Tasks

## 1. The control and the write

- [x] 1.1 In App, split the reveal predicates: `canRevealPage` (the open item is a page, so the crumb is a control) and `hasPageRow` (the page has a Files row). Update the `StatusBar` prop documentation. Verify the existing reveal tests still pass, including journal and board breadcrumbs staying inert.
- [x] 1.2 Make `handleRevealPage` create a page that has no row: set `pendingReveal`, write the open draft's content through `savePage`, keep the fold/compact steps, and let the pending-reveal effect reveal once `hasPageRow` turns true. Verify an App integration test: opening a reference to a missing page, activating the crumb writes `pages/<name>.md` with the page's content, the row appears, and focus lands on it.
- [x] 1.3 Keep the "writes nothing" case honest: verify an App integration test that revealing a page that already has a file writes no file and leaves the editor content unchanged, and that a page with unsaved text and no file has that text written by the reveal.

## 2. Docs and version

- [x] 2.1 Note in the README's status-bar description (or the Reminders-adjacent prose if that is where the crumb is documented) that the page name reveals the row and creates a brand-new page so it can be revealed. Bump `version` in `package.json` (minor). Verify the status bar's badge reads the new version.

## 3. Integration verification

- [x] 3.1 Run the whole unit and integration suite, `npx tsc -b`, `npx oxlint --deny-warnings --format=agent`, and `npm run build`; verify all green.
- [x] 3.2 Run the whole e2e suite; verify all green and sweep dev servers with `npm run kill:dev`.

## Workflow follow-up

- Archive the change with `/opsx-archive` after review.
