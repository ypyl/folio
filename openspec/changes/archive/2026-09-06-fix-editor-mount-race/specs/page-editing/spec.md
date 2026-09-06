## ADDED Requirements

### Requirement: The editor pane shows exactly one live editor per open page
Opening a page SHALL render exactly one editor surface seeded with that page's content (its draft if one exists, otherwise its indexed content). No empty, stale, or duplicate editor surfaces SHALL appear. Switching pages SHALL replace the current editor with the newly selected page's editor; the previous page's editor SHALL be fully torn down even when the switch happens while the previous editor is still initializing.

#### Scenario: Opening a page renders a single editor with its content
- **WHEN** a page is open in the editor pane
- **THEN** the pane contains exactly one editor surface, and it is seeded with that page's content

#### Scenario: A rapid page switch leaves no stale editor behind
- **WHEN** the user switches to another page while the previous page's editor is still initializing
- **THEN** the pane shows exactly one editor surface, seeded with the newly selected page's content, and no empty editor from the previous page remains