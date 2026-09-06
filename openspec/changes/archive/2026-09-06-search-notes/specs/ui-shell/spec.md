## MODIFIED Requirements

### Requirement: Header shows brand, content-width search, and an active-vault status slot
The header SHALL show the Folio brand at the left, a search input centered over and spanning the center pane's column, and in the right slot a display-only status for the active vault: the folder's name and its file count. The slot SHALL NOT perform actions — adding, switching, or re-granting a folder happens on the folder rail. The search input's width SHALL match the content column it sits over (capped at a readable maximum), not a fixed narrow box, so the box and its dropdown align with the content beneath. Search behavior — the results dropdown, matching, keyboard, and edge states — is specified by the search capability.

#### Scenario: Search spans the content column
- **WHEN** the shell renders at desktop width
- **THEN** the search input is horizontally aligned with the center pane and spans that column's width, not a fixed-width box

#### Scenario: Search behavior lives with the search capability
- **WHEN** the user types into the search input
- **THEN** the input's behavior is the search capability's: a results dropdown, keyboard shortcuts, and empty states, none of which were present while the input was inert

#### Scenario: The slot shows status and performs no actions
- **WHEN** a vault is active
- **THEN** the header slot shows the folder's name and file count and has no behavior that opens a picker, switches folders, or re-grants permission