## 1. Token migration

- [x] 1.1 Rewrite the `:root` block in `src/index.css` with the full Kami token set from `DESIGN.md` (verbatim names/values); delete template vars (`--accent`, `--text`, `--bg`, etc.) and the `prefers-color-scheme: dark` block; set `color-scheme: light`. Verify: grep `src/` shows no template var names or banned values (`#fff`, `#f8f9fa`, `#f3f4f6`, `#aa3bff`)
- [x] 1.2 Add base styles: `body` on `--parchment`, `#root` as full-viewport grid container (template's centered-card `border-inline` rules removed), base font stack, global `:focus-visible { outline: 2px solid var(--brand); outline-offset: 2px }`. Verify: dev server renders parchment full-height background with visible brand focus on tab-through

## 2. Layout shell

- [x] 2.1 Rewrite `src/App.tsx` to compose `Header` + workspace grid (`grid-template-rows: auto 1fr`; workspace `240px minmax(0, 1fr) 220px`, per-pane `overflow-y: auto`); delete template hero/counter/docs markup. Verify: `npm run build` passes and the three panes fill the viewport with independent scroll
- [x] 2.2 Build the `Header` component: brand left (`FolioMark` small + "Folio"), inert search input centered over the content column (header grid mirrors `240px minmax(0,1fr) 220px`), empty right slot container. Verify: at 1280px the search input aligns with the center pane, and typing in it produces no results/dropdown
- [x] 2.3 Delete template `src/App.css` and fold any retained styles into `src/index.css`. Verify: no `App.css` import remains in `src/main.tsx`

## 3. Accordion + panels

- [x] 3.1 Create `Accordion` component (`title`, `defaultOpen`, `children`) wrapping native `details/summary`, custom chevron in `summary::after` rotated on `[open]`, `interpolate-size: allow-keywords` for smooth open/close. Verify: sections open/close independently, keyboard-operable, both default-open state honored
- [x] 3.2 Create `Sidebar`: New Page button (secondary die: `--warm-sand` fill, `--border` edge, `--dark-warm` text, 8px radius, `8px 16px` padding), Journal accordion with placeholder copy (no calendar), Pages accordion — both open by default, no Tags section. Verify: sidebar matches role→token map in `design.md`; placeholder copy shows "calendar arrives later"
- [x] 3.3 Create `MetaPanel`: Backlinks and Forwardlinks accordion sections with placeholder copy, independently collapsible. Verify: both sections collapse/expand independently and render inside the 220px right column

## 4. Empty state

- [x] 4.1 Create `EditorPane` empty state: centered `FolioMark` (`role="presentation"`, decorative) + one-line tagline in `--stone`; no button or interactive control. Verify: renders in the center pane before any page is open, mark is `aria-hidden`, keyboard tab skips it

## 5. Acceptance gates

- [x] 5.1 Grep gates: no template artifacts remain (`counter`, `hero`, `#next-steps`, `ticks`), no banned hexes/cool grays in `src/`. Verify: `grep -ri "counter\|hero\|next-steps" src/` is empty and the banned-value grep from 1.1 still passes
- [x] 5.2 `npm run lint` and `npm run build` both pass; visual pass against the role→token map in `design.md` (flat surfaces, hairline borders, one chromatic color). Verify: build green, screenshot inspection shows no off-palette colors