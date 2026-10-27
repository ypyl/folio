# Spec Delta

## MODIFIED Requirements

### Requirement: Import translates Logseq conventions into Folio Markdown

The importer SHALL translate the source into Folio's on-disk forms so the
resulting vault reads correctly with no runtime compatibility:

- Page and journal names SHALL be normalized into legal, visible, referenceable
  Folio names; journal days SHALL use the dated form.
- A source page whose name is a real calendar day, whether written as a human
  date or as a zero-padded day, SHALL be written as that journal day rather than
  under the pages folder, so the references to it resolve. Its content SHALL
  fold together with any journal source for the same day.
- Plain `[[Name]]` wikilinks SHALL become `#[[Name]]`, with any alias dropped.
- A reference whose name is a human-written date SHALL become the journal day for
  that date.
- A block reference SHALL become a reference to the page or day that owns the
  block.
- A task keyword at the start of a list item SHALL become a page reference.
- Logseq's UI-only block properties and drawer wrappers SHALL be removed, while
  the user's own data properties SHALL be kept as literal text.
- Asset destinations written relative to a page SHALL become vault-relative.
- Journals nested inside the source's pages SHALL be folded into the
  destination's journal days; drawings and whiteboards SHALL be copied in as
  vault files.
- Folio's own reference rules SHALL be respected: text Folio does not read as a
  reference SHALL NOT be turned into one, and content inside fenced code SHALL be
  left as written.

#### Scenario: A human date page becomes its journal day

- **GIVEN** a source page named `Apr 30th, 2025`
- **WHEN** it is imported
- **THEN** the destination holds it as `journals/2025-04-30.md` and a reference
  to it resolves to that day

#### Scenario: A zero-padded day page becomes its journal day

- **GIVEN** a source page named `2025-04-30`
- **WHEN** it is imported
- **THEN** the destination holds it as `journals/2025-04-30.md`, not as a page
  the app would never list

#### Scenario: A day page folds with its journal source

- **GIVEN** a source holding a page named `Apr 30th, 2025` and a journal file
  for 2025-04-30
- **WHEN** the source is imported
- **THEN** the destination holds one `journals/2025-04-30.md` with both contents

#### Scenario: A block reference into a date-named page names the day

- **GIVEN** a source page named `Apr 30th, 2025` holding a block with an id,
  and another page referencing that block
- **WHEN** the source is imported
- **THEN** the block reference becomes a reference to the 2025-04-30 journal day

#### Scenario: Wikilinks become Folio references

- **GIVEN** a source page containing `See [[Roadmap]]`
- **WHEN** the page is imported
- **THEN** the imported page contains `See #[[Roadmap]]`

#### Scenario: Aliased links keep the page and drop the alias

- **GIVEN** a source page containing `[[Roadmap | this year]]`
- **WHEN** the page is imported
- **THEN** the imported page contains `#[[Roadmap]]`

#### Scenario: A human date reference becomes the journal day

- **GIVEN** a source page referencing `Apr 30th, 2025`
- **WHEN** the page is imported
- **THEN** the imported page references the journal day for 2025-04-30

#### Scenario: A block reference becomes a reference to its owner

- **GIVEN** a source block reference whose block lives on a dated page
- **WHEN** the containing page is imported
- **THEN** the reference becomes a reference to that page

#### Scenario: A task keyword becomes a page reference

- **GIVEN** a source list item beginning with a task keyword
- **WHEN** the page is imported
- **THEN** the imported item begins with that keyword as a page reference

#### Scenario: UI-only properties are removed and data kept

- **GIVEN** a source block carrying an editor UI property and the user's own
  property
- **WHEN** the page is imported
- **THEN** the UI property is gone and the user's property remains as literal
  text

#### Scenario: Relative asset paths become vault-relative

- **GIVEN** a source page referencing an asset by a page-relative path
- **WHEN** the page is imported
- **THEN** the imported page references it by its vault path and the asset is
  written

#### Scenario: Journal filenames are normalized

- **GIVEN** a source journal file written in Logseq's dated form
- **WHEN** the source is imported
- **THEN** the destination holds it as a journal day

#### Scenario: Drawings and whiteboards are preserved as vault files

- **GIVEN** a source holding drawings and whiteboards
- **WHEN** the source is imported
- **THEN** they are written into the destination as vault files

#### Scenario: Non-reference text is not turned into a reference

- **GIVEN** a source page containing a URL with a fragment and a slash-separated
  tag token
- **WHEN** the page is imported
- **THEN** neither is rewritten as a reference

#### Scenario: Fenced code is left as written

- **GIVEN** a source page with a fenced code block containing a wikilink
- **WHEN** the page is imported
- **THEN** the code block still contains it verbatim
