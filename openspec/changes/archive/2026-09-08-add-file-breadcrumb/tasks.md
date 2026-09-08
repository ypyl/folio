# Tasks — add-file-breadcrumb

## 1. Breadcrumb markup

- [x] 1.1 Render the breadcrumb in `EditorPane.tsx`'s page-open branch: a row above `.document` splitting `page.path` on `/` with separators, `.md` kept on the final segment, full path in a `title` attribute; verify existing `npm test` stays green
- [x] 1.2 Confirm the crumb renders only when the page is open — the empty, loading, and search-results surfaces show none (the results view structurally lacks EditorPane; the others are the `page === null` branches)

## 2. Breadcrumb styles

- [x] 2.1 Add styles in `EditorPane.module.css`: sticky at `top: 0` with `z-index` above the document, opaque parchment background, hairline `--border` bottom edge, stone 12px metadata text (Kami, matching the gutter precedent), `white-space: nowrap`, left truncation where the last segment is `flex-shrink: 0` and never ellipsizes until it alone overflows; verify by running the app against a vault with `notes/Deep/2026.md` and a root-level `todo.md`, scrolling a long page to confirm the crumb sticks and content does not ghost under it, and shrinking the window to confirm the final file-name segment stays readable

## 3. Contract tests

- [x] 3.1 Add EditorPane tests for the spec scenarios: a nested path renders `notes / Deep / 2026.md` with the extension, a root-level path renders the single segment `todo.md`, a not-yet-existing path renders as-is (the crumb never checks existence), and `page === null` renders no crumb; verify `npm test` passes with the new cases
- [x] 3.2 Verify a11y intent: the crumb stays in the accessible tree as text (no `aria-hidden`), and the `title` tooltip carries the full path

## 4. Whole-change verification

- [x] 4.1 Run `npm run lint` and `npm run build` clean; run `npm test` green, and manually exercise the spec scenarios in the browser before archiving