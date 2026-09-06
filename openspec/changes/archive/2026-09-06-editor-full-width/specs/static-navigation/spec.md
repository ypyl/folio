## ADDED Requirements

### Requirement: The editor surface fills the pane's width
The editor pane SHALL let the editor surface use the pane's full width: the content column SHALL NOT be capped to a fixed measure, only padded at the pane's edges. The pane itself continues to take all available space in the workspace layout.

#### Scenario: A wide window fills the editor surface
- **WHEN** the window is wider than the editor pane's old fixed measure
- **THEN** the editor surface spans the full width of the pane, bounded only by the pane's edge padding