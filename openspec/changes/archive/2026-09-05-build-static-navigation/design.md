## Context

The shell (build-ui-shell) is static: Sidebar/MetaPanel show placeholders, EditorPane always shows the empty state. Nothing real exists yet — no `VaultStorage` (task 3), no scan/index (task 6), no Milkdown (task 7). This step wires mock data through the existing panes. Motivation: see `proposal.md` — Why. Requirements: `specs/static-navigation/spec.md`.

## Goals / Non-Goals

**Goals:**
- Prove the navigation model — sidebar lists, click swaps the editor — with hand-authored data
- Keep the mock trivially removable: one import in App is the whole swap point when the real index lands (task 6)
- Preserve the task-1 empty state as the live starting screen

**Non-Goals:**
- No storage/index/editor behavior; the micro-render is presentational throwaway that dies at task 7
- No in-content navigation, no backlinks pane, no page creation, no routing (see proposal Non-goals)

## Decisions

### 1. Selection is plain App state, not a router or context
`App` holds `const [active, setActive] = useState<MockPage | null>(null)` and threads it down: Sidebar gets `pages`, `journalEntries`, `active`, `onSelect`; EditorPane gets `page`. No hash router, no React context, no custom hook.
- *Why*: routing's first real consumer is surviving a reload, which needs real storage (task 5); context/hooks earn their place only when search, journal, and wikilink clicks all navigate (tasks 7-11). Adding them now is speculative plumbing with one consumer.
- *Alternative rejected*: hash routing now — no reload-persistence to justify it; the mock would merely look like it remembers.

### 2. The seam is by object, resolved in App
Sidebar rows carry the `MockPage` they represent and call `onSelect(page)`; App stores the object; EditorPane receives it. Nothing resolves titles except App.
- *Why*: for this step the mock list and the content are the same object — no lookup needed. When the real index arrives, the seam naturally narrows to "resolve title → page" because wikilinks are title-keyed (ADR-0012), and that change is local to App.
- *Alternative rejected*: a title-keyed seam now — resolves nothing today; the mock map is already keyed by object identity.

### 3. Mock vault: one disposable module, portable Markdown
A single file (e.g. `src/mockVault.ts`) exports `type MockPage = { title, kind: 'page' | 'journal', content }` plus the data arrays. Only App imports it; Sidebar/EditorPane receive data via props. Content is authored as valid Markdown so the same text can later be lifted into real `.md` files as the scan/index fixture.
- *Why*: task 5/6 replaces the mock by dropping one import and deleting the file; components never know the mock exists. Portable content keeps the fixture door open without building anything (per proposal lifecycle decision).
- *Alternative rejected*: an in-memory `VaultStorage` mock — front-loads the abstraction (task 3) the plan deliberately defers.

### 4. Editor render: micro-renderer, title as in-pane heading
EditorPane, given a page, shows the title as an H1 and runs a ~20-line renderer over the body: ATX `#` heading lines → headings, blank-line-separated paragraphs, and `[[Page]]` / `#tag` tokens → inert chip spans. Everything else renders as plain text (`white-space: pre-wrap`).
- *Why*: the final app reads through the Milkdown editor (task 7), so any read view is throwaway; but raw `[[X]]` text would misrepresent the product in the dev demo. ~20 lines buys a demo that reads like the thing being built.
- *Chips are tags, not links* (ADR-0012, DESIGN.md): styled with `--tag-bg`/`--brand-tint`, no brand color, no pointer/hover — so inert styling never promises navigation (the one broken option is link-styled-but-inert).
- *Why title in-pane*: sidebar shows the name; the pane shows it again as a heading, mirroring Logseq's file-title-over-content pattern. The exact title mechanism is a task-7 question this step previews, not settles.
- *Alternative rejected*: raw text dump (honest but unrepresentative); react-markdown dep (superseded by Milkdown in 5 tasks).

### 5. Start empty, never auto-open
On load `active` is `null`; the editor shows the task-1 empty state and no row is active.
- *Why*: the empty state is the only state that survives to the real app — auto-opening hides it for the whole mock era and lets it rot. It also avoids inventing a "default page" product decision the real app hasn't made, and matches task 2's no-persistence honesty (reload → nothing remembered).

### 6. Active row + list rows (Kami)
Rows are full-width buttons: quiet surface, `--dark-warm` text, hover `--warm-sand`. Active row: `--brand-tint` fill, `aria-current="page"`, near-black/brand text. One accent color kept under the 5% rule; a chip fill is not a second hue.

## Risks / Trade-offs

- [Micro-render looks like the real editor and drifts as a "read view"] → it is explicitly throwaway at task 7; the spec marks chips inert so no navigation behavior accretes here
- [Empty state unseen during mock era if anyone later auto-opens] → decided against auto-open (decision 5); empty state stays the live default
- [Portable Markdown content implies a future fixture that may never materialize] → writing valid Markdown costs nothing now; no directory/files are created for it
- [Components stop importing the mock, so coverage of it is thin] → 80% thresholds stay green via App/render tests that exercise the mock as data

## Migration Plan

Pure additive presentational change on top of the shell. Rollback is a git revert (no data, no schema). Swap later is: App imports the real index instead of the mock; Sidebar/EditorPane props are unchanged. `npm run lint` and `npm run build` are the gates; tests keep the 80% coverage thresholds.

## Open Questions

- Exact sample page names/content and the empty-state tagline copy — copy decisions, resolvable during apply without changing specs or approach.
