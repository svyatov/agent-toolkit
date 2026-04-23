# Filters and Search

## Filter Operators

Filters select tasks by matching attribute values. The general form is `attribute.operator:value`.

When no operator is specified, the default depends on the attribute type:
- Strings default to `contains` (substring match)
- Dates default to exact match
- Numeric default to exact match

### String Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `:` (default) | contains (substring) | `project:Home` |
| `.is:` | exact match | `status.is:pending` |
| `.isnt:` | not exact match | `status.isnt:completed` |
| `.has:` | contains (same as default) | `description.has:bug` |
| `.hasnt:` | does not contain | `description.hasnt:test` |
| `~` | regex match | `description~'fix.*bug'` |
| `!~` | regex does not match | `description!~'^WIP'` |

### Numeric Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `:` | equals | `priority:H` |
| `.not:` | not equal | `priority.not:H` |
| `.gt:` | greater than | `urgency.gt:10` |
| `.lt:` | less than | `urgency.lt:5` |
| `.gte:` | greater or equal | — |
| `.lte:` | less or equal | — |

### Date Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `:` | on that date | `due:today` |
| `.before:` | before date | `due.before:monday` |
| `.after:` | after date | `due.after:2025-06-01` |
| `.not:` | not on date | `due.not:today` |

### Presence Operators

| Operator | Meaning | Example |
|----------|---------|---------|
| `:` (empty value) | attribute is not set | `due:` |
| `.any:` | attribute has any value | `due.any:` |
| `.none:` | attribute has no value | `project.none:` |

## Tag Filters

```bash
+tag                    # has this tag
-tag                    # does not have this tag
+VIRTUAL_TAG            # virtual tag (uppercase)
```

Tags are case-sensitive. Virtual tags are always uppercase.

## Logical Operators

Multiple filters combine with implicit AND. Use explicit operators for complex logic:

```bash
# Implicit AND (default)
task project:Home +urgent list

# Explicit AND
task project:Home and +urgent list

# OR
task '(project:Home or project:Work)' list

# XOR (one or the other, not both)
task '(+bug xor +feature)' list

# NOT (negate with attribute operators, not a standalone keyword)
task project.not:Home list
```

**Precedence** (highest to lowest):
1. Parentheses `()`
2. `and`
3. `or` / `xor`

Always quote or escape parentheses to prevent shell interpretation:
```bash
task '(project:Home or project:Work)' and +urgent list
task \(project:Home or project:Work\) and +urgent list
```

## Attribute Name Abbreviations

You can abbreviate attribute names as long as they're unambiguous:

| Abbreviation | Full name |
|-------------|-----------|
| `desc` | `description` |
| `proj` | `project` |
| `pri` | `priority` |
| `dep` | `depends` |
| `recur` | `recur` |
| `sched` | `scheduled` |
| `stat` | `status` |
| `mod` | `modified` |

## Search with Patterns

The `/pattern/` syntax searches the description field:

```bash
task /bug/ list                  # tasks containing "bug"
task /^Fix/ list                 # tasks starting with "Fix"
task /bug|issue/ list            # tasks containing "bug" or "issue"
```

Regular expressions are enabled by default (since v2.4.0). Disable with `rc.regex=off`.

For case-insensitive search: `rc.search.case.sensitive=no`.

## Complex Filter Examples

```bash
# Overdue high-priority tasks in Backend project
task project:Backend priority:H +OVERDUE list

# Tasks due this week that are not blocked
task +WEEK +UNBLOCKED list

# Tasks modified in the last 3 days
task modified.after:now-3d list

# Tasks with no project assigned
task project: list

# Tasks in Home or any sub-project of Home
task project:Home list

# Tasks with annotations containing a URL
task description~'http' list

# Tasks added today
task entry:today list

# Active tasks (started but not done)
task +ACTIVE list

# All tasks that block something, sorted by urgency
task +BLOCKING next
```

## Combining Filters with Reports

Filters work with any report command:

```bash
task project:Work next           # "next" report filtered to Work project
task +bug count                  # count of tasks tagged "bug"
task due.before:eow minimal      # minimal report for tasks due before end of week
```

The `rc.context` feature applies an automatic filter to all commands — see `references/customization.md` for context setup.
