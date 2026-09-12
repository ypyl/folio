## MODIFIED Requirements

### Requirement: Header shows brand, content-width search, and an active-vault status slot

The header SHALL show the Folio brand at the left and a search input centered over and spanning the center pane's column. Beside the brand, the header SHALL show the running application version as `v<version>`, where `<version>` is the `version` field of `package.json`. The version SHALL be non-interactive text, SHALL render in every app state, and SHALL NOT be a control or gate any behavior. The header's right slot SHALL be empty: the vault's name and file count moved to the status bar. The slot SHALL hold no controls and SHALL NOT open a picker, switch folders, or re-grant permission — adding, switching, or re-granting a folder happens on the folder rail. The search input's width SHALL match the content column it sits over (capped at a readable maximum), not a fixed narrow box, so the box and its dropdown align with the content beneath. Search behavior — the results dropdown, matching, keyboard, and edge states — is specified by the search capability.

#### Scenario: Search spans the content column

- **WHEN** the shell renders at desktop width
- **THEN** the search input is horizontally aligned with the center pane and spans that column's width, not a fixed-width box

#### Scenario: Search behavior lives with the search capability

- **WHEN** the user types into the search input
- **THEN** the input's behavior is the search capability's: a results dropdown, keyboard shortcuts, and empty states, none of which were present while the input was inert

#### Scenario: The slot shows status and performs no actions

- **WHEN** a vault is active
- **THEN** the header slot shows no controls — the vault's name and file count appear in the status bar instead — and the slot performs no other actions: it opens no picker, switches no folder, and re-grants no permission

#### Scenario: The header names the running version

- **WHEN** the shell renders, in any app state
- **THEN** the header shows `v<version>` beside the brand, where `<version>` matches the `version` field of `package.json`, and the badge is not an interactive control
