# Spec Delta

## MODIFIED Requirements

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

## ADDED Requirements

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
