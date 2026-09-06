## Why

Folio's center pane currently opens to a dead brand screen while a vault is already open, and the sidebar offers a "New Page" button that creates nothing. The journal is the natural home of a notes app (ADR-0006: keep it small): land there, create pages by referencing them, and let the empty page say "type here".

## What Changes

- **REMOVE the sidebar's New Page button** (it is currently inert). Creating a page stays organic: type `#word` / `#[[Page]]` anywhere, let a links-pane forwardlink open an unmaterialized page, or open a calendar day. No replacement affordance is added.
- **Open today's journal note by default.** Whenever a folder becomes active and no page is open — app restore, a folder switch, or adding a folder — the editor opens that folder's `journals/YYYY-MM-DD.md` for today. A day with no file on disk opens blank and materializes on first save (existing unmaterialized-page behavior; nothing is written by merely opening). Re-activating the already-active folder keeps the open page.
- **Show a placeholder in an empty editor.** An open page with no content shows a hint ("Start typing…") at the cursor line so a blank page reads as editable; the hint disappears as soon as the page has any text and returns when it is emptied.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `static-navigation`: The "App loads to the empty state" requirement is replaced — with a vault open, the app loads to today's journal note; the brand empty state remains only for the no-vault case (and transiently while a folder's index builds).
- `ui-shell`: The sidebar requirement drops the New Page button ("Sidebar is an accordion with a New Page button" → accordion of Journal and Pages only); the folder-rail requirement changes "switching resets the open page so no page is selected" to "switching opens the newly active folder's today journal".
- `page-editing`: New requirement — an open page with empty content shows a placeholder inviting typing; the placeholder never renders for non-empty pages and never appears as selectable or saved content.

## Impact

- `src/components/Sidebar.tsx` — remove the New Page button; `Sidebar.module.css` drops `.newPageBtn`.
- `src/App.tsx` — effect that opens today's journal when a folder's graph is ready and no page is open; import `localDayString`.
- `src/components/EditorPane.tsx` + `EditorPane.module.css` — track document emptiness and render the placeholder (`--stone`, Kami token; no new color).
- Tests: `App.test.tsx` (remove New Page assertion; folder-open now opens today's note), `EditorPane.test.tsx` (placeholder states), plus new assertions for the default-open behavior.
- No filesystem, ADR, or dependency changes. No new ADR.