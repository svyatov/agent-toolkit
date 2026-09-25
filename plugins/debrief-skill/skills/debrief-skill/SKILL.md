---
name: debrief-skill
description: Debrief a skill's recent runs from the session transcripts, find the errors, retries, corrections, and dead ends the skill caused, and propose the edits that make the next run smooth
license: MIT
compatibility: Requires Node.js 18.17 or later (built-in modules only) to read Claude Code and Codex session transcripts. Read-only until the user approves a fix.
disable-model-invocation: true
argument-hint: "[skill name | self | all] [days]"
allowed-tools:
  - Bash(node ${CLAUDE_SKILL_DIR}/scripts/transcript.mjs *)
  - Read
---

# Debrief Skill

Every skill run leaves a record in the session transcript: each tool call, each error, each thing the user had to say. Read that record for **friction**, the calls, context, and user attention the run spent that a better skill would have spared. Trace each piece of friction to a line of the skill, and fix the skill at its source.

A healthy skill debriefs clean. The report then says so in one line per run.

## Step 1: Pick the runs

List runs with the bundled script, which reads Claude Code sessions in `~/.claude/projects/` and Codex sessions in `~/.codex/sessions/`. Each output line is a timestamp, the skill name, the `transcript:line` where the run starts, and the directory the skill loaded from, newest first. Without a skill name, the script leaves out runs of this skill.

```bash
node ${CLAUDE_SKILL_DIR}/scripts/transcript.mjs runs [--session ID] [--days N] [skill]
```

| Arguments | Runs |
|---|---|
| Empty | The newest run the user invoked in this session: `--session ${CLAUDE_SESSION_ID}`. A skill that another run loaded through a Skill call belongs to that run: skip its line and take the run that loaded it |
| A skill name | Its runs in this session. None there: its runs in every project over the last 30 days |
| A skill name and a number | Its runs over that many days |
| `self` | The runs of `debrief-skill`, found as a skill name, minus the first output line: that line is this run, still in progress. Apply the "None there" fallback after you remove that line |
| `all`, optionally a number or "in this session" | Every skill that ran over that many days (default 30), or with "in this session", every skill in `--session ${CLAUDE_SESSION_ID}`. A skill another run loaded is a skill of its own here: debrief it separately, and tell the loading run's subagent to attribute friction only to its own skill's text. Keep the skills whose source the user maintains (Step 2) and name the rest in the header as skipped |

Take the five newest runs of each skill, and write in the header how many runs existed and how many you read.

In Codex, `${CLAUDE_SKILL_DIR}` and `${CLAUDE_SESSION_ID}` reach you as literal text: use the directory of this `SKILL.md` and `$CODEX_THREAD_ID` instead. Codex lists a run when the user named the skill with `$name`. A skill Codex picked on its own leaves no marker, so say in the header that such runs are not covered.

## Step 2: Find the source

The directory from Step 1 is where the skill loaded from, and that is not always where it is edited:

- `~/.claude/skills/<name>/` or `<project>/.claude/skills/<name>/` is the source.
- `~/.agents/skills/<name>/` is the source for a Codex user skill.
- `~/.claude/plugins/cache/<marketplace>/<plugin>/<version>/...` or `~/.codex/plugins/cache/<marketplace>/<plugin>/<version>/...` is an installed copy that the next update overwrites. Look `<marketplace>` up in `~/.claude/plugins/known_marketplaces.json`, or under `[marketplaces.<marketplace>]` in `~/.codex/config.toml`. A `directory` or `local` source is the local checkout: the same relative path under it is the source. A `github` or `git` source needs its local clone: it is the current repository when `git remote get-url origin` names the same repository, and otherwise ask the user for the path once.
- A marketplace or skill the user does not maintain has no local source. Its findings become an upstream report.

The `<version>` in a cache path is the version that ran, and `version` in the source plugin's `.claude-plugin/plugin.json` is the current one. When the source has moved past it, a friction the current text already fixes is not a finding. A skill that loads straight from its source (a user skill, or a symlink into a checkout) has no version: write `(loads from source)` in the header, and check `git status` there, since uncommitted edits in the source are what ran.

Done when every skill has a source path, or is marked upstream.

## Step 3: Read each run

Read the skill's `SKILL.md` and every file it names, so you know what the run was told to do. Then print each run:

```bash
node ${CLAUDE_SKILL_DIR}/scripts/transcript.mjs show <transcript:line> [--subs]
```

Each line is `L<n> <KIND> <text>`, where `n` is the transcript line:

| Kind | Line |
|---|---|
| `PREV` | The model's last message before the run, which can hold what the run was asked to do |
| `RUN` | The invocation, with its arguments |
| `YOU` | A message the user typed |
| `SAY` | Text the model wrote |
| `CALL` | A tool call and its input |
| `ERR` | A tool result marked as an error; in Codex, a failed script, a non-zero exit code, or a patch that did not apply |
| `DENY` | A tool call the user or the permission rules rejected (Claude Code only) |
| `STOP` | The user interrupted the model |
| `BIG` | A result over 30,000 characters, or one the host moved to a file |
| `NOTE` | A task notification or a `!` shell command |
| `SKILL` | A skill loaded, the run's own or one it called |
| `COMPACT` | The context was compacted |
| `SUB` | A subagent the run dispatched: its label, its transcript, and its counts |
| `sub` | With `--subs`: an error, denial, or interrupt inside that subagent, with line numbers in its own transcript |

The last line counts calls, errors, denials, interrupts, and user messages, then the subagents' errors and denials. The slice ends at the next command the user types, and a skill the run loads itself stays inside it, so it can carry later work that has nothing to do with the skill: the run ends where the conversation leaves the skill's task. To see lines in full, run `node ${CLAUDE_SKILL_DIR}/scripts/transcript.mjs lines <transcript> <n>...` (for a `sub` line, the transcript on its `SUB` line): it prints each line's text, tool input, and tool result, each capped at 4,000 characters. Pass `--max N` to change the cap.

Look for friction of these kinds:

- **Error**: an `ERR`, and what the run did next: a retry, a workaround, or giving up.
- **Correction**: a `YOU` that redirects, rejects, or repeats a request; a `DENY`; a `STOP`.
- **Dead end**: calls spent looking for something the skill could have stated (a path, a command, a flag, a convention), or the same lookup made twice.
- **Guess**: a question to the user that the skill or the environment could answer, or a choice made on nothing where the skill left a gap.
- **Skip**: a step done partly or not at all, a completion criterion claimed and not met, the user asking for what the skill promised. A departure that cost nothing is not a Skip.
- **Bloat**: a `BIG` result that a narrower command in the skill would have avoided.
- **Drift**: output whose shape differs from what the skill specifies.

Run `show --subs` for a run whose `SUB` lines carry errors or denials. Subagent errors can be named unrelated in bulk, by pattern: a non-zero exit from a command that already printed what it ran for, such as a `grep` with no match, is unrelated.

Done when every `ERR`, `DENY`, `STOP`, and `YOU` line in the run is either a friction item or named as unrelated.

## Step 4: Attribute

Give each friction item one cause:

| Cause | Means | Fix |
|---|---|---|
| **Skill** | The text is wrong, stale, silent where the run needed it, ambiguous, contradicts itself, or tells the run to do something that hits a host limit | Edit the text |
| **Wording** | The text says the right thing and the run did otherwise | Sharpen it: a stronger leading word, a checkable completion criterion, the instruction moved to the step that needs it |
| **Environment** | A missing tool, auth, network, or permission | Only what the skill can declare or check: `compatibility`, `allowed-tools`, a preflight step |
| **Agent** | A slip the text already guards against | None |
| **User** | A new request or a change of mind | None |

A **Skill** item is a finding from one run. A **Wording** or **Environment** item is a finding when it happens in two runs or more, and a Watch item when it happens in one. **Agent** and **User** items are not reported.

Every finding cites the transcript line where the friction shows and the skill line that caused it, or where the missing text belongs. A finding without both citations is dropped. When the fix belongs in a file the skill follows rather than in the skill, such as the repository's `AGENTS.md` or `CLAUDE.md`, the finding cites that file's line instead, and it gets a code like any other. When the `writing-for-agents` skill is available, load it before drafting fixes to skill text.

Done when every friction item has a cause and each finding has both citations and a drafted fix.

## Step 5: Report

| Level | Meaning |
|---|---|
| **Blocking** | The run failed, or its result was wrong |
| **Should fix** | The run recovered, through a retry, a user correction, or a guess |
| **Consider** | The run went through, at a cost in calls or context |

````markdown
# Debrief: <skill>

Runs read: R of N, <first date> to <last date>. Source: `<path>` (ran <version>, current <version>)
Blocking: N · Should fix: N · Consider: N · Watch: N

## Should fix

### F1 <one line>
**Run**: `<transcript>:<line>`, "<the ERR or YOU line, quoted>"
**Cause**: Skill | Wording | Environment
**Skill line**: `<path>:<line>`
**Fix**:
```diff
- old
+ new
```

## Watch
- W1 <what happened, in which run, and what would make it a finding>

## Smooth
- <date> `<transcript>:<line>`: <the counts line>
````

Number findings F1, F2, and so on across all levels, and omit a level that has none. **Smooth** lists every run with no finding, or reads `- None`: without it the reader cannot tell a clean run from one that was never read.

For `all`, dispatch one subagent per skill in one message. Claude Code runs up to 20 subagents at once (`CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`): with more skills than that, dispatch 20 and start the next one each time one finishes. Give each the path of this file, the skill name, its source path, and its run references, and have it run Steps 3 to 5 and return the report. Then print one table first (skill, runs read, Blocking, Should fix, Consider, Watch) and the per-skill reports below it, skills with the most severe findings first. Each subagent numbers from F1 and W1: renumber findings and Watch items across the whole printout, in print order, so every code is unique for Step 6, and keep each report's header and Smooth lines.

## Step 6: Apply

Ask which findings to apply, by code. Apply the chosen ones to the source from Step 2, never to a cache copy, and then follow the source repository's own change checklist from its `AGENTS.md` or `CLAUDE.md`. For an upstream skill, hand the chosen findings to the `report-upstream` skill when it is installed, and print them as a ready-to-file issue otherwise.
