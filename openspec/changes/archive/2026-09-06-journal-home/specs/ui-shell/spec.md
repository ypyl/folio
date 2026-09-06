## REMOVED Requirements

### Requirement: Sidebar is an accordion with a New Page button
The sidebar SHALL start with a New Page button at the top, followed by two collapsible sections: Journal and Pages. Both sections SHALL support independent open/close (one section's state does not affect the other), open by default, and expand/collapse without page reloads or JavaScript manipulation of document state. There SHALL be no Tags section and no other sidebar sections.

#### Scenario: Sections open and close independently
- **WHEN** the user collapses the Pages section while Journal is open
- **THEN** Pages collapses and Journal remains open

#### Scenario: New Page button is present and quiet
- **WHEN** the shell renders
- **THEN** the New Page button is the first element of the sidebar, uses the secondary button variant, and is not the only colored element in the viewport

**Reason**: The New Page button was inert — it created nothing. Folio already creates pages organically: an unmaterialized `#word` / `#[[Page]]` reference opened from the forwardlinks pane, or a journal day opened from the calendar (see static-navigation unmaterialized-pages). A dead affordance at the top of the sidebar misled more than it helped; the journal is the entry point.

**Migration**: The sidebar starts directly with the Journal section. Create a page by referencing it in any note and opening the link, or by opening a calendar day.

## ADDED Requirements

### Requirement: Sidebar is an accordion of Journal and Pages sections
The sidebar SHALL contain exactly two collapsible sections — Journal, then Pages — with no other sections, controls, or buttons above or between them. Both sections SHALL support independent open/close (one section's state does not affect the other), open by default, and expand/collapse without page reloads or JavaScript manipulation of document state. There SHALL be no Tags section and no New Page button.

#### Scenario: Sections open and close independently
- **WHEN** the user collapses the Pages section while Journal is open
- **THEN** Pages collapses and Journal remains open

#### Scenario: The Journal section leads the sidebar
- **WHEN** the shell renders
- **THEN** the first element of the sidebar is the Journal section, and no button or other control precedes the accordion

## MODIFIED Requirements

### Requirement: A folder rail lists opened folders and switches between them
The shell SHALL render a narrow folder rail as the leading workspace column. The rail SHALL show an add control and one entry per opened folder; the entry for the active folder SHALL be visually distinct. Activating a rail entry SHALL make that folder the active one, and when its stored permission is pending it SHALL request permission for that stored folder instead of opening the picker. Opening the same folder twice through the picker SHALL NOT add a second entry. Switching folders SHALL reset the open page to the newly active folder's today journal note — a blank in-memory page when no file exists yet, materializing on first save. The rail SHALL render no folder entries until stored folders have been resolved.

#### Scenario: The add control opens the picker and lists the folder
- **WHEN** the user activates the add control and picks a folder
- **THEN** the picker opens, an entry for the folder appears on the rail, and the folder becomes active

#### Scenario: Clicking a rail entry switches the active folder
- **WHEN** the user activates a rail entry that is not the active folder
- **THEN** that folder becomes the active one and the open page becomes that folder's today journal note

#### Scenario: The active entry is visually distinct
- **WHEN** multiple folders are listed
- **THEN** the active folder's entry is visually distinct from the others

#### Scenario: A pending-permission folder re-grants without the picker
- **WHEN** the user activates a listed folder whose stored permission is pending
- **THEN** the app requests permission for that stored folder and no picker is shown

#### Scenario: Re-picking an opened folder does not duplicate it
- **WHEN** the user picks a folder that is already listed
- **THEN** no duplicate entry appears and the existing entry becomes active

#### Scenario: No entries render while stored folders resolve
- **WHEN** the app is resolving stored folders at startup
- **THEN** the rail renders no folder entries