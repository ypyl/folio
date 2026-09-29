## MODIFIED Requirements

### Requirement: Pins persist in a hidden vault meta file

Pin state SHALL persist inside the vault as an ordered list of page paths in a hidden meta file (`.folio/pins.md`), so pins survive reopening the vault, belong to that vault alone, and can be rebuilt by scanning the folder (ADR-0001). The meta file SHALL NOT appear as a page in the Files listing, in search results, or anywhere else in the app. The list's order SHALL be pin order with the most recently pinned page first. Editing the meta file in another tool SHALL reorder the pins accordingly, and the app SHALL pick up such a change on its normal refresh.

#### Scenario: Reopening the vault restores pins

- **GIVEN** the user pinned `Ideas.md` and `Vision.md`, with `Ideas.md` pinned most recently
- **WHEN** the folder is closed and reopened
- **THEN** both pages are still pinned and `Ideas.md` sits above `Vision.md` in the pinned ordering

#### Scenario: The pin file is invisible to the app as a page

- **GIVEN** a vault whose `.folio/pins.md` lists several pages
- **WHEN** the user opens the Files listing or searches
- **THEN** no "pins" page or entry appears, and the pin file itself is not listed or searchable

#### Scenario: An external edit to the pin file reorders pins

- **GIVEN** `.folio/pins.md` lists `a.md` then `b.md`
- **WHEN** another tool rewrites it to list `b.md` then `a.md` and a refresh occurs
- **THEN** the pinned rows show `b.md` first

#### Scenario: No pin file means nothing pinned and nothing created

- **WHEN** a vault has no `.folio/pins.md`
- **THEN** the Files list has no pinned rows and the app creates no file merely by rendering the sidebar
