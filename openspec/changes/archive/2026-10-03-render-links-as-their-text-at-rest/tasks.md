# Tasks

## 1. Hide a link's marks

- [x] 1.1 In the decoration pass, hide a `Link` node's opening mark and its closing-mark-to-end tail, found by name so an image label is not swallowed.
- [x] 1.2 Do the same for an `Autolink`'s angle brackets.
- [x] 1.3 Refuse to hide an empty link text, and any range that would span a line break.

## 2. Tests

The tests are in `src/editor/codemirror.test.ts`, under "a markdown link reads as its text".

- [x] 2.1 A link reads as its text at rest, keeps the whole construct in the document, and shows it again when the caret enters.
- [x] 2.2 An autolink reads without its brackets.
- [x] 2.3 Ctrl+Click still opens the hidden destination.
- [x] 2.4 A link inside a code span or a fence stays literal.
- [x] 2.5 An empty link keeps its source, and a link with an image label still shows the image.

## 3. Verification

- [x] 3.1 Run `npx oxlint --fix`, `npm run fmt`, `npx oxlint --deny-warnings --format=agent`, `npx tsc -b`, and the suite.
- [x] 3.2 Bump `version` in `package.json`.
- [x] 3.3 Archive the change and sync its spec, then commit and publish.
