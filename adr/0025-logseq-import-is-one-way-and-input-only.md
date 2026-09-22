# ADR-0025: The Logseq import is one-way and input-only

- Status: Accepted
- Date: 2025-09-22

## Context

Folio owes nothing to other tools' conventions. ADR-0012 gives the app one reference
namespace with two lexical forms (`#word`, `#[[Page]]`), states that plain `[[Page]]`
wikilinks are not a reference form, and says existing vaults using other conventions are
read as Markdown text but their conventions are not features. AGENTS.md repeats it as a
hard rule: no migration compatibility.

That rule says what the **runtime** parses. It says nothing about a user who already has
years of notes in Logseq and wants to bring them across. Today the only route is
`scripts/migrate-logseq.mjs`, a Node script run from a shell. Leaving it there makes the
app usable only by people who never had another tool.

The obvious way to add an in-app importer is to teach the parser to also read
`[[Page]]`, `((uuid))`, `collapsed::`, `#tag/with/slash`, and Logseq task keywords. That
would reverse ADR-0012 for every vault, forever, and put a second grammar on the
keystroke path so that two users with different conventions get different parses of the
same text.

## Decision

**A Logseq import reads Logseq conventions once, at the user's request, and writes Folio
forms.** The importer is a one-way, input-only compatibility layer:

- It runs only from an explicit brand-screen action, over a source folder the user picks
  with a read-only handle, into a destination the user picks.
- It **writes** Folio Markdown. The vault it produces is an ordinary Folio vault; the
  index, editor, parser, and search never see a Logseq convention.
- Nothing about the runtime grammar changes. ADR-0012 stands: after import, `[[Page]]`,
  `((uuid))`, `#tag/with/slash`, and `collapsed::` are still plain text.
- The source folder is never written, renamed, or deleted.
- The import rules live in `src/vault/logseqImport.ts` (and, for the shell, in
  `scripts/migrate-logseq.mjs`); they are not part of the index or the editor. The rules
  are documented in `MIGRATION_LOGSEQ_FOLIO.md`.
- The merge is non-destructive: a destination path that already exists is skipped and
  reported, never overwritten, and the destination's `.folio/` meta is left alone.

Rejected: **runtime Logseq parsing.** It reverses ADR-0012, doubles the grammar, and puts
the second grammar on the keystroke path, where the cost lands on every vault that never
had Logseq notes.

Rejected: **a shell-only script.** It works, but it makes the feature unreachable from
the product and duplicates the rules outside the app with no shared test.

Rejected: **an overwrite-on-import option.** Import cannot be undone, so a destination
file the user already has must never be destroyed by a mis-click. Re-running the import
is idempotent because existing paths are skipped.

## Consequences

- The importer adds a second, isolated place where Logseq's conventions are known. It is
  bounded to one module plus its tests; nothing downstream learns them.
- The rules exist twice — the app module and the CLI script — and must not drift.
  `MIGRATION_LOGSEQ_FOLIO.md` is the shared reference and the app module is unit-tested
  against it.
- An imported vault can look like a Logseq vault to other tools that read Logseq, but
  Folio treats it as its own. There is no export back to Logseq.
- Import cannot be cancelled and writes are not transactional; a failure leaves written
  files in place, and the skip-existing merge makes a re-run the recovery path.
- The app gains no runtime dependency on Logseq, so removing the importer later leaves
  imported vaults intact as plain Markdown.
