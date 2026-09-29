## Why

Folio pages are heading-structured documents (ADR-0027), but nothing in the app helps a reader see or move through that structure: the right meta panel shows what links in and out, never the page's own shape. Removing list folding took away the one affordance that rewarded bullet outlines and named a reading surface over headings as its replacement; this is that surface. At the same time, the panel splits a page's outgoing links into two near-identical sections — Forwardlinks (pages) and References (files and boards) — which costs panel height and a decision every time a reader looks for something the page points at.

## What Changes

- Add a **Contents** section to the right meta panel, above Backlinks: the open page's headings as an indented list, open by default. Activating a heading scrolls it into view, reusing the editor's existing block-locate mechanism. This is view-only and writes nothing.
- Derive Contents from the page's **saved content**, memoized on the content string — headings only, never list items (ADR-0027). A heading change appears a beat after auto-save.
- **Merge References into Forwardlinks.** The panel keeps one Forwardlinks section holding two labeled groups, **Pages** and **Files** (assets and board references); the separate References section is removed.
- **Change the panel's defaults:** Contents open, Backlinks open, Forwardlinks collapsed, Keyboard shortcuts collapsed.
- Contents sizes to its content with a scroll cap; the link section(s) keep sharing the panel's remaining height.

## Capabilities

### New Capabilities

- `page-contents`: the right panel's Contents section — an open page's headings, indented by level, navigable by activation, derived from saved content and never written.

### Modified Capabilities

- `ui-shell`: the meta panel's sections, order, and defaults (adds Contents, merges References into Forwardlinks, collapses Forwardlinks by default); the loading placeholders and the shell/last-section requirements that name the panel's sections.
- `vault-assets`: a page's assets are listed in Forwardlinks' Files group instead of a References section.
- `whiteboards`: a page's board references are listed in Forwardlinks' Files group instead of a References section.
- `static-navigation`: the meta panel's row navigation (asset rows live in Forwardlinks' Files group, not a References section).
- `page-editing`: the attach-files scenario names the panel section that lists a newly attached file.

## Non-goals

- **No list items or outliner TOC.** Contents is headings only (ADR-0027); a bullet page shows an empty Contents, which is the intended signal.
- **No new file kind, index, or storage.** Contents is derived data, rebuilt from the page's content, never written to the vault (ADR-0001).
- **No editing from Contents.** Activating a heading scrolls and briefly marks it; it does not move the caret or change the document.
- **No live-draft freshness.** Contents reflects saved content, not the in-flight draft.
- **No change to how headings render**, to the editor's locate mechanism (reused as-is), or to how a page opens (page-editing's "no read-only preview" rule stands).
- **No backend, no database, no block model.**

## Impact

- **UI**: a new Contents band in `MetaPanel`; `Forwardlinks` becomes one section with two groups; the panel's default states change. No new dependency, no network.
- **App**: one memoized derivation of headings from the open page's content; one handler that asks the editor to locate a block. Both off the keystroke path.
- **Specs**: a new `page-contents` capability plus deltas to `ui-shell`, `vault-assets`, `whiteboards`, `static-navigation`, and `page-editing`.
- **ADRs**: consistent with ADR-0027 (headings carry structure), ADR-0006 (keep it small), ADR-0011 (Kami), ADR-0001 (Markdown canonical). No new ADR is required; the References/Forwardlinks merge reverses the earlier `split-forwardlinks-and-band-meta-panel` change and is recorded in the `ui-shell` delta.
