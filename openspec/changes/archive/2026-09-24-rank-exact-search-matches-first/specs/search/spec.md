## MODIFIED Requirements

### Requirement: Search matches titles and content across the vault
Search SHALL match every indexed page and journal day of the open vault. A page SHALL match when its title matches the query, and SHALL match when its content matches the query, with title matches ranking above content matches (title weighted higher). Search SHALL also match the open vault's assets: every file under `assets/` SHALL match when its label — its path inside `assets/` — matches the query, and an asset's file contents SHALL NOT be read, indexed, or matched. Search SHALL also match the open vault's boards: every board under `boards/` SHALL match when its label — its path inside `boards/` — matches the query, and a board's contents SHALL NOT be read, indexed, or matched. The query SHALL be split into terms; a page, journal day, asset, or board SHALL be returned only when every term of at least 3 characters matches it (AND semantics). Within each kind group, results SHALL be ordered by match tier before overall relevance: first results whose every query term appears in the title as a literal, case-insensitive substring (exact title); then results whose every term appears literally in the body, but not all in the title (exact body); then results whose title matched only fuzzily (fuzzy title); then results whose body matched only fuzzily (fuzzy body). Within a tier, results SHALL be ordered by overall relevance (best match first). Unmaterialized pages — references to pages not yet created — SHALL NOT be searchable.

#### Scenario: A title query surfaces the page
- **WHEN** the user searches for a term that appears in a page's title
- **THEN** that page appears in the results, ranked above content-only matches

#### Scenario: A content query surfaces the page
- **WHEN** the user searches for a term that appears only in a page's body
- **THEN** that page appears in the results

#### Scenario: Every term must match
- **WHEN** the user searches a multi-term query
- **THEN** only pages containing every term appear; pages containing just one term are excluded

#### Scenario: Exact title matches lead
- **GIVEN** a page titled `Docker`, a page titled `Docker notes` whose body contains `docker`, and a page whose body contains `docker` but whose title is unrelated
- **WHEN** the user searches for `docker`
- **THEN** the two pages whose titles contain `docker` rank above the body-only page, and among those the exact-title order follows overall relevance

#### Scenario: An exact body match outranks a fuzzy title match
- **GIVEN** a page titled `Dockr` (fuzzy title match for `docker`) and a page whose body contains `docker` literally
- **WHEN** the user searches for `docker`
- **THEN** the exact-body page ranks above the fuzzy-title page

#### Scenario: Exact matches outrank fuzzy matches
- **GIVEN** a page whose body contains `docker` literally and a page whose body contains a typo of `docker`, neither title matching
- **WHEN** the user searches for `docker`
- **THEN** the literal match ranks above the typo match

#### Scenario: A fuzzy title match outranks a fuzzy body match
- **GIVEN** a page whose title contains a typo of `docker` and a page whose body contains a typo of `docker`, neither matching exactly
- **WHEN** the user searches for `docker`
- **THEN** the fuzzy-title page ranks above the fuzzy-body page

#### Scenario: Exact-first ordering applies inside each group
- **GIVEN** a journal day whose body contains `docker` literally and a page whose body matches `docker` only fuzzily
- **WHEN** the user searches for `docker`
- **THEN** the exact journal match leads the Journal group and the fuzzy page trails the Pages group, the groups keeping their own kind order

#### Scenario: Ties keep relevance order
- **GIVEN** two results in the same tier
- **WHEN** the user searches for a term they both match
- **THEN** they keep their overall relevance order, with the path breaking a remaining tie

#### Scenario: Unmaterialized pages are not searchable
- **WHEN** the user searches for a name that has no file on disk
- **THEN** no result is shown for it

#### Scenario: An asset is found by its name
- **GIVEN** a vault holding `assets/2026/q3-report.pdf`
- **WHEN** the user searches for `q3-report`
- **THEN** the file appears in the results under the Assets group

#### Scenario: An asset is found by its subfolder
- **GIVEN** a vault holding `assets/2026/q3-report.pdf`
- **WHEN** the user searches for `2026`
- **THEN** that file appears in the results

#### Scenario: An asset's contents are never matched
- **GIVEN** a vault holding `assets/report.pdf` whose bytes contain the word `revenue`, and no page or asset name containing `revenue`
- **WHEN** the user searches for `revenue`
- **THEN** no result is shown, because the app does not read a file's contents

#### Scenario: A file outside the assets folder is not searchable
- **GIVEN** a vault holding `pages/diagram.png`, which is not under `assets/`
- **WHEN** the user searches for `diagram`
- **THEN** no asset result is shown for it, matching the Assets section, which lists only files under `assets/`

#### Scenario: A board is found by its name
- **GIVEN** a vault holding `boards/migration.excalidraw`
- **WHEN** the user searches for `migration`
- **THEN** the board appears in the results under the Boards group

#### Scenario: A board's contents are never matched
- **GIVEN** a vault holding `boards/migration.excalidraw` whose scene contains the text `queue`, and no page or board name containing `queue`
- **WHEN** the user searches for `queue`
- **THEN** no result is shown for the board, because the app does not read a board's scene for search
