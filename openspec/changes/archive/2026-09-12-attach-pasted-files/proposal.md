## Why

Dropping a file into the editor copies it into the vault and links it. Pasting does nothing: the editor's paste handler reads the clipboard's Markdown flavor and its plain text, and a screenshot carries neither, so the gesture the user actually reaches for — snip, Ctrl+V — is silently dropped. Now that vault images render, the only missing step is the intake.

## What Changes

- Pasting a clipboard that carries files inserts them exactly as dropping does: each file is copied into the vault's `assets/` folder and a link is inserted at the caret, so a pasted screenshot displays immediately.
- Text paste is untouched: the branch acts only when the clipboard carries files and no plain text, leaving the editor's markdown-aware paste exactly as it is.
- A pasted bitmap that arrives under a generic name (`image.png`, `blob`) is named from the paste's local time instead, so a vault does not fill with `image-1`, `image-2`. A copied file keeps the name it had.
- The pane's file-intake prop and collector are renamed (`onAttachFiles`, `collectFiles`) since both the drop and the paste gesture now feed them. No behavior change.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `page-editing`: "Pasted files are copied into the vault and linked at the cursor" — new requirement covering what a paste with files does, how such a file is named, what happens when the same clipboard carries text, and what a paste with nothing to attach does.

## Impact

- `src/components/EditorPane.tsx` (a paste handler beside the drop handler), `src/components/dropAssets.ts` (the paste-name helper, reusing the existing collector), `src/App.tsx` (the prop rename).
- Reuses the existing intake end to end: `copyDroppedFiles` for the copy and unique naming, `linkForAsset` for the link shape, and the rendering added by `render-vault-images` for the display.
- No storage change, no index change (`assets/` stays out of pages), no ADR: this is the same asset flow with one more gesture as its source.
- Non-goals: no image transcoding or downscaling, no de-duplication of identical images, no clipboard reading outside a user's paste gesture, no change to text paste or to drop.

## Out of scope, named

Screenshots pasted from a source that offers no file at all (a clipboard carrying only HTML, which the editor already inserts as markup, remote image URL and all) are not changed here.
