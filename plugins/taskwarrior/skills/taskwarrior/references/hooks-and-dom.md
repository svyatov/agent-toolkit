# Hooks and DOM

## Hooks Overview

Hooks are scripts that Taskwarrior executes at specific events. They can validate, modify, or reject changes.

**Location**: `~/.task/hooks/`

**Naming**: `<event>[-<identifier>]` (e.g., `on-add-require-project`, `on-modify-check-date`)

Scripts must be executable (`chmod +x`).

## Hook Events

| Event | When | Input (stdin) | Output (stdout) | Can reject? |
|-------|------|--------------|-----------------|-------------|
| `on-launch` | Taskwarrior starts | nothing | JSON tasks (optional) | yes |
| `on-exit` | Taskwarrior exits | nothing | JSON tasks (optional) | no |
| `on-add` | task added | 1 JSON task | 1 JSON task (modified ok) | yes |
| `on-modify` | task modified | 2 JSON tasks (old, new) | 1 JSON task (the new one) | yes |

### Exit Codes

- **0** — success: apply any JSON output, show feedback text (optional)
- **non-zero** — failure: reject the change, show feedback text (required)

### Feedback

Any non-JSON line written to stdout is displayed to the user as feedback. On failure (non-zero exit), at least one feedback line is required.

## Hook I/O Examples

### on-add (require project)

```bash
#!/bin/bash
# on-add-require-project
read task
project=$(echo "$task" | python3 -c "import sys,json; print(json.load(sys.stdin).get('project',''))")
if [ -z "$project" ]; then
  echo "Tasks must have a project assigned."
  exit 1
fi
echo "$task"
exit 0
```

### on-modify (prevent due date removal)

```python
#!/usr/bin/env python3
# on-modify-protect-due
import json, sys

old = json.loads(input())
new = json.loads(input())

if 'due' in old and 'due' not in new:
    print("Cannot remove due date from a task that has one.")
    sys.exit(1)

print(json.dumps(new))
sys.exit(0)
```

## Hooks v2

Hooks v2 passes additional context as command-line arguments:

| Argument | Value |
|----------|-------|
| `api:2` | API version |
| `args:'task ...'` | full command line |
| `command:<cmd>` | the command being run (add, done, modify, etc.) |
| `rc:<path>` | path to .taskrc |
| `data:<path>` | path to data directory |
| `version:<ver>` | Taskwarrior version |

v2 is backward-compatible — v1 scripts work unchanged.

## Hook Development

### Minimal framework

```python
#!/usr/bin/env python3
import json, sys

# Read input
task = json.loads(input())

# Your logic here

# Output modified task
print(json.dumps(task))
sys.exit(0)
```

### Testing hooks independently

```bash
echo '{"description":"Test task","status":"pending"}' | ~/.task/hooks/on-add-myhook
echo $?
```

### Debugging

```bash
task rc.debug.hooks=2 add "test task"
```

This shows: hook script name, input, output, exit code, execution time.

### Verifying installation

```bash
task diagnostics
```

Look for the "Hooks" section — it lists all detected hook scripts and their status.

## DOM (Document Object Model)

The DOM provides a unified addressing scheme for all Taskwarrior data.

### DOM References

| Reference | Returns |
|-----------|---------|
| `system.version` | Taskwarrior version |
| `system.os` | operating system |
| `rc.<name>` | configuration value |
| `<id>.<attribute>` | task attribute by ID |
| `<uuid>.<attribute>` | task attribute by UUID |

### Accessing DOM Values

```bash
task _get 1.description          # description of task 1
task _get 1.project              # project of task 1
task _get 1.due                  # due date of task 1
task _get 1.uuid                 # UUID of task 1
task _get 1.urgency              # urgency score of task 1
task _get rc.data.location       # data directory path
task _get system.version         # Taskwarrior version
```

Multiple references in one call:
```bash
task _get 1.description 1.project 1.due
```

### DOM in Modifications

Use DOM references to set attributes relative to other attributes:

```bash
task 5 modify wait:5.due-1w      # wait = task 5's due date minus 1 week
task 5 modify scheduled:5.due-4d # scheduled = 4 days before due
```

Self-referencing shorthand (within the same task):
```bash
task 5 modify wait:due-1w        # same as above — refers to own due date
```

### Date Sub-elements

Date attributes expose sub-elements via DOM:

```bash
task _get 1.due.year             # year component
task _get 1.due.month            # month (1-12)
task _get 1.due.day              # day (1-31)
task _get 1.due.week             # week number
task _get 1.due.weekday          # weekday (0=Sunday)
task _get 1.due.julian           # Julian day
task _get 1.due.hour             # hour
task _get 1.due.minute           # minute
task _get 1.due.second           # second
```

### Annotations

Access annotations by index (1-based):

```bash
task _get 1.annotations.count              # number of annotations
task _get 1.annotations.1.description      # first annotation text
task _get 1.annotations.1.entry            # first annotation date
task _get 1.annotations.1.entry.year       # year of first annotation
```

### Tags

Check for specific tags:

```bash
task _get 1.tags.count           # number of tags
task _get 1.tag.bug              # "bug" if present, empty if not
```

## Helper Commands for Scripting

| Command | Output |
|---------|--------|
| `task _get <refs>` | DOM values |
| `task _unique <attr>` | unique values for an attribute |
| `task _columns` | available column names |
| `task _tags` | all tags in use |
| `task _projects` | all project names |
| `task _aliases` | all defined aliases |
| `task _context` | all context names |
| `task _ids [filter]` | matching task IDs |
| `task _uuids [filter]` | matching task UUIDs |
| `task <filter> export` | full JSON export |

### JSON Export Format

```json
[
  {
    "id": 1,
    "description": "Fix login bug",
    "status": "pending",
    "project": "Backend",
    "priority": "H",
    "due": "20250620T000000Z",
    "entry": "20250615T120000Z",
    "modified": "20250615T120000Z",
    "tags": ["bug", "auth"],
    "urgency": 14.2,
    "uuid": "a1b2c3d4-..."
  }
]
```

Dates in export are always ISO-8601. `id` and `urgency` are computed (not stored).

Use `rc.json.array=off` to get one JSON object per line (useful for streaming/piping).
