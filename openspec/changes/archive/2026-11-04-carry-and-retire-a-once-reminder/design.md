# Design

## D1 — Due is a rule plus a graph fact, not a new state

`ruleMatches(rule, day)` stays the pure calendar function it is. A second,
narrower question sits beside it:

> is this rule **due** on `day`?

which is `ruleMatches` plus one carry case: a `once` rule anchored before today
whose occurrence no journal day has recorded. Recording is derived from the
index's own backlinks, so no new file, field, or migration exists.

```ts
dueRules(rules, day, today, recordedByDay) → ReminderRule[]
```

`recordedByDay` asks "does a journal day on or after this rule's anchor,
**other than the day being judged**, reference the page?" — the day's own note is
excluded on purpose (D2).

Both consumers already share one derivation, so both call this: the day-open
write (`unreferencedRules`) and the badge.

## D2 — Why the open day is excluded from its own record

A carried occurrence is written into today's note and then saved, so after the
save today *does* reference the page. If that counted as "recorded", the badge
would drop to zero the moment the line was saved while its checkbox sat
unticked, contradicting the badge's contract (an unticked item is pending). So
the record searched for is a **journal day other than the open day**: the
carried line keeps the reminder counted for today until it is ticked, and a
fresh day carries nothing because the line already exists elsewhere.

The dedupe does not rely on this: `unreferencedRules` already skips a rule whose
page the open day's note or draft references, so reopening today writes nothing.

## D3 — Retirement is driven by the tick, like the badge

A `once` rule is deleted from `.folio/reminders.md` when the open day's note
records its page as done and the note's day is the anchor or later. That is the
same scan the badge already performs on the same input (the open note's saved
text), so retirement costs one more pass over the same memoized set:

```
useEffect on [journalDay, openDayNote, reminders]
  spent = reminders.filter(r => r.recurrence === 'once'
                            && r.anchor <= journalDay
                            && done.has(r.target.toLowerCase()))
  if (spent.length) saveReminders(reminders minus spent)
```

Properties:

- It writes only when there is something to retire, so an ordinary day writes
  nothing.
- It is the user's own action (a tick) that triggers it, not opening a day.
- Recurring rules are exempt: a tick records one day's occurrence, not the
  schedule. A future-anchored one-off is exempt: a done reference to the page
  before its day does not mean it happened.
- Retirement keeps the line, the page, and its backlinks, exactly like a
  removed rule (ADR-0032).

## D4 — The yearly guard

`yearly` compares month-day only; `daily`, `weekly`, and `monthly` all guard with
`day >= rule.anchor`. The missing guard lets a future-anchored yearly rule fire
in an earlier year's same month-day, which the spec's `later April 12` wording
already forbids. Adding `day >= rule.anchor` is the whole fix.

## Cost (AGENTS.md: the keystroke budget)

- Nothing new runs per keystroke. The carry fact is read from
  `graph.backlinks` (a map lookup plus a scan of one page's referrers) inside
  memos keyed on `[reminders, journalDay, graph]`, rebuilt on index refresh.
- The retirement effect runs on the open note's identity, the same trigger the
  badge already uses, i.e. on save or a fresh read, never on typing.
- No new allocation per visited item: the referrer scan is a `for` loop over an
  existing array with string comparisons.

## Alternatives rejected

- **Retire on materialization** (drop the rule the moment the line is written):
  the badge would lose a pending reminder the user has not ticked, contradicting
  the badge's contract.
- **Carry onto the first day opened after the anchor** rather than today: it
  writes into whichever historical day the user happens to browse, and it needs
  the same "recorded" fact to be self-limiting anyway.
- **An overdue list or count**: a new surface (ADR-0032 rejected the reminders
  panel), and the day's note is already the surface.
- **A stored "last fired" field per rule**: state that the derived backlinks
  already carry, and a second thing to keep consistent with the files.
