# Proposal

## Why

Opening an SVG asset makes a `blob:` URL and points a new window at it. A
`blob:` document inherits the origin of the page that created it, so the SVG's
own script runs with the app's access: it can open the `folio` IndexedDB
database, take the stored folder handles, and read the vault while the folder
permission is granted for the session. ADR-0021 assumed that window was an
opaque origin, which is not how `blob:` URLs work. A vault can hold an SVG the
user did not write (an imported Logseq graph, a shared folder), so one click on
its row is the whole exploit.

## What Changes

- **An SVG opens as a download.** The OS's registered application gets a copy,
  exactly like an archive today. It is no longer shown as a document in a new
  window.
- **Everything else keeps its branch.** A PDF, an image, media, and plain text
  still open in a window; an archive still downloads. Inline images in a page
  are untouched: an `<img>` cannot run script, so an SVG shown in the page is
  still shown.
- **ADR-0021 is corrected.** Its decision no longer lists SVG as a displayable
  type, and its consequence stops claiming the window is an opaque origin.

## Capabilities

### New Capabilities

<!-- none -->

### Modified Capabilities

- `files`: the requirement "Activating a file row opens the file and changes
  nothing else" excludes SVG from the types shown in a window.

## Non-goals

- No SVG sanitizer, no SVG parsing, and no new dependency.
- No in-app viewer, preview pane, or iframe surface.
- No change to the open gesture (a plain press on a row, the platform modifier
  on a link), to the other displayable types, or to the download branch.
- No change to how a file row is listed, labelled, or resolved, and no change
  to a page's inline images.
- No change to what the gesture writes: the vault file and the page's Markdown
  stay untouched.

## Impact

- `src/vault/assetOpen.ts`: `svg` leaves `DISPLAYABLE`; the branch decision
  already reads that table, so the open gesture needs no second rule.
- `adr/0021-vault-files-open-as-derived-copies.md`: the decision's displayable
  list and the same-origin consequence are corrected in place.
- `openspec/specs/files/spec.md`: the file-opening requirement and its
  scenarios.
- Tests: `src/vault/assetOpen.test.ts` pins the branch per extension.
- Version: a minor bump (user-visible behavior); the archive commit carries its
  own patch bump.
