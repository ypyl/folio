# Proposal

## Why

The brand screen is the first thing a new user reads, and it has accumulated
about sixty words of prose in one centered column: a tagline, a two-sentence
introduction, a two-sentence fact dump, and a repository sentence. Nothing on it
can be skimmed, and the demo action has to be found inside the paragraph. The
same information fits on one screen in half the words if the facts become a
short labeled row instead of a sentence.

## What Changes

- The brand screen becomes a hero plus a facts row. The tagline becomes the
  screen's headline (near-black, larger, weight 600), followed by one short
  sentence that says what Folio is: local-first, the Markdown folder is the
  database, the notes stay on the user's machine.
- What the app does moves out of prose and into three labeled facts under the
  actions: `Pages & journals` / `Plain Markdown files`, `Wiki links` /
  `#word or #[[Page]]`, `Whiteboards` / `#!board`. They sit in one row where the
  pane is wide and one column where it is not. No icons, no cards, no borders:
  label over detail, separated by space.
- The primary demo action sits directly under the introduction, with the Logseq
  import beside it as the secondary action.
- The tour reference and the repository line shrink into a quiet two-line footer
  under the facts. Their wording, behavior, and order stay what the spec already
  requires.
- The mark drops from 96px to 72px so the headline carries the emphasis, and the
  screen scrolls instead of clipping when a short viewport cannot fit it.
- Copy falls from about sixty words to about thirty-five; no information is lost.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `workspace`: the brand-screen requirement describes the hero-plus-facts
  layout: the tagline as headline, one-sentence description, three labeled facts
  in a row, actions above the facts, and the tour and repository lines as a
  footer. Every other behavior of that requirement (states, demo, browser
  warning, import, link targets) is unchanged.

## Impact

- `src/components/EditorPane.tsx`: the brand-screen markup and copy constants
  (`BRAND_DESCRIPTION`, `BRAND_FACTS` become one description and a facts list).
- `src/components/EditorPane.module.css`: the brand-screen block's layout and
  the facts row.
- `DESIGN.md`: a short brand-screen recipe, so the hero-plus-facts shape is the
  recorded answer rather than something new the next screen invents.
- Tests: `src/App.integration.test.tsx`,
  `src/components/EditorPane.integration.test.tsx`, and
  `tests/e2e/workspace.spec.ts` assert the old fact sentence.
- No vault, storage, index, editor, or Markdown changes. No new dependency, no
  new ADR (ADR-0011 still governs the palette; its deferred type scale is not
  touched).

## Non-goals

- Not a marketing page: no images, illustrations, screenshots, carousel, or
  cards. No second chromatic color, no gradients, no shadows.
- No new control: the open-folder action stays in the rail, the demo and the
  import stay the screen's actions, and the tour and repository keep their
  current targets and accessible names.
- No change to the warning callout, the demo flow, the import panel, or the
  `notes` transitional hint.
- No typography system: no serif display face, no new type scale (ADR-0011
  defers that decision).
- No new state, storage, or first-run flag.
