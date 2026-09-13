## Context

See `proposal.md` for why. Facts that shape the approach, measured in Chrome before writing it:

- A markdown link in the page is a real `<a href="…">` (Milkdown's commonmark link mark), with no `target`. A plain click on it does **not** navigate the editor: the click's default is not prevented, but a contenteditable swallows the activation and ProseMirror places the caret. A Ctrl+Click fires on the anchor with `ctrlKey: true` and an unprevented default, so the browser opens a tab on its own.
- A bare URL is a plain text node: `document.querySelectorAll('.ProseMirror a')` sees only the markdown links, and the URL text has no wrapper at all.
- `inlineDecorations.ts` already walks the text nodes of the changed blocks for reference badges and struck runs, and its plugin owns `handleClick` (the badge path, which is target-based because a document position cannot tell a badge click from a click beside it).
- The editor's link style is `.editor :global(a) { color: var(--brand); text-decoration: none }`, and `DESIGN.md` ("Links") fixes that as the app's one link behavior: brand ink, no underline, hover lightens, no per-component exceptions.

## Goals / Non-Goals

**Goals:**

- A URL a user types is usable without leaving the editor and without touching the file.
- One gesture for both link forms: markdown links and bare URLs behave identically.
- The click that edits keeps working: no navigation, no accidental tab, no caret jump.

**Non-Goals:**

- No autolink mark and no GFM autolinks. GFM would rewrite a bare URL into `<url>` on the next save — a file change nobody asked for — and it is the parser side of the preset this app deliberately does not load.
- No opening of vault-relative targets: `assets/photo.png` is not served over HTTP, so a tab would show a 404. Showing vault files in-app is a separate feature with its own design (the asset rendering path already reads them).
- No middle-click handling, no context menu of the app's own, no toolbar.
- No change to how a link's text or a URL is edited, selected, or copied.

## Decisions

### D1 The bare-URL scan joins the existing walk

A third decoration in `scanInline`: a `url` class over `https?://…` and `www.…` runs, with trailing sentence punctuation trimmed (`.,;:!?` and a trailing unmatched `)`), skipping text inside inline code, fenced code, and existing link marks (a link's own text is already under the anchor, and decorating it would double the click path for no gain).

Rejected: pulling in GFM's autolink parser. It is the whole-preset decision this app has already declined twice, and its rewrite of bare URLs into `<url>` on save breaks the "file keeps the characters typed" rule the app holds everywhere else.

Rejected: a second plugin for URLs. The walk, the incremental invalidation, and the click handler already exist in one place; a second copy would be a second pass per keystroke over the same blocks.

### D2 The gesture lives on the click event, not in PM's click hook

The open branch is a `handleDOMEvents.click` handler in the same plugin, and it is the only place the gesture exists:

- Modifier + click on an anchor: take the anchor's target.
- Modifier + click on a bare URL: resolve the URL from the clicked position, so a span another decoration split still resolves.
- Either way: `preventDefault` — the browser never activates a link inside this editor itself — then open only when the target is an external URL, and report the click handled only when something was opened. A vault path or a fragment therefore stops the default (no tab showing a 404) while leaving the click to the editor, and a modifier-less click is untouched: it places the caret, and a contenteditable does not follow an anchor on its own.

This started in the plugin's `handleClick` prop, and the browser check showed why that cannot work: that hook runs while the press is being handled, so its `preventDefault` does not stop the browser's own activation of an anchor — a Ctrl+Click on a markdown link opened **two** tabs, and the DOM-visible proof was a `click` event whose `defaultPrevented` was still false. The click event is the one that activates a link, so it is the one that has to be prevented.

Rejected: leaning on the browser's own Ctrl+Click for anchors. It works in a tab, but the app would not control it, would double-open wherever it also handled the gesture, and would leave the vault-relative case opening a 404 tab.

### D3 Opening goes through `window.open(url, '_blank', 'noopener,noreferrer')`

One call, explicit `noopener` so the opened page cannot reach back into the app's window, and a scheme check (`http:`, `https:`, `mailto:`) before it. An installed Folio hands the URL to the system browser, which is the point of the request.

### D4 The decoration's style is the app's link style, and nothing else

`color: var(--brand)`, no underline, per `DESIGN.md`'s Links rule. The decoration adds no padding, border, or font change, so no line metrics move and the gutter's measurements are unaffected. It does not set `cursor: pointer`: a plain click does not open the URL, and a pointer would promise otherwise — the caret cursor is the honest one for text the user can still edit.

## Risks / Trade-offs

- [A URL in prose ends up decorated when the writer did not mean a link] → The same reading every other tool gives a bare URL; the scan trims sentence punctuation so `see https://example.com/path.` links the URL and not the period.
- [The decoration rides the same pass as badges and strikes, adding one regex per text node] → Bounded by the open document and already paid once per changed block per edit; no new pass and no new per-keystroke work beyond that.
- [A Ctrl+Click on a link opens a tab *and* the editor moves the caret there] → Not prevented by this design (the browser's caret placement happens on mousedown), and harmless: the caret lands in the link, which is where the user clicked.
- [Opening an external URL is the one action in the app that leaves it] → It is user-initiated, modifier-gated, and never writes to the vault.

## Migration Plan

None. No persisted state, no file-shape change: a page written before this change renders the same way after it.
