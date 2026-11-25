# Tasks

## 1. The drawing puts the engine back

- [x] 1.1 In `src/editor/diagrams.ts`, add an exported helper that snapshots mermaid's configuration, installs the app's palette, runs the drawing, and restores the snapshot in a `finally`; use it from `loadEngine`'s render, and reword the module comment about the board's paste path.
- [x] 1.2 In `src/editor/diagrams.test.ts`, cover the helper with a fake mermaid: the palette is installed before the job, the snapshot is restored after it, and the snapshot is restored after a failed job too.

## 2. The spec says what happens

- [x] 2.1 Update the `diagrams` requirement "One engine configuration serves every renderer" in the change's delta (done) and re-read the code comment against it, so neither claims a configuration the board's converter does not use.

## 3. Version and verification

- [x] 3.1 Bump `version` in `package.json` (patch: a cosmetic fix to what a pasted diagram looks like).
- [x] 3.2 Run the unit and integration suites, `npx tsc -b`, `npx oxlint --deny-warnings --format=agent`, and `npm run build`; verify all green.
- [x] 3.3 Run the whole e2e suite (a page's diagram still draws in the app's palette); verify all green and sweep dev servers with `npm run kill:dev`.

## Workflow follow-up

- Archive the change with `/opsx-archive`, syncing the main `diagrams` spec and moving the change directory.
- Publish the GitHub Release for the feature commit's version, with notes drawn from `CHANGELOG.md`.
