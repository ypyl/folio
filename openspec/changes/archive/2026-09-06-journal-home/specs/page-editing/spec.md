## ADDED Requirements

### Requirement: Empty pages show a placeholder inviting typing
An open page whose content is empty SHALL show a short placeholder hint in the editor pane at the start of the document, inviting the user to type. The hint SHALL NOT appear while the page has any content, SHALL return when the user deletes all content, SHALL NOT be selectable as text, and SHALL NOT be part of the page's content: it never appears in the document's Markdown and is never written to the file.

#### Scenario: A blank page invites typing
- **WHEN** an open page has no content
- **THEN** the editor pane shows a placeholder hint at the document start, and the page's content — and the file once saved — contain no placeholder text

#### Scenario: Typing hides the placeholder
- **WHEN** the user types into an empty page
- **THEN** the placeholder disappears and stays hidden while the page has content

#### Scenario: Emptying the page brings the placeholder back
- **WHEN** the user deletes all content from a page that had content
- **THEN** the placeholder hint shows again at the document start