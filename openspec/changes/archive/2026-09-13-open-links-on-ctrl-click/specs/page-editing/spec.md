## ADDED Requirements

### Requirement: External URLs open on Ctrl+Click
A URL written bare in a page's text — `http://…`, `https://…`, or `www.…` — SHALL be displayed in the app's link style (brand ink, no underline) while the document and the saved Markdown keep exactly the characters the user typed: no formatting mark SHALL be created and the text SHALL NOT be rewritten. Ctrl+Click (Cmd+Click on macOS) on that text SHALL open it in the browser — a new tab, or the system browser when the app runs installed — and SHALL NOT navigate the app itself away. Ctrl+Click on a markdown link SHALL open its target the same way. A plain click SHALL open nothing: it places the caret where it was clicked, so a URL and a link's text stay editable. A click on a link whose target is not an external URL — a vault-relative path such as `assets/photo.png`, or a bare fragment — SHALL open nothing, in any modifier state, because nothing is served at those targets.

#### Scenario: A bare URL becomes a link and opens on Ctrl+Click
- **GIVEN** a page whose text contains `https://anthropic-partners.skilljar.com`
- **WHEN** the page renders and the user Ctrl+Clicks that text
- **THEN** it is displayed as a link in brand ink, the browser opens the URL in a new tab, and the page stays open where it was

#### Scenario: A markdown link opens the same way
- **GIVEN** a page containing `[Anthropic](https://anthropic-partners.skilljar.com)`
- **WHEN** the user Ctrl+Clicks the link text
- **THEN** the browser opens that URL, and the app does not navigate away from the page

#### Scenario: A plain click only edits
- **GIVEN** a page containing a bare URL and a markdown link
- **WHEN** the user clicks either without a modifier
- **THEN** no tab opens, the caret is placed where the click landed, and the text is unchanged

#### Scenario: The file keeps the characters typed
- **GIVEN** a page whose text contains a bare URL
- **WHEN** the page saves
- **THEN** the Markdown holds that URL exactly as typed, with no autolink mark and no added brackets

#### Scenario: Non-external targets do not open
- **GIVEN** a page containing a markdown link to `assets/photo.png` and text reading `#section`
- **WHEN** the user Ctrl+Clicks either
- **THEN** no tab opens and the document is unchanged

#### Scenario: Near misses stay text
- **GIVEN** a page containing `see https://example.com/path.` and a URL inside inline code
- **WHEN** the page renders
- **THEN** the sentence's trailing period is not part of the link, and the URL inside code is not displayed as a link
