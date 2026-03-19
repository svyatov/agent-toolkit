---
name: taskwarrior
description: >
  Taskwarrior CLI reference for managing tasks, bugs, and work items from the
  terminal. This skill contains the correct syntax for filters, dates,
  recurrence, UDAs, urgency tuning, custom reports, contexts, and hooks that
  you CANNOT reliably produce from memory alone — Taskwarrior's syntax is
  unusual (attribute:value, +tag, virtual tags like +OVERDUE) and easy to get
  wrong. ALWAYS use this skill when the user: (1) runs or asks about any
  `task` command, (2) wants to add, modify, complete, delete, or list tasks,
  (3) asks what's due, overdue, or what to work on next, (4) wants to track
  bugs or work items from the command line, (5) mentions priorities, projects,
  tags, filters, recurring tasks, or contexts, (6) wants a custom report,
  UDA, hook script, or urgency tuning, (7) mentions Taskwarrior by name.
  Do NOT skip this skill just because the request sounds simple — even basic
  operations like `task add` have non-obvious attribute syntax that differs
  from other CLI tools.
---

# Taskwarrior

Taskwarrior is a command-line task manager. Everything flows through one command: `task`.

## Core Syntax

Every command follows this pattern:

```
task [filter] <command> [modifications]
```

- **filter** — selects which tasks to act on (before the command)
- **command** — what to do (add, modify, done, delete, list, next, etc.)
- **modifications** — changes to apply (after the command)

Filters and modifications look similar (`project:Home`, `+tag`, `due:friday`) but their position relative to the command determines their role.

## Essential Operations

### Creating tasks

```bash
task add <description> [attributes]
task add Fix login bug project:Backend priority:H due:friday +bug
task add "Buy groceries" due:saturday +personal
task log <description>          # record an already-completed task
```

### Modifying tasks

```bash
task <ID> modify <changes>
task 3 modify priority:M due:monday
task 3 modify +urgent            # add tag
task 3 modify -urgent            # remove tag
task 3 modify /typo/fixed/       # text substitution in description
task 3 append more details       # add words to end
task 3 prepend URGENT            # add words to beginning
task 3 annotate "See PR #42"    # add a note
task 3 denotate "See PR #42"   # remove a note
```

### Completing, deleting, undoing

```bash
task <ID> done                   # mark complete
task <ID> done project:Shipped   # en passant: modify while completing
task <ID> delete                 # mark deleted (recoverable)
task undo                        # undo the last change (one level)
```

### Starting and stopping (time tracking)

```bash
task <ID> start                  # mark as actively working
task <ID> stop                   # stop working (keeps the task)
```

### Viewing tasks

```bash
task                             # default report (usually 'next')
task list                        # all pending tasks
task next                        # pending tasks sorted by urgency
task <ID> info                   # full details for one task
task ready                       # tasks ready to work on now
task overdue                     # tasks past their due date
task active                      # currently started tasks
task completed                   # completed tasks
task waiting                     # tasks hidden until their wait date
```

## Filters Quick Reference

Filters select tasks. Multiple filters combine with implicit AND.

| Pattern | Meaning |
|---------|---------|
| `project:Home` | tasks in project Home |
| `project:Home.Kitchen` | tasks in sub-project |
| `project.not:Home` | tasks NOT in project Home |
| `+tag` | tasks with this tag |
| `-tag` | tasks without this tag |
| `status:pending` | pending tasks |
| `status:completed` | completed tasks |
| `due:today` | due today |
| `due.before:monday` | due before Monday |
| `due.after:2025-01-01` | due after a date |
| `priority:H` | high priority |
| `priority:` | no priority set |
| `description~pattern` | description matches regex |
| `/keyword/` | search description for text |
| `+OVERDUE` | virtual tag: past due |
| `+ACTIVE` | virtual tag: started tasks |
| `+READY` | virtual tag: unblocked, not waiting, not scheduled in future |

Combine with logic: `(project:Home or project:Work) and +urgent`

Read `references/filters-and-search.md` for the full operator reference, regex support, and complex filter examples.

## Dates Quick Reference

| Named Date | Meaning |
|------------|---------|
| `today`, `tomorrow`, `yesterday` | calendar days |
| `now` | current date+time |
| `monday` .. `sunday` | next occurrence of that weekday |
| `eod`, `sod` | end/start of today |
| `eow`, `sow` | end/start of this week |
| `eoww`, `soww` | end/start of work week (Mon-Fri) |
| `eom`, `som` | end/start of this month |
| `eoq`, `soq` | end/start of this quarter |
| `eoy`, `soy` | end/start of this year |
| `later`, `someday` | 2038-01-18 (far future) |

**Durations**: `2d` (2 days), `1w` (1 week), `3mo` (3 months), `1y` (1 year), `4h` (4 hours)

**Relative dates**: `due:today+3d` (3 days from today), `wait:due-1w` (1 week before due)

**Date types on a task**:
- `due:` — deadline
- `scheduled:` — earliest you plan to start
- `wait:` — hide task until this date
- `until:` — auto-delete after this date

Read `references/dates-durations-recurrence.md` for ISO-8601 formats, the full named dates list, recurrence setup, and date math.

## Virtual Tags

Virtual tags are computed, not stored. Use them in filters with `+TAG`.

| Tag | Meaning |
|-----|---------|
| `+PENDING` | status is pending |
| `+COMPLETED` | status is completed |
| `+DELETED` | status is deleted |
| `+ACTIVE` | task has been started |
| `+BLOCKED` | depends on another pending task |
| `+BLOCKING` | other tasks depend on this |
| `+UNBLOCKED` | has dependencies, but all resolved |
| `+DUE` | due within `rc.due` days (default 7) |
| `+OVERDUE` | past due date |
| `+TODAY` | due today |
| `+WEEK` | due this week |
| `+MONTH` | due this month |
| `+YEAR` | due this year |
| `+READY` | pending, not blocked, not waiting, scheduled date reached or none |
| `+WAITING` | has a future wait date |
| `+SCHEDULED` | has a scheduled date |
| `+TAGGED` | has at least one user tag |
| `+ANNOTATED` | has annotations |
| `+PROJECT` | assigned to a project |
| `+PRIORITY` | has a priority value |
| `+UDA` | has a UDA value |
| `+LATEST` | the most recently modified task |
| `+ORPHAN` | task with UDA data but UDA not configured |

## Dependencies

```bash
task 5 modify depends:3         # task 5 depends on task 3
task 5 modify depends:3,7       # depends on tasks 3 and 7
task +BLOCKED list               # show blocked tasks
task +BLOCKING list              # show tasks that block others
```

## Dynamic CLI Lookups

Before baking information into your response, prefer fetching current data from the user's actual Taskwarrior installation:

| Need | Command |
|------|---------|
| Command list with descriptions | `task help` |
| All commands with metadata | `task commands` |
| Config variable lookup | `task show <setting>` |
| Available columns | `task _columns` |
| All tags in use | `task _tags` |
| All projects in use | `task _projects` |
| All contexts defined | `task context list` |
| Task data as JSON | `task <filter> export` |
| DOM value lookup | `task _get <id>.<attribute>` |
| Diagnostics/troubleshooting | `task diagnostics` |

Use these to answer questions about the user's specific setup, current tasks, or configuration rather than guessing.

## Reference Files

Load these when you need deeper information on a topic:

| File | When to read |
|------|-------------|
| `references/filters-and-search.md` | Complex filter construction, operator reference, regex, attribute names |
| `references/dates-durations-recurrence.md` | Date formats, full named dates list, recurrence setup, ISO-8601, date math |
| `references/reports-and-columns.md` | Custom report creation, column format specifiers, sort syntax |
| `references/customization.md` | UDAs, urgency tuning, contexts, themes, .taskrc configuration |
| `references/hooks-and-dom.md` | Hook scripts, DOM references, scripting, automation |

## Working With Taskwarrior in Development

### Track project work

```bash
task add "Implement auth middleware" project:MyApp.Backend priority:H due:friday +feature
task add "Write tests for auth" project:MyApp.Backend depends:<prev_id> +test
task add "Update API docs" project:MyApp.Docs +docs
```

### Review what needs attention

```bash
task project:MyApp next          # project tasks by urgency
task +OVERDUE list               # what's late
task +DUE list                   # due within a week
task +ACTIVE list                # what you're working on now
task ready                       # what's unblocked and actionable
```

### Use contexts for focus

```bash
task context define myapp "project:MyApp"
task context myapp               # activate — all reports now filter to MyApp
task context none                # deactivate
```

### Export for scripting

```bash
task status:pending export       # JSON array of all pending tasks
task project:MyApp export        # JSON for a specific project
```

The JSON export includes all attributes and is useful for building dashboards, reports, or integrations.
