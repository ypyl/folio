# Links Pane

## Why

The right meta panel still shows placeholder copy in its Backlinks and Forwardlinks sections even though the index has been building the full link graph since scan-parse-index. The pane exists to show a page's place in the vault; placeholder text wastes it.

## What Changes

- The meta panel's Backlinks and Forwardlinks sections render real rows from the index graph for the open page.
- Backlinks rows list every page that references the open page, however the reference is written (`#word` or `#[[Page]]`); forwardlinks rows list the pages the open page references.
- Rows are buttons; clicking one navigates to that page, like sidebar rows.
- References to pages that do not exist yet are **lazy**: the row stays clickable and opens a blank page that lives only in memory — the `.md` file is NOT created until the user writes content into it (the journal create-on-write pattern, PLAN task 10).
- **BREAKING (spec only)**: static-navigation's "Meta panel remains placeholder" requirement is replaced by the real links-pane behavior.
- Explicitly out of scope: unlinked references (plain-text mentions without link tokens) — parked under PLAN "Later ideas".

## Capabilities

- **New Capabilities**: none
- **Modified Capabilities**:
  - `static-navigation` — the meta panel stops being placeholder and navigates; navigation to an unmaterialized page (no file on disk) opens a blank in-memory page that materializes on first save
  - `ui-shell` — the meta panel's sections gain row content and empty-state copy; placeholder copy remains only while no page is open

## User Impact

Opening any page shows its place in the vault at a glance: who links to it, where it links. A link to a page that doesn't exist yet no longer dead-ends — it opens a blank page that creates its file only when the user starts writing, so the filesystem never grows orphan files for mere glances.