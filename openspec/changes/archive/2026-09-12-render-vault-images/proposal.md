## Why

Pages can already reference vault assets: dropping a file copies it into `assets/` and inserts `![name](assets/name.ext)`. Nothing ever displays those bytes. `VaultStorage` writes binary but has no binary read, and nothing in `src/` turns a vault path into a URL a browser can render, so `assets/photo.png` resolves against the site origin, 404s, and the note shows a broken image. A screenshot is the case that surfaces this: the file lands in the vault and the reference is written, and the user still sees nothing.

## What Changes

- The storage seam gains a binary read alongside its binary write: `readBinary(path)` resolving with the file's bytes, under the same path contract and the same missing-file rejection as the text read.
- The editor resolves image references that point into the vault: the rendered image element displays the vault file, while the markdown keeps the path it had, so the file stays canonical and reload-stable.
- Resolution is bounded: once per path per open page, on document load and on a reference being added — never on the keystroke path, and never a retry for a path the vault cannot resolve.
- References carrying a scheme (remote images, `data:` URLs) are left exactly as they are.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `vault-storage`: "VaultStorage exposes read, write, delete, list, and stat" — the five operations are named as the text and metadata set, with binary assets read and written through the separate binary operations.
- `page-editing`: "Vault image references render in the editor" — new requirement covering what the editor displays for a vault image path, what it leaves alone, and how often the vault is read.

## Impact

- `src/vault/storage.ts` (the interface member) and `src/vault/fs.ts` (the implementation, mirroring the text read). Tests across the vault suite build the real `FileSystemVaultStorage` over `fakeHandle`'s tree, so one implementation reaches all of them.
- A new resolution module under `src/editor/` plus wiring in `src/components/EditorPane.tsx` (a read function passed in, a per-page URL cache, and one more pass where the gutter already runs) and `src/App.tsx` (the read function).
- Out of scope: pasting a screenshot. That is the next change, and it is the same asset path with a clipboard source; this change makes its result visible.
- No ADR: the storage boundary (ADR-0003) keeps its shape and gains one operation of the kind it already has, and Markdown stays canonical (ADR-0001) because only the rendered element's URL is derived, never the document text.
