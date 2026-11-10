# Spec Delta

## REMOVED Requirements

### Requirement: An experimental switch lives on the folder rail

**Reason**: The trace, the mode's last gated feature, ships in every build. With
nothing left to gate, the control could not change anything, so it goes with the
mode it served.

**Migration**: The rail's bottom group holds the tour control alone. No vault
content depends on the control.

### Requirement: The switch persists across reloads

**Reason**: Removed with the switch it described.

**Migration**: The `folio.prerelease` browser key is no longer read or written; a
leftover value is harmless and needs no cleanup.

### Requirement: The switch enables features that ship behind a flag

**Reason**: Removed with the switch it described. A future capability that needs
previewing re-introduces the flag and this switch together.

**Migration**: None. No feature reads prerelease mode after this change.

### Requirement: The experimental control explains what it enables

**Reason**: Removed with the control it described.

**Migration**: None. The popup had no destination outside the control.

### Requirement: The popup sits beside the rail and describes the control

**Reason**: Removed with the control it described.

**Migration**: None.

### Requirement: Every gated feature is described

**Reason**: Removed with the gate it described. With no flagged feature, there is
nothing for a description list to cover.

**Migration**: None.
