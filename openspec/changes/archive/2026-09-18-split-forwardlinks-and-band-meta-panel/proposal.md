## Why

A page's Forwardlinks mixes two different things in one list: pages it references and files it points at. Page rows navigate, asset rows open a file, and one alphabetical list makes the reader sort out which is which. The right meta panel is also the last pane that still scrolls as one region: link sections grow without limit and push the panel's own summary rows around, which is the layout failure the sidebar already fixed (task 23 → task 24's column of bands).

## What Changes

- **Forwardlinks lists page rows only.** A page's `#` references stay where they are; nothing navigational moves.
- The right meta panel gains a third page-metadata section, **References**, holding the open page's asset rows: every vault file its Markdown links and images target, one row per file, labelled with the file's name. The section is collapsed by default, like the sidebar's Assets section. Activating a row opens the file exactly as it does today (ADR-0021) and changes nothing else.
- The right meta panel becomes **banded** like the sidebar: Backlinks, Forwardlinks, and References share the panel's remaining height and each scrolls inside its own body, with a minimum height so a short window cannot collapse one to nothing. The panel itself only scrolls as a fallback, when even the floors do not fit. The keyboard-shortcuts section stays the panel's last section, anchored to its bottom edge, and still expands upward with no scroll region or height cap of its own.
- Every section summary stays in the document in every app state, and a collapsed section is exactly its summary row (the sidebar's rule, applied to the right panel).
- The meta panel's loading placeholders cover all three link sections while the index builds.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `ui-shell`: the meta panel becomes Backlinks, Forwardlinks, References, and the keyboard-shortcuts reference, with each link section scrolling inside its own body; the shell's multi-scroll-region wording covers the right panel too; the loading placeholders cover the References section.
- `vault-assets`: "Forwardlinks lists a page's assets beside its page references" is replaced by "the References section lists a page's assets", so a page's files have one home in the panel and Forwardlinks has one meaning.
- `static-navigation`: the links-pane requirement is restated for three sections — Backlinks and Forwardlinks page rows navigate, References asset rows open a file and navigate nowhere.

## Impact

- UI: `src/components/MetaPanel.tsx` and `MetaPanel.module.css` (third section, banded layout, scroll bodies), `src/App.tsx` (the two row lists split into a page list and an asset list, keeping the existing `[graph, page]` memo dependencies so nothing joins the keystroke path). `Accordion` already supports a class on the `<details>` and on the body, so it needs no new prop.
- Specs: `ui-shell`, `vault-assets`, `static-navigation`.
- Docs and build identity: `DESIGN.md` (the panel's banded layout joins the sidebar's rule), `PLAN.md` (new numbered task entry), `package.json` 0.10.0 → 0.11.0.
- No new dependency, no `VaultStorage` change, no persisted state, no ADR: this is UI organization inside ADR-0005's three-pane shell, with ADR-0021 and ADR-0022 unchanged.

## Non-goals

- No section rename beyond the requested label: the new section is titled **References** and holds asset rows, which is deliberately at odds with ADR-0012's "page references" vocabulary. The word "References" in the panel means the page's files; the specs say so explicitly so the two never get confused.
- No asset backlinks ("which pages use this file"), no asset metadata in rows (size, type, modified date), no asset editing, renaming, deleting, or pinning (ADR-0022 stands).
- No windowing of the panel's lists. A page's link and asset counts are bounded by the page's own content, not by vault size, so the row count in the document stays a function of the open page, and no new memo, measurement, or spacer machinery is added.
- No change to what counts as a reference or an asset, to how a row's target resolves, or to the editor's own rendering of links and images.
- No change to the sidebar, the status bar, or the keyboard-shortcuts list's contents.
