# Add file breadcrumb

## Why

The editor pane shows only the document's content — never the file behind it. A page's identity (its vault-relative path, ADR-0013) is invisible while reading or writing: a journal day reads "September 8, 2026" while the file is `journals/2026-09-08.md`, and a document's `# Title` heading can differ entirely from its file name. The pane is the one place in the app with no indication of the actual file.

## What Changes

- The editor pane shows a breadcrumb at the top for the open page: the page's vault-relative path rendered as non-interactive segments — `notes / Deep / 2026.md` — with the `.md` extension kept on the last segment.
- The breadcrumb sticks to the top of the pane while the document scrolls beneath it.
- The breadcrumb is purely informational: segments are not links, nothing navigates, nothing copies.
- The breadcrumb reflects the open page's path; it does not track file existence, save state, or staleness (those facts belong to `pendingBlank`/`lastKnown` content fallbacks and the SaveIndicator).

## Capabilities

### New Capabilities

None — no new behavioral surface is introduced.

### Modified Capabilities

- `page-editing`: the editor pane gains a requirement to show the open page's file path at the top of the content.

## Non-goals

- **No folder navigation.** Segments are not clickable; there is no directory browsing or folder-view pages.
- **No copy affordance.** The path is not copyable (no click-to-copy, no context menu).
- **No rename path.** The breadcrumb does not rename files and does not expose the in-document title differently than today.
- **No existence tracking.** The breadcrumb does not display whether the file exists, is new, or was deleted externally; the save indicator and content fallbacks already own those states.
- **No search-results, empty, or loading surfaces.** The breadcrumb renders only for an open page.

## Impact

- `src/components/EditorPane.tsx` — renders the breadcrumb for the open page; CSS in `EditorPane.module.css`, following Kami tokens (stone 12px metadata, hairline border, opaque parchment, no decoration).
- `src/page.ts` — no change needed; `Page.path` already carries the vault-relative path.
- No new dependencies, no backend, no ADR changes (UI-only, per ADR-0006/0011).