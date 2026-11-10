# Spec Delta

## ADDED Requirements

### Requirement: A name the folder cannot hold is not a page reference

A bracketed page reference whose name the folder cannot hold as a file name
SHALL NOT be a page reference. It SHALL remain literal Markdown text, SHALL NOT
be badged, and SHALL NOT contribute a link, a backlink, a Links row, a file, or
a page that materializes on first save. Such a name holds any of `< > : " / \ |
? *` or a control character, or is a Windows device name. Every other name SHALL
keep the ordinary rule — the page it matches, or a page that does not exist yet.

#### Scenario: A name holding a pipe is literal text

- **GIVEN** a note holding `#[[Interview - Amjad | Bkdkfd]]` and no page of that
  name
- **WHEN** the note is open
- **THEN** the token renders as literal text, with no badge, no Links row, and
  no page that opens or materializes on save

#### Scenario: Editing a note with such a token never fails a save

- **GIVEN** a note holding a reference whose name holds a pipe
- **WHEN** the user edits the note and the save settles
- **THEN** the save succeeds, the note is written, and no file is created for
  the impossible name

#### Scenario: A name holding a colon is literal text

- **WHEN** a note holds `#[[Chapter 1: Start]]`
- **THEN** it is literal text and names no page

#### Scenario: A name holding a separator is literal text

- **WHEN** a note holds `#[[Journal/2026]]`
- **THEN** it is literal text, and no page under a nested directory is created

#### Scenario: A device name is literal text

- **WHEN** a note holds `#[[NUL]]`
- **THEN** it is literal text and names no page

#### Scenario: An unusual but writable name still resolves

- **GIVEN** pages named `café`, `2.0`, and `100% done`
- **WHEN** notes reference them as `#[[café]]`, `#[[2.0]]`, and
  `#[[100% done]]`
- **THEN** each token is a reference and resolves to its page

#### Scenario: A missing page with a writable name is still a reference

- **GIVEN** no page named `feature roadmap`
- **WHEN** a note holds `#[[feature roadmap]]`
- **THEN** the token is badged as a reference to that page
