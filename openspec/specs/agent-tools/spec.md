# agent-tools Specification

## Purpose
The tool surface an installed browser agent calls to act on the user's notes: what
exists, what it may touch, how a change reaches the open page and every other
page, what a result may contain, and how the experimental gate retires the whole
surface. It is the app's own seams with a name, a description, and a schema, not a
second interface over the folder.

## Requirements

### Requirement: The surface exists only while the agent gate is on

While the agent gate is on, the app SHALL register its tools with the browser's
model-context interface. While the gate is off, the app SHALL register nothing,
and an agent that lists tools SHALL see an empty set. Turning the gate off SHALL
retire every registered tool before the next frame, and unmounting SHALL retire
them the same way. Where the browser has no model-context interface, the app SHALL
register nothing and SHALL fail in no visible way.

#### Scenario: A gate-off build exposes no tools

- **GIVEN** the agent gate off
- **WHEN** an agent lists the page's tools
- **THEN** the list is empty

#### Scenario: Turning the gate on registers the surface

- **GIVEN** the agent gate off and a folder open
- **WHEN** the user turns experimental mode on
- **THEN** the page's tools are registered and listable

#### Scenario: Turning the gate off retires the surface

- **GIVEN** the tools registered
- **WHEN** the user turns experimental mode off
- **THEN** every tool is retired and an agent's list is empty

#### Scenario: A browser without the interface is a no-op

- **GIVEN** a browser that has no model-context interface
- **WHEN** the app mounts with the gate on
- **THEN** nothing registers and no error reaches the user

### Requirement: The surface is a fixed set of named tools

The surface SHALL hold exactly these tools: `search_notes`, `read_note`,
`note_links`, `app_state`, `open_note`, `create_note`, `edit_note`,
`append_note`, and `add_reminder`. Each SHALL carry a name of at most 30
characters, a description of at most 500 characters, and a JSON Schema for its
input with parameter descriptions of at most 150 characters.

#### Scenario: Every tool is declared within its budgets

- **WHEN** the declarations are inspected
- **THEN** each tool's name, description, and parameter descriptions are within
  their limits and each carries an input schema

#### Scenario: An undeclared tool is not callable

- **WHEN** an agent calls a name the surface does not declare
- **THEN** the call fails and changes nothing

### Requirement: A change to the open page lands as one editor transaction

When a write tool targets the page that is open, the app SHALL apply the change to
the live document as one editor transaction: the user's typing SHALL be preserved,
the caret SHALL NOT move to another position, the change SHALL be one step of the
editor's own history, and it SHALL reach the page's draft and the debounced save
as a keystroke would. The app SHALL NOT replace the whole document and SHALL NOT
write the file directly.

#### Scenario: The change merges with what the user typed

- **GIVEN** an open page the user has typed into
- **WHEN** a write tool changes a different part of that page
- **THEN** the agent's text and the user's typing are both in the document

#### Scenario: The agent's change undoes like an edit

- **GIVEN** an open page a write tool just changed
- **WHEN** the user presses `Mod-z`
- **THEN** the agent's change is undone and the user's earlier typing is kept

#### Scenario: The caret stays where the user left it

- **GIVEN** the caret in the middle of an open page
- **WHEN** a write tool changes text before the caret
- **THEN** the caret stays with the text it was in

#### Scenario: The open page reaches the save

- **GIVEN** an open page a write tool just changed
- **WHEN** the save delay passes
- **THEN** the file holds the merged text and the status bar reports it saved

### Requirement: A change to any other page goes through the app's write path

When a write tool targets a page that is not open, the app SHALL write it through
its own write-through path, so the Files listing, the page's backlinks, and the
search corpus reflect the change before the tool returns. The app SHALL NOT write
the file without updating what it derives from it.

#### Scenario: The listing and the backlinks are true after the call

- **GIVEN** a page that is not open and another page that references it
- **WHEN** a write tool appends a line to it
- **THEN** the Files listing shows its new size order and the referencing page's
  backlink row is present, without a reload

#### Scenario: The next call sees the last one's write

- **GIVEN** a write tool that created a page
- **WHEN** the next call reads that page
- **THEN** it reads the text the first call wrote

### Requirement: A page name resolves by the app's naming rule

Where a tool takes a page name, the app SHALL resolve it by its own rule: a name
that is a valid calendar date SHALL resolve to that journal day, and any other name
SHALL resolve to the page of that name, existing or not. A tool SHALL NOT accept a
page path built by the caller in place of a name.

#### Scenario: A date name resolves to the journal day

- **WHEN** a tool is called with a name that is a calendar date
- **THEN** the change targets that date's journal day file

#### Scenario: A plain name resolves to its page

- **WHEN** a tool is called with a name that is not a calendar date
- **THEN** the change targets that page, creating its file if it has none

### Requirement: A stale match fails and writes nothing

`edit_note` SHALL replace an exact string the caller supplies. When that string is
not present in the page's current text, the app SHALL change nothing and SHALL
report the failure so the caller can read the page again. The app SHALL NOT fall
back to replacing the whole page, approximating the match, or writing a partial
change.

#### Scenario: A match that moved fails

- **GIVEN** a page whose text changed since the caller read it
- **WHEN** the caller's string no longer matches
- **THEN** nothing is written and the call reports that the text was not found

#### Scenario: A match present twice is refused

- **GIVEN** a page where the caller's string occurs more than once
- **WHEN** the caller supplies it
- **THEN** nothing is written and the call reports that the match is ambiguous

### Requirement: The text tools refuse app-owned state and non-Markdown files

The text tools SHALL refuse a path inside the app-owned `.folio/` directory, whose
files have writers of their own, and a path that is not Markdown, because a board
is a board file and any other vault file is not a page. Nothing in the surface
SHALL remove, rename, or move a file.

#### Scenario: A state file is refused

- **WHEN** a text tool is called with a path under `.folio/`
- **THEN** nothing is written and the call reports that the path is refused

#### Scenario: A non-Markdown file is refused

- **WHEN** a text tool is called with a path that is not Markdown
- **THEN** nothing is written and the call reports that the path is refused

### Requirement: A reminder is written through the app's rule writer

`add_reminder` SHALL add a rule by re-rendering the app's reminder file from its
parsed rules and writing it through the app's own writer, so the file keeps its
header, its canonical reference form, and its rule order. The tool SHALL NOT edit
that file's text directly.

#### Scenario: The rule file keeps its canonical form

- **GIVEN** a folder with at least one reminder rule
- **WHEN** `add_reminder` adds another
- **THEN** the file holds its header, the earlier rules in order, and the new rule
  in the canonical form

#### Scenario: An invalid rule is refused

- **WHEN** `add_reminder` is called with a recurrence the app does not know or a
  day that is not a calendar day
- **THEN** nothing is written and the call reports the invalid rule

### Requirement: Results are summaries and reads are capped

A write tool's result SHALL be the path it touched and the lines added and
removed; it SHALL NOT return the page's new text. A read tool SHALL return one
page at most, a window of its lines, and search results capped at a small fixed
number of rows. No tool SHALL return the whole vault.

#### Scenario: A write returns counts, not the page

- **GIVEN** a write that replaced three lines
- **WHEN** the call returns
- **THEN** its result names the path and the added and removed counts, and holds
  none of the page's text

#### Scenario: No tool lists the vault

- **WHEN** the surface's tools are inspected
- **THEN** none of them returns the vault's pages or files as a set

### Requirement: Every write is recorded as an action taken on the user's behalf

A write tool SHALL record its action in the session's activity record, naming the
tool, the path, and the counts, on the same path a surface's action takes.

#### Scenario: A tool's write appears in the record

- **GIVEN** the gate on and the activity surface available
- **WHEN** a write tool changes a page
- **THEN** the record gains an entry naming that tool and that page's path

### Requirement: The tools declare their hints

Every read tool SHALL declare that it changes nothing, every write tool that its
result is consequential, and every tool whose result contains note text that the
text is untrusted. The hints SHALL be annotations on the declaration, and the app
SHALL NOT present them as an enforcement of anything.

#### Scenario: A note-text result is marked untrusted

- **WHEN** the declarations are inspected
- **THEN** every tool returning note text carries the untrusted-content hint, and
  every write carries the consequential hint
