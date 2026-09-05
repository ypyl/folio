## 1. Renderer behavior

- [x] 1.1 Narrow the reference regex in `MarkdownPreview.tsx` to `/#\[\[([^\]]+)\]\]|#([\w-]+)/g` and update the header comments ("references `#word` / `#[[Page]]` as inert chips; plain `[[Page]]` falls through as text"; drop "tag chips" / "three lexical forms" wording) — verify `npx vitest run` passes after 1.2
- [x] 1.2 Update `MarkdownPreview.test.tsx`: rename "tag" wording to references; keep the two existing reference cases; add a `#[[many words]]` chip case and a case asserting plain `[[Inbox]]` renders as literal text with no chip — verify `npx vitest run` passes
- [x] 1.3 Rewrite `mockVault.ts` to the two forms: all `[[Name]]` links become `#Name`, add one `#[[...]]` multi-word example (e.g. `#[[reading list]]`), and reword "A #tag is just a link to a page" / "Tagged #architecture." into reference language — verify `npx vitest run` passes and `rg -n '\[\[' src` shows no `[[...]]` references in mock content

## 2. Design tokens and styling

- [x] 2.1 Rename `--tag-bg` to `--chip-bg` in `src/index.css` and `src/components/MarkdownPreview.module.css` — verify `rg -n 'tag' src` finds no token or concept references outside test fixture filenames
- [x] 2.2 Update `DESIGN.md`: rename the token rows (`--chip-bg`, "Default reference chip swatch"; revise the `--brand-tint` row's "when a tag must recede" note) and rewrite the "### Tags / badges" section as "### References / chips" — verify `rg -n -i tag DESIGN.md` is empty

## 3. Docs and decisions

- [x] 3.1 Update ADR-0012 in place: lexical forms narrow from three (`[[Page]]`, `#word`, `#[[Page]]`) to two (`#word`, `#[[Page]]`), with `[[Page]]` explicitly not a reference form; update the Consequences bullets accordingly — verify the ADR reads consistently with the two-form grammar
- [x] 3.2 Update ADR-0004's index shape: `Link.via` becomes `'word' | 'bracketed'` and the links list comment cites only `#word` / `#[[Page]]` — verify the ADR has no `[[Page]]` form listed as a reference
- [x] 3.3 Update AGENTS.md reference-forms sentence, README.md feature bullets (drop "Tags (`#tag`)"; rewrite the `[[wikilinks]]` bullet to `#word` / `#[[Page]]` references), and PLAN.md task 6 wording (drop "#tags" and "tags maps"; say page references in the two forms, pages + backlinks only) — verify `rg -n '\[\[|Tags|tags maps' README.md PLAN.md AGENTS.md` is clean
- [x] 3.4 Run `npm run lint`, `npm run build`, and `npm test` — verify all three pass and `rg -n -i 'tag' src openspec/specs DESIGN.md README.md PLAN.md AGENTS.md adr/0012* adr/0004*` shows no concept-level "tag" residue (fixture filenames like `tags.md` in tests and historical ADR wording are acceptable)