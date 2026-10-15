# Spec Delta

## ADDED Requirements

### Requirement: Search recognizes operators in the query

Search SHALL recognize five operator tokens: `page:`, `journal:`, `board:`,
`assets:`, and `title:`. An operator SHALL be any whitespace-separated token
that begins with an operator word followed by a colon, compared
case-insensitively. Text after the colon SHALL be an ordinary search term, and
the operator itself SHALL NOT be matched as a term. At most one operator SHALL
apply: the first operator token wins, and any later operator token SHALL be
ignored, not matched.

#### Scenario: An operator shapes the query without being searched

- **WHEN** the user searches for `board:meeting`
- **THEN** the Boards group is promoted, and `meeting` is the term that must
  match

#### Scenario: A bare operator adds no term

- **WHEN** the user searches for `board: notes`
- **THEN** the Boards group is promoted, and only `notes` is matched

#### Scenario: An operator is case-insensitive

- **WHEN** the user searches for `Board: notes`
- **THEN** it behaves exactly as `board: notes`

#### Scenario: The first operator wins

- **WHEN** the user searches for `board: assets: notes`
- **THEN** the Boards group is promoted, `assets:` is ignored, and only `notes`
  is matched

#### Scenario: An operator alone matches nothing

- **WHEN** the user searches for `board:` with no other term
- **THEN** no result is shown, because the operator is not a term

### Requirement: An operator promotes its kind

`page:`, `journal:`, `board:`, and `assets:` SHALL promote their kind. The
promoted kind's group SHALL lead both the dropdown and the results view, above
the other three groups, which keep their default relative order. Promotion SHALL
reorder only and SHALL NOT hide any result.

#### Scenario: Boards are promoted

- **WHEN** the user searches for `board: notes` and pages and boards both match
- **THEN** the Boards group leads the results, and the matching pages still
  appear below it

#### Scenario: Files are promoted

- **WHEN** the user searches for `assets: notes` and pages and files both match
- **THEN** the Files group leads the results, and the matching pages still
  appear below it

#### Scenario: Pages and journal days are promoted

- **WHEN** the user searches for `page: notes` or `journal: notes`
- **THEN** the Pages or Journal group leads the results, respectively

#### Scenario: Promotion holds in the results view

- **WHEN** the user opens the results view while an operator is active
- **THEN** the promoted group leads there too

### Requirement: The title operator promotes name matches

`title:` SHALL promote results whose match is in a title or name rather than in
content. The dropdown and the results view SHALL show a Names section first,
holding every page, journal day, board, and file whose match is in its title or
name, followed by the usual kind groups for the remaining content-only matches.

#### Scenario: Name matches lead

- **GIVEN** one note whose title holds the term and one whose body holds it
- **WHEN** the user searches for `title: term`
- **THEN** the title match appears in a Names section above the content match

#### Scenario: Content matches keep their groups below

- **WHEN** the user searches for `title: term` and pages and boards match by
  content
- **THEN** their groups follow the Names section in the usual order

#### Scenario: No name match means no Names section

- **WHEN** the user searches for `title: term` and only content matches exist
- **THEN** no Names section is shown, and the usual groups appear

#### Scenario: A board or file name is a name match

- **WHEN** the user searches for `title: term` and a board or file's name holds
  the term
- **THEN** that board or file appears in the Names section

### Requirement: An empty query offers the search operators

When the query is empty and a folder is open, the spotlight SHALL deploy a list
of the five search operators instead of no dropdown. Each row SHALL show an
icon, a label, and a one-line description. Choosing a row SHALL insert its token
followed by a space into the input, keep the caret after it, and keep the input
focused so the user can finish the query. The arrow keys SHALL move the active
row, and Enter SHALL choose the active row.

#### Scenario: An empty query lists the operators

- **WHEN** the user opens the spotlight with an empty query and a folder open
- **THEN** the dropdown lists the five operators, each with an icon, a label, and
  a description

#### Scenario: Choosing a row inserts its token

- **WHEN** the user chooses the `board:` row
- **THEN** the input holds `board: ` with the caret after the space, and the
  input keeps focus

#### Scenario: The operator list responds to the keyboard

- **WHEN** the operator list is shown and the user presses the arrow keys and
  Enter
- **THEN** the active row moves and Enter chooses it

## MODIFIED Requirements

### Requirement: Search opens a spotlight and deploys its results

Search SHALL be a modal spotlight, separate from the workspace layout, opened by
`Ctrl/Cmd+P`, by `Ctrl/Cmd+K`, or by the folder rail's search trigger, with its
search input focused and its text selected. Typing a query with a folder open
SHALL deploy a results dropdown below the input whenever the query matches at
least one result. A query of three or more characters that matches nothing
SHALL deploy the dropdown with an empty state; an empty query SHALL deploy the
dropdown holding the operator list; a query shorter than three characters that
matches nothing SHALL deploy nothing. Clicking outside the spotlight SHALL
close it while keeping the query, and reopening it SHALL re-deploy the same
results, so the query survives a close until cleared. Opening or closing the
spotlight SHALL change nothing: no vault file, no open page, no history entry,
no active marking.

#### Scenario: Typing deploys the dropdown

- **WHEN** the user types a query that matches at least one result, with a folder
  open
- **THEN** a results dropdown appears below the input

#### Scenario: Short queries deploy nothing

- **WHEN** the query is shorter than three characters and matches nothing
- **THEN** no dropdown is shown

#### Scenario: An empty query lists the operators

- **WHEN** the user opens the spotlight with an empty query and a folder open
- **THEN** the dropdown appears holding the five operators

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

### Requirement: Results are grouped, labelled, and show match snippets

The dropdown SHALL render results in four groups — Pages, Journal, Boards, and
Files — each under its own header, in that order, unless an active search
operator sets a different order as its requirement states. Each row SHALL show a
label: a page's title, a journal day's readable date, a board's name, or a
file's name. A page or journal row SHALL show a snippet for every place the
query occurs, not only the first, with the matched text highlighted: nearby
occurrences SHALL share one snippet, each snippet SHALL carry a line of context
on each side, and far-apart occurrences SHALL be separate snippets, divided from
each other. The dropdown SHALL show at most two snippets per row, noting any
remainder as how many more places the page holds, and SHALL NOT clamp a snippet
in a way that can hide an occurrence it covers. A title-only match SHALL show
the page's opening lines. A board row and a file row SHALL show no snippet.
Results SHALL be capped per group, with a see-all row offering the full set.

#### Scenario: Results are grouped by kind

- **WHEN** a query matches pages, journal days, boards, and files
- **THEN** each appears under its own header, in Pages, Journal, Boards, Files
  order

#### Scenario: A promoted group leads

- **WHEN** a search operator promotes a kind
- **THEN** that kind's group leads, and the other groups keep their default
  order below it

#### Scenario: Journal days are labelled with their date

- **WHEN** a journal day matches
- **THEN** its row shows the readable date, not a raw file name

#### Scenario: A file row carries no snippet

- **WHEN** a file matches
- **THEN** its row shows its name and no snippet

#### Scenario: Snippets highlight every occurrence

- **GIVEN** a page whose content contains the query in three places
- **WHEN** the page appears
- **THEN** its row shows a snippet for each place, with the matched text
  highlighted, in order

#### Scenario: Nearby occurrences share one snippet

- **GIVEN** a page whose content contains the query on two adjacent lines
- **WHEN** the page appears
- **THEN** one snippet covers both, rather than two snippets repeating the text

#### Scenario: A row past the snippet cap notes the remainder

- **GIVEN** a page whose content contains the query in five far-apart places
- **WHEN** the page appears
- **THEN** its row shows two snippets and a note counting the places not shown

#### Scenario: A single occurrence shows one snippet

- **WHEN** a page's content contains the query exactly once
- **THEN** its row shows that one snippet and no remainder note
