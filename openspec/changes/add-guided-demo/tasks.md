# Tasks

## 1. In-memory demo storage

- [x] 1.1 Add `src/demo/storage.ts` implementing `VaultStorage` over a
      `Map<path, string | Blob>` with a monotonic mtime per write, and verify
      `src/demo/storage.test.ts` covers read, write, binary write/read,
      recursive list ordering, stat after write, and missing-path rejection
      against the ADR-0013 path contract.
- [x] 1.2 Verify the storage never touches the filesystem or web storage by
      inspecting the module and its test.

## 2. Seeded guide content

- [x] 2.1 Add `src/demo/vault/` with the demo's Markdown pages, journal
      templates, board scene, SVG asset, and text asset, plus
      `src/demo/content.ts` that fills the date placeholders and returns the
      file map; verify `src/demo/content.test.ts` finds every kind of content
      and every planned guide page.
- [x] 2.2 Verify the guide's link graph and reminders: build the index from the
      demo storage and assert every reference resolves except
      `missing-topic`, Welcome references every guide, the board and assets
      resolve from their guide pages, pins are ordered, and today's reminders
      match and materialize as task items.
- [x] 2.3 Verify the Welcome page is the table of contents: its text names and
      references every guide page, and no guide page is missing from the demo
      index.

## 3. The demo as a virtual folder

- [x] 3.1 Extend `VaultFolder` with an optional handle and a demo flag, add
      `addVirtualFolder` to `useVault`, and skip handle-registry and
      last-active writes for a demo folder; verify `src/vault/useVault.test.ts`
      adds and activates it, dedups a second open, closes it back to the
      no-folder state, and leaves the stored folder registry untouched.
- [x] 3.2 Wire the demo into `App`: construct the storage only on first open,
      reuse the listed demo row on a later activation, and land the demo on
      `pages/Welcome.md` instead of today's journal; verify
      `src/App.integration.test.tsx` opens the demo, shows Welcome, lists its
      Files, opens a guide page, and opens Today with the reminders written.

## 4. Brand screen

- [x] 4.1 Add the `onDemo` control to `EditorPane`, render it as the primary
      brand action in every no-folder state, including the unsupported-browser
      copy, and keep the Logseq import below it; verify
      `src/components/EditorPane.integration.test.tsx` shows and activates the
      control for `open-folder` and `browser-unsupported` hints and that the
      import still renders.
- [x] 4.2 Verify the App-level entry point: with no `showDirectoryPicker`, the
      brand screen states the browser requirement, offers the demo, and opens
      it; with the picker present, the demo and the import are both offered,
      and the add control still opens a real folder.

## 5. Tour and docs

- [x] 5.1 Update the tour's editor step to name the guided demo, and verify
      `src/components/Tour.test.tsx` still walks five steps and the editor step
      names both reference forms and the demo.
- [x] 5.2 Add ADR-0034 (the guided demo is an in-memory vault), index it in
      `adr/README.md`, and add the "Try the demo" section and feature bullet to
      `README.md`; verify the links and commands read correctly.
- [x] 5.3 Bump `package.json` by a minor version for the new user-facing
      capability.

## 6. Integration

- [x] 6.1 Add `tests/e2e/demo.spec.ts`, removing `showDirectoryPicker` before
      the first navigation; verify the demo opens from the brand screen, the
      Welcome TOC opens a guide page, the board loads, Today writes the
      reminders, and a reload does not restore the demo.
- [x] 6.2 Run `npm run test`, `npx tsc -b`, `npx oxlint --fix`,
      `npm run fmt`, `npx oxlint --deny-warnings --format=agent`,
      `npm run build`, and `npm run test:e2e`; fix everything they report.

## Workflow follow-up

- Sync the delta specs into `openspec/specs/` (new `demo`, modified
  `workspace` and `navigation`), archive the change, and bump `package.json`
  again for the archive commit.
- Push `master` to `origin` and `nas`.
