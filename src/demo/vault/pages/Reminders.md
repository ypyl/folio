# Reminders

A reminder is a page you ask to see again. You set one from the Journal calendar:
open the page you want to be reminded about, right-click a day, and choose a
recurrence.

> Demo guide. #Welcome has the table of contents.

## The demo's rules

The demo ships with two rules in `.folio/reminders.md`:

| Recurrence                 | Page                  |
| -------------------------- | --------------------- |
| Every day, from {{today}}  | #[[Water the plants]] |
| Every week, from {{today}} | #[[Weekly review]]    |

A page has one reminder at a time; choosing another for the same page asks first,
then replaces it. The page rows for both targets carry a small bell in the Files
listing.

## See a rule land

Click **Today** in the status bar. When the day opens, the app writes each due
reminder into the note as an unchecked task item:

- [ ] #[[Water the plants]]
- [ ] #[[Weekly review]]

The checkbox is the record: ticking it marks the occurrence done for the session
and the app-icon badge stops counting it. Deleting the rule later leaves the page
and the written lines alone.

## Remove a rule

Right-click the page's row in Files and choose **Remove reminder**. The menu shows
the schedule it deletes. Only the rule goes; the page and any lines it wrote stay.
