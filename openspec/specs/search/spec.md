# Search

## Purpose

Full-text search over the open vault: open the spotlight with a keyboard
shortcut or the folder rail's search trigger, type a query, get grouped matches
across pages, journal days, boards, and files, and open one with a click or the
keyboard.

## Requirements

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

### Requirement: Search matches titles, content, and names

Search SHALL match every page and journal day of the open vault by title and by
content, with title matches ranked above content matches, and SHALL match the
vault's boards and files by their names. A board's drawing and a file's contents
SHALL NOT be read or matched. A query SHALL be split into terms, and a result
SHALL be returned only when every term matches it. A term SHALL be compared
case-insensitively unless the match-case toggle is on, in which case it SHALL be
compared in the exact case the user typed. A term of three or more characters
SHALL match literally or fuzzily. A term shorter than three characters SHALL
match only as a whole word and SHALL NOT match inside a longer word. Within a
kind, results SHALL be ordered exact matches before fuzzy ones: first a title
that contains every term literally, then a body that contains every term
literally, then a title matched only fuzzily, then a body matched only fuzzily;
within a tier, better matches lead, with the name breaking a tie. Pages that do
not exist yet SHALL NOT be searchable.

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

#### Scenario: A case-sensitive term ranks by the same tiers

- **GIVEN** one result whose title holds the term in its exact case and one whose
  body holds it in its exact case
- **WHEN** the user searches for the term with the match-case toggle on
- **THEN** the title match ranks first, exactly as it does with the toggle off

#### Scenario: Matching folds case by default

- **GIVEN** a page holding `Docker`
- **WHEN** the user searches for `docker` with the match-case toggle off
- **THEN** that page appears

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

### Requirement: A match-case toggle restricts search to the typed case

The spotlight SHALL offer a match-case toggle, a labelled pressing control
beside the search field that reports its own pressed state, and it SHALL be off
by default. With it on, every term SHALL be compared in the exact case it was
typed: a literal match, a whole-word match for a short term, and the fuzzy
fallback for a typo SHALL each require the same case, and a result SHALL carry a
highlight only for an occurrence in that case. Both search surfaces SHALL show
the case-sensitive match set.

#### Scenario: The toggle is off by default

- **WHEN** the user opens the spotlight
- **THEN** the toggle is unpressed, and a case-insensitive query finds a page
  whose spelling differs only in case

#### Scenario: Case-sensitive search skips a case variant

- **GIVEN** one page holding `Docker` and one holding `docker`
- **WHEN** the user searches for `docker` with the toggle on
- **THEN** only the page holding `docker` appears

#### Scenario: A short term is case-sensitive

- **GIVEN** one page titled `UX` and one holding `ux`
- **WHEN** the user searches for `UX` with the toggle on
- **THEN** only the page titled `UX` appears

#### Scenario: A typo in the wrong case does not match

- **GIVEN** a page holding `docker` and no other spelling
- **WHEN** the user searches for `Dockr` with the toggle on
- **THEN** no result is shown

#### Scenario: Highlights follow the case rule

- **GIVEN** a page holding `Docker` on one line and `docker` on another
- **WHEN** the user searches for `docker` with the toggle on
- **THEN** the row's snippet highlights only the lowercase occurrence

#### Scenario: The results view shows the case-sensitive set

- **GIVEN** the toggle is on and a query has matches
- **WHEN** the user opens the results view
- **THEN** it lists exactly the matches that query produced

#### Scenario: Operators still apply

- **WHEN** the user searches for `board: Foo` with the toggle on
- **THEN** the Boards group is promoted and only board names holding `Foo` in
  that case match

### Requirement: The toggle re-runs the query and lasts as long as it

Pressing the toggle SHALL run the current query again at once, without the user
retyping it, and both the dropdown and the results view SHALL show the new match
set. The toggle SHALL be kept when the spotlight is closed with a query, and
SHALL be reset to off when the query is cleared. Pressing it SHALL change
nothing else: no vault file, no open page, no history entry, and no active
marking.

#### Scenario: Pressing the toggle re-runs the query

- **WHEN** the user has a query with results and presses the toggle
- **THEN** the results are recomputed for the same query with the new case rule,
  the input keeps its text and its focus, and nothing needs retyping

#### Scenario: The toggle survives a close with the query

- **WHEN** the user has a query with the toggle on and closes the spotlight
- **THEN** reopening it keeps the query and keeps the toggle on, with the same
  results

#### Scenario: Clearing the query resets the toggle

- **WHEN** the user clears the query, by the clear button or by Escape
- **THEN** the toggle returns to off

#### Scenario: A press changes nothing but the matches

- **GIVEN** a page is open with unsaved edits
- **WHEN** the user presses the toggle
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

### Requirement: A see-all row offers the full results view

The dropdown SHALL show a pinned row offering the search results view whenever
the query has at least one match. Activating it SHALL open that view for the
query, and it SHALL remain available after a result has been opened, so the user
can return to the results without retyping.

#### Scenario: See-all is offered when a query matches

- **WHEN** the user runs a query with matches
- **THEN** the dropdown shows a row stating the total match count and offering
  the results view

#### Scenario: See-all returns to the results

- **WHEN** the user opened a result, then activates the see-all row again
- **THEN** the results view reopens for the same query

### Requirement: Selecting a result opens it

Choosing a page or journal-day result, or pressing Enter on the active row,
SHALL open that page exactly as choosing it in the sidebar would, and SHALL
close the dropdown while keeping the query. When the result's match falls in a
block of the page, opening SHALL scroll that block into view and frame it,
together with every other block of the page that holds a match; a result with no
text match SHALL open without a mark. A journal day with no note SHALL open
blank and create nothing until the first save. Choosing a board result SHALL
open the board. Choosing a file result SHALL open the file instead of
navigating.

#### Scenario: Choosing a result opens its page

- **WHEN** the user chooses a page result
- **THEN** the editor pane shows that page and the dropdown closes

#### Scenario: A page result opens at its match

- **GIVEN** a page whose match falls below its opening lines
- **WHEN** the user opens that result
- **THEN** the page opens with the matching block scrolled into view and framed

#### Scenario: A title-only match opens unmarked

- **WHEN** the user opens a result whose match is only in the title
- **THEN** the page opens at the top with no marked block

#### Scenario: Opening keeps the query

- **WHEN** the user opens a page from the results
- **THEN** the dropdown closes and the query remains

#### Scenario: A journal day with no note opens blank

- **WHEN** the user chooses a journal-day result with no note
- **THEN** a blank page opens and the file is created only on first save

#### Scenario: A board result opens the board

- **WHEN** the user chooses a board result
- **THEN** the board opens, the dropdown closes, and the query remains

#### Scenario: A file result opens the file

- **WHEN** the user chooses a file result
- **THEN** the file opens, the spotlight closes, the query remains, and the same
  page stays open behind it

### Requirement: The results view shows the full match set

The search results view SHALL display the complete match set for the query
without per-group caps: every matching page, journal day, board, and file, in
the same order and grouping as the dropdown, with the same labels and, for pages
and journal days, the same per-place snippets. It SHALL show at most five
snippets per row and note any remainder, because it is the survey surface. The
view SHALL be transient: opening, browsing, and closing it SHALL create, modify,
and remove no vault file, and closing it SHALL return to the previously open
page.

#### Scenario: The view lists all matches

- **WHEN** a query matches more than the dropdown shows
- **THEN** the results view lists every match, uncapped, in group order

#### Scenario: The view shows more places per row

- **GIVEN** a page whose content contains the query in four far-apart places
- **WHEN** the page's row appears in the results view
- **THEN** it shows all four snippets, where the dropdown row would show two and
  a remainder note

#### Scenario: Opening a result behaves like the dropdown

- **WHEN** the user opens a result from the results view
- **THEN** the editor pane shows that page, the view closes, and the spotlight
  keeps the query

#### Scenario: The view is transient

- **WHEN** the user leaves the results view
- **THEN** no vault file is created, modified, or removed, and the previously
  open page is shown again

### Requirement: The results view paginates and responds to the keyboard

The results view SHALL paginate its list when it exceeds the page size, showing
at most one page at a time with controls to move to the previous and next pages,
the total match count, and which portion is shown. Moving to another page SHALL
reset the view's scroll to the top. Arrow keys SHALL move the active row through
the current page, Enter SHALL open it, and Escape SHALL close the view and
return to the previously open page. Editing the query SHALL update both surfaces
from the same search: the dropdown shows the top matches and the view shows the
full set; a query with no matches SHALL close the view.

#### Scenario: Matches beyond one page are reachable

- **WHEN** the match set exceeds the page size and the user advances a page
- **THEN** the next slice is shown, the displayed range updates, and the view
  scrolls to the top

#### Scenario: A short match set has no pager

- **WHEN** the match set fits one page
- **THEN** the view shows the full list with no pagination controls

#### Scenario: Arrows and Enter navigate the view

- **WHEN** the view is open and the user presses the arrow keys and Enter
- **THEN** the active row moves and Enter opens it

#### Scenario: Escape closes the view

- **WHEN** the view is open and the user presses Escape
- **THEN** the view closes and the previously open page is shown

#### Scenario: A query with no matches closes the view

- **WHEN** the user edits the query to one with no matches
- **THEN** the view closes, the previous page is shown, and the dropdown shows
  its empty state

### Requirement: Search responds to the keyboard

`Ctrl/Cmd+P` and `Ctrl/Cmd+K` SHALL open the spotlight with its input focused
and selected; the arrow keys SHALL move the active row, with hovering a row
moving the active row to it; Enter SHALL open the active row; Escape SHALL clear
the query and close the spotlight.

#### Scenario: Arrows move the active row

- **WHEN** the dropdown is open and the user presses the arrow keys
- **THEN** the active row moves, and hovering a row moves the active row to it

#### Scenario: Enter opens the active row

- **WHEN** the user presses Enter with a row active
- **THEN** that row opens in the editor pane

#### Scenario: Escape clears the search

- **WHEN** the user presses Escape in the spotlight
- **THEN** the query is cleared and the spotlight closes

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
