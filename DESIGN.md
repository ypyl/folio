# Folio Design Language

Folio's visual identity is the **Kami design language** (ADR-0011). Kami's whole
aesthetic compresses into one sentence:

> **Warm parchment canvas, ink-blue accent, serif carries hierarchy, avoid cool
> grays and hard shadows.**

Kami is a constraint system for paper documents (a "design system for paper,
not a UI framework"). Folio manages exactly that: a folder of Markdown paper.
The design language makes the UI feel like the folder of paper it manages, not
a generic SaaS app.

Source of truth: [Kami's `design.md`](https://github.com/tw93/Kami/blob/main/skills/kami/references/design.md).
This document is Folio's adapter: what applies, what the tokens are, and what
has been explicitly deferred. When in doubt, copy Kami's answers before
inventing new ones.

---

## The one-sentence aesthetic, decoded

| Element | Meaning for Folio |
|---|---|
| Warm parchment canvas | Page background is warm paper (`#f5f4ed`), never pure white |
| Ink-blue accent | `#1B365D` is the *only* chromatic color. Everything else is warm neutral |
| Serif carries hierarchy | Headings do the hierarchy work — see "Typography" below (deferred) |
| Avoid cool grays and hard shadows | Every gray has a yellow-brown undertone; surfaces are flat |

---

## Tokens

### Brand (the only chromatic color)

| Token | Hex | Use |
|---|---|---|
| `--brand` | `#1B365D` | Ink blue. The only accent. App icon background, theme color, CTAs, active states |
| `--brand-light` | `#2D5A8A` | Brighter variant for details on dark surfaces |

**Rule**: ink-blue covers ≤ 5% of any surface. More than that is ornament, not
restraint.

### Surfaces

| Token | Hex | Use |
|---|---|---|
| `--parchment` | `#f5f4ed` | Page background — warm cream, the emotional foundation. **Never pure white** |
| `--ivory` | `#faf9f5` | Quiet filled container (brighter than parchment) |
| `--inline-code-bg` | `#f0eee6` | Screen inline annotation — one warm-gray step darker than parchment |
| `--warm-sand` | `#e8e6dc` | Interactive surface (secondary buttons) |
| `--dark-surface` | `#30302e` | Dark-theme container — warm charcoal |
| `--deep-dark` | `#141413` | Dark-theme page background — not pure black, slight olive undertone |

**Banned**: `#ffffff` as a surface. `#f8f9fa` / `#f3f4f6` and any cool-gray
surface.

### Text — four levels, no fifth

| Token | Hex | Use |
|---|---|---|
| `--near-black` | `#141413` | Primary text — deepest, warm olive undertone |
| `--dark-warm` | `#3d3d3a` | Secondary text, table headers, links |
| `--olive` | `#504e49` | Subtext — descriptions, captions |
| `--stone` | `#6b6a64` | Tertiary — dates, metadata |

**Mnemonic**: every gray has a yellow-brown undertone. In `rgb()`, warm gray
is R ≈ G > B. Cool gray is R < G < B or R = G = B (neutral). A gray that fails
the mnemonic is off-palette, not a shade.

### Borders

| Token | Hex | Use |
|---|---|---|
| `--border` | `#e8e6dc` | Primary border — section dividers, table headers, controls |
| `--border-soft` | `#e5e3d8` | Secondary border — row separators, subtle dividers |

### Chromatic tints (derived from ink-blue over parchment)

| Token | Hex | Use |
|---|---|---|
| `--chip-bg` | `#E4ECF5` | Default reference chip swatch |
| `--brand-tint` | `#EEF2F7` | Lightest fill, when a chip must recede |

Use the token, never a hand-mixed `rgba()`. A tint outside these two is a new
token.

### The one sanctioned exception

The "no second chromatic color" rule has exactly one approved exception (from
Kami's changelog template): a warm warning tint for breaking-change badges.

| Token | Hex |
|---|---|
| `--breaking-bg` | `#f0e0d8` (muted warm peach) |
| `--breaking-fg` | `#8b4513` (warm brown) |

Both values are warm-toned (R > G > B). Any other off-token color is a
violation; do not add a second semantic accent.

---

## Rules in force

These are hard constraints. Violations are scope/convention issues, not
stylistic preferences.

1. **One chromatic color.** Ink-blue is the only accent. No second hue. (One
   sanctioned exception above.)
2. **Warm paper, never pure white.** Surfaces use parchment `#f5f4ed`; pure
   `#ffffff` is banned as a surface.
3. **Warm grays only.** Any gray has a yellow-brown undertone; cool blue-grays
   (`#f8f9fa`, `#f3f4f6`) are banned.
4. **Flat surfaces, whisper shadows.** No hard drop shadows or gradients on
   surfaces. A whisper shadow is reserved for elements that physically float:
   dialogs, popovers, tooltips. It is never used to make an ordinary card look
   more important.
5. **Restraint over ornament.** A detail stays only if it communicates
   something. Run the deletion test: if hiding a line preserves meaning and
   grouping, delete it.
6. **Subtractive decoration.** Do not stack a brand line, fill, radius, and
   border on the same component. A line earns its place only when it separates
   content regions, encodes state, or carries a data relationship.
7. **4px spacing base.** Space on a 4px grid (`xs` 2–3, `sm` 4–5, `md` 8–10,
   `lg` 16–20, `xl` 24–32, `2xl` 40–60). Proximity law: the gap *under* a
   heading must be clearly smaller than the gap *above* it (2x or more) — a
   heading belongs to what follows.
8. **Radius: screen surfaces.** Print keeps 2–6pt; screen surfaces may use 8px
   and up (Kami lets `landing-page.html` set its own scale). Never use radius
   alone to create emphasis.

---

## Components (applied to a screen app)

Kami's component recipes, with the screen conventions from Kami's landing-page
template.

### Surfaces / cards

A lifted surface is carried by the fill, not an outline: `--ivory` against
`--parchment` is the whole gesture. Do not add a closed hairline border around
a filled card.

### The board canvas

A whiteboard's canvas is the app's parchment, not the editor's white: a board
with no background of its own opens on `--parchment` (`#f5f4ed`). Rule 2 holds
inside the canvas too, so a new board is never the one pure-white surface in a
warm-parchment app. The value lives in the board's own scene, so a board that
already names a background — saved earlier, or changed with the editor's own
picker — keeps it.

The editor's chrome around the canvas is the app's as well: the toolbar,
islands, menus, dialogs, and inputs take the ink-blue accent, the warm
ivory/parchment surfaces, warm lines and text, the whisper shadow, and the app's
interface font, so a board does not read as a foreign app pasted into the pane.
The scope is the palette. The editor's layout, tool icons, canvas rendering, and
hand-drawn drawing fonts are its own and are left alone.

The canvas's crosshair cursor is the app's too: for the drawing tools it is an
ink-blue cross with a light halo, not the platform's crosshair, whose colour the
app cannot set. The editor's own cursors — the hand's grab, the eraser's circle,
the laser's — stay as they are.

### Side panes are columns of bands

Both side panes — the left sidebar and the right meta panel — are columns of
bands. A band either sizes to its content (the sidebar's control row and
calendar, the meta panel's keyboard-shortcuts reference) or shares the pane's
leftover height with the other bands: `flex: 1 1 0` while open, with a floor
of 120px so a short window cannot collapse a listing to nothing, and exactly
its summary row while closed. A listing that outgrows its band scrolls inside
that band's own body — it never grows the pane and never pushes another band's
summary out of reach. The pane itself scrolls only as a fallback, when even
the floors do not fit. Because surfaces stay flat, a band anchored to the
pane's bottom edge (the keyboard-shortcuts row) sits on the pane's own fill
rather than a shadow.

### Scroll regions

A scroll region the app owns reserves the lane its scrollbar will occupy, so
its content keeps the same width whether or not it is overflowing:
`scrollbar-gutter: stable` beside `overflow-y: auto`. Without it, content
reflows sideways every time it crosses the pane's or the band's height, in both
directions. The regions are the editor pane, the sidebar's Pages, Boards, and
Assets bodies, the meta panel's Backlinks, Forwardlinks, and References bodies,
the search results list, and the search dropdown.

A region that reserves the lane carries the app's own bar in it: a thin,
rounded, inset pill in `--stone`, shown for as long as the region can scroll
and absent while it cannot. Every such region repeats the recipe beside its
gutter declaration:

```css
.region::-webkit-scrollbar { background: transparent; }
.region::-webkit-scrollbar-track { background: transparent; }
.region::-webkit-scrollbar-thumb {
  background-color: var(--stone);
  border: 4px solid transparent; /* inset the pill within the lane */
  background-clip: content-box; /* paint only inside the transparent border */
  border-radius: 999px;
  min-height: 32px;
}
```

The recipe sets no `width` on `::-webkit-scrollbar`, so the lane keeps the
platform's own width and the reservation promises the content width it always
did. The thumb stays in that lane, so it never covers a character. Its
visibility is the region's own overflow and nothing else: a region with more
content than height shows it, a region that fits shows nothing, and neither the
pointer nor a scroll event decides. Do not gate it on hover or on scrolling,
and do not add a scroll listener for either; an overlay bar that floats over
the content is a `ScrollArea` component, a different and larger decision than
this rule.

Some regions reserve nothing. The two side panes are one kind: they scroll only
as a fallback while their accordion bodies own the scrolling, so a reserved lane
would sit empty on every ordinary window. The others are sized to their own
fixed extent, where a lane would shrink what they were sized for: the folder
rail (a 44px content box holding 40px controls) and an overlay popup such as a
code block's language list, whose width comes from its content. A region that
opts out of the lane opts out of the thumb too, and keeps the bar the platform
gives it.

`scrollbar-gutter: stable` reserves nothing where the platform draws its
scrollbars over the content rather than in a gutter, so this rule needs no
per-platform variant: it is a no-op on macOS and touch, and exactly the fix on
Windows and Linux. Where the platform ignores `::-webkit-scrollbar` and floats
its own bar, that bar is what scrolls the region and the app adds nothing.

### Links

One link behavior across the whole app: brand color, no underline, hover
lightens. Do not add per-component underline or color exceptions; two special
cases drift into five. The contract cuts both ways: brand color on non-links
(FAQ questions, section titles) reads as clickable and misleads — non-link
headings stay near-black.

### Buttons

Two variants only:

| Variant | Background | Border | Text |
|---|---|---|---|
| `.btn-primary` | `--brand` | `--brand` | `--ivory` |
| `.btn-secondary` | `--warm-sand` | `--border` | `--dark-warm` |

Both: 8px radius, `8px 16px` padding. Hover on primary: `--brand-light`,
translateY(-1px).

### References / chips

Two tiers, both on registered tokens: default `--chip-bg` on `--brand` text;
recede `--brand-tint`. Solid hex only, no translucent backgrounds. Start pale;
"lightest solid wins most of the time."

### Lists

Native list markers, brand-colored. Do not fake a bullet with a `::before`
dash — that reads like AI default output, not editorial typesetting.

A list item that holds nested content carries a disclosure control (ADR-0026).
It is a real 14px button, but it lives in the **left rail** (see Left rail),
nearest the prose, not in the item's marker lane: the browser's bullet is never
covered (ADR-0020). The glyph is a quiet `--stone` chevron, pointing down when
expanded and right when folded, brand on hover. A foldable item shows its
control at all times — the rail is a control column, not a hover affordance —
while a leaf item shows none.

### Code

Component-backed blocks: the code-block component (CodeMirror inside the
block). A quiet ivory panel — fill only, no border, 8px radius — with a slim
header row (language label + copy button) and the editor below. Syntax
highlighting uses existing tokens only: keyword `--brand`, comment `--stone`,
string `--olive`, number `--dark-warm`, function/class `--near-black`. The
mapping lives in `src/editor/codeBlockSetup.ts` (hex values mirror the tokens
above, so the two must not drift); blocks without a language stay monochrome
and show the `Text` label.

### Left rail

Quiet rail along the document's left margin holding the fold controls for list
items (see Lists). Each control sits on its item's first line, nearest the
prose; no border or fill. The rail itself is inert — `pointer-events: none`,
and it holds nothing but the controls — while the controls are interactive and
announced. It carries no line numbers: a page opened to a search match is
located by marking the block on the page (see Search match), not by a number in
the margin.

### Search match

Opening a search result locates the match: the block is scrolled into view and
washed with a `--brand-tint` background that fades out over about two seconds
(`.folio-search-hit`; the duration matches `HIGHLIGHT_MS` in
`src/editor/searchHighlight.ts`). The wash is presentational — it never enters
the page or the file — and it is cleared at once by the next keystroke. A
result whose match is only in the page title opens with no mark.

### Pin star (row icon + status-bar toggle)

The pin toggle lives in the **status bar's leading corner**, before the
file path — a 24px square button showing a 14px star: filled `--brand`
(ink-blue) when the open page is pinned, outline `--stone` otherwise.
Disabled state (journal day, unmaterialized page, results view) is a dimmed
down-level star; the button carries `aria-pressed`, the glyph is
`aria-hidden`.

In the Pages list, pinned rows are marked by the **row's own style** — a
bolder, near-black title (plus `data-pinned`) — never an icon or extra
control. A second chromatic color must not appear (Kami rule); the status
bar's star glyph is `src/components/StarIcon.tsx`.

### Tables

Editorial: no framed box, no tinted header bar, no vertical rules. Hairline
row rules (`--border`, 0.25pt/px scale), content-sized columns, muted
uppercase header labels. Row separation comes from whitespace before line
weight.

One exception, and only one: a cell that holds no text may show a hairline on
its trailing edge (`--border-soft`, 1px). A table the user has just inserted is
empty in every cell, and with row rules alone there is nothing to tell its
columns apart or to aim a press at. The hairline leaves with the emptiness it
marks, so a table whose cells all hold text keeps row rules only. It is a hint
for an empty cell — the same kind of device as the empty-page placeholder — not
the table's resting style.

A table that begins a page keeps a 16px top margin, where every other first
block has its top margin zeroed. The table's column handle is drawn above its
first row, and the pane clips at its top edge, so the table needs that room for
the handle to be inside the pane and pressable. The room is space, not content:
nothing about the page's Markdown changes. See `keep-table-handles-reachable`.

While the caret is in a table, the table carries a compact strip at the caret's
row: two controls, **Delete row** and **Delete column**, drawn as the handle's
chip (ivory, hairline border, stone ink, brand on hover), one press each. It is
Folio chrome over the table block, never content, and it is the visible pointer
path to the deletions the `Mod-Alt-d` and `Mod-Alt-Shift-d` chords also perform.
A table the caret is not in carries no toolbar: the strip is editing state, like
the caret itself.

### Images

A vault image reads at the pane's width: an image wider than the pane scales
down to it, a narrower one keeps its own size (`max-width: 100%` never
stretches), and the aspect ratio is the image's own. There is no floor — a
small image stays small.

One control, in the image's **top-left** corner: the table handle's recipe, an
18px ivory chip with a hairline border, that expands the image to its own size
and collapses it back. Left, not right, so an image wider than the pane keeps
its own control on screen once expanded, without scrolling to it. It appears
when the pointer is over the image or the control has keyboard focus, and stays
visible while the image is expanded. Only an image that resolved from the vault
has one, and the state is presentation only: nothing about it reaches the
Markdown. A remote image is neither fitted nor given a control
(`fit-vault-images-to-pane`).

### Keyboard focus

Use a visible `outline` for keyboard focus. Re-verify foreground/background
contrast in hover and focus states, not just resting.

---

## Typography — intentionally NOT adopted (yet)

ADR-0011 explicitly defers Kami's typography:

> Kami's serif-first, print-tight type scale is for documents; the app UI
> remains a screen UI. If the app later adopts the full Kami type system, that
> is a separate ADR.

Kami's typography rules (for reference only, **not in force** in Folio today):

- One serif family per page for headlines and body; `--sans` equals
  `--serif`; a distinct sans only for genuine UI chrome
- Weights: serif body 400, headings 500 — no synthetic bold (600/700), no
  black/thin
- Tight headlines 1.1–1.3, dense body 1.4–1.45, reading body 1.5–1.55
- Screen scale ≈ print pt × 1.33, minimum 12px
- Ladder discipline: sizes land on the scale, never between its steps
- Body letter-spacing 0; tracking only for short labels and overlines

If you feel the app needs serif display type, a type scale, or letter-spacing
treatments, propose it as a new ADR rather than silently importing Kami's
print scale.

---

## Current adoption status

| Surface | Status |
|---|---|
| PWA icon (prism mark) | Done — ADR-0011 |
| Manifest `theme_color` `#1B365D`, `background_color` `#f5f4ed` | Done — `vite.config.ts` |
| `<meta name="theme-color">` `#1B365D` | Done — `index.html` |
| In-app UI tokens (`src/index.css`) | **Not migrated.** Still the Vite template defaults (purple accent, cool grays, white background — all violations). Migration is a future change; propose it via OpenSpec when UI work starts |

### The prism mark (icon)

Ink-blue rounded square, a parchment diamond (the paper), and an ink-blue page
with parchment text lines and a folded corner. The diamond and crosshair evoke
indexing and organization — the vault's in-memory index (ADR-0004) — while the
parchment registers warmth and "paper", not "cloud app". Source:
`public/folio-mark.svg`.

---

## References

- [ADR-0011: Adopt the Kami design language](adr/0011-kami-design-language.md)
- [Kami design system (upstream, full text)](https://github.com/tw93/Kami/blob/main/skills/kami/references/design.md)