# Design

## Context

See proposal.md. The build-time flag lives in `src/features.ts`
(`features.reminders`, from `VITE_REMINDERS`). The folder registry already
persists app-level state in IndexedDB (`handleStore`), which establishes that
app-level preferences may live outside the vault. The rail already ends with a
bottom-anchored tour control.

## Goals / Non-Goals

**Goals:**
- One persisted switch that turns on gated features, without a rebuild.

**Non-Goals:**
- A general settings system, or moving the folder registry to the same store.

## Decisions

**D1: Prerelease mode is a boolean in `localStorage`.** A UI preference is not
vault content and does not belong in `.folio/` (which travels with the folder) or
in the page index. `localStorage` is synchronous, survives reloads, and is safe
to read when unavailable (private mode), where the mode simply stays off. The
folder registry stays in IndexedDB because a directory handle cannot go in
`localStorage`; a boolean can, so this does not need a database.

**D2: The effective flag is `features.reminders || prerelease`.** The build flag
stays the shipped default and the test override; prerelease mode is layered on
top. `App` computes the effective value once and passes it to `Sidebar` as a
prop, so the day menu, the badge, and materialization all read the same gate and
`Sidebar` stays a dumb renderer.

**D3: The toggle lives on the rail, before the tour.** The rail is the app-level
control column. The control sits in a bottom group with the tour control, so the
tour stays the rail's last control and both remain held to the bottom edge. It
carries `aria-pressed` for its state and an accessible name, and renders in every
state, compact included, because it is app-level.

## Risks / Trade-offs

- **`localStorage` is per origin, not per vault.** That is the intent: prerelease
  mode is a person's switch, not a property of a folder.
- **A hidden feature turned on could surprise.** The control reports its state
  (`aria-pressed` and a title), so the mode is visible while it is on.
- **The flag still ships.** Turning the mode off restores the shipped behavior
  without a rebuild.
