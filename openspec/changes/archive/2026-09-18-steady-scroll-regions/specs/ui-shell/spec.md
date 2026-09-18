## ADDED Requirements

### Requirement: A scroll region reserves its scrollbar's gutter
Every scroll region the app owns SHALL reserve the width its scrollbar occupies whether or not the region is currently overflowing, so that a region's content keeps the same width before and after it begins to overflow and does not reflow when a scrollbar appears or disappears. The reserved width SHALL be the platform's own scrollbar width, and the reservation SHALL be made for the region's vertical axis only.

The regions this applies to SHALL be the editor pane, the sidebar pane and its Pages and Assets bodies, the meta panel and its Backlinks, Forwardlinks, and References bodies, and the search results list.

No scrollbar's appearance SHALL change: every bar SHALL remain the platform's native one, with its own colour, thickness, and transparency, and the app SHALL NOT draw a scrollbar of its own, place one over a region's content, or hide one.

Where the platform draws scrollbars over the content rather than in a gutter, no width SHALL be reserved, so the app SHALL NOT introduce a dead strip next to the content on such a platform.

A region whose content is sized to its own fixed extent SHALL NOT reserve a gutter, because the reservation would shrink the content it was sized for: the folder rail, whose controls are a fixed size in a fixed-width column, and an overlay popup such as a code block's language list, whose width is content-sized.

#### Scenario: A page growing past the pane does not move its text
- **GIVEN** an open page whose content is shorter than the editor pane
- **WHEN** the content grows past the pane's height so that a scrollbar appears
- **THEN** the document keeps the width it had before, its text does not reflow, and only the scrolling changes

#### Scenario: The reservation is present before anything overflows
- **GIVEN** an open page whose content fits the pane, and a region whose content fits its band
- **WHEN** each is inspected while it has nothing to scroll
- **THEN** each already holds the space its scrollbar would occupy, so adding content to either one cannot move the other content in that region

#### Scenario: A listing crossing its band's height does not shift
- **GIVEN** the sidebar's Pages body holding fewer rows than its band can show
- **WHEN** more pages arrive and the body begins to scroll
- **THEN** the rows keep their width and position, and no other band's height changes

#### Scenario: The scrollbar stays the platform's own
- **WHEN** any region of the app is scrolling
- **THEN** its scrollbar is the one the platform draws — not restyled, not hidden, and not replaced by an element the app renders over the content

#### Scenario: No dead strip where scrollbars already float
- **GIVEN** a platform that draws scrollbars over the content rather than in a gutter
- **WHEN** a region of the app overflows
- **THEN** the region's content keeps its full width and no gutter is reserved beside it

#### Scenario: The folder rail keeps its control size
- **GIVEN** more open folders than the rail can show, so that the rail scrolls
- **THEN** the rail's avatars keep their full size and are not clipped, because the rail reserves no gutter

#### Scenario: An overlay popup keeps its content-sized width
- **GIVEN** a code block whose language list is open
- **WHEN** the list is long enough to scroll
- **THEN** the popup's width is unchanged by the scrolling, because it reserves no gutter
