# ADR-0024: A whiteboard is a board file the app edits

- Status: Accepted
- Date: 2026-09-21

## Context

ADR-0006 named whiteboards out of scope, and ADR-0022 settled that a vault file which is not Markdown is an opaque asset: listed, referenced, opened as a derived copy, never interpreted and never written. That covers every file the app has no view for, and it covers a whiteboard badly. A sketch is something the user creates, edits, and comes back to; treating it as bytes the app must not touch leaves no way to make one or to change one.

A board is therefore neither a page nor an asset. It has a view and a save path, like a page, but it is not Markdown and must not enter the page machinery — search content, backlinks, pins, drafts, the reference namespace — which is exactly what ADR-0022 refused for assets. It needs a name.

The design that emerged (recorded in `openspec/changes/archive/.../add-whiteboards`, and in the `whiteboards` capability spec) makes a board a `.excalidraw` file under `boards/`, referenced from a page by a `#!` token, and edited in the main pane by Excalidraw.

## Decision

Introduce a **third kind of vault file: the board**.

- A board is a `.excalidraw` file under `boards/` (at any depth, no hidden segment). It produces no page record and is not an asset. The app parses, edits, and writes it; it does not rename, move, or delete one.
- A board is referenced by a `#!` token in the page's Markdown, in the same two lexical forms as a page reference: `#!word` and `#![[Many Words]]`. The name resolves, case-insensitively, to `boards/<name>.excalidraw`, in its own namespace — never the page one. The token stays in the file; the board is derived (ADR-0001). This extends ADR-0012's reference grammar to two kinds and marks the second with `!`.
- A board reference to a board that does not exist yet is valid: activating it opens a blank board and the file materializes on the first save, the same delayed-creation rule a page follows.
- The board editor is Excalidraw, mounted in the main pane. The package and its fonts are loaded lazily and kept out of the offline install; the app's own origin serves the fonts, never the package's CDN fallback. Only element changes save; the camera (pan/zoom) is view state, never document content.
- The board joins the app's surfaces the way a page does where it must: a Boards section in the sidebar, a Boards group in search by name, a Referenced by section while it is open, and an entry in the Back/Forward trail. Any `.excalidraw` file opens in the board editor — the extension decides the view, whether the file was reached by a badge, a path link, a sidebar row, or a search result.

## Consequences

- ADR-0006's whiteboard exclusion is reversed (this record is the reversal; 0006 points here). The rest of its guardrail list is untouched.
- ADR-0012's namespace widens from pages alone to pages and boards. Its "one namespace" simplification is preserved in spirit: one parser, one tokenizer, two namespaces distinguished by the `#!` marker, not a second subsystem.
- ADR-0022 is untouched: a board is not an asset. Assets stay opaque and read-only; the exception lives in a new category rather than in the asset rule.
- A board file is text JSON written through `VaultStorage.write`; the app's IO seam (ADR-0003) is unchanged. The board's scene never enters a page parse, the search corpus, or the typing path, so the editor-responsiveness budget (AGENTS.md) is untouched.
- The app takes a new runtime dependency, `@excalidraw/excalidraw` (MIT), lazily. The offline install grows by nothing for a vault that never holds a board; the first board open pays the chunk and its fonts.
- `#!word` in existing prose becomes a board reference. `#!` requires a name character, so shebangs and paths (`#!/bin/bash`) do not match; the residue is prose deliberately containing `#!word`, and the form is Folio's own.

Rejected: **board as an asset.** It would reuse the Assets listing, at the price of an exception on every clause of ADR-0022 (parsed, written, opened in an editor) and an Assets section that must treat one extension differently. The folder is the kind, and `boards/` says so.

Rejected: **board as a Markdown page** (Obsidian's `.excalidraw.md`). The scene JSON would enter the page content, the search corpus, backlink parsing, and the block scan, and the page would need two editors — the internal document model ADR-0009 rejected.

Rejected: **a combined `.excalidraw.png` or `.excalidraw.svg`.** It makes an inline embed cheap (the picture is a real image) but the app does not embed boards inline, so it only adds a re-encode round-trip and hides the source inside a binary.

Rejected: **`#[[name.excalidraw]]`** (the ADR-0019 name-shape precedent). It would make every reference inspect its name's suffix to pick a target kind, and a board reference would read like a page reference.
