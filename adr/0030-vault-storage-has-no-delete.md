# ADR-0030: VaultStorage has no delete

- Status: Accepted
- Date: 2026-10-07

## Context

ADR-0003 sketched the `VaultStorage` interface with `delete(path)`, and
ADR-0013 fixed its contract with the method in place. Both shipped, and the
method was implemented and tested — but no caller ever used it. The app creates
and overwrites files (pages, boards, the pins file) and never removes one. That
is not an oversight: the product states the same rule in three other places.
The app "SHALL never edit, move, rename, or delete the user's files on its own"
(vault spec); an asset "never" gets deleted (ADR-0022); and reference-aware
asset deletion is decided against (NOTES.md, "Decided against").

A capability with no caller is surface the seam does not need, and the only
thing keeping this one alive was its own tests.

## Decision

Remove `delete(path)` from `VaultStorage` and `FileSystemVaultStorage`. The
seam is read/write: `read`, `write`, `writeBinary`, `readBinary`, `list`,
`stat`. The fake handle's `removeEntry` goes with it, since nothing else called
it.

A test that simulated a file vanishing outside the app now mutates the fake
tree directly. That is the honest model of what happens: the folder changes
under the app, and the app observes the change. It never performs the deletion.

If a feature ever does delete a file — the "orphan asset cleanup" Idea is the
only candidate — the method returns under that change, with the caller that
needs it.

## Consequences

- ADR-0003's interface sketch and ADR-0013's contract listing are revised in
  this one respect: `delete` is no longer part of the interface. Everything
  else in those records stands.
- The app still cannot delete a vault file; the interface now says so, rather
  than leaving a method that only convention kept unused.
- The change is reversible at the cost of the method itself: one interface
  member and one implementation.
