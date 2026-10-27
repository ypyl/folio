# Tasks

## 1. Shared Markdown renderer

- [x] 1.1 Add `src/markdown/render.ts` with escaped `renderInline` (emphasis,
      strong, strikethrough, code spans, links, images, reference chips) and
      `renderBlock` (headings, paragraphs, nested lists, blockquotes, code
      fences, GFM tables, rules); verify `src/markdown/render.test.ts` covers
      each construct and that raw HTML is escaped.
- [x] 1.2 Switch `codemirror.ts`'s table cells and `staticBlocks()` to the shared
      renderer, delete the stub, and verify `codemirror.integration.test.ts`
      still renders table markup and now returns formatted static blocks.

## 2. Presenting entry

- [x] 2.1 Set `PRESENT_ENABLED` to true and verify the page row's menu offers
      Present while journal days and note-less pages do not.
- [x] 2.2 Add App integration tests: a row presents the open page, a row for a
      page that is not open opens it and then presents, closing restores the
      editor, and presenting writes nothing.

## 3. The demo and browser

- [x] 3.1 Add a Playwright check that opens the demo's Presenting page, presents
      it from the row menu, and steps through its slides.
- [x] 3.2 Run `npm run test`, `npx tsc -b`, `npx oxlint --fix`, `npm run fmt`,
      `npx oxlint --deny-warnings --format=agent`, `npm run build`, and
      `npm run test:e2e`.

## Workflow follow-up

- Archive the change (no spec delta; the presentations spec already owns the
  behavior), bump `package.json` for the feature and archive commits, and push
  `master` to `origin` and `nas`.
