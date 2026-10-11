# Spec Delta

## MODIFIED Requirements

### Requirement: Search opens a spotlight and deploys its results

Search SHALL be a modal spotlight, separate from the workspace layout, opened by
`Ctrl/Cmd+P`, by `Ctrl/Cmd+K`, or by the folder rail's search trigger, with its
search input focused and its text selected. Typing a query with a folder open
SHALL deploy a results dropdown below the input whenever the query matches at
least one result. A query of three or more characters that matches nothing
SHALL deploy the dropdown with an empty state; an empty query, and a query
shorter than three characters that matches nothing, SHALL deploy nothing.
Clicking outside the spotlight SHALL close it while keeping the query, and
reopening it SHALL re-deploy the same results, so the query survives a close
until cleared. Opening or closing the spotlight SHALL change nothing: no vault
file, no open page, no history entry, no active marking.

#### Scenario: Typing deploys the dropdown

- **WHEN** the user types a query that matches at least one result, with a folder
  open
- **THEN** a results dropdown appears below the input

#### Scenario: Short queries deploy nothing

- **WHEN** the query is empty, or is shorter than three characters and matches
  nothing
- **THEN** no dropdown is shown

#### Scenario: A short query deploys the dropdown

- **WHEN** the user types a query of one or two characters that matches at least
  one result, with a folder open
- **THEN** a results dropdown appears below the input

#### Scenario: An outside click closes but keeps the query

- **WHEN** the dropdown is open and the user clicks outside the spotlight
- **THEN** the spotlight closes and the query is kept, and reopening restores
  the same results

#### Scenario: The keyboard and the rail open the spotlight

- **WHEN** the user presses `Ctrl/Cmd+P` or `Ctrl/Cmd+K`, or activates the rail's
  search trigger, with a folder open
- **THEN** the spotlight opens with its input focused and its text selected

#### Scenario: Opening the spotlight changes nothing else

- **GIVEN** a page is open with unsaved edits
- **WHEN** the user opens and closes the spotlight without selecting a result
- **THEN** the open page, its content, the history trail, the active marking, and
  every vault file are unchanged

### Requirement: Search matches titles, content, and names

Search SHALL match every page and journal day of the open vault by title and by
content, with title matches ranked above content matches, and SHALL match the
vault's boards and files by their names. A board's drawing and a file's contents
SHALL NOT be read or matched. A query SHALL be split into terms, and a result
SHALL be returned only when every term matches it. A term of three or more
characters SHALL match literally or fuzzily. A term shorter than three
characters SHALL match only as a whole word, compared case-insensitively, and
SHALL NOT match inside a longer word. Within a kind, results SHALL be ordered
exact matches before fuzzy ones: first a title that contains every term
literally, then a body that contains every term literally, then a title matched
only fuzzily, then a body matched only fuzzily; within a tier, better matches
lead, with the name breaking a tie. Pages that do not exist yet SHALL NOT be
searchable.

#### Scenario: A title match leads

- **WHEN** the user searches for a term in a page's title
- **THEN** that page appears, ranked above content-only matches

#### Scenario: A content match surfaces the page

- **WHEN** the user searches for a term that appears only in a page's body
- **THEN** that page appears

#### Scenario: Every term must match

- **WHEN** the user searches a multi-term query
- **THEN** only results containing every term appear

#### Scenario: A short query finds the page it names

- **GIVEN** a page titled `UX`
- **WHEN** the user searches for `UX`
- **THEN** that page appears

#### Scenario: A short term matches a whole word in content

- **GIVEN** a page whose body holds the word `UX` and a page that does not
- **WHEN** the user searches for `UX`
- **THEN** only the page holding the word appears

#### Scenario: A short term never matches inside a longer word

- **GIVEN** a page whose body holds `Linux` and no standalone `ux`
- **WHEN** the user searches for `UX`
- **THEN** that page does not appear

#### Scenario: A short term still requires every term

- **GIVEN** a page holding the word `UX` and the term `design`, and a page
  holding only one of them
- **WHEN** the user searches for `UX design`
- **THEN** only the page holding both appears

#### Scenario: Exact matches outrank fuzzy ones

- **GIVEN** one result containing the term literally and one containing a typo
- **WHEN** the user searches for the term
- **THEN** the literal match ranks above the typo match

#### Scenario: A page that does not exist yet is not searchable

- **WHEN** the user searches for a name with no note
- **THEN** no result is shown for it

#### Scenario: A file is found by its name

- **WHEN** the user searches for part of a file's name
- **THEN** the file appears under the Files group

#### Scenario: A file's contents are never matched

- **GIVEN** a vault holding a file whose contents hold a word no name holds
- **WHEN** the user searches for that word
- **THEN** no result is shown, because a file's contents are not read

#### Scenario: A board is found by its name

- **WHEN** the user searches for part of a board's name
- **THEN** the board appears under the Boards group

#### Scenario: A board's contents are never matched

- **GIVEN** a vault holding a board whose drawing holds a word no name holds
- **WHEN** the user searches for that word
- **THEN** no result is shown for the board

### Requirement: Search is scoped to the active vault and shows an empty state

Search SHALL search only the open vault. Switching folders SHALL clear the query
and close the spotlight. With no folder open, or while the open folder is still
loading, the rail's search trigger SHALL be disabled and the spotlight SHALL NOT
open. A query of at least three characters that matches nothing SHALL show an
empty state naming the query as unmatched.

#### Scenario: A folder switch clears the search

- **WHEN** the user switches folders with a query present
- **THEN** the query is cleared and the spotlight closes

#### Scenario: No vault disables search

- **WHEN** no folder is open, or the open folder is still loading
- **THEN** the search trigger is disabled and the spotlight does not open

#### Scenario: No matches

- **WHEN** a query of three or more characters matches nothing
- **THEN** the dropdown shows an empty state naming the query
