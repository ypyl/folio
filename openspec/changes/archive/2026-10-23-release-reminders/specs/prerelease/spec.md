# Spec Delta

## REMOVED Requirements

### Requirement: A prerelease mode toggle lives on the folder rail

**Reason**: The mode exists to preview features that ship behind a build flag,
and reminders, its only flagged feature, are released. With nothing flagged the
control could not change anything, so a visible toggle claiming "Prerelease
features" would be false.

**Migration**: The rail's bottom group holds the tour control alone. No vault
content or preference depends on the toggle.

### Requirement: Prerelease mode persists across reloads

**Reason**: Removed with the mode it described.

**Migration**: The `folio.prerelease` browser key is no longer read or written; a
leftover value is harmless and needs no cleanup.

### Requirement: Prerelease mode enables features that ship behind a flag

**Reason**: Removed with the mode it described. A future capability that needs
previewing re-introduces the flag and this switch together.

**Migration**: None: no feature reads prerelease mode after this change.
