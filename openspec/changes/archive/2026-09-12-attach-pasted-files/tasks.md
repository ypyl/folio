## 1. Paste-name helper

- [x] 1.1 In `src/components/dropAssets.ts`, add `withPastedName(file)` implementing design D3 — a generic or empty stem becomes `pasted-YYYYMMDD-HHMMSS` in local time, the extension kept from the name or derived from the MIME subtype, anything else returned unchanged — and rename `collectDropFiles` to `collectFiles` with its header comment widened to cover both gestures; verify with cases for a generic bitmap name, a nameless bitmap, a real file name, and a name that already looks like a timestamp.

## 2. Paste handler

- [x] 2.1 In `src/components/EditorPane.tsx`, rename the `onDropFiles` prop to `onAttachFiles` and add `handlePaste` beside `handleDrop`: return unless a page is open, at least one file is on the clipboard, and `text/plain` is empty; prevent default, copy the files through the prop after `withPastedName`, and insert `linkForAsset(path)` per landed path through the adapter (design D1, D2, D4); verify `npx vitest run src/components/EditorPane.test.tsx` passes with cases for a pasted bitmap attaching and linking, a pasted file with a real name keeping it, a clipboard with text and a file copying nothing, a paste with files and no page copying nothing, and a failed copy inserting no link — and that the drop cases are unchanged.
- [x] 2.2 In `src/App.tsx`, rename the prop at its call site; verify `npx tsc -b` is clean and `npx vitest run src/App.test.tsx` passes.

## 3. Tests

- [x] 3.1 Extend `src/App.test.tsx` with a paste case against a real vault: a clipboard holding a bitmap under a generic name, pasted into an open page, lands a `pasted-<timestamp>.png` under `assets/` and inserts the image link at the caret; verify the file exists in the fake tree and the editor recorded the insertion.
- [x] 3.2 Verify the end-to-end result of the previous change still holds for a pasted file: the inserted reference resolves to the pasted bytes (the App-level paste case can assert the rendered element is resolved), so paste and display are covered by one test rather than two disconnected ones.

## 4. Gates

- [x] 4.1 Run `npx oxlint --fix`, `npm run fmt`, and `npx oxlint --deny-warnings --format=agent`; verify all three are clean.
- [x] 4.2 Run `npm test` and `npm run build`; verify both pass.
- [x] 4.3 Browser smoke in Chrome against a real vault: with an OPFS folder open as the vault, dispatch a paste carrying a bitmap into the editor, then verify the asset landed under `assets/` with the timestamped name, the page's markdown holds the new reference, and the pasted image renders from the vault's bytes. Repeat for a text paste to confirm text paste is unchanged. State plainly what the paste synthesis does and does not reproduce of a real clipboard gesture.
