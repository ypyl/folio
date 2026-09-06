## ADDED Requirements

### Requirement: The pane uses compact top padding above the content
The pane's content column SHALL start near the pane's top edge: its top padding SHALL be half the side padding, so the editor surface is not pushed down by space once reserved for a title heading.

#### Scenario: An open page starts near the pane's top
- **WHEN** a page is open in the editor pane
- **THEN** the editable content begins at the compact top padding, and the side and bottom padding remain unchanged