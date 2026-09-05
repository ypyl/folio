## 1. Mock vault data

- [x] 1.1 Create `src/mockVault.ts` exporting `type MockPage = { title: string; kind: 'page' | 'journal'; content: string }` and the data arrays (a handful of pages with `[[wikilinks]]`/`#tag` in content, 2-3 journal entries). Verify: content is valid portable Markdown; `npm run lint` passes
- [x] 1.2 Confirm only the app composition layer imports the mock (no component imports it). Verify: `grep -rn "mockVault" src/components` is empty

## 2. Sidebar list

- [x] 2.1 Give `Sidebar` props for pages, journal entries, the active page, and an `onSelect` callback; render one button row per entry inside the existing Journal and Pages accordions, replacing their placeholder copy. Verify: `npm run test` renders rows for both sections
- [x] 2.2 Style rows per Kami: full-width buttons, quiet surface, `--dark-warm` text, `--warm-sand` hover, active row `--brand-tint` fill + `aria-current="page"`. Verify: visual pass and active-row assertion in a test

## 3. Editor rendering

- [x] 3.1 Add a small Markdown micro-renderer (ATX headings, paragraphs, `[[Page]]`/`#tag` as inert chip spans, `white-space: pre-wrap` fallback). Verify: unit test covers heading, paragraph, and chip tokens
- [x] 3.2 Give `EditorPane` a `page` prop: when null show the existing empty state; when set show the title as an in-pane H1 plus the rendered body, and reset scroll to top on open. Verify: tests cover both branches

## 4. App wiring

- [x] 4.1 Add `active` state to `App`, defaulting to `null`, and thread props to `Sidebar` and `EditorPane`. Verify: `npm run build` passes; clicking a sidebar row swaps the editor content

## 5. Acceptance gates

- [x] 5.1 Update `src/App.test.tsx` for the new behavior (start empty, click page → content + active row, click journal → content, click second row → swap, meta panel placeholders persist). Verify: `npm run test` green and 80% coverage thresholds hold
- [x] 5.2 Grep gates: mock imports only from App; no banned hexes/cool grays added. Verify: `npm run lint` and `npm run build` pass