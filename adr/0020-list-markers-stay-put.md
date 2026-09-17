# ADR-0020: List markers stay where the browser places them

- Status: Accepted
- Date: 2026-09-16

## Context

A list item whose first line holds an image shows its bullet level with the image's bottom edge. A marker is placed on its item's first line box baseline, and a replaced element's baseline is its bottom margin edge, so an image, not text, decides where that line's baseline sits, and the marker follows it down. On a screenshot several hundred pixels tall the bullet lands at the far bottom of the item; where the image is taller than the pane, the bullet can be off screen while the item is being read. `align-list-marker-with-image-top` raised this.

One CSS rule addresses it: `li > p:first-child > :is(img, .folio-image):only-child { vertical-align: top }`. It aligns the leading image to the line's top and hands the baseline back to the text strut, a few pixels under the image's top edge.

## Decision

Leave the marker where the browser puts it. The editor keeps native markers, brand-colored, and carries no alignment rule of its own.

The rule above was written, built, and measured, then rejected:

- **It cannot be scoped to the image alone.** `:only-child` counts element siblings, and the text on an editor line is a text node, so `<p>text <span class="folio-image">…</span> trailing</p>` matches it. The rule therefore also re-aligns every list line that holds text beside an image. Measured in Chromium on a 420px pane: a line reading `text ![120x80] trailing` moved its text from 104px below the image's top to 2px below it, and a 24px icon moved its text by 6px. The spec written for the fix promised those lines would render as they do today, and that promise cannot be kept in CSS.
- **A native marker cannot be moved without moving its line.** The marker rides the line's baseline. The only way to place it anywhere else is to drop `list-style` and draw the marker ourselves, which DESIGN.md's Lists entry forbids: a faked bullet leaves the accessibility tree, reads as generated output, and puts per-item geometry in Folio's hands.
- **An editor-side signal would buy half the fix.** A node decoration over a paragraph whose only child is an image node would let the rule be scoped to image-only paragraphs, at the cost of a per-keystroke pass and a new kind of decoration. It still leaves the reported case half-fixed: when the line's text wraps (an image wider than the pane with a caption after it), the paragraph holds text, the decoration does not apply, and the bullet stays at the image's bottom.
- **The cost is cosmetic and local.** The bullet sits beside the item's first line either way. Only an item led by a large image loses the reader's sense of where the item starts.

## Consequences

- A list item led by an image keeps its bullet level with the image's bottom edge, and an item whose image is taller than the pane can show its marker out of view. That is the browser's own baseline placement for a replaced element, the placement an inline image gets on any line, and it is now the intended rendering rather than an unexamined one.
- No CSS rule, no decoration, and no marker of Folio's own. `src/components/EditorPane.module.css` keeps its single marker rule (`li::marker` color), so nothing about marker alignment exists to drift.
- The gutter's `pinToTop` (`src/editor/gutter.ts`) is unaffected and stays. It places the app's own line number, which Folio owns and can move for free. A browser marker is not the app's element, and treating it as one is what the rejected rule did.
- Revisiting this needs one of two things first: a decision to own the marker, with a DESIGN.md change and an accessibility story for a drawn bullet, or a measurement showing that an editor-side signal earns its per-keystroke cost.
