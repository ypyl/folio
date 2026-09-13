# ADR-0017: Adopt the GFM table slice and the component table block

- Status: Accepted
- Date: 2026-09-13

## Context

Folio's editor loads Milkdown's `commonmark` preset (ADR-0008), which has no `table` node: a page containing a pipe table opened as one paragraph of literal pipes, broken by the hard breaks Markdown gives it. The `page-editing` spec already claimed tables were editable, so the app was behind its own contract, and any vault written by hand or by another tool showed its tables as raw text — the most visible place where the file and the app disagreed.

Milkdown's GFM support is a preset, not a menu. `@milkdown/preset-gfm` adds the table grammar *and* autolink literals, task lists, GFM footnotes, and a strikethrough mark, in one flat list of plugins. The autolinks are the decisive cost: with the preset registered, a bare `https://example.com` in a page parses to a link and serializes back as `<https://example.com>`, and `www.example.com` as `[www.example.com](http://www.example.com)`. The editor would rewrite characters nobody touched, against a live requirement of `page-editing` and against the premise that the folder is the database (ADR-0001). The strikethrough mark would also collide with the presentational decoration `render-struck-text` had just shipped, and task lists and footnotes would arrive needing design of their own.

`@milkdown/components` — the package ADR-0014 already depends on for the code block — ships a `table-block` component that renders a table's controls (row and column handles, add and delete, alignment) as a Vue node view.

## Decision

Take tables from the GFM preset and nothing else.

- Register the table pieces **by name**, not by spreading or filtering the preset's exported arrays: the five schemas, the input rule, `tableKeymap`, the three plugins, and the commands the component resolves by key. Those arrays are flat lists of the wrappers' inner items, so an identity filter against an exported wrapper silently leaves that item registered — the failure would be invisible (URLs rewritten) rather than a build error. A whitelist fails at compile time when an export is renamed. The slice lives in `src/editor/tableSetup.ts`.
- Replace `remark-gfm` with a **table-only remark plugin**, built from `micromark-extension-gfm-table` and `mdast-util-gfm-table` (both already present as `remark-gfm`'s own dependencies). This is the price of keeping a bare URL literal, and it buys parsing, serializing, and column alignment for tables alone.
- Adopt `@milkdown/components/table-block` for the controls, with Folio's `renderButton` markup (a drawing plus an accessible name per control) and Folio styling per DESIGN.md's Tables rules. Because the component's controls are pointer-only spans, Folio binds its own chords — `Mod-Alt-t` insert, `Mod-Alt-Enter` add row, `Mod-Alt-Shift-Enter` add column — and lists them in the shortcuts reference, which is also the dispatch surface (ADR-0016).
- Accept the serializer's canonical table forms as the contract: padded cells, a short delimiter row (`| - |`), `<br />` for an empty cell, and one empty body row for a header-only table. They are stated in `page-editing` rather than papered over. A page that is only opened is never rewritten, and no text is re-interpreted — the line is drawn at the characters a user typed.
- Extend the document tail (ADR-0014's sibling rule) to a table, so a page ending in one keeps a continuation paragraph, exactly as a page ending in a code block does.

Rejected: `.use(gfm)`, for the URL rewriting above and for the three features nobody asked for. Rejected: filtering `gfm`'s arrays, because it fails silently. Rejected: a Folio-written table schema, parser, or serializer — the text-editing ownership ADR-0008 exists to avoid. Rejected: registering the table keymap and commands without the component, which leaves a table frozen at whatever shape it arrived in, since nothing can add a row or column.

This implements the tables ADR-0008 already named and follows the component pattern ADR-0014 set. It supersedes neither.

## Consequences

- A page's pipe table is a table on screen and a table in the file, while every other construct's Markdown stays byte-identical to the GFM-free editor: bare URLs, `~~runs~~`, `[x]` markers, and footnote syntax are untouched.
- The editor gains a Vue node view per table, alongside the one per code block, and pulls `dompurify`, `clsx`, and `lodash-es` through the component. Vue itself was accepted in ADR-0014.
- `@milkdown/preset-gfm`, `micromark-extension-gfm-table`, and `mdast-util-gfm-table` become direct dependencies, and the slice has to be revisited on a preset upgrade. That is the cost of the whitelist.
- `Enter` leaves a table (the preset's keymap) rather than adding a row, and a table's controls are the component's markup with Folio styling. Folio documents both rather than changing them.
- One exception to leaving the component its own placement: a row or column handle the component puts outside the pane's visible box is nudged inside it (`keep-table-handles-in-the-pane`, `src/editor/tableHandleClamp.ts`). The pane is a scroll container, so a handle above its edge cannot be pressed, and the component's placement is not configurable. Folio corrects the result, never the calculation, and only for the two chips a user presses.
- A hand-written table adopts the canonical form the first time its page is saved. Opening a page never touches it.
