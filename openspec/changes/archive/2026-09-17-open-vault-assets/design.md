## Context

See `proposal.md` for why. Current state and constraints that shape the approach:

**Facts, measured in Chromium 145.0.7632.6 (Playwright 1.58.1):**

- `FileSystemFileHandle.getFile()` reports a type derived from the file's extension: `application/pdf` for `.pdf`, `image/png` for `.png`, `text/plain` for `.txt`, the OOXML type for `.docx`, `application/zip` for `.zip`, and `''` for a name with no extension. Measured over OPFS, which is the same handle machinery `FileSystemVaultStorage.readBinary` returns. So a read usually arrives typed, and the extension is what makes a displayable type displayable.
- `window.open` still opens a window after a 250 ms await inside a click handler, so transient activation survives the wait that precedes the read. The pre-open in D4 is insurance against a read slower than that window, not a requirement.
- A click handler that calls `preventDefault()` and then `window.open` opens exactly one window, with Ctrl held and without it. No double-open, nothing for the browser to activate on its own.
- In an app window (`--app=`, `matchMedia('(display-mode: standalone)')` true), pointing an opened window at a `blob:` URL of type `application/pdf` loads it there as `document.contentType === 'application/pdf'`: it is not handed to the system browser and it does not download. Plain text behaves the same. A genuinely *installed* PWA could not be automated in this environment; the app window is the closest reproducible shape, and task 1.1 leaves the installed check to a human.
- Headless Chromium has no PDF viewer, so a PDF blob tab there shows a blank HTML page. The supported target is a real browser window, which is where the check above ran.

Other current state and constraints:

- `src/editor/inlineDecorations.ts` already owns the one link gesture in the app. Its plugin's `handleDOMEvents.click` returns early unless Ctrl/Cmd is held, then `preventDefault()`s, resolves an href (anchor target, or a bare URL from the position), and calls `openExternal(href)`, which accepts only `http:`, `https:`, and `mailto:` and refuses a relative href on purpose. So the vault-relative case today stops the default and opens nothing.
- `src/editor/assetImages.ts` established the pattern for turning a vault path into a URL: `isVaultRelative(src)` (non-empty, no leading `/`, no scheme) plus `URL.createObjectURL` over bytes from `readBinary`, never touching the document text.
- `EditorPane` already receives `readAsset: (path) => Promise<Blob>` from `App` and holds it in `readAssetRef`, read at call time so a folder switch swaps the vault behind it. The decoration plugin is constructed in the same mount effect (`adapter.onReferenceClick` is the existing precedent for a callback injected at mount).
- The click path is not the keystroke path: this runs on a click, reads once, and touches no index, pool, or decoration state (`AGENTS.md` responsiveness budget).
- Platform facts the design depends on, none of which Folio can code around: a browser never exposes a vault file's OS path, `http(s)` to `file://` navigation is blocked, and there is no shell-open. The only verbs are *display these bytes* and *download these bytes*.

## Goals / Non-Goals

**Goals:**

- The click the app already performs the gesture for does something useful for a vault path, with no new gesture to learn.
- Nothing about the vault or the document changes: this is a read-only gesture (ADR-0001).
- The union of "display it" and "download it" covers every file type, so no extension is a dead link.
- The decision logic is a plain unit-testable module; the browser call is a thin edge.

**Non-Goals:**

- No in-app viewer, no preview pane, no layout change (ADR-0005).
- No write-back, no watching the file for external edits, no re-import.
- No generalisation to "open any local file the user picks": the only paths in scope are ones a page links to.
- No change to the vault-relative *image* pass, the drop/paste flows, or `openExternal`.

## Decisions

### D1 The gesture is extended where the gesture already lives

The vault-relative case joins the existing Ctrl+Click branch in the same plugin, before `openExternal` is consulted. Rejected: a click listener on the pane's host element in `EditorPane`. That would be a second place that intercepts anchor clicks, in a different layer, racing the plugin's `preventDefault` for the same event.

### D2 The reader is injected, not imported

`createInlineDecorationPlugin` gains a `readAsset` option beside `onActivate`, fed the way the reference listener already is: the adapter (`EditorAdapter`/`MilkdownAdapter`) gains one setter, and `EditorPane` attaches it from `readAssetRef` — read at activation time, so a folder switch swaps the vault behind it. The reader the plugin holds answers `undefined` when no vault is open, and the gesture then does nothing. The editor layer keeps no storage access of its own and stays unaware of which vault is open (ADR-0010, ADR-0003).

### D3 Type routing is decided from the extension, with the blob's own type as fallback

A small explicit table maps an extension to a MIME type and to "the browser displays this": the displayable set is PDF, the image types the asset flow already recognises, the common audio and video containers, and plain text. Everything else takes the download branch. Rejected: deciding from the type the storage read hands back. Measured, that type is derived from the extension and is `''` for a name with no extension — and an empty type makes a *navigation* download rather than render, so an extensionless file would take the wrong branch, and a displayability decision would be made by a MIME string the app does not control. The extension is in the path we already have; the table is the ten lines that make the behaviour deterministic. Deciding the type also means the object URL is created over a `Blob` carrying the chosen type rather than the one the handle reported.

### D4 The tab is opened synchronously; the bytes are fetched after

The click handler opens the blank tab first (`window.open('', '_blank')`), then reads, then assigns the object URL to it. An `await` before the open risks the popup being blocked and the activation being spent, and pre-opening costs nothing when the read fails — the tab is closed. Rejected: creating the anchor and `click()`ing it after the read, which has the same activation problem and no way to close a blank tab on failure.

### D5 The download branch is a synthetic anchor, not a hopeful navigation

A `<a download>` click with the object URL. Rejected: navigating a tab to a non-displayable blob and relying on Chrome's own download-on-navigation. That leaves a blank tab in the window and makes the branch's behaviour depend on the browser's internal MIME handling, which is exactly what D3 exists to pin down.

### D6 Object URLs are short-lived and not cached

One URL is created per activation and revoked on a timer (long enough that the tab has taken the bytes). Rejected: reusing `AssetImages` keyed to the page's lifetime. That cache exists because images are re-rendered on every document change and must not be read again; an asset open is a rare, discrete click, and holding every opened file's URL for as long as the page is open trades memory for nothing.

### D7 A percent-encoded target is decoded to a vault path

Markdown destinations carry `%20` where a name has a space, so the href is decoded before the storage read, and a target that decodes to something outside the ADR-0013 path contract is treated as unresolvable rather than passed through. The read goes through the same seam and the same contract as every other read; the storage rejects an invalid path and the gesture opens nothing.

### D8 The decisions live in one module under `src/editor/`

Path qualification, percent-decoding, the extension table, and the choice between the two branches: a plain module, unit-tested directly, with the DOM call (`window.open`, the anchor) at the edge. This mirrors `assetImages.ts` and keeps the plugin's click handler readable.

## Risks / Trade-offs

- [When Folio runs as an installed app, a `blob:` URL might not be able to leave the app's own window for the system browser.] → Measured in an app window: the opened window loads the blob itself, with the right content type, and nothing is handed off or downloaded. Residual gap: a truly installed PWA was not automatable here, so task 1.1 asks a human to confirm it once. If it fails there, the fallback is the download branch for every type in standalone mode, which is a spec-visible change and must go through `/opsx-update`.
- [An empty or wrong MIME type turns a preview into a download.] → D3 derives the type from the extension; measured, the read's own type is empty only for a name with no extension.
- [Percent-encoding and markdown destinations with spaces.] → D7; plus a task to check that dropping `Q3 report.pdf` produces a destination this gesture can resolve, since `insertMarkdown` parses the string as Markdown and a raw space terminates a destination.
- [A downloaded copy is Folio's first file outside the vault.] → The app never writes it (the browser does) and never reads it back. Not a rule violation, but it is the reason the requirement states plainly that edits to it do not return.
- [An `.html` or `.svg` blob opened in a window runs its scripts.] → The window is an opaque origin with `opener` cleared, so the file can reach neither the app nor the vault. Taken as the cost of previewing SVG (an image, which the spec lists as displayable) rather than excluding it: `domOpeners.openTab` clears `opener` before handing the window its URL, and a type the browser cannot display takes the download branch anyway.
- [Revoking the object URL too early breaks the tab's load.] → D6's timer; revoking does not unload an already-loaded document, so a generous delay is free.
- [Reading a large file on a click.] → One read of one file, off the keystroke path, with no re-read on failure. There is no size ceiling this design enforces.

## Open Questions

- Whether the UI should say "open a copy" somewhere (the link's tooltip, a first-use note). Deferrable: the spec fixes the behaviour, not the affordance, and adding it later changes no requirement.
- The exact displayable-extension set. Deferrable: the rule ("a type the browser can display") is in the spec; the list is data.
- Whether a vault link to a Markdown page should later navigate in-app instead of opening as an asset. Out of scope here, and a separate change if wanted.
