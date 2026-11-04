# Tasks

## 1. Due-day derivation

- [x] 1.1 `src/vault/reminders.ts`: add the `day >= rule.anchor` guard to
      `yearly` in `ruleMatches`.
- [x] 1.2 `src/vault/reminders.ts`: add `dueRules(rules, day, today,
      recordedElsewhere)` — matching rules plus a `once` rule anchored before
      today that no journal day has recorded — with a doc comment naming the
      change.
- [x] 1.3 `src/rows.ts`: build the recorded predicate from
      `graph.backlinks` filtered to journal days on or after the anchor and
      excluding the day being judged; switch `unreferencedRules` to `dueRules`
      and take the local day as a parameter.

## 2. App wiring

- [x] 2.1 `src/App.tsx`: pass the local day into the day-open materialization.
- [x] 2.2 `src/App.tsx`: count the open day's reminders with `dueRules` so a
      carried one-off is counted until its line is ticked.
- [x] 2.3 `src/App.tsx`: retire a ticked one-off through `saveReminders`, in an
      effect keyed on the open note's identity, short-circuiting when nothing is
      spent.

## 3. Tests

- [x] 3.1 `src/vault/reminders.test.ts`: a future-anchored `yearly` rule does not
      match an earlier year's month-day; `dueRules` carries an unrecorded past
      one-off onto today, does not carry a recorded one, does not carry a
      future-anchored one, and carries only on today.
- [x] 3.2 `src/rows.test.ts`: `unreferencedRules` writes the carried line into
      today's journal, writes nothing when another journal day records the page,
      writes nothing on a day other than today, and writes nothing when the draft
      already holds the line.
- [x] 3.3 `src/App.integration.test.tsx`: opening today's journal materializes a
      missed one-off and the badge counts it; the badge keeps counting until the
      line is ticked; ticking it drops the rule from `.folio/reminders.md` while
      the line, the page, and its backlinks remain; an unticked line, a future
      anchor, and a recurring rule leave the rule file alone.

## 4. Checks and docs

- [x] 4.1 Run `npx oxlint --fix`, `npm run fmt`, the unit/integration suites,
      `tsc -b`, `npx oxlint --deny-warnings`, `npm run build`, and the e2e suite.
- [x] 4.2 Amend `adr/0032-a-due-reminder-is-written-on-open.md` in place: the
      day-open write materializes a missed one-off onto today, and a tick
      retires a `once` rule from the rule file.
- [x] 4.3 Bump `version` in `package.json` (minor); archive the change, sync the
      main spec, bump again for the archive commit, and push `master` to
      `origin` and `nas`.
