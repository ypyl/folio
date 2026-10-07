# Design

## Context

See proposal.md — Why. Today a `ShortcutItem` is a label plus `keys: string[]`
and an optional row-level `surface`; `ShortcutsList` renders one control per key
and names it `${item.label} ${displayKeys(key)}`. The history rows use that: a
row each, gated `back` / `forward`. Two facts make a shared row non-trivial:
each chip must keep its own accessible name (otherwise both announce "Back /
Forward …"), and each must keep its own availability (Back can be live while
Forward is dimmed).

## Goals / Non-Goals

**Goals:**

- One visible row for the pair, with the two chips.
- Preserve both the per-action naming and the per-direction gating.
- Smallest change to the data that carries both.

**Non-Goals:**

- No change to any other row, chord, or the history behavior itself.

## Decisions

**D1 — Move label and surface from the row to the key.** A row's `keys` becomes
`ShortcutKey[]`, where `ShortcutKey = { chord: string; label?: string; surface?:
ShortcutSurface }`, and `ShortcutItem.surface` is removed. `ShortcutsList` names
a control `${key.label ?? item.label} ${displayKeys(key.chord)}` and gates it on
`canApply[key.surface ?? group.target]`. The history item becomes
`{ label: 'Back / Forward', keys: [{ chord: 'Mod-[', label: 'Back', surface:
'back' }, { chord: 'Mod-]', label: 'Forward', surface: 'forward' }] }`. Every
other row's keys become objects with only a `chord`, and behave exactly as
before. The alternative — a row-level `surface` on the shared row — cannot gate
the two directions apart, which the spec's "one chord of a shared row can
disable while the other stays live" requires. The resetting alternative — gate
the row on `canBack || canForward` and let a no-op chord do nothing — was
rejected for the same reason.

**D2 — The visible label carries the pair; the per-key labels carry the action.**
The row reads "Back / Forward" to the eye, while the per-key `label` keeps the
accessible names "Back Ctrl+[" and "Forward Ctrl+]", so a screen reader still
hears which chip is which. Dropping the per-key label (naming both controls
"Back / Forward …") was rejected: two controls would announce identically.

## Risks / Trade-offs

- **The pinned inventory test compares `item.keys`.** It must normalise the key
  objects to their chords (and may assert the labels and surfaces) → updated in
  the same task, so the drift guard still pins the full sheet.
