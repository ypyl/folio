## ADDED Requirements

### Requirement: The right panel's last section is a keyboard-shortcuts reference
The right meta panel SHALL hold the keyboard-shortcuts reference as its last collapsible section, after the page-metadata sections. The section SHALL be collapsed by default and its summary SHALL read "Keyboard shortcuts". While collapsed, the section's summary SHALL sit at the panel's bottom edge, below the page-metadata sections, whether those sections are shorter than the panel or long enough to make it scroll. Opening it SHALL expand the reference in place, growing upward from the panel's bottom edge: the panel SHALL continue to scroll as a single region, and the open list SHALL NOT introduce a second scrolling area or a height cap of its own. Opening it SHALL list the app's keyboard shortcuts: the editor's formatting and editing shortcuts (bold, italic, inline code, undo, redo, heading levels one through six, paragraph, ordered and bullet lists, blockquote, code block, indent and outdent, line break) and the app's search shortcut. The section SHALL list only shortcuts the app actually provides, and SHALL show each as a readable label with its key combination rendered as key tokens; heading levels one through six SHALL be covered by a single key-range entry rather than one entry per level. The section SHALL be present and openable in every app state — with a vault open, while the index builds, on search-results surfaces, and on the brand empty state. The panel SHALL carry an accessible name that describes the whole panel, not only its link sections. Opening or closing the reference SHALL NOT change the open page, the search surface, or the open/closed state of the Backlinks and Forwardlinks sections. Because the reference is a disclosure rather than a modal surface, opening it SHALL NOT move keyboard focus, trap focus, or require a dismissal gesture; its summary SHALL be reachable and toggleable by keyboard like any other disclosure.

#### Scenario: The panel ends with the reference
- **WHEN** the shell renders with a vault open
- **THEN** the right panel's sections are Backlinks, then Forwardlinks, then the collapsed "Keyboard shortcuts" row, and no section follows it

#### Scenario: The collapsed reference sits at the panel's bottom
- **WHEN** the reference is collapsed and the page-metadata sections are shorter than the panel
- **THEN** the reference row sits at the panel's bottom edge rather than directly beneath the page-metadata sections

#### Scenario: The collapsed reference stays at the panel's bottom while the panel scrolls
- **GIVEN** the page-metadata sections are long enough to overflow the panel
- **WHEN** the user scrolls the panel
- **THEN** the collapsed reference row remains at the panel's bottom edge

#### Scenario: The open reference grows upward from the panel's bottom
- **WHEN** the user opens the reference while its row sits at the panel's bottom edge
- **THEN** the list expands upward from that edge, the panel remains the only scrolling region, and no scrolling area or height cap appears inside the reference

#### Scenario: The open reference stays fully reachable on a short window
- **GIVEN** the open reference is taller than the panel
- **WHEN** the user scrolls the panel
- **THEN** the whole list is reachable and no part of it is clipped or hidden behind the row

#### Scenario: The reference is collapsed by default
- **WHEN** the shell renders
- **THEN** the keyboard-shortcuts section is collapsed and the panel shows only its summary row

#### Scenario: The reference lists only real shortcuts
- **WHEN** the user opens the keyboard-shortcuts section
- **THEN** it lists the editor's formatting and editing shortcuts and the app's search shortcut, and lists no shortcut for capabilities that provide none (such as links)

#### Scenario: Heading levels are covered as a single range
- **WHEN** the user opens the keyboard-shortcuts section
- **THEN** one entry covers heading levels one through six, showing their key combinations as a range rather than six separate entries

#### Scenario: The reference is reachable in every app state
- **GIVEN** the app on the brand empty state with no vault open
- **WHEN** the shell renders
- **THEN** the right panel's keyboard-shortcuts section is present and opens

#### Scenario: Opening the reference disturbs nothing
- **GIVEN** a page is open and the Backlinks and Forwardlinks sections are both open
- **WHEN** the user opens the keyboard-shortcuts section
- **THEN** the open page is unchanged, the search surface is unchanged, and Backlinks and Forwardlinks remain open

#### Scenario: The reference is a disclosure, not a modal surface
- **WHEN** the user opens the keyboard-shortcuts section
- **THEN** keyboard focus stays wherever the user left it, focus is not trapped, and no dismissal gesture is required to keep working

#### Scenario: The reference toggles by keyboard
- **WHEN** the user reaches the keyboard-shortcuts summary with the keyboard and activates it
- **THEN** the summary shows visible keyboard focus and the section opens and closes

## MODIFIED Requirements

### Requirement: Header shows brand, content-width search, and an active-vault status slot
The header SHALL show the Folio brand at the left and a search input centered over and spanning the center pane's column. The header's right slot SHALL be empty: the vault's name and file count moved to the status bar. The slot SHALL hold no controls and SHALL NOT open a picker, switch folders, or re-grant permission — adding, switching, or re-granting a folder happens on the folder rail. The search input's width SHALL match the content column it sits over (capped at a readable maximum), not a fixed narrow box, so the box and its dropdown align with the content beneath. Search behavior — the results dropdown, matching, keyboard, and edge states — is specified by the search capability.

#### Scenario: Search spans the content column
- **WHEN** the shell renders at desktop width
- **THEN** the search input is horizontally aligned with the center pane and spans that column's width, not a fixed-width box

#### Scenario: Search behavior lives with the search capability
- **WHEN** the user types into the search input
- **THEN** the input's behavior is the search capability's: a results dropdown, keyboard shortcuts, and empty states, none of which were present while the input was inert

#### Scenario: The slot shows status and performs no actions
- **WHEN** a vault is active
- **THEN** the header slot shows no controls — the vault's name and file count appear in the status bar instead — and the slot performs no other actions: it opens no picker, switches no folder, and re-grants no permission

### Requirement: Meta panel is an accordion of page metadata
The right meta panel SHALL contain the collapsible page-metadata sections Backlinks and Forwardlinks. Each section SHALL show placeholder copy while no page is open, and both SHALL open and close independently. When a page is open, each section SHALL list its page rows instead of placeholder copy: Backlinks lists every page that references the open page, Forwardlinks lists every page the open page references, both alphabetically. A section with no matching pages SHALL show empty-state copy. Rows SHALL use the sidebar's row styling and `aria-current` marking for the open page; rows that target a page with no file on disk SHALL be visually dimmed to signal the page is not yet created, and remain clickable. Clicking any row navigates (static-navigation links-pane requirements).

#### Scenario: Meta sections are independently collapsible
- **WHEN** the user collapses Backlinks while Forwardlinks is open
- **THEN** Backlinks collapses and Forwardlinks remains open

#### Scenario: Backlinks list the open page's referrers
- **GIVEN** `Topic.md` is open and referenced by `Ideas.md` and `Log.md`
- **WHEN** the user looks at the Backlinks section
- **THEN** the section lists `Ideas` and `Log` rows, alphabetically

#### Scenario: Forwardlinks list the open page's targets
- **GIVEN** an open page whose content references `Roadmap` and the journal day `2026-09-06`
- **WHEN** the user looks at the Forwardlinks section
- **THEN** the section lists `Roadmap` and `2026-09-06` rows, alphabetically, whether or not each target's file exists

#### Scenario: Empty sections show copy instead of rows
- **GIVEN** an open page that no page references
- **WHEN** the user looks at the Backlinks section
- **THEN** the section shows empty-state copy ("Nothing links here yet."), not placeholder copy and no rows

#### Scenario: Unmaterialized targets are dimmed but clickable
- **GIVEN** an open page whose content references `Missing`, and no `Missing.md` exists
- **WHEN** the user looks at the Forwardlinks section
- **THEN** the `Missing` row is rendered dimmed, still clickable, and still navigates

#### Scenario: Placeholders persist only before a page opens
- **WHEN** no page is open
- **THEN** both sections show their placeholder copy

### Requirement: The shell shows an app-level status bar
The shell SHALL render a thin status bar as a full-width row below the workspace, present in every app state — with a vault open, while the index builds, on search-results surfaces, and on the brand empty state. The bar SHALL hold three groups and the pin control specified by pinned-pages: the open page's file path as a breadcrumb (left), a status group holding the save-state text and the indexing label (immediately after the breadcrumb, separated from it by a vertical hairline), and the active vault's name and file count (right side). A group SHALL be empty when its content has no source: no page open leaves the path group empty; a page with nothing to report leaves the status group empty; no active folder leaves the vault group empty. The bar SHALL sit outside all pane scroll regions — its content never scrolls, and the panes scroll independently beneath it — and SHALL use Kami tokens (stone 12px text, hairline top border, flat surfaces). The bar SHALL hold no action other than the pin control: it opens no picker, switches no folder, re-grants no permission, and navigates nowhere.

#### Scenario: The bar frames every app state
- **GIVEN** the app on the brand empty state with no vault open
- **WHEN** the shell renders
- **THEN** the status bar is present with all three groups empty and no content beyond the pin control

#### Scenario: An open page fills the path group
- **WHEN** the user opens a page
- **THEN** the status bar's path group shows the page's file-path breadcrumb

#### Scenario: The indexing label shows in the bar
- **WHEN** the active folder's index is building
- **THEN** the status bar shows the "Indexing notes…" status in the center group

#### Scenario: The bar performs no actions
- **WHEN** the user activates the breadcrumb segments, the status text, or the vault name in the status bar
- **THEN** nothing happens: no navigation, no picker, no folder switch, no permission re-grant

#### Scenario: The bar stays put while panes scroll
- **WHEN** the user scrolls a pane beneath the status bar
- **THEN** the bar and its content remain fixed at the shell's bottom

## REMOVED Requirements

### Requirement: A question-mark button opens a keyboard-shortcuts reference
The status bar's question-mark button SHALL open a modal dialog over the shell that lists the app's keyboard shortcuts: the editor's formatting and editing shortcuts (bold, italic, inline code, undo, redo, heading levels, paragraph, ordered and bullet lists, blockquote, code block, indent and outdent, line break) and the app's search shortcut. The dialog SHALL list only shortcuts the app actually provides, and SHALL show each as a readable label with its key combination. The dialog SHALL close when the user presses Escape, activates a close control, or activates the area outside the dialog (its scrim). Opening the dialog SHALL move keyboard focus into it; closing SHALL return focus to the question-mark button. The dialog SHALL be exposed to assistive technology as a dialog.

#### Scenario: The button opens the reference
- **WHEN** the user activates the question-mark help button in the status bar
- **THEN** a modal dialog listing the app's keyboard shortcuts opens over the shell

#### Scenario: The reference lists only real shortcuts
- **WHEN** the shortcuts dialog is open
- **THEN** it lists the editor's formatting and editing shortcuts and the app's search shortcut, and lists no shortcut for capabilities that provide none (such as links)

#### Scenario: Escape closes and returns focus
- **WHEN** the shortcuts dialog is open and the user presses Escape
- **THEN** the dialog closes and keyboard focus returns to the question-mark button

#### Scenario: Clicking outside the dialog closes it
- **WHEN** the shortcuts dialog is open and the user activates an area of the scrim outside the dialog
- **THEN** the dialog closes

#### Scenario: The dialog is accessible
- **WHEN** the shortcuts dialog is open
- **THEN** it is exposed to assistive technology as a dialog, and opening it moves keyboard focus into the dialog

**Reason**: The reference was the app's only modal, opened from a `?` button in the status bar's far-right corner. That made the shell's most reference-like content the one thing a user had to open, cover the workspace with, and dismiss, and it made a corner button the status bar's only action. The shell already has a panel present in every app state that scrolls independently and holds inspection content, so the reference belongs there as a section rather than as a surface. Removing the modal also removes the focus-into/focus-return contract, the scrim, the close control, and the Escape handling that existed only to serve it.

**Migration**: The reference is the right meta panel's last collapsible section, collapsed by default, titled "Keyboard shortcuts". There is no button and no keyboard route to it — the panel's summary row is the affordance. The listed shortcuts and their key tokens are unchanged, except that heading levels one through six are now shown as one key range.
