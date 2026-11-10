# Design

## Context

See proposal.md — Why. The relevant current state:

- `matchRefs` in `src/vault/parse.ts` is the single extraction of reference
  tokens. It feeds the editor's badges (`findReferenceRanges`), the index's
  page links (`parseLinks`) and board refs (`parseBoardRefs`), and the reminder
  rule reader.
- `resolveReferencePath` / `resolveBoardPath` (`src/vault/index.ts`) turn a
  target into `pages/<name>.md` or `boards/<name>.excalidraw` on demand. Five
  call sites (App's reference click, the Links rows, the reminders) use them, so
  resolution is too late and too dispersed to hold a validity rule.
- `FileSystemVaultStorage` walks each path segment with
  `getFileHandle`/`getDirectoryHandle`, and Chromium validates every name with
  the portable-name rule before touching the disk. `parsePath` (`src/vault/fs.ts`)
  already rejects empty, `.`, and `..` segments with `InvalidVaultPathError`.

## Goals / Non-Goals

**Goals:**

- One definition of "a name this folder can hold", used by both the reference
  layer and the storage transport.
- The impossible token stops being a link everywhere at once: no badge, no
  Links row, no backlink, no completion, no page or board on save.
- A path that still reaches storage with such a name fails with a Folio error,
  not Chromium's `TypeError`.

**Non-Goals:**

- No change to the reference forms, to `referenceTrigger` (the picker only ever
  completes names read from the vault, which are writable by definition), or to
  how a genuine write failure is reported.
- No sanitizing, renaming, or rewriting of user text or files.
- No new UI, gate, or capability.

## Decisions

**D1 — A pure `isWritableFileName` in a new `src/vault/names.ts`.**
It tests a name against the portable set (`< > : " / \ | ? *`, control
characters) plus the Windows device names. Alternatives: put it in `fs.ts`
(then the pure parser imports the transport), in `link.ts` (that module owns
Markdown link forms, not folder names), or duplicate the regex (two definitions
of one boundary). One module with a doc comment keeps the boundary in one place
and lets `parse.ts` stay transport-free.

**D2 — Filter in `matchRefs`, not in resolution.**
`if (!isWritableFileName(target)) continue` applies to page and board targets
alike, before dedupe, so every consumer inherits the rule and nothing else has
to know about it. Resolution-time rejection would need a sentinel or a throw at
five call sites, and would leave the index holding a link to a page that can
never exist. The cost is one regex test per token inside a pass that already
runs (visible lines in the editor, the whole document at scan and save):
no new pass, no allocation, nothing added to the keystroke path beyond that
test.

**D3 — Reject the name in `parsePath`.**
`parsePath` gains the same check per segment and throws `InvalidVaultPathError`.
That covers `read`, `write`, `readBinary`, `stat`, `list`, and `remove` with one
check, and it fails before the first handle lookup, so the error names the path
instead of quoting a browser message. ADR-0013's "invalid paths are rejected, not
sanitized" is the authority; this only extends what "invalid" means.

**D4 — What counts as unwritable.**
The portable character set, plus `/` and `\`: a name holding a separator becomes
a nested path whose title is the last segment, so the reference could never name
it back (`#[[a/b]]` wrote `pages/a/b.md`, whose title is `b` — already unlinked
before this change). Windows device names come along because the app targets
Windows and Chromium refuses them there. Trailing dots and spaces are not
tested: the segment written is `<name>.md`, so the name's last character is never
the one the OS refuses. `.`/`..` cannot reach here as a name (they would be
`..md`), and `parsePath` already rejects them as segments.

## Risks / Trade-offs

- **Over-filtering loses a working reference** → the rule is the documented
  portable set; tests pin `café`, `2.0`, `100% done`, spaces, and brackets as
  writable.
- **Under-filtering leaves the bug** for a character Chromium refuses but the
  rule omits → the rule is exactly the portable set Chromium applies; the e2e
  runs the reported name end to end.
- **A vault already holding such a token changes appearance** (the phantom Links
  row disappears and the token stops being a chip) → that row never opened a
  page successfully; the text is untouched, so the user can retype the name.
- **A nested-path reference (`#[[a/b]]`) stops writing a page** → it was already
  unlinked and produced an extra page named `b`; text is the honest result.

## Migration Plan

None. No file is rewritten, no index shape changes, and the rule is derived at
scan time like every other parse rule. Rolling back is reverting the commit.

## Open Questions

None.
