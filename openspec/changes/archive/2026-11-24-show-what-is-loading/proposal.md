# Proposal

## Why

Two waits in the app say nothing while they happen, and both read as "the app is
empty" rather than "the app is working".

The first is the cold start. `useVault` reopens the stored folder by reading the
folder registry, asking the browser for permission, and scanning the folder
before anything can be shown. The shell has no state for that window: the
sidebar's Journal and Files sections render with nothing in them, the pane shows
the brand screen's "Your notes appear here.", and the status bar is quiet. On a
folder from a network share or a synced disk that window is seconds long, and it
looks like the notes are gone. The shell has a loading state already — the pane's
document skeleton, the sidebar's calendar and row skeletons, and the status bar's
"Indexing notes…" — but it is only wired to the index build, which starts *after*
the restore.

The second is a diagram. A fence whose drawing is on its way shows an empty box
of the right height: the box is reserved so the prose does not jump, but with
nothing in it the page reads as a gap until the drawing lands, which on the first
diagram of a session is a second of nothing.

## What Changes

- **The restore window is a loading state.** While the app reopens its stored
  folder, the shell shows the loading it already has: the pane's document
  skeleton, the sidebar's calendar and row skeletons, and a status bar that names
  what it is doing.
- **A short restore does not flash.** The loading state is held for a moment
  before it renders, so a start that settles quickly (a fresh browser, a warm
  folder) goes straight to content instead of flashing skeletons for two frames.
- **The status bar names the phase.** "Opening your notes…" while the stored
  folder is being reopened, "Indexing notes…" while the index builds. One phrase
  at a time in the same `role="status"` slot.
- **A pending diagram shows a placeholder.** A fence whose drawing has not landed
  shows the app's loading placeholder in the block's place, sized so the page does
  not jump, and replaced by the drawing when it arrives. It is presentational: no
  control, no dismissal, and it carries an accessible label saying the diagram is
  being drawn.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `workspace`: the shell's loading state covers the app reopening its stored
  folder, not only the index build, and the status bar names which of the two is
  happening.
- `diagrams`: a fence whose drawing is pending shows a loading placeholder in its
  place, presentational and labelled, until the drawing or a failure replaces it.

## Non-goals

- **No new progress surface.** No spinner component, no progress bar, no toast
  and no dialog. The app's existing placeholders and the status bar carry it.
- **No change to what the restore does.** Same registry read, same permission
  query, same scan, same deadline. Only what the shell shows meanwhile.
- **No change to the index build's loading state.** What `indexing` shows today
  is unchanged; it simply gains a phase before it.
- **No per-diagram progress.** A diagram is pending or drawn, never 40% drawn.
- **No animation beyond the app's own placeholder pulse** (DESIGN.md: the pulse
  is the only motion, never brand-coloured, and it stops for reduced motion).
- **No new user setting** to turn any of it off.

## Impact

- `src/useDelayed.ts` (new): the hold that keeps a fast start from flashing.
- `src/components/saveLabel.ts`, `saveLabel` copy and its callers: the restore
  phrase outranks the index phrase, which outranks the save state.
- `src/components/StatusBar.tsx`: a `restoring` prop, passed through to the copy.
- `src/App.tsx`: one computed shell loading flag, and the phase the status bar
  names.
- `src/components/EditorPane.tsx`: no new markup; the existing document skeleton
  now also covers the restore window.
- `src/editor/diagrams.ts`: the pending placeholder, painted when a box registers
  and replaced on success or failure.
- `src/index.css`: the placeholder's box in a diagram.
- Tests: the hold, the status bar's two phases, the pane's skeleton during a slow
  restore, and the diagram box's placeholder and its replacement.
- `DESIGN.md`: one line where diagrams are described, saying what a pending
  drawing looks like.
- Version bump: minor, because the shell's cold start and a waiting diagram are
  both user-visible.
