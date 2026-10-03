# Tasks

## 1. Seam and adapter skeleton

- [x] 1.1 Add `@codemirror/lang-markdown`, `@codemirror/view`, `@codemirror/state`, `@codemirror/commands`, `@lezer/markdown` as direct dependencies.
- [x] 1.2 Write `src/editor/codemirror.ts` implementing `EditorAdapter`: `mount`, `destroy`, `setContent`, `onChange` (emit the changed text, not a re-serialization), `insertMarkdown`.
- [x] 1.3 Implement `highlightBlock` on `blockStartLines` (`src/lineAnchors.ts`) plus a scrolled-to line decoration.
- [x] 1.4 Implement `applyChord` by replaying the chord at the editor surface, so the editor's own keymap resolves it (ADR-0016 keeps working).
- [x] 1.5 Keep `EditorPane.tsx` unchanged apart from choosing the adapter, so the pane's lifecycle, draft stream, image pass, and drop/paste handling are untouched.
- [x] 1.6 Drop the formatting chords instead of wiring them. The Markdown source is typed, so there is nothing to toggle: the shortcuts reference now lists only undo, redo, the reference chord, and search, and the ui-shell requirements that covered the formatting, code block, and table chords are removed in the delta.
- [x] 1.7 Drop the line-number gutter. It numbered top-level blocks, and the source shows the file's own lines, so there is nothing for it to add; the requirement is synced into the main spec and then removed in the delta.

## 2. Inline rendering (view-only decorations)

- [x] 2.1 Add a decoration plugin that scans the syntax tree over `visibleRanges` only, so cost scales with the screen and not the document.
- [x] 2.2 Render `![alt](path)` as an image element inside the `.folio-image` wrapper while the caret is outside its range; reveal the source when the caret enters it.
- [ ] 2.3 Verify the pane's existing image pass resolves, fits, expands, and releases these images with no change to `src/editor/assetImages.ts` (ADR-0028).
- [x] 2.4 Highlight headings, emphasis, code spans, and fenced blocks with the DESIGN.md token palette.

## 2b. Tables

- [x] 2b.1 Render a GFM table as a table at rest from a `StateField` (a plugin may not replace line breaks) as a block widget, with alignment from the delimiter row and escaped inline cell markup.
- [x] 2b.2 Reveal the source while the caret is on the table, and re-render when it leaves; a press on the rendered table brings the source back.
- [x] 2b.3 Keep the recompute scoped: only the tables on the edited lines and the tables the caret moved on or off are re-read.
- [ ] 2b.4 Confirm a table renders in the pane at the DESIGN.md table style, and that a wide table does not stretch the pane.

## 3. References

- [x] 3.1 Style `#word`, `#[[Page]]`, `#!word`, and `#![[Board]]` as reference text, using `findReferenceRanges` unchanged.
- [x] 3.2 Make a reference clickable (plain click and Ctrl+click) and route activation through the existing `onReferenceClick` / `onBoardLink` listeners.
- [x] 3.3 Keep reference completion working through `@codemirror/autocomplete` and the existing `setSuggestionSource` sources, producing the same two canonical forms (ADR-0012 unchanged).

## 4. Removals and reads

- [x] 4.1 Delete the table modules and their tests; a GFM table renders at rest and is edited as its source.
- [x] 4.2 Delete the code block component surface and its picker; fenced code keeps highlighting through the document grammar. The token mapping moved to `codeHighlight.ts` first, so the surface and the component could not drift while both existed.
- [ ] 4.3 Implement `staticBlocks` from the markdown text (block-start rule plus a small HTML renderer) so presentations and the reading view keep working without a second grammar, or drop `staticBlocks` and move slides to the text-based derivation.
- [x] 4.4 Delete `milkdown.ts`, `milkdown.test.ts`, and the ProseMirror couplings that no longer apply: `inlineDecorations`, `tableSetup`, `tableCellCaret`, `tableDeleteControls`, `tableHandleClamp`, `vaultImageView`, `codeBlockSetup`, `codeFormat`, `referenceSuggest`, `searchHighlight`, `documentTail`, `emptyLines`, `markdownLike`, `popupPlacement`, and their tests. Nine `@milkdown/*` packages, `codemirror`, and two micromark/mdast packages left `package.json` (115 packages removed from the install). The pane builds one adapter and the `?editor=` switch is gone.

## 4b. Takeaways from the review

- [x] 4b.1 Disable Presenting: the page row's menu entry is hidden behind one flag (`PRESENT_ENABLED` in `src/components/Sidebar.tsx`), so the seam and the view stay and re-enabling it is one line. The presentations delta removes the entry requirement.
- [ ] 4b.2 Sync the two requirements the archived `2026-09-07-line-numbers` change never landed: "The editor shows block line numbers" (done, then removed above) and the search spec's "Search results report the match's line" (still missing; the search line label itself is untouched by this change).
- [ ] 4b.3 The image expand control's toggle, board references and `.excalidraw` links, and the search-hit fade have no test on this path.

## 4c. Follow-ups the switch-over leaves

- [ ] 4c.1 Prune `EditorPane.module.css`: the `.ProseMirror`, `.milkdown-*`, `.language-picker`, `.codemirror-host`, and table-handle rules now match nothing the surface renders. Kept for now because the prune needs a visual pass over tables and images, which the CM6 path shares some selectors with.
- [ ] 4c.2 `staticBlocks` renders escaped text for a paragraph, so a presentation would show `**bold**` and `![x](p)` literally. Dormant while Presenting is off; the inline renderer written for table cells (`cellHtml`) already does the work.
- [ ] 4c.3 The requirement the archived `line-numbers` change added to the search spec ("Search results report the match's line") is still missing from it. The search line label itself is untouched by this change.

## 5. Verification

- [x] 5.1 Re-point the pane and App tests: both mock the adapter module and now mock `codemirror`, still substituting `fakeEditor` behind the seam. `mount.test.tsx` drives the real adapter and now counts `.cm-editor` surfaces. The shortcuts tests' ProseMirror keymap introspection is replaced by replaying the history chords through `applyChord` on the real adapter.
- [ ] 5.2 Confirm the typing budget end to end. What is established: the render pass is bounded by `visibleRanges`; the table field recomputes only the tables on the edited lines and the tables the caret moved on or off, with a test for the unrelated-keystroke case; nothing serializes the document any more, and the entry chunk is 372 KB raw / 130 KB gzip against 954 KB / 308 KB with both editors. What is missing is a measurement of the whole keystroke path on a large page.
- [x] 5.3 Run `npx oxlint --fix`, `npm run fmt`, and `npx oxlint --deny-warnings --format=agent` (the build is run at the switch-over).
- [x] 5.4 Write ADR-0029 and update `adr/README.md`; mark ADR-0008, ADR-0014, ADR-0017, and ADR-0018 superseded.
- [ ] 5.5 Bump `version` in `package.json` for the commit.
