## Why

A page can already reference a vault file that is not an image — dropping or pasting a PDF inserts `[Q3 report](assets/Q3 report.pdf)` — and that reference cannot be used. `open-links-on-ctrl-click` deliberately opens only external URLs and swallows the click for everything else, so a vault-relative link is styled as a link, looks clickable, and does nothing: the file sits in the vault, unreachable from the page that points at it. Vault images already escape this (`render-vault-images` reads their bytes and displays them); every other file type is a dead reference.

## What Changes

- Ctrl+Click (Cmd+Click on macOS) on a link whose target is a path inside the vault SHALL open the stored file's bytes: a new tab for a type the browser can display (PDF, image, media, plain text), a download for anything else, so the OS can open it with the app registered for that type.
- The bytes come from the existing binary read on the storage seam, read once per activation; no new storage operation and no new dependency.
- The page's Markdown SHALL NOT change and the vault file SHALL NOT be written: only the thing handed to the browser is derived, so the file stays canonical on disk (ADR-0001).
- What the browser or the OS opens is **a copy of a moment, not the vault file**. Edits made in an external application do not return to the vault. This is a sandbox boundary of the browser platform, not a choice Folio can code around, and the requirement states it so the behaviour is not mistaken for a bug later.
- The gesture that opens stays the one the app already uses for links. A plain click still places the caret, and a fragment target (`#section`) still opens nothing in any modifier state.
- Vault-relative image references are unaffected: they keep rendering in place.

## Capabilities

### New Capabilities

- None. The storage seam already exposes the binary read this needs, and the behaviour belongs with the rest of page editing.

### Modified Capabilities

- `page-editing`: "External URLs open on Ctrl+Click" — its closing rule that a vault-relative path "SHALL open nothing, in any modifier state" is what this change reverses. A new requirement, "Vault asset links open the stored file", covers which references qualify, what the open gesture does per file type, that the vault is read once per activation and never written, and that the result is a copy rather than the file itself.

## Impact

- `src/editor/inlineDecorations.ts` — the plugin's existing Ctrl+Click branch gains a vault-relative path, resolved through a reader injected the way `onActivate` already is, so the editor layer still owns no vault access of its own (ADR-0010).
- `src/editor/` — a small module turning a vault path and its bytes into an openable target: extension to MIME type, the object URL's lifetime, and the open-only-a-renderable-type rule. Unit-testable without a browser.
- `src/components/EditorPane.tsx` — pass the vault reader (`readAsset`, already a prop for vault images) into the decoration plugin.
- `src/components/EditorPane.module.css` / `DESIGN.md` — only if the honesty of "a copy" needs a visual affordance; the link style itself does not change.
- No dependency, no schema, no parser or serializer change, no vault write, no index change. Nothing is added to the keystroke path: this runs on a click, reads once, and touches no derived data.
- **ADR:** the decision worth recording is the boundary itself — the browser cannot hand a vault file to the OS in place, so opening a vault file always yields a derived copy. This is durable and surprising enough to outlive the change; propose a new ADR superseding nothing, rather than folding it into `design.md`.

## Non-goals

- No in-app viewer or preview pane for non-image assets: this change hands the file to the browser or the OS, and a rendered viewer inside Folio is a separate feature with its own layout questions (ADR-0005).
- No native companion, no native messaging host, no `folio:` protocol handler. The only thing that would make "open the vault file in place" possible is code outside the browser, which contradicts keeping the app small (ADR-0006).
- No write-back and no "re-import": an edit made in an external application is not observed, merged, or saved into the vault by this change.
- No page-link resolution. A vault-relative link to a Markdown page is an asset like any other here; navigating to a page in-app is a different feature.
- No change to drag-and-drop, paste, or the link text and path an asset reference is written with.
- No vault-relative link in read-only contexts (search results, match bodies).
