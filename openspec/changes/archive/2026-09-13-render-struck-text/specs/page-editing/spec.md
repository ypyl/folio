## ADDED Requirements

### Requirement: Struck text renders crossed
When a page's text contains a struck run — two tildes, then at least one character with no tilde and no leading or trailing space, then two tildes — the editor SHALL display it with a line through it, in every block a page can hold. Where runs share text, the pair that closes first wins, so `~~a~~b~~` strikes `a` and leaves the tail alone. The run SHALL be a presentational decoration over the literal text: the document, the saved Markdown, the clipboard, and the index SHALL keep the tildes exactly as the user wrote them, and no formatting mark SHALL be created, so nothing toggles a struck run and it behaves as ordinary text for editing, copying, and saving. Text inside inline code or a fenced code block SHALL NOT be decorated, and neither SHALL a lone tilde, an empty pair, a pair whose content starts or ends with a space, or a run containing a tilde inside it. The decoration SHALL be derived from the text in the same pass as the editor's reference badges, so it adds no work proportional to the document on a keystroke.

#### Scenario: A struck run shows a line, and the file keeps its tildes
- **GIVEN** an open page containing `~~Responsible AI, Safety & Risk for Architects~~`
- **WHEN** the page renders
- **THEN** the run is shown with a line through it, and the page's Markdown still reads `~~Responsible AI, Safety & Risk for Architects~~` after the page saves

#### Scenario: A run survives save and reopen as literal text
- **GIVEN** a page whose saved Markdown contains a struck run
- **WHEN** the page is closed and opened again
- **THEN** the run is still decorated with its tildes intact, with no formatting mark added to the document

#### Scenario: Near misses stay plain
- **GIVEN** a page containing a lone `~`, an empty `~~~~` pair, a pair padded as `~~ spaced ~~` and as `~~ ~~`, and a run with a tilde inside as `~~a b ~c~~`
- **WHEN** the page renders
- **THEN** none of them is decorated and all keep their characters

#### Scenario: Code is not struck
- **GIVEN** a page containing `~~text~~` inside inline code and inside a fenced code block
- **WHEN** the page renders
- **THEN** neither run is decorated, and both keep their characters verbatim

#### Scenario: A struck reference shows both decorations
- **GIVEN** a page containing `~~#Inbox~~`
- **WHEN** the page renders
- **THEN** the reference is still shown as a badge and the run is still shown crossed, and clicking the badge still opens the referenced page

#### Scenario: Editing elsewhere in the page does not disturb it
- **GIVEN** a page with a struck run, and the caret in another block
- **WHEN** the user types
- **THEN** the struck run keeps its decoration, and the editor rescan is limited to the block the edit touched
