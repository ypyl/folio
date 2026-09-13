## Why

Notes are full of URLs, and in Folio they cannot be used. A markdown link (`[text](https://…)`) is a real anchor, so the browser opens it on Ctrl+Click today — but the form people actually write, a bare `https://…` on its own line, is plain text with nothing to click: the editor loads commonmark, which does not autolink, so Ctrl+Clicking it does what Ctrl+Clicking any other word does. Reaching a URL you wrote therefore means selecting it and copying it into a browser by hand.

## What Changes

- A URL written bare in a page — `http://…`, `https://…`, or `www.…` — is displayed as a link, in the app's one link style (brand ink, no underline), while the file keeps exactly the characters typed.
- Ctrl+Click (Cmd+Click on macOS) opens it in the browser: a new tab, or the system browser when Folio runs as an installed app. A markdown link opens the same way.
- A plain click never opens anything: it places the caret where clicked, so URLs stay editable, and a link's text stays as typed.
- Links that are not external URLs — a vault path like `assets/photo.png`, a bare `#anchor` — do not open a tab: there is nothing served at those paths, and a new tab would only show a 404. They keep behaving as text.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `page-editing`: "External URLs open on Ctrl+Click" — new requirement covering which text is shown as a link, what the open gesture is, that a plain click only edits, and which targets are deliberately not opened.

## Impact

- `src/editor/inlineDecorations.ts` — the bare-URL scan joins the existing walk (a third decoration beside badges and struck runs), and the plugin's click path gains the open gesture.
- Two rules in `src/components/EditorPane.module.css`: the URL decoration's ink, and nothing that changes the text's metrics.
- No dependency, no schema, parser, serializer, storage, or index change: the URL stays literal text, so no autolink mark is created and the file is never rewritten for showing one.
- Non-goals: no autolink *mark* (nothing to toggle, and no rewrite of a bare URL into `<url>` on save), no in-app viewer for vault files (an asset link is not opened), no middle-click handling, no change to how a markdown link's text is edited, and no new toolbar or context menu.
