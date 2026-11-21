# Tasks

## 1. The envelope, the actions, and the gate

- [x] 1.1 Add `src/agent/modelContext.ts`: a typed reader for
  `document.modelContext` that resolves to `null` where the browser has none, and
  `registerTools(tools, signal)` that registers each declaration and returns the
  `AbortController`'s abort as its retirement. Add a fake (`fakeModelContext.ts`
  beside `vault/fakeHandle.ts`) that records registrations and retirements; verify
  with a test that aborting retires every tool.
- [x] 1.2 Add `src/agent/actions.ts` with the collaborators it takes (storage,
  index upsert functions, drafts, editor handle, session sink) and the five action
  primitives behind the nine tools: `search`, `read`, `links`, `state`, `open`,
  `create`, `edit`, `append`, `remind`. Verify the naming rule with a test that a
  calendar-date name resolves to the journal day and any other name to its page.
- [x] 1.3 Wire registration in `src/App.tsx`: register once while the effective
  agent gate is on, abort on gate-off and unmount, and pass the bound actions.
  Verify with an integration test against the fake that the gate off registers
  nothing and a gate flip registers then retires.

## 2. The read tools

- [x] 2.1 Implement `search_notes`, `read_note`, `note_links`, and `app_state` in
  `src/agent/actions.ts` against the existing index, search core, and rows; cap
  search at a small fixed row count, and read at one page, a line window, and a
  character cap. Verify with `src/agent/actions.test.ts` cases for each cap and for
  a read of a page with no file.
- [x] 2.2 Implement `open_note` through the app's existing open path, so it lands
  in the history trail exactly as choosing a row does; verify with an integration
  case that the page opens and Back returns to the previous one.

## 3. The write tools

- [x] 3.1 Implement `create_note` and `append_note` for the closed-page shape: read
  the file or start from empty, apply the change, and write through `upsertPage`;
  verify that the Files listing and a referencing page's backlinks are true right
  after the call, with no reload.
- [x] 3.2 Implement `edit_note`'s two shapes: on the open page, match against the
  live document and dispatch one transaction with a mapped caret; elsewhere, match
  the file and write through `upsertPage`. Verify with tests that the open-page
  shape performs one dispatch and no storage write, that the user's typing
  survives, and that `Mod-z` undoes only the agent's change.
- [x] 3.3 Add the refusals: `.folio/` paths, non-Markdown paths, a missing match,
  an ambiguous match, an unknown tool. Verify each returns its own failure and
  writes nothing.
- [x] 3.4 Implement `add_reminder` through `parseReminders` / `renderReminders` /
  `upsertReminders`; verify the file keeps its header, order, and canonical
  reference form, and that an unknown recurrence or an impossible day is refused.

## 4. Declarations, record, and the browser check

- [x] 4.1 Add `src/agent/tools.ts` with the nine declarations and their char
  budgets and annotations, and `tools.test.ts` pinning every budget and every hint
  (reads read-only, writes consequential, note-text results untrusted).
- [x] 4.2 Route every write through the activity record (`add-agent-activity-log`)
  and verify with an integration test that a tool's write adds one entry naming the
  tool and the path.
- [x] 4.3 Run the surface against a browser's real model-context interface rather
  than only the fake. This machine's Chromium (145) exposes the preview on
  `navigator.modelContext`, which the app reads as well as the trial's
  `document.modelContext`; `tests/e2e/agent-browser.spec.ts` launches it with
  `--enable-features=WebMCP`, wraps `registerTool` before the app loads, and
  asserts all nine registrations arrive and all nine are retired when the gate
  goes off. It skips where no build exposes the interface.

## 5. Full circle

- [x] 5.1 Run `npx oxlint --fix`, `npm run fmt`, `npx tsc -b`, `npm run test`,
  `npm run build`, and the e2e suite, which drives a tool call through the app's
  own gate and asserts the change is visible in the app and named in the record;
  all pass (1436 unit and integration tests, 45 e2e).
- [x] 5.2 Bump `version` in `package.json` (minor), run `npm run changelog`, and
  commit the feature with its tests, docs, delta spec, and design.
- [x] 5.3 Run `npx oxlint --deny-warnings --format=agent`.

## Workflow follow-up

- Archive the change, syncing the `agent-tools` delta into `openspec/specs/`, with
  its own patch version bump.
- Push `master` to every remote (`origin`, `nas`) and publish the release at the
  feature commit.
- Flip ADR-0036 from Proposed to Accepted when the surface lands, and record the
  browser check's outcome there.
