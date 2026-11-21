# Spec Delta

## MODIFIED Requirements

### Requirement: The trace records the app's writes and failures

The trace SHALL record every write the app makes into the folder with the file's
path, its size, and whether it succeeded, every failed read, write, or stat with
the error's name and message, every page opened, every flush with the number of
writes it carried, and every save the app reported as failed. It SHALL also
record every action taken on the user's behalf with the action's name, the path
it touched, and what changed in counts, so an agent's write is distinguishable
from the user's own. That record SHALL add no page text, and the write the action
caused SHALL still be recorded once, as the app's write.

#### Scenario: A failed write is recorded with its error

- **GIVEN** an open folder and a page whose writes are rejected
- **WHEN** the user's edit is saved and the write fails
- **THEN** the trace records the write, its path and size, and the error

#### Scenario: A flush is recorded

- **GIVEN** an open page with an edit waiting on the save delay
- **WHEN** the tab becomes hidden and the pending write is flushed
- **THEN** the trace records the flush and the number of writes it carried

#### Scenario: An action taken on the user's behalf is attributed

- **GIVEN** an open folder and the gate on
- **WHEN** an action changes a page
- **THEN** the trace records the action's name, the page's path, and its added and
  removed line counts, and the write it caused is recorded once
