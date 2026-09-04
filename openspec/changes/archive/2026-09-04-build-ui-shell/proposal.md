## Why

The app is still the Vite starter template: a hero page, a counter, a purple accent, a white background, cool grays, and a dark-mode block — every one a Kami violation, per DESIGN.md's own adoption table ("In-app UI tokens: **Not migrated**"). Every later step (navigation, editor, storage) needs a shell to land in, and the shell is the pitch: it is the first artifact that shows what Folio is. This change replaces the template with the Folio shell — Kami tokens applied, three-pane layout, header with search — and nothing else.

## What Changes

- **Migrate design tokens** — replace the Vite template styles in `src/index.css` with the Kami tokens from `DESIGN.md` (verbatim token names and values; warm surfaces, brand ink, 4px spacing base, 8px screen radius). Delete the template dark-mode block and force light (`color-scheme: light`).
- **Delete template scaffold** — remove the Vite hero, counter, docs, and social sections (`src/App.tsx` rewrite, template `src/App.css` removed). The FolioMark stays.
- **Header row** — brand left (FolioMark + "Folio"), **search input centered** over the content column (grid mirroring the body columns, openspec-viewer pattern), right slot empty. Search renders but is inert until the search step.
- **Three-pane shell** — left sidebar, editor pane, right meta panel, on a `240px 1fr 220px` grid, full height, hairline borders, flat surfaces.
- **Sidebar accordion** — native `<details>` sections: top New Page button (secondary variant), collapsible Journal section (calendar placeholder text — the real calendar arrives in the journal step), collapsible Pages section. No Tags section (tags are pages, ADR-0012).
- **Right meta panel accordion** — collapsible Backlinks and Forwardlinks sections, empty/placeholder in the shell.
- **Editor empty state** — transient brand screen (FolioMark, decorative, `aria-hidden` + one line of tagline copy). No fake open-folder button; the real action lands in the header right slot in the storage step.
- **Keyboard focus** — visible brand-colored focus state across all interactive elements (a11y).

## Capabilities

### New Capabilities

- `ui-shell`: the application shell — layout grid, header with inert search, accordion sections, empty state, and Kami token base that every subsequent feature step builds on.

### Modified Capabilities

None — this is the first capability (no existing specs).

## Non-goals

- **No editor** — no Milkdown, no editing, no rendering of pages (later step).
- **No storage** — no `VaultStorage`, no File System Access, no open-folder behavior (later step). The empty state stays until a vault opens.
- **No mock data or navigation** — no mock vault, no clickable page lists (next step).
- **No calendar** — the Journal section shows placeholder text only.
- **No search functionality** — the input renders; debounce, dropdown, Fuse.js all come in the search step.
- **No tags UI** — tags are pages (ADR-0012); no third accordion section.
- **No dark mode** — `color-scheme: light` only; Kami dark tokens are not adopted (no ADR).
- **No responsive collapse** — desktop Chromium-first; narrow windows get tight-but-scrollable behavior, not a mobile layout.

## Impact

- **Code**: `src/App.tsx` rewritten; new `src/components/` (Accordion, Sidebar, EditorPane, MetaPanel); `src/index.css` rewritten with Kami tokens + base styles; `src/App.css` deleted (styles fold into `index.css`).
- **References**: ADR-0005 (layout, revised today), ADR-0011 (Kami), ADR-0012 (unified references — no tags section).
- **Dependencies**: none added; native `<details>` + CSS only.
- **Verification**: `npm run lint` + `npm run build` green; grep confirms no banned hexes (`#fff`, `#f8f9fa`, `#aa3bff`, cool grays); no template artifacts remain.