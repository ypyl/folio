## REMOVED Requirements

### Requirement: Presenting the open page renders it as a full-viewport deck

**Reason**: Presenting is entered from a page row's context menu instead of an editor control, and now targets the page the row names — which may not be open yet. A journal day and a page with no file on disk have no row, so they can no longer be presented.

**Migration**: To present a page, open its row's context menu in the Files listing and choose Present. The app opens that page first and derives the deck from the live document once it is ready, so unsaved draft edits still present. The editor pane's Present control is gone.

## MODIFIED Requirements

### Requirement: A presentation is entered and left explicitly and changes nothing

A presentation SHALL open only through an explicit user gesture on a page row, and SHALL close on `Escape` and through an on-screen close control. Closing SHALL return to the editor with the presented page open, its content unchanged, and no presentation state written to the vault or elsewhere. For as long as the presentation is open, the app SHALL write nothing to the vault, and the presented page's Markdown and file SHALL be unchanged. Presenting a page that is not already open SHALL open it first, with the same effect as selecting that page's row — including whatever page-history entry a selection makes. Presenting the page that is already open SHALL NOT navigate and SHALL NOT add a page-history entry. Closing a presentation SHALL NOT add a page-history entry of its own.

#### Scenario: Escape returns to the editor unchanged

- **GIVEN** a page being presented
- **WHEN** the user presses `Escape`
- **THEN** the workspace returns with the presented page open and its content and file unchanged

#### Scenario: Closing writes nothing

- **GIVEN** a page being presented
- **WHEN** the user closes the presentation
- **THEN** no vault file changed and no presentation state was stored

#### Scenario: The open page does not change

- **GIVEN** the open page being presented
- **WHEN** the presentation closes
- **THEN** the same page is still open, and the history trail has gained no entry

#### Scenario: Presenting a non-open page opens it

- **GIVEN** a page row that is not the open page
- **WHEN** the user presents it
- **THEN** that page opens as selecting its row would (including its page-history entry) and the deck is shown

## ADDED Requirements

### Requirement: Presenting a page renders it as a full-viewport deck

Presenting SHALL render the presented page as a slide deck that occupies the whole workspace, replacing the folder rail, sidebar, editor pane, and meta panel for as long as the presentation is open, and showing exactly one slide at a time. Presenting SHALL be entered from a page row's context menu (row-context-menu capability) and SHALL be available only for a file-backed page row: a journal day has no row, and a page with no file on disk has no row, so neither can be presented. When the presented page is the open page, the content as it currently stands in the editor SHALL be the source of slides, including edits not yet saved to the file. When the presented page is not the open page, the app SHALL open it first and derive the deck from the live document once that document is ready, so its draft's unsaved edits present there too. Presenting SHALL NOT read or write any vault file.

#### Scenario: A page row presents

- **GIVEN** a vault with a page row in the Files listing
- **WHEN** the user activates Present on that row
- **THEN** the workspace is replaced by a full-viewport deck showing that page's first slide

#### Scenario: The open page presents without navigating

- **GIVEN** a page open in the editor
- **WHEN** the user activates Present on that page's row
- **THEN** the deck shows the page's content and remains on that page

#### Scenario: A non-open page opens first

- **GIVEN** a page row that is not the open page
- **WHEN** the user activates Present on that row
- **THEN** that page opens in the editor and the deck shows its first slide

#### Scenario: Unsaved edits are what present

- **GIVEN** an open page with edits that have not been saved
- **WHEN** the user presents that page
- **THEN** the deck shows the edited content, and the page's file remains as it was

#### Scenario: A journal day cannot be presented

- **GIVEN** a journal day open in the editor
- **WHEN** the user looks for a way to present it
- **THEN** there is no page row for the day and so no present affordance

#### Scenario: A page with no file cannot be presented

- **GIVEN** a page open in the editor that has no file on disk
- **WHEN** the user looks for a way to present it
- **THEN** there is no page row for it and so no present affordance
