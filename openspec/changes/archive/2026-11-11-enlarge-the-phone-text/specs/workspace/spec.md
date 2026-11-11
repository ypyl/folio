# Spec Delta

## MODIFIED Requirements

### Requirement: Compact controls are touch-sized and clear the device's safe areas

At or below the compact breakpoint, every control the shell shows SHALL have a
target of at least 48 by 48 CSS pixels, and the shell's text SHALL follow the
compact scale: 18px body text, 17px list text, 15px secondary text, 16px
calendar days, 13px section labels, status text, and nav labels, and no text
below 12px. A navigation view's row SHALL keep at least 16 CSS pixels from the
shell's trailing edge, and a Files row SHALL be 56 CSS pixels tall. The rule
covers the compact navigation bar's destinations, the app bar's title, actions,
and status line, the Journal row's controls, the folder rail's controls and a
folder entry's close control, the accordion summaries, the calendar's month
controls and day cells, the Files listing's rows, the right panel's rows and its
Contents disclosure and expand/collapse controls, the brand screen's actions,
the search spotlight's controls and rows, the menus' items, and the presentation
view's controls. A target MAY be larger than the mark it draws; where a control's
drawn mark is smaller than the minimum, an invisible hit area SHALL make up the
difference. The calendar's seven-column grid is the one exception to the width:
its cells SHALL be 48 tall and as wide as the pane's column share, which SHALL
be at least 44. The compact navigation bar and the app bar SHALL pad themselves
with the device's safe-area insets, so no control sits under a notch, a rounded
corner, or the home indicator, and the shell SHALL size itself to the viewport
height that remains visible, so the on-screen keyboard shrinks the shell rather
than covering the bottom of the editor.

#### Scenario: The app bar's controls meet the minimum target

- **GIVEN** a viewport at or below the compact breakpoint
- **WHEN** the shell renders
- **THEN** every destination in the navigation bar is at least 48 by 48 CSS
  pixels

#### Scenario: The navigation row's controls meet the minimum target

- **GIVEN** a viewport at or below the compact breakpoint and the navigation view shown
- **WHEN** the sidebar renders
- **THEN** Back, Forward, and Today are each at least 48 by 48 CSS pixels

#### Scenario: The rail's controls meet the minimum target

- **GIVEN** a viewport at or below the compact breakpoint and a folder listed
- **WHEN** the navigation view is shown
- **THEN** the brand, search, add, and each folder entry are at least 48 by 48
  CSS pixels, and so is the folder entry's close control

#### Scenario: The calendar's cells meet the minimum target

- **GIVEN** a viewport at or below the compact breakpoint and a folder open
- **WHEN** the navigation view is shown
- **THEN** the month controls are at least 48 by 48 CSS pixels, and every day
  cell is 48 tall and at least 44 wide

#### Scenario: The listings and summaries meet the minimum target

- **GIVEN** a viewport at or below the compact breakpoint and a folder open
- **WHEN** the navigation or meta view is shown
- **THEN** each accordion summary, each Files row, each right-panel row, and the
  Contents disclosure and its controls are at least 48 by 48 CSS pixels

#### Scenario: The open item's name meets the minimum target

- **GIVEN** a viewport at or below the compact breakpoint and a page with a Files
  row open
- **WHEN** the shell renders
- **THEN** the app bar's title and its page-actions control are each at least 48
  by 48 CSS pixels

#### Scenario: The overlay surfaces' controls meet the minimum target

- **GIVEN** a viewport at or below the compact breakpoint
- **WHEN** the brand screen, the search spotlight, or a menu renders
- **THEN** every control and row it shows is at least 48 by 48 CSS pixels

#### Scenario: The compact text follows the scale

- **GIVEN** a viewport at or below the compact breakpoint and a page open
- **WHEN** the editor, the listing, the calendar, and the app bar render
- **THEN** the editor's body text is 18px, a list row's text is 17px, a section
  label is 13px, and no text is smaller than 12px

#### Scenario: The panes keep a 16px margin

- **GIVEN** a viewport at or below the compact breakpoint and the navigation view shown
- **WHEN** the listing renders
- **THEN** each row's box ends at least 16 CSS pixels from the shell's trailing
  edge

#### Scenario: The bar clears the safe areas

- **GIVEN** a device whose screen has a safe-area inset at the bottom
- **WHEN** the shell renders
- **THEN** the navigation bar's destinations sit inside the inset and none is
  clipped

#### Scenario: The keyboard shrinks the shell

- **GIVEN** the editor view is shown and the on-screen keyboard opens
- **WHEN** the shell re-renders
- **THEN** the shell's height is the visible height, the navigation bar stays
  visible, and the caret's line is not covered by the keyboard

### Requirement: The compact app bar names the open view

At or below the compact breakpoint the shell SHALL render a 64 CSS pixel app bar
above every compact view. It SHALL hold a title and, under it, the save-state
line. The title SHALL be one line at 18px semibold, truncated rather than
wrapped, naming the view: the open item's title, "Details", the folder's name or
"Folders", and "Folio" on the brand screen. Where the open item is a page or a
journal day, the title SHALL be a control at least 48px tall that locates it as
the status bar's crumb does. The status line SHALL be 13px, outside the title
control, and announced as a status: the save-state text, or the indexing label
while the index builds, and nothing on the brand screen. The bar SHALL pad the
top safe-area inset.

#### Scenario: The bar shows the open page's title

- **GIVEN** a viewport at or below the compact breakpoint and a page open
- **WHEN** the app bar renders
- **THEN** its title is the page's title and it is one line

#### Scenario: The title locates a page

- **GIVEN** a page open in the editor view
- **WHEN** the user activates the app bar's title
- **THEN** the navigation view shows with the page's row in view and focused

#### Scenario: The title locates a journal day

- **GIVEN** a journal day open in the editor view
- **WHEN** the user activates the app bar's title
- **THEN** the navigation view shows with the day's cell in view and focused

#### Scenario: The navigation view names its folder

- **GIVEN** a folder active and the navigation view shown
- **WHEN** the app bar renders
- **THEN** its title is the folder's name

#### Scenario: The bar shows the save state

- **GIVEN** a page with unsaved edits open
- **WHEN** the app bar renders
- **THEN** its status line reads "Unsaved changes" and is announced as a status

#### Scenario: The brand screen has no save state

- **GIVEN** no folder active and the brand screen shown
- **WHEN** the app bar renders
- **THEN** it shows no status line

### Requirement: The compact navigation bar composes three destinations

At or below the compact breakpoint the shell's footer SHALL be a navigation bar,
64 CSS pixels tall plus the device's bottom safe-area inset, holding exactly
three equal destinations: Notes (the navigation view), Page (the editor view),
and Details (the meta view). Each destination SHALL be a full-height segment of
a third of the bar's width, carrying a 24px icon and a visible 13px label. The
destination whose view is shown SHALL carry a 56 by 32 rounded active indicator
in the app's recede tint behind its icon, with its icon and label in the brand
ink; the other destinations SHALL carry no indicator and use the tertiary ink.
Each destination SHALL report the active state to assistive technology, and the
bar SHALL hold no status text. The bar SHALL sit outside the panes' scroll
regions, so its content never scrolls.

#### Scenario: The bar carries three destinations

- **GIVEN** a viewport at or below the compact breakpoint
- **WHEN** the shell renders
- **THEN** the footer shows Notes, Page, and Details, in that order

#### Scenario: A destination fills a third of the bar

- **GIVEN** a viewport at or below the compact breakpoint
- **WHEN** the navigation bar renders
- **THEN** each destination is one third of the bar's width and the full 64px
  height

#### Scenario: The active destination carries the indicator

- **GIVEN** a viewport at or below the compact breakpoint and the editor view
  shown
- **WHEN** the navigation bar renders
- **THEN** Page carries the 56 by 32 rounded indicator and the brand ink, and
  Notes and Details carry neither

#### Scenario: The destination reports its state

- **GIVEN** a viewport at or below the compact breakpoint and the meta view shown
- **WHEN** the user reads the navigation bar's destinations with assistive
  technology
- **THEN** Details reports the current state and the other two do not

#### Scenario: The bar carries no status text

- **GIVEN** a viewport at or below the compact breakpoint and a page with unsaved
  edits open
- **WHEN** the navigation bar renders
- **THEN** it shows only the three destinations; the save state is in the app bar

#### Scenario: The bar clears the safe areas

- **GIVEN** a device whose screen has a safe-area inset at the bottom
- **WHEN** the shell renders
- **THEN** the destinations sit inside the inset and none is clipped

#### Scenario: The bar exists only at compact

- **GIVEN** a viewport wider than the compact breakpoint
- **WHEN** the shell renders
- **THEN** no navigation bar and no destination render
