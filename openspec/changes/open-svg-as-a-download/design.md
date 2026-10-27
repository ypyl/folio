# Design

## Context

`openVaultPath` (`src/vault/assetOpen.ts`) reads the file's bytes through the
storage seam and hands them to the browser as a `blob:` URL: a new window for a
type in `DISPLAYABLE`, a download otherwise. `window.open` opens the window
before the read (a user gesture is what allows a window at all) and
`opened.opener = null` keeps the opened page away from the app's window handle.

What that handle does not do is change the opened document's origin. A `blob:`
URL's document has the origin of the page that created the URL, so script in a
top-level SVG runs with access to the app's storage: the `folio` IndexedDB
database holds the folder handles, and the folder permission is granted for the
session, so the script can read the vault and send it anywhere.

## Goals / Non-Goals

**Goals:**

- One click on an SVG cannot run script with the app's origin.
- No new dependency, no new UI, no new document path.
- The other branches keep working exactly as they do.

**Non-Goals:**

- Showing SVGs in the app, or sanitizing them.
- Changing the plain-click/Mod+Click gesture or the row surfaces.

## Decisions

### D1: SVG joins the download branch

The displayable table is the app's own list of types it serves as a document.
Removing `svg` moves it to the branch that already exists: the file is handed
to the browser as a download, and the OS's SVG application opens the copy. The
gesture, the read, the naming, the "changes nothing else" guarantees, and the
percent-decoding rule are all untouched, because they live outside the type
table. One line, no new code path.

An SVG in a page is unaffected: it is an `<img>` inside the editor's document,
and an image element cannot run script however the bytes are typed.

### D2: Correct ADR-0021 in place

The record already owns this decision and states a false premise ("a window
opened this way is an opaque origin"). The repo's MADR convention is to edit a
record in place when its status or content changes, so the decision's list of
displayable types drops SVG and the consequence names the real origin rule. A
new ADR would duplicate the decision to correct one sentence.

### Rejected: sanitize the SVG

Stripping `<script>`, event attributes, and `javascript:` URLs needs an HTML/SVG
parser or a new dependency, and a deny-list is exactly the kind of thing that
gets bypassed. The browser cannot show an SVG document safely under the app's
origin, so the type is not shown as a document at all.

### Rejected: an `<img>` wrapper document

Writing a tiny HTML document into the new window with the SVG as an `<img>`
would keep the window branch. But the wrapper document still has the app's
origin and adds a second document-building path, so a later change to it
reintroduces the same class of bug for no user benefit over a download.

### Rejected: a sandboxed iframe preview

It is a new surface (a modal or a pane) and a layout decision ADR-0005 would
have to absorb, for a type the OS already displays.

## Risks / Trade-offs

- An SVG row now costs a download step before it is visible. That is the price
  of not running foreign script with the app's storage access.
- A user who expects a tab for an SVG sees a download instead. The requirement
  and ADR-0021 say so plainly, so the behavior is documented rather than
  surprising.
- The download branch is used more, so its upload/OS path gets more real use; it
  is the same code an archive already took.
