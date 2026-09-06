## 1. Remove the New Page button

- [x] 1.1 Delete the New Page button from `Sidebar.tsx` and `.newPageBtn` from `Sidebar.module.css`, and drop the button assertion in `App.test.tsx` ("renders the shell chrome…"); verify `rg -n "New Page|newPageBtn" src` returns nothing and `npm test` passes the shell test
- [x] 1.2 Update `Sidebar.test.tsx` if it references the button or the accordion's leading position, so the Journal section is asserted as the sidebar's first element; verify the sidebar tests pass

## 2. Open today's journal by default

- [x] 2.1 Add the auto-open effect in `App.tsx` (import `localDayString`): when the active folder's `graph` is non-null and `activePath` is null, set `activePath` to `journals/<localDayString(new Date())>.md` and seed its draft via `drafts.open(path, graph.pages.get(path)?.content ?? '')` + `setDraftVersion`, mirroring `handleSelect`; verify a folder-open lands on the today editor seeding `''` (fixture has no today file) and no `Journals/<today>.md` file was created
- [x] 2.2 Update the "shows the brand empty state with a folder open but nothing selected" test in `App.test.tsx` to expect the blank today editor instead (seeded `''`, calendar Today cell marked active), and keep the no-vault empty-state test intact; verify the navigation suite passes
- [x] 2.3 Add a test that a folder switch resets to the new folder's today note, and a test that typing into the auto-opened today note materializes `journals/<today>.md` on save (mirroring the existing journal-write test); verify with `npm test`

## 3. Empty-page placeholder

- [x] 3.1 In `EditorPane.tsx`, track emptiness (`initialContent.trim() === ''`, updated on each `onChange` to `markdown.trim() === ''`) and set `data-empty` + `data-placeholder` attributes on the editor mount element; verify via unit test that an empty page renders the placeholder and a non-empty page does not
- [x] 3.2 Add the placeholder rule to `EditorPane.module.css` (`.editor[data-empty] :global(.ProseMirror) :global(p:first-child)::before` with `content: attr(data-placeholder)`, `float: left; height: 0; pointer-events: none`, `color: var(--stone)`); verify the placeholder appears at the document start and never in the serialized content
- [x] 3.3 Add `EditorPane.test.tsx` scenarios: placeholder shows on an empty page, hides after typing, and returns after deleting all content; verify the editor tests pass

## 4. Integrate and verify

- [x] 4.1 Run `npm run lint` and `npm run build` clean, then `npm test` green (specs: ui-shell sidebar accordion, static-navigation today-journal load, page-editing placeholder)