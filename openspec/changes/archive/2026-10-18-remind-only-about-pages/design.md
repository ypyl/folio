# Design

## Context

See proposal.md. The day menu's reminder items act on the open page
(`reminderTarget` in `App`). That value is currently the open page's title
whenever a page is open, and a journal day is a page, so a journal day becomes a
target. `kindOf(path)` already tells a journal day (`journals/...`) from a page.

## Goals / Non-Goals

**Goals:**
- Offer reminder items only when the open item is a page.

**Non-Goals:**
- Any change to rules, matching, materialization, or removal.

## Decisions

**D1: The reminder target requires a page-kind open item.** `reminderTarget`
becomes the open page's title only when `kindOf(activePath) === 'page'`;
otherwise it is null, so the day menu opens no reminder items. This keeps the
rule simple (a day is never a target) and leaves a board and the no-page state
exactly as they are.

Alternative considered: allow a journal day but render the target as the day's
note. Rejected, because the reminder would be about the day, which is the thing
that makes no sense.

## Risks / Trade-offs

- **A user who wanted to remind about a day cannot.** That is the point: a day is
  where a reminder lands, not what it is about. The day cell itself is the
  anchor, and any page can target it.
