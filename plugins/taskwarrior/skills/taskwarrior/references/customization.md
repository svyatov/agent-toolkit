# Customization

## Configuration Basics

Taskwarrior stores configuration in `~/.taskrc`. Manage settings with:

```bash
task config <name> <value>       # set a value
task config <name> ''            # set to empty string
task config <name>               # delete a setting
task show                        # show all settings
task show <substring>            # show matching settings
```

**Command-line override** (temporary, not saved):
```bash
task rc.verbose=nothing list
task rc.dateformat=Y-M-D list
```

**Environment variables**:
- `TASKRC` — path to config file (default: `~/.taskrc`)
- `TASKDATA` — path to data directory (default: `~/.task`)

The only required setting is `data.location=~/.task`.

## User Defined Attributes (UDAs)

UDAs let you add custom fields to tasks.

### Creating a UDA

```bash
# Basic UDA
task config uda.estimate.type numeric
task config uda.estimate.label Est

# String UDA with allowed values
task config uda.severity.type string
task config uda.severity.label Severity
task config uda.severity.values critical,major,minor,trivial

# Date UDA
task config uda.reviewed.type date
task config uda.reviewed.label Reviewed

# Duration UDA
task config uda.timebudget.type duration
task config uda.timebudget.label Budget

# Default value
task config uda.estimate.default 1
```

### UDA Types

| Type | Stores | Sort behavior |
|------|--------|--------------|
| `string` | text | alphabetic (or by `values` order if defined) |
| `numeric` | number | numeric |
| `date` | timestamp | chronological |
| `duration` | time span | by duration length |

### Using UDAs

```bash
task add "Fix bug" severity:major estimate:3
task 1 modify severity:minor
task severity:critical list
```

### UDA Urgency Contribution

Give UDA values an urgency boost:

```bash
# Boost urgency by 5.0 when severity is set
task config urgency.uda.severity.coefficient 5.0

# Boost specific values differently
task config urgency.uda.severity.critical.coefficient 10.0
task config urgency.uda.severity.major.coefficient 5.0
```

### Orphaned UDAs

If you remove UDA configuration but tasks still have data for it, the data is preserved but cannot be filtered or displayed. Reconfigure the UDA to access the data again.

## Urgency

Urgency is a computed score that determines task sort order in the `next` report.

### Formula

Urgency = sum of (coefficient x factor) for all terms.

### Default Coefficients

| Term | Coefficient | Condition |
|------|------------|-----------|
| `urgency.next.coefficient` | 15.0 | has `+next` tag |
| `urgency.due.coefficient` | 12.0 | has due date (scaled by proximity) |
| `urgency.blocking.coefficient` | 8.0 | blocks other tasks |
| `urgency.priority.H.coefficient` | 6.0 | priority is H |
| `urgency.priority.M.coefficient` | 3.9 | priority is M |
| `urgency.priority.L.coefficient` | 1.8 | priority is L |
| `urgency.scheduled.coefficient` | 5.0 | has scheduled date past |
| `urgency.active.coefficient` | 4.0 | task is started |
| `urgency.age.coefficient` | 2.0 | scales with age (max at 365 days) |
| `urgency.annotations.coefficient` | 1.0 | has annotations |
| `urgency.tags.coefficient` | 1.0 | has tags |
| `urgency.project.coefficient` | 1.0 | assigned to project |
| `urgency.waiting.coefficient` | -3.0 | is waiting |
| `urgency.blocked.coefficient` | -5.0 | is blocked |

### Due Date Scaling

The due coefficient is not binary — it scales based on how close the due date is:
- Overdue by 7+ days: factor = 1.0 (full coefficient)
- Due today: factor = 0.7
- Due in 7 days: factor = 0.4
- Due in 14 days: factor = 0.2
- No due date: factor = 0.0

### Tuning Urgency

```bash
# Make blocking tasks even more urgent
task config urgency.blocking.coefficient 12.0

# Custom tag boost
task config urgency.user.tag.critical.coefficient 10.0

# Custom project boost
task config urgency.user.project.Work.coefficient 3.0

# Disable age-based urgency
task config urgency.age.coefficient 0
```

### Viewing Urgency

```bash
task 1 info                      # shows urgency breakdown
task urgency.gt:10 list          # filter by urgency score
```

## Contexts

Contexts apply an automatic filter to all commands — a way to focus on a subset of tasks.

### Managing Contexts

```bash
# Define
task context define work "project:Work or +work"
task context define home "project:Home or +personal"
task context define urgent "+OVERDUE or priority:H"

# Activate
task context work

# Show active context
task context show

# List all contexts
task context list

# Deactivate
task context none

# Delete
task context delete work
```

### How Contexts Work

When a context is active, its filter is automatically ANDed (wrapped in parentheses) with every command's filter. So `task list` with context `work` becomes `task (project:Work or +work) list`.

Contexts are stored in `.taskrc`:
```
context.work=project:Work or +work
context=work
```

## Color Themes

Include a theme in `.taskrc`:

```bash
include dark-256.theme
```

### Available Themes

| Theme | Description |
|-------|------------|
| `dark-16.theme` | dark background, 16 colors |
| `dark-256.theme` | dark background, 256 colors |
| `light-16.theme` | light background, 16 colors |
| `light-256.theme` | light background, 256 colors |
| `solarized-dark-256.theme` | Solarized dark |
| `solarized-light-256.theme` | Solarized light |
| `no-color.theme` | disable all colors |

Variant themes: `dark-blue-256`, `dark-gray-256`, `dark-green-256`, `dark-red-256`, `dark-violets-256`, `dark-yellow-green-256`, `bubblegum-256`

Override individual rules after the include:

```bash
include dark-256.theme
color.overdue=white on red
```

## Verbosity

Control how much feedback Taskwarrior shows:

```bash
task config verbose yes          # all feedback (default)
task config verbose no           # minimal
task config verbose nothing      # suppress all

# Fine-grained: comma-separated tokens
task config verbose "header,footnote,label,affected"
```

### Verbosity Tokens

| Token | Controls |
|-------|---------|
| `blank` | blank lines in output |
| `header` | column headers |
| `footnote` | footnotes (config overrides, context) |
| `label` | ID labels in feedback |
| `new-id` | "Created task N" message |
| `new-uuid` | UUID in creation message |
| `affected` | "N tasks affected" message |
| `edit` | edit command hints |
| `special` | special tags/attributes feedback |
| `project` | project change summary |
| `sync` | sync feedback |
| `filter` | show applied filter |
| `override` | config override warnings |
| `unwait` | unwait notifications |
| `context` | context activation messages |

## Key Configuration Settings

| Setting | Default | Purpose |
|---------|---------|---------|
| `data.location` | `~/.task` | task data directory |
| `default.command` | `next` | command run when `task` is invoked bare |
| `default.project` | (none) | auto-assign project to new tasks |
| `due` | `7` | days before due to show in +DUE |
| `recurrence.limit` | `1` | pending instances of recurring tasks |
| `gc` | `on` | garbage collection (ID renumbering) |
| `regex` | `on` | enable regex in filters |
| `search.case.sensitive` | `yes` | case-sensitive search |
| `json.array` | `on` | export as JSON array vs. individual objects |
| `bulk` | `3` | threshold for bulk-modify confirmation |
| `confirmation` | `yes` | confirm destructive operations |

Use `task show <substring>` to explore the full set.
