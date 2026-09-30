# Tasks

## 1. Reveal in the sidebar

- [x] 1.1 Convert `Sidebar` to `memo(forwardRef(...))` and expose a `revealActive()` handle: it finds the listing's enclosing `<details>`, sets `open = true` when the section is closed, locates the `[data-active]` row, scrolls it into view with `scrollIntoView({ block: 'nearest' })`, and focuses it. Verify a `Sidebar` test renders a long listing with the active row outside the window, closes the Files section, calls `revealActive()`, and asserts the section is open and `document.activeElement` is the active row.
- [x] 1.2 Make `revealActive()` a safe no-op when there is nothing to reveal — no vault, no active row, or the listing not rendered. Verify a `Sidebar` test calls it with an empty row set and with no active path and asserts no throw and no change.

## 2. The status bar's page name as a control

- [x] 2.1 In `StatusBar`, render the last path segment as a `<button>` when an `onRevealPage` handler is supplied, and as inert text otherwise; give the button an accessible name naming the page and the action, and reuse the bar's existing focus-visible styling. Verify a `StatusBar` test asserts the segment is a button that calls the handler when supplied, and is not a button when omitted.
- [x] 2.2 Confirm the rest of the bar stays inert: the directory crumbs, the status text, the vault name, and the version render no activation path. Verify a `StatusBar` test asserts none of them is a button, and that activating the directory crumbs calls nothing.

## 3. Wiring in `App`

- [x] 3.1 Find the active row among the `rows` passed to `Sidebar` and pass `onRevealPage` to `StatusBar` only when that row's kind is `page`; hold the sidebar's handle in a ref. Verify an `App` test with a board open and one with a journal day open asserts the status bar's file-name crumb is not a button.
- [x] 3.2 Implement the reveal in `App`: when the left navigation is expanded, call the sidebar handle directly; when it is folded, unfold it, record the request in a ref, and perform the reveal in an effect once the pane is expanded. Verify an `App` test with the left navigation folded activates the status bar's page name and asserts the pane unfolds with focus on the page's row, and a second test with it expanded reveals in one step.
- [x] 3.3 Verify revealing leaves everything else alone in an `App` test: with an open page carrying unsaved edits, activating the page name leaves the editor content and the open path unchanged and issues no vault write.

## 4. Typing path and checks

- [x] 4.1 Confirm the reveal adds nothing to the typing path: verify an `App` test reveals the row, then types in the document, and asserts no scroll or focus change results from the keystroke and that the `Sidebar`'s prop identities are unchanged across the reveal.
- [x] 4.2 Run the repo checks: `npx oxlint --fix`, `npm run fmt`, `npm test`, `npm run build`, then `npx oxlint --deny-warnings --format=agent`. Verify all succeed with no warnings.
- [x] 4.3 Browser check: start with `npm run dev:test`, confirm the log says `ready in`, open a vault with enough pages that the open page's row scrolls out of the Files listing, activate the status bar's page name, and confirm the row scrolls into view and takes focus; repeat with the left pane folded and with the Files section collapsed. Stop the server with `npm run kill:dev` and verify no dev server survives.
- [x] 4.4 Bump `version` in `package.json` by a minor step. Verify the status bar badge shows the new `v<version>`.
