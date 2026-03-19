# Reports and Columns

## Report Types

Taskwarrior has three categories of reports:

1. **Static built-in** — cannot be customized: `burndown`, `calendar`, `history`, `ghistory`, `export`, `commands`, `colors`, `diagnostics`, `show`, `stats`, `summary`, `tags`, `projects`, `reports`, `columns`, `udas`, `information`, `timesheet`

2. **Modifiable built-in** — customizable via config: `active`, `all`, `blocked`, `blocking`, `completed`, `list`, `long`, `ls`, `minimal`, `newest`, `next`, `oldest`, `overdue`, `ready`, `recurring`, `unblocked`, `waiting`

3. **Custom** — user-defined reports

## Custom Report Configuration

Define a custom report with these config settings:

```
report.<name>.description=<text>
report.<name>.columns=<column-list>
report.<name>.labels=<label-list>
report.<name>.sort=<sort-specification>
report.<name>.filter=<filter>
```

### Example: Create a "bugs" report

```bash
task config report.bugs.description "Open bugs sorted by priority"
task config report.bugs.columns "id,priority,project,description.count,due"
task config report.bugs.labels "ID,P,Project,Description,Due"
task config report.bugs.sort "priority-,due+,project+"
task config report.bugs.filter "status:pending +bug"
```

Then use it: `task bugs`

## Column Formats

Columns support format specifiers via `column.format`. Run `task columns` for the full list from your installation.

### Core Columns

| Column | Formats | Notes |
|--------|---------|-------|
| `id` | (numeric) | read-only, working set index |
| `uuid` | `long`, `short` | permanent identifier |
| `status` | `long`, `short` | pending/completed/deleted/recurring/waiting |
| `description` | `combined` (default), `desc`, `oneline`, `truncated`, `count`, `truncated_count` | `combined` includes annotations; `count` shows `[2]` for annotation count |
| `project` | `full`, `parent`, `indented` | `parent` shows only top-level; `indented` shows hierarchy |
| `priority` | (default), `indicator` | indicator shows a single character |
| `tags` | `list`, `indicator`, `count` | `list` shows comma-separated |
| `depends` | `list`, `count`, `indicator` | |
| `urgency` | `real`, `integer` | real shows decimal |

### Date Columns

All date columns (`due`, `end`, `entry`, `modified`, `scheduled`, `start`, `until`, `wait`) support:

| Format | Shows | Example |
|--------|-------|---------|
| `formatted` (default) | per `rc.dateformat` | `2025-06-15` |
| `julian` | Julian day number | `2460841` |
| `epoch` | Unix timestamp | `1718409600` |
| `iso` | ISO-8601 | `20250615T000000Z` |
| `age` | time since | `2w` |
| `relative` | time until/since | `in 3d`, `2w ago` |
| `countdown` | time remaining | `3d` |

### Other Columns

| Column | Formats |
|--------|---------|
| `recur` | `duration`, `indicator` |
| `estimate` | (string) |
| `mask` | (string, read-only) |

### UDA Columns

Any UDA is automatically available as a column with the same name. String UDAs support `default` and `indicator` formats. Numeric UDAs support `default` and `indicator`. Date UDAs support all date formats above.

## Sort Specification

Sort fields use `+` for ascending and `-` for descending, separated by commas:

```
sort=priority-,due+,project+/,urgency-
```

The `/` (solidus) after a field name creates a **list break** — a visual separator in the output when the value of that field changes. Useful for grouping.

Example: `sort=project+/,urgency-` groups tasks by project with a blank line between projects, sorted by urgency within each group.

### Sort Key Ordering

Sort keys are evaluated left to right. The first key is the primary sort, the second breaks ties, and so on.

## Modifying Built-in Reports

Override any built-in report's configuration:

```bash
# Change what columns the "next" report shows
task config report.next.columns "id,priority,project,tags,due,description"
task config report.next.labels "ID,P,Project,Tags,Due,Description"

# Change the filter for "list"
task config report.list.filter "status:pending -waiting"

# Change sort order
task config report.next.sort "urgency-"
```

View current report configuration: `task show report.<name>`

## Empty Columns

By default, columns with no data are hidden (`rc.print.empty.columns=off`). Set to `on` to always show all configured columns.

## Default Report

The command `task` with no arguments runs `rc.default.command` (default: `task next`).

Change it:
```bash
task config default.command "list"
```

## Burndown Charts

Three variants showing task creation/completion over time:

```bash
task burndown.daily              # daily resolution
task burndown.weekly             # weekly (default for `task burndown`)
task burndown.monthly            # monthly
```

Burndown predicts completion date based on recent net completion rate. If the pending count is still growing, it reports "no convergence."

Apply filters to scope the burndown: `task project:MyApp burndown.weekly`
