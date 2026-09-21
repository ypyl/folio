## MODIFIED Requirements

### Requirement: A scroll region reserves its scrollbar's gutter
Every scroll region the app owns SHALL reserve the width its scrollbar occupies whether or not the region is currently overflowing, so that a region's content keeps the same width before and after it begins to overflow and does not reflow when a scrollbar appears or disappears. The reserved width SHALL be the width the platform's own scrollbar would occupy, and the reservation SHALL be made for the region's vertical axis only.

The regions this applies to SHALL be the editor pane, the sidebar pane and its Pages and Assets bodies, the meta panel and its Backlinks, Forwardlinks, and References bodies, and the search results list.

Every such region's bar SHALL be the app's own thumb, drawn in the lane the region reserves: thin, rounded, inset in the lane, painted in the app's muted ink, invisible while the pointer is outside the region and revealed while the pointer is over it. The thumb SHALL NOT cover any of the region's content, SHALL NOT be revealed by anything other than the region's own hover, SHALL NOT fade or slide in or out, and SHALL NOT change the lane's width.

On a platform that ignores the app's scrollbar styling and draws its own bar floating over the content, the platform's bar SHALL remain and no lane SHALL be reserved, so the app SHALL NOT introduce a dead strip next to the content on such a platform.

A region whose content is sized to its own fixed extent SHALL NOT reserve a gutter and SHALL NOT carry the app's thumb, because both the reservation and the thumb would shrink the content it was sized for: the folder rail, whose controls are a fixed size in a fixed-width column, and an overlay popup such as a code block's language list, whose width is content-sized. Such a region keeps whatever bar the platform gives it.

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

#### Scenario: The bar is the app's own thumb in the reserved lane
- **GIVEN** a region that overflows its lane's height
- **WHEN** the pointer is outside the region
- **THEN** no bar is visible and the region's content keeps the width it has with the lane reserved
- **WHEN** the pointer is over the region
- **THEN** the app's thumb is shown inside the reserved lane, over none of the region's content, and the content's width is unchanged by its appearance

#### Scenario: The scrollbar stays the platform's own
- **GIVEN** a platform that ignores the app's scrollbar styling and draws its own bar
- **WHEN** a region of the app overflows
- **THEN** the platform's bar is the one that scrolls it, not restyled, not replaced by an element the app renders over the content

#### Scenario: No dead strip where scrollbars already float
- **GIVEN** a platform that draws scrollbars over the content rather than in a gutter
- **WHEN** a region of the app overflows
- **THEN** the region's content keeps its full width and no gutter is reserved beside it

#### Scenario: The folder rail keeps its control size
- **GIVEN** more open folders than the rail can show, so that the rail scrolls
- **THEN** the rail's avatars keep their full size and are not clipped, because the rail reserves no gutter and carries no app thumb

#### Scenario: An overlay popup keeps its content-sized width
- **GIVEN** a code block whose language list is open
- **WHEN** the list is long enough to scroll
- **THEN** the popup's width is unchanged by the scrolling, because it reserves no gutter and carries no app thumb
