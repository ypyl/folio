# Design

## Context

See `proposal.md`. The brand screen is rendered by `EditorPane` when
`page === null`; the no-folder copy is two literals (`BRAND_DESCRIPTION`,
`BRAND_FACTS`) plus the `EMPTY_HINTS` tagline, all inside one `<p>`, with the
demo button, the `brandAction` slot (the Logseq import), and the repository line
stacked under it in a centered 46ch column. Styling is
`EditorPane.module.css`. The screen is static: nothing here is on the typing
path or reads the vault.

## Goals / Non-Goals

**Goals:**

- One screen that is skimmed, not read: a headline, one sentence, the actions,
  then three facts.
- Half the words for the same information.
- Keep the brand screen one centered column; no cards, icons, or new surface.

**Non-Goals:**

- No type scale, serif display face, or letter-spacing treatment (DESIGN.md
  defers those to a future ADR).
- No new control, state, storage, or dependency.
- No change to the browser warning, demo, import, tour, or repository behavior.

## Decisions

**Hero, actions, facts, footer — in that order.** The reference the user pointed
at (a features-section pattern) puts the headline and the call to action first
and the feature list under it. Mapping it onto Folio: the tagline becomes the
headline, `BRAND_DESCRIPTION` becomes the one-sentence introduction, the demo
and import buttons sit immediately under it, the facts row comes next, and the
tour and repository lines close the screen in 12px stone. The action stays above
the detail so a returning user can open the demo without reading anything.

**The facts are a list of `{label, detail}` pairs, not a sentence.** One
constant, `BRAND_FACTS`, becomes an array of three pairs rendered as a `<ul>`.
The spec's three facts are unchanged; only their presentation changes. This is
what removes most of the words: "Pages and journals are plain Markdown" becomes
`Pages & journals` over `Plain Markdown files`, and the reference grammar drops
to the shorthand it is: `#word or #[[Page]]`.

**No icons.** A chip or glyph per fact would restate the label it sits beside;
DESIGN.md's deletion test and its "subtractive decoration" rule both delete it.
The label's weight is the anchor, and the three columns are separated by space
alone — no dividers, no fills, no borders.

**Layout is one grid, not cards.** `grid-template-columns: repeat(auto-fit,
minmax(140px, 1fr))` with a 460px cap: three columns in a wide pane, one on a
phone, no media query, and no truncation at any width. Each item is centered
label-over-detail.

**The mark shrinks to 72px and the tagline becomes an `<h1>`.** The screen now
has a real headline, so the headline carries the hierarchy and the mark is
identity rather than the loudest thing on screen. 20px/600 in the UI font is
within today's screen-UI scale, not Kami's deferred print scale.

**The screen scrolls instead of clipping.** The content grew from three bands to
five, and a landscape phone is shorter than the block. The pane keeps
`height: 100%` and `overflow-y: auto`, and centers through an inner wrapper with
`margin: auto` — the overflow-safe centering, since `justify-content: center`
alone clips the first band once the content outgrows the box. The wrapper, not
the pane, carries the padding, so the padding scrolls with the content.

**Copy (subject to review):**

- Headline: unchanged (`Open a folder to begin.`).
- Introduction: "Folio is a local-first notes app: your Markdown folder is the
  database, and your notes stay on your machine."
- Facts: `Pages & journals` / `Plain Markdown files`; `Wiki links` /
  `#word or #[[Page]]`; `Whiteboards` / `#!board`.
- Tour line and repository line: unchanged wording, so the tour reference still
  names the rail's `?` and the repository link keeps its accessible name.

**Inline controls cancel their own padding.** At 12px the control's 5px hover
padding read as a stray space between "Take the tour" and the comma after it
(`tour ,`), and before the full stop after "GitHub". The link treatment keeps
its padding and gains `margin: 0 -5px`, so the tint still has breathing room
while the text sits where the sentence expects it. That fixes the punctuation
without touching either sentence.

Words: about 60 before, about 35 after, and the paragraph a user must actually
read is one sentence.

## Risks / Trade-offs

- [The facts row reads as decoration] → each item states a capability the app
  has and keeps the spec's own three facts; nothing new is claimed.
- [Copy drifts from the tour's editor step] → the facts restate the same three
  forms, as before; keep them in sync with `src/tour/steps.ts`.
- [Existing tests assert the old sentence] → the tests move to the new copy in
  the same change, so the spec, the DOM, and the assertions stay one story.
- [Taller screen on a short window] → the pane scrolls, and the centered column
  still fits a desktop window unchanged.
