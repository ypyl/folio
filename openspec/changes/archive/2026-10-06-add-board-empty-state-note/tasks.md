# Tasks

## 1. The blank-board note in the board host

- [x] 1.1 Add an optional `boardToken: string | null` prop to `BoardView` (`src/editor/boardView.tsx`), render a short note as a sibling of `<Excalidraw>` inside the `.board` host when the board holds no elements, and clear it (never back) on the first element-bearing `onChange`. Verify with `src/editor/boardView.test.tsx`: a blank board shows the note naming the token, a board whose `initialScene` holds elements shows none, and the note disappears after a change carrying an element.
- [x] 1.2 Style the note in `src/editor/boardView.module.css` from the app's tokens only (muted text, ivory surface, hairline border, whisper shadow at most), `pointer-events: none`, placed away from the top-center toolbar per DESIGN.md, and verify the note's DOM node reports no pointer events in the host test. Run `npm run fmt` and `npx oxlint --deny-warnings`.
- [x] 1.3 Add the no-token case to the host test: a `boardToken` of `null` shows the note without naming a token, and verify `npm run test:unit` passes.

## 2. Passing the token from App

- [x] 2.1 Compute the token in `src/App.tsx` for the open board — `isBoardReferenceable(boardStem(activePath)) ? boardToken(boardStem(activePath), 'word') : null` (the token name is the filename stem, not the `boardName` display label) — and pass it to `BoardView`; confirm `src/App.integration.test.tsx` covers opening a blank board from a `#!` reference with the note shown and no file written, and that a board with content shows no note.
- [x] 2.2 Verify `npx tsc -b` and `npm run test:integration` pass.

## 3. Verification and integration

- [x] 3.1 Browser-check the note with a real dev server (`npm run dev:test`, confirm `ready in`, then `npm run kill:dev`): open a blank board from a `#![[Some Name]]` reference, confirm the note shows the canonical token and that drawing over it creates an element (no click swallowed).
- [x] 3.2 Bump `version` in `package.json` (minor, new user-facing surface) and run `npx oxlint --deny-warnings --format=agent`, `npm run test:unit`, `npm run test:integration`, and `npm run build`, all green.
