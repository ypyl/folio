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
| `--tag-bg` | `#E4ECF5` | Default tag swatch |
| `--brand-tint` | `#EEF2F7` | Lightest fill, when a tag must recede |

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

### Tags / badges

Two tiers, both on registered tokens: default `--tag-bg` on `--brand` text;
recede `--brand-tint`. Solid hex only, no translucent backgrounds. Start pale;
"lightest solid wins most of the time."

### Lists

Native list markers, brand-colored. Do not fake a bullet with a `::before`
dash — that reads like AI default output, not editorial typesetting.

### Code

Fill only (ivory), no border. Syntax highlighting uses existing tokens only
(keyword `--brand`, comment `--stone`, string `--olive`, number `--dark-warm`,
function/class `--near-black`); blocks without a language stay monochrome.

### Tables

Editorial: no framed box, no tinted header bar, no vertical rules. Hairline
row rules (`--border`, 0.25pt/px scale), content-sized columns, muted
uppercase header labels. Row separation comes from whitespace before line
weight.

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