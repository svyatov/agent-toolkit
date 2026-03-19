# Dates, Durations, and Recurrence

## Named Dates

Taskwarrior supports many named date synonyms that resolve to specific timestamps.

### Relative Dates

| Name | Resolves To |
|------|------------|
| `now` | current date and time |
| `today` | start of today (midnight) |
| `yesterday` | start of yesterday |
| `tomorrow` | start of tomorrow |
| `monday` .. `sunday` | next occurrence of that weekday (or today if it matches) |

### Period Boundaries

| Name | Meaning |
|------|---------|
| `sod` | start of today |
| `eod` | end of today (23:59:59) |
| `sow` | start of this week (Sunday-based) |
| `eow` | end of this week |
| `soww` | start of work week (Monday) |
| `eoww` | end of work week (Friday 23:59:59) |
| `som` | start of this month |
| `eom` | end of this month |
| `soq` | start of this quarter |
| `eoq` | end of this quarter |
| `soy` | start of this year |
| `eoy` | end of this year |

### Special Dates

| Name | Meaning |
|------|---------|
| `later` / `someday` | 2038-01-18 (far future placeholder) |
| `easter` | Easter Sunday this year |
| `goodfriday` | Good Friday this year |
| `midsommar` | Midsommar this year (June) |
| `midsommarafton` | Midsommar Eve this year |

### Modifiers

Add `n` (next) or `p` (previous) to weekday names:
- `mondayn` — next Monday (even if today is Monday)
- `fridayp` — previous Friday

## Date Formats

### Default Format

Controlled by `rc.dateformat` (default: `Y-M-D`). Format elements:

| Element | Meaning | Example |
|---------|---------|---------|
| `Y` | 4-digit year | 2025 |
| `y` | 2-digit year | 25 |
| `M` | 2-digit month | 06 |
| `m` | 1-digit month | 6 |
| `D` | 2-digit day | 09 |
| `d` | 1-digit day | 9 |
| `h` | 2-digit hour (24h) | 14 |
| `n` | 2-digit minute | 30 |
| `s` | 2-digit second | 00 |

### ISO-8601

Always accepted regardless of `rc.dateformat`:

```
2025-06-15
2025-06-15T14:30:00
2025-06-15T14:30:00Z
2025-06-15T14:30:00+05:00
```

## Relative Date Math

Combine named dates with durations using `+` or `-`:

```bash
due:today+3d            # 3 days from today
due:eow-1d              # 1 day before end of week
wait:due-1w             # 1 week before the due date (DOM reference)
scheduled:due-4d        # 4 days before the due date
until:due+2w            # 2 weeks after the due date
```

The `due-Xd` syntax in `wait:` and `scheduled:` is a DOM reference — it reads the task's own `due` attribute and subtracts from it.

## Duration Values

### Simple Durations

| Syntax | Meaning |
|--------|---------|
| `5s`, `5sec`, `5seconds` | 5 seconds |
| `10min`, `10minutes` | 10 minutes |
| `4h`, `4hrs`, `4hours` | 4 hours |
| `2d`, `2days` | 2 days |
| `3w`, `3wks`, `3weeks` | 3 weeks |
| `2mo`, `2months` | 2 months |
| `1q`, `1quarters` | 1 quarter |
| `1y`, `1yr`, `1years` | 1 year |

### Precision

- **Precise**: seconds, minutes, hours, days, weeks (exact conversion)
- **Imprecise**: months (30 days), quarters (91 days), years (365 days)

### ISO-8601 Durations

Format: `P[nY][nM][nD][T[nH][nM][nS]]`

```
P1Y          # 1 year
P2M3D        # 2 months, 3 days
P1DT12H      # 1 day, 12 hours
PT2H30M      # 2 hours, 30 minutes
```

## Recurrence

Recurring tasks create a hidden template that spawns periodic instances.

### Setting Up Recurrence

A recurring task needs both `recur:` and `due:`:

```bash
task add "Weekly review" recur:weekly due:friday
task add "Pay rent" recur:monthly due:1st
task add "Quarterly report" recur:quarterly due:eoq
task add "Daily standup" recur:weekdays due:9:00
```

### Recurrence Frequencies

| Value | Meaning |
|-------|---------|
| `daily` | every day |
| `weekdays` | Monday through Friday |
| `weekly` | every week |
| `biweekly` | every two weeks |
| `monthly` | every month |
| `bimonthly` | every two months |
| `quarterly` | every quarter |
| `semiannual` | every six months |
| `annual` / `yearly` | every year |
| `biannual` / `biyearly` | every two years |
| `Nd` | every N days |
| `Nw` | every N weeks |
| `Nmo` | every N months |
| `Ny` | every N years |

### How Recurrence Works Internally

1. When you create a recurring task, Taskwarrior stores a **template** (status: `recurring`, hidden from normal reports)
2. The template spawns **instances** (status: `pending`) according to the recurrence schedule
3. `rc.recurrence.limit` controls how many future instances exist at once (default: 1)
4. Each instance is independent — completing one doesn't affect others

### The Mask System

The template tracks instance states with a mask string:
- `-` pending
- `+` completed
- `X` deleted
- `W` waiting

### Modifying Recurring Tasks

When you modify a recurring task instance, Taskwarrior asks whether to apply the change to:
- This instance only
- All instances (propagate to template)

### Limiting Recurrence

Use `until:` to stop recurrence after a date:

```bash
task add "Sprint review" recur:2w due:friday until:2025-12-31
```

### Date Types for Planning

Use these date attributes together for task lifecycle planning:

| Attribute | Purpose | Effect |
|-----------|---------|--------|
| `due:` | deadline | affects urgency, shows in +DUE/+OVERDUE |
| `scheduled:` | earliest planned start | hidden from `ready` report until reached |
| `wait:` | hide until date | task hidden from all reports until date |
| `until:` | expiration | auto-deleted after this date |

Example combining them:

```bash
task add "Prepare presentation" \
  due:friday \
  scheduled:wednesday \
  wait:monday \
  project:Work
```

This task is hidden until Monday, shows as "ready" from Wednesday, and is due Friday.
