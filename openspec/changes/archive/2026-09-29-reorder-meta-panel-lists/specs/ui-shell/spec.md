## MODIFIED Requirements

### Requirement: Meta panel is an accordion of page metadata

The right meta panel SHALL contain the collapsible page sections Contents, Backlinks, and Forwardlinks, followed by the keyboard-shortcuts reference (the last-section requirement). Each section SHALL show placeholder copy while no page is open and no board is open; while a board is open it SHALL show the board's Referenced by section instead of the page sections (whiteboards capability). All page sections SHALL open and close independently. The Backlinks and Forwardlinks sections SHALL share the panel's remaining height, each body scrolling within itself when its rows do not fit, and each SHALL keep a minimum height so a short window cannot collapse it to nothing; the Contents section SHALL instead size to its content up to a maximum height, scrolling within itself when its list is longer, so it never claims more height than it needs. The panel itself SHALL scroll only as a fallback, when even the link sections' floors do not fit. Every section summary SHALL be rendered in every app state, and a collapsed section SHALL occupy exactly its summary row.

When a page is open, each section SHALL list its rows instead of placeholder copy. Contents lists the page's headings (page-contents capability), each labelled with the heading's text and indented by level. Backlinks lists every page that references the open page, most recently edited first, with the path ascending as the tiebreak when two referrers share a last-edited time. Forwardlinks lists the page's outgoing references in two labelled groups — Pages, holding the page references the open page makes, and Files, holding the assets and boards it references (vault-assets and whiteboards capabilities) — each in document order: the order the references appear in the open page's content, which for the Files group means the assets in their own document order and then the boards in theirs. A section or group with no rows SHALL show empty-state copy. Contents and Backlinks SHALL be open by default; Forwardlinks SHALL be collapsed by default. Rows SHALL use the sidebar's row styling and `aria-current` marking for the open page; page rows that target a page with no file on disk SHALL be visually dimmed to signal the page is not yet created, and remain clickable. Asset rows SHALL NOT be dimmed, because a row exists only for a file the vault holds. Clicking a page row navigates, and clicking an asset or board row opens the file or board it names (static-navigation and vault-assets requirements).

#### Scenario: Meta sections are independently collapsible

- **WHEN** the user collapses Backlinks while Forwardlinks is open
- **THEN** Backlinks collapses and Forwardlinks remains open

#### Scenario: Backlinks list the open page's referrers

- **GIVEN** `Topic.md` is open and referenced by `Ideas.md` and `Log.md`, and `Log.md` was edited more recently than `Ideas.md`
- **WHEN** the user looks at the Backlinks section
- **THEN** the section lists the `Log` row above the `Ideas` row, most recently edited first

#### Scenario: Forwardlinks list the open page's targets

- **GIVEN** an open page whose content references `Roadmap` and the journal day `2026-09-06`, in that order
- **WHEN** the user looks at the Forwardlinks section
- **THEN** its Pages group lists the `Roadmap` row above the `2026-09-06` row, in the order the references appear, whether or not each target's file exists

#### Scenario: Forwardlinks sort page and asset rows together

- **GIVEN** an open page whose content references `Roadmap` and `assets/q3-report.pdf`
- **WHEN** the user looks at the panel
- **THEN** Forwardlinks lists the `Roadmap` row in its Pages group and the `q3-report.pdf` row in its Files group, each group keeping the order its references appear in the page

#### Scenario: References lists the open page's files

- **GIVEN** an open page whose content embeds `assets/shot.png` and links `assets/q3-report.pdf`
- **WHEN** the user looks at the Forwardlinks section
- **THEN** its Files group lists the `shot.png` row above the `q3-report.pdf` row, in the order the references appear, and its Pages group holds no asset row

#### Scenario: References is collapsed by default

- **WHEN** the shell renders with a page open
- **THEN** the Forwardlinks section shows only its summary row, and Contents and Backlinks are open

#### Scenario: Empty sections show copy instead of rows

- **GIVEN** an open page that no page references
- **WHEN** the user looks at the Backlinks section
- **THEN** the section shows empty-state copy ("Nothing links here yet."), not placeholder copy and no rows

#### Scenario: An open page with no files shows copy in References

- **GIVEN** an open page that references pages but no vault files
- **WHEN** the user opens the Forwardlinks section
- **THEN** its Files group shows an empty-state message rather than rows

#### Scenario: Unmaterialized targets are dimmed but clickable

- **GIVEN** an open page whose content references `Missing`, and no `Missing.md` exists
- **WHEN** the user looks at the Forwardlinks section
- **THEN** the `Missing` row is rendered dimmed, still clickable, and still navigates

#### Scenario: An asset row is never dimmed

- **GIVEN** an open page whose Forwardlinks Files group lists `q3-report.pdf`
- **WHEN** the user looks at that row
- **THEN** it renders undimmed and opens the file when activated

#### Scenario: Placeholders persist only before a page opens

- **WHEN** no page is open and no board is open
- **THEN** all page sections show their placeholder copy

#### Scenario: A board replaces the page sections with Referenced by

- **GIVEN** a board is open
- **WHEN** the user looks at the meta panel
- **THEN** the panel shows the board's Referenced by section rather than the Contents, Backlinks, and Forwardlinks rows

#### Scenario: A long section scrolls inside itself

- **GIVEN** an open page with more backlinks than the panel can show
- **WHEN** the user scrolls the Backlinks listing to its end
- **THEN** only the Backlinks body scrolls, the panel itself does not scroll, and the Contents, Backlinks, and Forwardlinks summaries stay where they were

#### Scenario: The sections share the panel's height

- **WHEN** the user opens the Forwardlinks section
- **THEN** the Backlinks and Forwardlinks sections divide the panel's remaining height, each scrolling within its own body, and no listing is pushed out of reach

#### Scenario: A collapsed section is one row

- **WHEN** the user collapses Forwardlinks
- **THEN** Forwardlinks occupies exactly its summary row and the height it gave up goes to the sections that remain open

#### Scenario: A short window cannot collapse a listing

- **GIVEN** a window too short to fit the link sections at their minimum heights
- **WHEN** the panel lays out
- **THEN** each link section keeps its minimum height and the panel itself scrolls, rather than a section being clipped to nothing
