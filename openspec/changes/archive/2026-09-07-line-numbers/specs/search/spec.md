## ADDED Requirements

### Requirement: Search results report the match's line

A search result row SHALL report the canonical block-anchored start line of the page's **first** text match, rendered as `· line N` beside the result's label, in both the header dropdown and the full search results view. A result whose match occurs only in the page title — no text match — SHALL show no line number. The reported number SHALL be computed with the same block-start rule the editor gutter uses, so a result's line exists in the gutter when the page opens.

#### Scenario: A text match shows its line

- **WHEN** the user searches for a term that appears in a page's content
- **THEN** the result row shows the page label followed by `· line N`, where N is the block-anchored start line of the first match

#### Scenario: A title-only match shows no line

- **WHEN** the user searches for a term that matches only a page's title
- **THEN** the result row shows the label without any line number

#### Scenario: Multiple matches report the first

- **WHEN** a page contains several matches across different blocks
- **THEN** the row reports the block-anchored line of the first match only

#### Scenario: The dropdown and results view agree

- **WHEN** the user moves from the header dropdown to the full results view on the same query
- **THEN** each row shows the same `· line N` for the same page