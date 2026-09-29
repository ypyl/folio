## 1. Slide derivation (editor layer + pure policy)

- [x] 1.1 Add `StaticBlock = { type: string; html: string }` and `staticBlocks(): StaticBlock[]` to the `EditorAdapter` seam (`src/editor/editor.ts`), and verify `src/editor/fakeEditor.ts` records/stubs it so the fake satisfies the interface (typecheck passes)
- [x] 1.2 Implement `staticBlocks()` in `MilkdownAdapter`: take the live document's top-level nodes, serialize each with the schema's `DOMSerializer`, and return `{ type, html }`; verify a unit test parses a page with a heading, a paragraph, a fenced code block, and a `---` and asserts each block's type and serialized HTML
- [x] 1.3 Add a pure `deriveSlides(blocks: StaticBlock[]): string[]` in the presentation layer and verify tests cover: breaks split into slides, no break yields one slide, a leading/trailing `---` produces no empty slide, consecutive `---` collapse, and a `code_block` whose text contains `---` stays one slide
- [x] 1.4 Expose `staticBlocks()` on `EditorPaneHandle` through `EditorPane` (delegating to the adapter) and verify a component test that the handle returns the adapter's blocks and that calling it changes nothing in the document

## 2. Presentation surface

- [x] 2.1 Create `PresentationView` as a modal `<dialog>` that renders the current slide's HTML, a `n / m` position, a progress indicator, and next/previous/close controls with accessible names; verify component tests for the rendered slide, the position text, and each control's name and effect
- [x] 2.2 Handle keyboard navigation in the dialog — `ArrowRight`/`Space`/`PageDown`/`ArrowDown` next, `ArrowLeft`/`PageUp`/`ArrowUp` previous, `Home` first, `End` last — clamped with no wrap; verify tests that the ends do not move and that `Home`/`End` jump
- [x] 2.3 Toggle fullscreen on `F` and through an on-screen control, without forcing fullscreen on open; verify tests with a stubbed `requestFullscreen`/`fullscreenElement` that toggling calls it, a refused request leaves the deck usable, and closing clears fullscreen state
- [x] 2.4 Resolve vault images in the shown slide with `syncAssetImages`/`releaseAssetImages` from `src/editor/assetImages.ts`, reading through the app's `readBinary`; verify a test with a fake reader that a vault-relative `src` is replaced by a `blob:` URL and released on close
- [x] 2.5 Style the deck with Kami tokens in a CSS module (parchment/near-black/ink-blue, no new colors, no shadows) and let a slide taller than the viewport scroll within itself; verify the stylesheet uses existing token variables and the presentation test renders without horizontal page scroll

## 3. Entry control and app wiring

- [x] 3.1 Add a Present control to the editor pane, present only while a page is open and absent on the brand empty state, the indexing state, the search-results surface, and an open board; verify component tests for presence/absence and that its presence does not alter the content column or the first block's start line
- [x] 3.2 Wire `App`: a `slides: string[] | null` state, an `onPresent` handler that calls `editorRef.current.staticBlocks()` and runs `deriveSlides`, renders `PresentationView` when non-null, and clears the state on close; verify a component test that activating Present shows the deck, closing via `Escape` restores the editor, and the history trail gains no entry
- [x] 3.3 Pass the active folder's `readBinary` into the presentation and verify a test that a slide image is read once through the storage seam and that presenting and closing write nothing (no `VaultStorage.write` call)

## 4. Verification and close-out

- [x] 4.1 Run a browser check on the sample vault with `npm run dev:test`: open a page whose content uses `---`, open the present control, page through it, press `F` and `Escape`, and confirm the page and its file are unchanged (sweep leftovers with `npm run kill:dev`). (App booted in Chromium with no console errors and the status bar reading v0.32.0. The manual vault-open pass was not automatable — `showDirectoryPicker` has no automation fallback and the repo has no Playwright harness — so it was accepted as covered by the App test (Present → navigate → Escape → same page, no `VaultStorage.write`), the `PresentationView` tests, the `staticBlocks` tests, and the boot check. Server killed with `npm run kill:dev`; no survivors.)
- [x] 4.2 Run `npx oxlint --fix`, then `npm run fmt`, then `npx oxlint --deny-warnings --format=agent`, `npm test`, and `npm run build`; verify all pass
- [x] 4.3 Bump `version` in `package.json` (minor, a new user-facing capability) and verify the status bar shows the new `v<version>`
