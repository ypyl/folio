# Tasks

## 1. The name rule

- [x] 1.1 Add `src/vault/names.ts` with `isWritableFileName` (portable characters, control characters, Windows device names) and its unit test covering every refused class, a device name with and without an extension, and writable names (`café`, `2.0`, `100% done`, spaces, brackets); `npx vitest run src/vault/names.test.ts` passes.

## 2. References stop naming the impossible

- [x] 2.1 Filter the target in `matchRefs` (`src/vault/parse.ts`) so a page or board target the folder cannot hold yields no token; verify with unit tests that `findReferenceRanges`, `parseLinks`, and `parseBoardRefs` drop `#[[a | b]]`, `#[[a:b]]`, `#[[a/b]]`, `#[[NUL]]`, and `#![[a | b]]`, and keep `#[[café]]`, `#[[2.0]]`, `#[[100% done]]`, and `#![[Migration topology]]`.
- [x] 2.2 Add an integration test with a vault note holding `#[[Interview - Amjad A. | Bkdkfd]]`: the graph exposes no page or forwardlink for it, no board for `#![[a | b]]`, and opening the note and saving succeeds (`src/vault/index.integration.test.ts` or the nearest existing suite); the suite passes.

## 3. The storage guard

- [x] 3.1 Reject an unwritable segment in `parsePath` (`src/vault/fs.ts`) with `InvalidVaultPathError`; verify with `src/vault/fs.test.ts` cases that `read`, `write`, and `list` reject such a path without calling a handle, and that legal-but-unusual names still pass.

## 4. The recorded contract

- [x] 4.1 Add the portable-name line to ADR-0013's path contract and to `adr/README.md` if it lists requirement text; verify the ADR reads as one contract with the code, no new ADR needed.

## 5. Full circle

- [x] 5.1 Run `npx oxlint --fix`, `npm run fmt`, `npx tsc -b`, `npm run test`, `npm run build`, the e2e suite, and `npx oxlint --deny-warnings --format=agent`; all pass, and the e2e includes the reported reference name typed into a note (page stays text, no save failure, no file written).
- [x] 5.2 Bump `version` in `package.json` (patch) and commit the feature with its tests, docs, delta specs, and ADR line.

## Workflow follow-up

- Archive the change, syncing the `references` and `whiteboards` deltas into `openspec/specs/`, with its own patch version bump.
- Push `master` to every remote (`origin`, `nas`).
