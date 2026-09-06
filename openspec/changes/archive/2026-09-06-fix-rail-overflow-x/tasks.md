## 1. CSS change

- [x] 1.1 In `src/components/FolderRail.module.css`, add `overflow-x: hidden;` to `.rail` (keep `overflow-y: auto`). Verify: `npm run build` passes.

## 2. Gates

- [x] 2.1 Run full gates: `npm test` (all files, coverage ≥80), `npm run lint`, `npm run build`, `openspec validate --changes`. Verify: all green, no new warnings.
- [x] 2.2 Dev smoke: `npm run dev` (fresh server), open the sample vault — the folder rail shows no horizontal scrollbar at its bottom edge; the avatar list still scrolls vertically when long. Verify: manual.