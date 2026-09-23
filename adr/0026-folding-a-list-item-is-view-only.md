# ADR-0026: Folding a list item is view-only

- Status: Accepted
- Date: 2026-09-23

## Context

Folio's lists are Markdown lists: an item's sub-items live in the file as an indented nested list. Reading a long outline means scrolling past detail that is not currently relevant, and Logseq lets a writer fold an item so its sub-items leave the screen. Folio needs the same gesture without acquiring the thing that makes Logseq different.

The obvious way to persist a fold is Logseq's own: a `collapsed:: true` property on the block, written into the file. That property is a block attribute, and ADR-0009 rejects a block model for exactly this reason: state that is not prose would leak into the canonical Markdown, and a file would stop being just a file. A second way is app state in `.folio/` (ADR-0015), which is allowed but introduces a new class of persisted UI state for a reading convenience.

Two neighbouring decisions constrain the rendering. ADR-0020 leaves the browser's native list marker where the browser puts it and refuses to draw a marker of Folio's own, and DESIGN.md's Lists entry forbids faking a bullet with a `::before` dash.

## Decision

**Folding a list item is a view over Markdown, never a change to it.**

- A fold hides an item's nested content in the editor only. The ProseMirror document is untouched, so the serializer still writes every line and the file on disk keeps them (ADR-0001, ADR-0009). A fold produces no markdown change and so cannot dirty the page.
- **Fold state is session-scoped and per editor instance.** It is not written to the vault: no Markdown property and no `.folio/` entry. Opening another page or reloading the app shows every item expanded. Persisting folds is out of scope until a separate decision says otherwise.
- **The native marker stays.** The disclosure control is a separate element in the item's marker lane; the browser still draws the bullet, and Folio carries no marker-alignment rule of its own. ADR-0020 stands unchanged, and this decision does not meet its stated condition for revisiting (a decision to own the marker).
- **Folding is not an outliner.** It folds a Markdown list item's nested blocks; it introduces no block, no id, and no document model (ADR-0006, ADR-0009).

## Consequences

- A folded item's lines survive every save, and a fold by itself never writes the file. Two users, or one user in two sessions, see the same expanded page.
- A disclosure control joins the small set of real elements Folio draws inside the editable surface (ADR-0018's image control is the precedent), positioned and styled by DESIGN.md rather than by a faked marker.
- A fold changes the rendered height without changing the document, so the line-number gutter must be told to re-measure; the editor seam carries a layout-change notification for that reason.
- Persisting fold state later needs its own decision and its own storage choice; this ADR deliberately leaves that open rather than choosing `.folio/` by default.
