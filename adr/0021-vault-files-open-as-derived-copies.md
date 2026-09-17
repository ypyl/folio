# ADR-0021: A vault file opens as a derived copy, never in place

- Status: Accepted
- Date: 2026-09-17

## Context

A page can link to a file in the vault — `[Q3 report](assets/q3-report.pdf)` — and until now only images were usable: the pane reads an image's bytes and displays them, and every other file type was a link that looked clickable and did nothing. What should happen when the user opens one?

The browser decides most of that answer, and none of it is Folio's to choose:

- A page never learns a file's path on disk. `FileSystemDirectoryHandle` is deliberately opaque about it, so there is no path to name.
- Navigation from an `http(s)` origin to `file://` is blocked, so even a path Folio knew could not be followed.
- There is no shell-open in the web platform. No API asks the operating system to open a file with the application registered for it.

Two verbs exist: hand the browser bytes to display, or hand it bytes to download. Everything else a user might expect — the system's PDF editor opening *the* vault file, edits landing back in the vault — needs code outside the browser.

The alternatives were therefore not variations of the same feature:

1. **A native companion** (a native-messaging host, or a helper registering a `folio:` protocol) that would call the OS to open the real path. It is the only way to the literal behaviour, and it means an install step outside the app, a second codebase, and a permission surface — the opposite of "no backend, no feature creep" (ADR-0006, ADR-0007).
2. **An in-app viewer** (embedding a PDF renderer in a pane). It keeps the user inside Folio but needs a large dependency, and it answers a different question: previewing, not editing with a tool the user already has. It also changes the three-pane layout (ADR-0005).
3. **Open in place with write-back**: observe the file after the external application closes it and re-read it into the vault. Built on (1), plus watching, conflict handling, and a rule for what happens when the external editor is a different file entirely.

## Decision

A vault file opens as a derived copy.

- The app reads the file once through the storage seam's binary read and gives the bytes to the browser: a `blob:` URL in a new window for a type the browser displays (PDF, images, media, plain text), a download for everything else, so the operating system's registered application can open it.
- The gesture is the one the app already uses for links: Ctrl+Click, Cmd+Click on macOS (`open-links-on-ctrl-click`).
- The vault file is never written and the page's Markdown is never touched, so the file stays canonical (ADR-0001). The app writes nothing anywhere as part of the gesture; the download, where there is one, is the browser's.
- No native companion, no in-app viewer, no protocol handler, no write-back, and no watching for a change made outside.

Rejected: the native companion. It is the only route to the literal behaviour, and it is not worth a second installable artifact for a file type the browser already displays in one click.

Rejected: an in-app viewer. A preview is not what was asked for, it adds a dependency and a layout decision, and it does nothing for the types the browser cannot render.

Rejected: relying on the browser's own handling of a relative link. A vault path resolves against the app's origin, so the tab would show a 404; this is why links into the vault open nothing today.

Rejected: copying the file into the vault on open, or writing a cached copy for the external application to edit. It makes a second source of truth inside the folder the app calls its database.

## Consequences

- Opening a PDF shows the browser's own viewer, not the user's PDF editor. Only the download branch reaches a registered application, and then it opens a copy in the downloads folder: an edit made there is invisible to Folio and does not return. This is the cost of the decision, and the feature is described in terms of it rather than as "open the file".
- The app can now cause a file to be created outside the vault — the browser writes it, Folio never does. Nothing reads it back.
- A window opened this way is an opaque origin with `opener` cleared: a file that carries script of its own (`svg`) can draw, and can reach neither the app nor the vault.
- Nothing new is persisted, no index or derived data changes, and the vault is read on a click and not on a keystroke, so the typing budget is untouched.
- The storage seam keeps the shape ADR-0003 gave it: one more consumer of the binary read that already existed.
- If an edit round-trip is ever wanted, it needs the companion this record rejects, and it supersedes this decision rather than extending it.
