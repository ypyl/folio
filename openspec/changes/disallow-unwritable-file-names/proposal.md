# Proposal

## Why

A reference whose name contains a character the File System Access API refuses
(`#[[Interview | notes]]`) resolves to a path the folder can never hold. Nothing
checks the name before the write: the blank page opens, the first save reaches
Chromium, and `getFileHandle` throws `TypeError: Name is not allowed`. The draft
goes to `failed`, the trace log records a `write-failed` line with a browser
message, and the page is unreachable from the app forever — there is no rename,
and every retry fails the same way. Vault data is fine; the reference text is
simply unhonourable, and the app should say so by not making it a link.

## What Changes

- **A file-name rule.** One predicate decides whether a name can be a file in
  the folder: no `< > : " / \ | ? *`, no control characters, and no Windows
  device name (`CON`, `NUL`, `COM1`, …). Chromium applies the portable-name rule
  on every platform, so these names fail everywhere, not only on Windows.
- **A reference that cannot name a file is not a reference.** `#[[a | b]]` and
  `#![[a | b]]` render as literal text, exactly like an unsupported convention:
  they produce no badge, no link row, no backlink, no completion candidate, and
  no page or board that materializes on save.
- **The storage seam rejects the name.** `parsePath` throws a Folio
  `InvalidVaultPathError` for a segment the folder cannot hold, so a path that
  slips past the reference layer fails with a named error instead of the
  browser's opaque `TypeError`. This extends ADR-0013's "invalid paths are
  rejected, not sanitized" to the portable-name rule; ADR-0013 gains one line
  naming it.
- **Nothing existing is rewritten.** Notes keep their text; the token simply
  stops being a link, and the phantom page stops appearing in the Links list.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `references`: a page reference whose name cannot be a file name is not a
  reference — it stays literal text and contributes no page, link, or backlink.
- `whiteboards`: the same rule for a `#![[...]]` board name, folded into the
  existing "a `#!` with no valid name stays literal text" requirement.

## Non-goals

- No renaming, escaping, or sanitizing of names the folder cannot hold: the
  text is the user's, and ADR-0013 says reject, not rewrite.
- No UI to pick a different name for a page, and no inline warning on the
  offending token: it renders as text, like every other convention Folio does
  not honour.
- No change to names that are unusual but writable (`café`, `2.0`, `100% done`,
  names with brackets), and no change to the reference forms themselves.
- No change to how a failed save is reported when a write fails for a real
  reason (permissions, disk, a file removed outside the app).
- No new capabilities, no gate, and no new surface: this is a fix, so the
  version bump is a patch.

## Impact

- `src/vault/names.ts` (new): `isWritableFileName`, the one file-name rule.
- `src/vault/parse.ts`: `matchRefs` drops a target the folder cannot hold, which
  removes it from the index's links and board refs and from the editor's badges
  in one place.
- `src/vault/fs.ts`: `parsePath` rejects such a segment with
  `InvalidVaultPathError`.
- Tests: the predicate, the parser, the storage guard, and an integration case
  for a note holding the reported reference.
- ADR-0013 (amended), `openspec/specs/references/spec.md`,
  `openspec/specs/whiteboards/spec.md` (via this change's deltas).
