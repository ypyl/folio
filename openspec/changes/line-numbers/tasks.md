## 1. Shared numbering rule

- [ ] 1.1 Create `src/lineAnchors.ts` exporting `blockStartLines(text): number[]` (first line or follows-blank rule, fence-aware, blank lines counted) and verify unit tests cover: plain blocks with blanks (1, 3, 5), tight lists (one anchor), fenced code interiors skipped, hard-broken paragraph continuation not anchored, empty text
- [ ] 1.2 Add a property-style consistency test: `blockStartLines` on a page's file text agrees with `blockStartLines` on the editor's canonical form for a canonicalized sample (the drift case is asserted as documented behavior, not a bug)

## 2. Editor adapter lines

- [ ] 2.1 Expose per-top-level-block canonical start lines from `MilkdownAdapter` (derive from the canonical text the adapter already produces; bind blocks in doc order) and verify with the round-trip smoke test: seeding `# Title\n\nBody\n- a\n- b\n` yields block lines `[1, 3, 5]`
- [ ] 2.2 Verify the numbers update after an edit (inserting a line above shifts all later block lines) via the smoke test's transaction path

## 3. Gutter rendering

- [ ] 3.1 Render the gutter in `EditorPane`: absolutely positioned spans inside the `.document` margin, `pointer-events: none`, `aria-hidden`, baseline-aligned to each block's first line (measure `.ProseMirror > *` children, zip with adapter lines); verify in the running app that numbers align with block first lines, the sparse signature (1, 3, 5) shows, lists get one number, and clicks over the gutter fall through to the document
- [ ] 3.2 Wire recompute on document change and a `ResizeObserver` on the editor root; stub `ResizeObserver` in the jsdom test (like the existing IntersectionObserver stub); verify numbers re-glue after a reflow (resize) and after edits
- [ ] 3.3 Style the gutter per Tokens (12px `--stone`, right-aligned, no border) in `EditorPane.module.css` and verify against DESIGN.md; confirm code blocks show their outer anchor alongside the CodeMirror local gutter
- [ ] 3.4 Update `DESIGN.md` with a short gutter paragraph (treatment, alignment, the canonical caveat)

## 4. Search rows

- [ ] 4.1 Add a helper computing the first text match's block-anchored line from `item.text` + `item.ranges` (title-only ⇒ no line), with unit tests for first-match selection and title-only
- [ ] 4.2 Render `· line N` in the header dropdown rows and the full results view; verify in the running app that text matches show the line, title-only matches don't, and both surfaces agree on the same query

## 5. Docs and build

- [ ] 5.1 Run `npm run lint` and `npm run build`; confirm the production build passes and the full test suite is green