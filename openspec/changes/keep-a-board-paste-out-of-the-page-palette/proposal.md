# Proposal

## Why

The app and the board editor share one mermaid instance, and mermaid's
configuration is a global. The page renderer initializes the app's palette before
every drawing and never puts anything back. `@excalidraw/mermaid-to-excalidraw`,
which the board editor calls when a user pastes mermaid into a board, initializes
its own configuration but only when its config hash differs from the last one it
used. So after a page has drawn a diagram in a session, the board's next paste
skips its own `initialize` and converts the diagram with the app's palette
instead. In a session where no diagram was drawn, the same paste uses mermaid's
default palette.

Same gesture, two outcomes, decided by whether a diagram happened to be on screen
since the last paste. The imported shape colours are cosmetic, but the
inconsistency is not: nothing about a board paste tells the user which palette
they will get.

A second, smaller problem is the writing. `src/editor/diagrams.ts` says "the
board editor's paste path shares this global configuration ... the configuration
is set by whoever is about to draw", and the `diagrams` spec requires "one engine
configuration" with "each renderer setting the configuration it draws with
immediately before it draws". Neither is what the code does: the board's
converter sets its own configuration only when its cached hash changes, so the
palette in effect is decided by history, not by whoever drew last.

## What Changes

- **The page renderer puts the engine back as it found it.** The drawing wrapper
  snapshots mermaid's configuration, installs the app's palette for its own
  render, and restores the snapshot once the render settles. The app stops
  owning a global that another renderer also uses. A board paste is then styled
  by the configuration the board's own converter installed, every time, in a
  fresh session and after a diagram page alike.
- **The writing says what happens.** The module comment and the `diagrams`
  requirement describe the shared engine, the snapshot and restore, and the fact
  that the board's conversion is Excalidraw's to configure.
- **No behaviour change for pages or slides.** A page's diagram and a slide's
  diagram are still drawn in the app's palette; the restore happens after the
  drawing settles, so it cannot affect it.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `diagrams`: the "one engine configuration serves every renderer" requirement
  becomes a rule that a renderer restores the configuration it found, and that a
  page render never changes what a later board paste draws. The existing
  scenarios stay; one is added for the paste.

## Non-goals

- Not theming the board's pasted mermaid in the app's palette. It cannot be
  guaranteed: the board's converter initializes its own configuration on its
  first conversion of a page load and skips its later ones, so no call of ours
  can be the last writer before that conversion without pre-warming or patching a
  third party's cache. A palette that appears only sometimes is worse than the
  converter's own, and it matches the dialog's own preview.
- No change to the fence grammar, the palette itself, the placeholder, the
  failure note, or the viewport scoping.
- No new dependency, and no direct import of Excalidraw's converter package.
- No cross-renderer lock. The panes are exclusive (opening a board unmounts the
  page), so two renderers cannot draw at once; the existing serialization of page
  renders stays as it is.

## Impact

- `src/editor/diagrams.ts`: the render wrapper snapshots and restores the
  configuration, through a small exported seam so the behaviour is testable.
- `src/editor/diagrams.test.ts`: cases for the restore, including a failed draw.
- `openspec/specs/diagrams/spec.md`: the requirement and its scenarios.
- Version bump: a patch bump for the feature commit, another for the archive
  commit.
