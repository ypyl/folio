## MODIFIED Requirements

### Requirement: External URLs open on Ctrl+Click
A URL written bare in a page's text — `http://…`, `https://…`, or `www.…` — SHALL be displayed in the app's link style (brand ink, no underline) while the document and the saved Markdown keep exactly the characters the user typed: no formatting mark SHALL be created and the text SHALL NOT be rewritten. Ctrl+Click (Cmd+Click on macOS) on that text SHALL open it in the browser — a new tab, or the system browser when the app runs installed — and SHALL NOT navigate the app itself away. Ctrl+Click on a markdown link SHALL open its target the same way. A plain click SHALL open nothing: it places the caret where it was clicked, so a URL and a link's text stay editable. A click on a link whose target is a bare fragment — `#section` — SHALL open nothing, in any modifier state, because nothing is served at that target. A link whose target is a vault-relative path is not covered here: it is governed by "Vault asset links open the stored file".

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
- **GIVEN** a page containing text reading `#section`
- **WHEN** the user Ctrl+Clicks it
- **THEN** no tab opens and the document is unchanged, because a fragment names nothing this app serves

#### Scenario: Near misses stay text
- **GIVEN** a page containing `see https://example.com/path.` and a URL inside inline code
- **WHEN** the page renders
- **THEN** the sentence's trailing period is not part of the link, and the URL inside code is not displayed as a link

## ADDED Requirements

### Requirement: Vault asset links open the stored file
When a page's markdown carries a link whose target is a path inside the vault — a target with no URL scheme and no leading `/`, such as `assets/q3-report.pdf` — Ctrl+Click (Cmd+Click on macOS) on the link's text SHALL open the file stored at that path, and SHALL NOT navigate the app away from the open page. The target SHALL be read as the vault path the link carries, whether the link spells it literally or percent-encoded.

What opens SHALL follow the file's type. A type the browser can display — PDF, image, audio, video, and plain text — SHALL be shown in a new tab displaying the stored bytes. Any other type SHALL be delivered as a download, so the application the operating system has registered for that type can open it.

The vault SHALL be read once per activation, through the same storage seam every other read uses, and SHALL NOT be read as part of handling a keystroke. The gesture SHALL NOT modify the page's markdown or the file on disk: the reference keeps the path it had and the file keeps its bytes, so the vault stays canonical (ADR-0001). The app SHALL write nothing anywhere as part of this gesture — the download, where there is one, is performed by the browser.

Because a browser cannot hand a file on disk to the operating system in place, what opens is a copy of the file as it was read, not the vault file: an edit made in whichever application opens it SHALL NOT be observed, merged, or saved into the vault by the app.

A target the vault cannot resolve — no such file, or a path the storage rejects — SHALL open nothing and SHALL leave the app and its document unchanged. A plain click SHALL remain an editing gesture: it places the caret where it was clicked and opens nothing. A target carrying a URL scheme and a bare fragment are governed by "External URLs open on Ctrl+Click" and are unaffected.

#### Scenario: A vault file that the browser can display opens in a tab
- **GIVEN** an open page whose markdown reads `[Q3 report](assets/q3-report.pdf)` and a vault holding that file
- **WHEN** the user Ctrl+Clicks the link text
- **THEN** the stored bytes are displayed in a new tab, the page stays open, and the file on disk is unchanged

#### Scenario: A vault file the browser cannot display is delivered as a download
- **GIVEN** an open page whose markdown links to a vault file of a type the browser does not display
- **WHEN** the user Ctrl+Clicks the link text
- **THEN** the browser downloads the file, so the operating system can open it with the application registered for that type, and the app stays on the open page

#### Scenario: A plain click still edits the link
- **GIVEN** a page containing a link to a vault file
- **WHEN** the user clicks it without a modifier
- **THEN** nothing opens, the caret is placed where the click landed, and the text is unchanged

#### Scenario: An unresolvable vault target opens nothing
- **GIVEN** a page whose markdown links to a vault path holding no file
- **WHEN** the user Ctrl+Clicks the link text
- **THEN** nothing opens, the document is unchanged, and the app does not navigate

#### Scenario: The reference and the file are never rewritten
- **GIVEN** an open page linking to a vault file, and the vault file's bytes
- **WHEN** the user Ctrl+Clicks the link, and the page is then edited and saved
- **THEN** the page's markdown still holds the same path, and the file on disk still holds the same bytes

#### Scenario: Opening a vault file costs nothing per keystroke
- **GIVEN** an open page that links to vault files, and a vault reader that counts reads
- **WHEN** the user types in the page and then Ctrl+Clicks a vault link
- **THEN** the counts show no vault read for the typing and exactly one for the activation

#### Scenario: The external and fragment rules are untouched
- **GIVEN** a page containing an `https:` link and text reading `#section`
- **WHEN** the user Ctrl+Clicks either
- **THEN** the external URL opens in a tab and the fragment opens nothing, as before
