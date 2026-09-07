## Context

The editor (`src/editor/milkdown.ts`) is a thin Milkdown v7 adapter over the classic packages (`@milkdown/core`, `@milkdown/preset-commonmark`, `plugin-history`, `plugin-listener`) with two customizations: paste-as-plain-text (`handlePaste`) and a seed-echo guard. Code blocks already round-trip correctly as Markdown; they just render as unstyled `pre>code` (the inline-code rule leaks onto them) with no language support. See proposal.md — Why. This design wires in Milkdown's component-based code block (CodeMirror) without touching the document model (ADR-0009) or the on-disk format (ADR-0001).

## Goals / Non-Goals

**Goals:**
- Code blocks render as a CodeMirror surface with language picker, token highlighting, line numbers, and code conveniences (completion, folding, search/replace).
- Markdown stays canonical: ` ```lang ` fences serialize identically; reload restores content and language.
- Pasting inside a code block works properly; paste-as-plain-text outside code blocks is untouched.
- All visuals come from Folio tokens (ADR-0011, `DESIGN.md` Code section) — no stock Milkdown/CM theme import.

**Non-Goals:**
- No new entry affordances (toolbar, slash menu) and no editor-focus change (separate change).
- No custom language registry, theme switching, or user themes.
- No migration of the whole adapter to `@milkdown/kit` unless the spike proves mixing is broken (see Decisions).

## Decisions

1. **Register the component on the classic packages; kit migration only as fallback.**
   Add `.use(codeBlockComponent)` — imported from `@milkdown/components/code-block` (7.22.x, same line as `@milkdown/core`) — to the existing `Editor.make()` chain, plus `ctx.update(codeBlockConfig.key, ...)` for the CM extensions. Classic + components share the same v7 ctx, so the smallest diff wins. *Alternative considered*: port the adapter to `@milkdown/kit` wholesale — larger churn, no behavior gain; kept as the fallback if the spike shows the component mis-wires with classic imports.

2. **Full `basicSetup` (the `codemirror` meta-package) + `languages` from `@codemirror/language-data`.**
   The user picked Option B for the playground's features: completion, folding, search/replace come with `basicSetup`. *Alternative considered*: a hand-trimmed CM setup (smaller bundle, ADR-0006 alignment) — rejected for now because it drops requested features; revisit only if bundle size becomes a real problem after measuring.

3. **Custom Folio-token CodeMirror theme instead of `oneDark`.**
   A new `src/editor/codeBlockSetup.ts` exports the CM extensions: `basicSetup`, `keymap.of(defaultKeymap)`, `languages` (from `@codemirror/language-data`), and a `HighlightStyle` + `EditorView.theme` built from the DESIGN.md Code tokens (keyword `--brand`, comment `--stone`, string `--olive`, number `--dark-warm`, function/class `--near-black`; no-language blocks stay monochrome, which is the default when no language is loaded). Token hex values live in this one module, each value commented with its DESIGN token name so the two can't drift silently.

4. **`handlePaste` yields to CodeMirror inside code blocks.**
   The adapter's paste-as-plain-text view prop would otherwise intercept pastes whose events bubble out of the CM surface. Fix: when the paste event's target is inside a `.cm-editor`, return `false` so CodeMirror handles it (multiline + indentation preserved); all other pastes keep the existing verbatim-plain-text path. Detection via `(event.target as HTMLElement)?.closest('.cm-editor')`.

5. **No changes to parser/serializer or the seed-echo guard.**
   The code_block schema, `language` attr, and fence serialization are already correct; seeding a doc with code blocks mounts CM instances without dispatching transactions, so the seed-echo suppression is unaffected. Typing inside CM updates the ProseMirror node through the component's own wiring, so the listener/`onChange` path is unchanged.

## Risks / Trade-offs

- **Bundle weight** (`@milkdown/components` pulls Vue 3 + `preset-gfm` + `plugin-diff` + `plugin-tooltip`; plus CodeMirror + language-data) runs against ADR-0006's keep-it-small guardrail → accepted deliberately (user chose Option B); recorded in the new ADR-0014; measure the production bundle after the build and only trim `basicSetup` if it's egregious.
- **Classic-imports interop breaks** → spike first (task 1); fallback is migrating `milkdown.ts` to `@milkdown/kit` imports; the design is otherwise unchanged.
- **`closest('.cm-editor')` coupling** to CodeMirror's internal root class → stable public class in CM6; verified in the spike; worst case also check the component's own container class.
- **Focus/keystroke quirks**: `Mod-Alt-c` and the ` ``` ` input rule act on the PM level and still open the block; once the caret is inside CM, its own keymaps own the keys. Edge cases (e.g. exiting the block) follow the component's defaults — verify during apply, adjust theme/CSS only.
- **Seed-echo or spurious-change regressions** from CM mounts → covered by the existing milkdown round-trip smoke tests; add a code-block round-trip case.

## Migration Plan

Rollout is in-repo and reversible: the component is additive to the editor chain; removing `.use(codeBlockComponent)` restores today's rendering with no data change (fences already on disk). No data migration.

## Open Questions

- Whether the default `@codemirror/language-data` list should be trimmed to Folio-relevant languages. Deferrable: nothing in the specs depends on the exact list; decide after seeing the picker live.
- `renderLanguage` presentation (the docs' `✔` checkmark customizing). Cosmetic; pick the default during apply.