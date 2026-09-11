## Context

See `proposal.md` — Why. Constraints that shape the approach:

- The adapter already owns the clipboard surface: `MilkdownAdapter.mount` overrides `editorViewOptionsCtx` to install `handlePaste`, which reads `text/plain` and either inserts literally or calls `insertParsedMarkdown` (the path drops and `insertMarkdown` already use). The `EditorAdapter` seam does not change (ADR-0010).
- ProseMirror's default clipboard serialization puts text nodes only on `text/plain`; `text/html` carries the formatting but the paste path deliberately ignores it.
- The markdown-likeness gate is block-level by design (`src/editor/markdownLike.ts`): a fence, or ≥2 block-signal lines making up ≥50% of non-blank lines. A selection copied from the editor usually has fewer than two signals (a lone heading, an inline run, `heading + prose`), so the gate cannot be the mechanism for the app's own clipboard.
- `serializerCtx` is available in the adapter and already used by `serialize()` for saves; the clipboard must carry the same canonical form (ADR-0001).

## Goals / Non-Goals

**Goals**

- Any selection copied or cut in the editor pastes back as the same structure, whatever its size or shape, without changing how external clipboard content is judged.
- Leave `text/plain` and `text/html` on copy exactly as they are today.

**Non-Goals**

- No `text/html` paste path, no sniff relaxation, no change to the force-literal shortcut's meaning.
- No command, prompt, or multi-page write (see proposal Non-goals).

## Decisions

### D1: A private clipboard flavor, not Markdown in `text/plain`

Copy or cut writes the selection's canonical Markdown under `application/x-folio-markdown`; paste prefers that flavor and parses it unconditionally. Putting Markdown in `text/plain` instead (by overriding `clipboardTextSerializer`) was rejected: the block-level gate would still reject a lone heading or an inline run, so the workflow would stay lossy for exactly the selections that motivate the change, and it would change what every external application receives.

### D2: Write the flavor in a `copy` DOM handler

`clipboardTextSerializer` controls only `text/plain`, so a custom flavor needs `event.clipboardData.setData` directly. The adapter adds a `copy` handler through `editorViewOptionsCtx`'s `handleDOMEvents` that computes the selection's Markdown, calls `setData('application/x-folio-markdown', md)` for a non-empty selection, and returns `false` so ProseMirror's own copy handling still runs and still sets `text/plain` and `text/html`. Cut needs no separate path: the browser fires `copy` before removing the selection.

### D3: Serialize the selection with the save serializer, through a doc wrapper

The Markdown for the flavor is produced by the same `serializerCtx` that saves pages, applied to a document built from the selection's slice (`schema.topNodeType.create(null, view.state.doc.slice(from, to).content)`). Using the save serializer is what keeps the clipboard equal to the on-disk form (ADR-0001); a second serializer would be a second source of truth.

### D4: Paste order — code block, force-literal, flavor, sniff

Inside `handlePaste`, after the existing `.cm-editor` yield:

1. **Force-literal** (`Shift` with Ctrl/Cmd) keeps its current meaning: insert `text/plain` verbatim. The flavor is ignored.
2. **Flavor present** → `insertParsedMarkdown(flavorText)`; the markdown-likeness rule is not consulted.
3. **Otherwise** → the existing `text/plain` sniff branch, unchanged.

Reusing `insertParsedMarkdown` means the flavor path inherits the current insertion semantics (multi-block fragment inserted, empty-paragraph replacement, ProseMirror splitting surrounding text) instead of needing new insertion code. One adjustment is required: the existing "single textblock unwrapped" shortcut applies only to a **paragraph**, so a lone heading or a single fenced block keeps its block form rather than being demoted to a paragraph. That also corrects the same latent behavior for a single fenced block pasted as plain text.

### D5: Empty selection writes nothing

An empty selection produces no flavor entry, so a subsequent paste falls through to the existing behavior.

## Risks / Trade-offs

- [The private flavor may not survive a clipboard round trip on some OS/browser combinations] → The fallback is exactly today's behavior (plain text, sniffed), so an app-internal move degrades to the current outcome rather than a worse one. The flavor is reliable within the browser session, which is the workflow's context.
- [The flavor could disagree with `text/html` if serialization changes] → Both come from the same live document in the same copy event; tests assert the flavor equals the canonical serializer output.
- [Force-literal silently ignores the flavor] → Deliberate: the shortcut's promise is "verbatim plain text", and the spec keeps that meaning. Documented in the requirement.
- [A flavor from a different Folio session or version is parsed blindly] → Acceptable: the flavor is Markdown, parsed by the same parser the page seeds use; a malformed flavor fails like a malformed paste.

## Migration Plan

Behavior-only, no data migration. Rollback is removing the `copy` handler and the flavor branch in `handlePaste`; the plain-text path is untouched and keeps working.

## Open Questions

None.
