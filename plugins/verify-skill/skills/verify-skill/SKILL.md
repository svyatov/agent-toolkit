---
name: verify-skill
description: Verify skills against saved Agent Skills and host guidance, with live link and upstream checks. Self-checks and --refresh update the guidance.
license: MIT
compatibility: >
  Requires file access. Live target checks and guidance refreshes require curl
  and network access to the relevant official documentation and repositories.
  Read-only until the user approves fixes or saved-reference updates.
  No install and no dependencies.
allowed-tools: Bash Read Grep Glob Edit
disable-model-invocation: true
argument-hint: "[skill path or name | self] [--refresh]"
---

# Verify Skill

Normal runs use the dated guidance bundled in `references/`. They do not
download general authoring or host documentation. Every finding identifies
its governing rule, source and reference date. Links, time-sensitive target
claims and imported-skill changes are still checked live.

A self-check or `--refresh` fetches current guidance, verifies against it, and
offers saved-reference updates with the findings. Refreshing is explicit;
reference age alone never starts a download.

Four axes:

- **A. Conformance** to the selected spec and authoring guidance.
- **B. Host features** against the selected guidance snapshot.
- **C. Freshness** of the information the skill states.
- **D. Upstream drift** of an imported skill against the repository it came from.

## Step 1: Resolve the target

| Trigger | Scope |
|---|---|
| A path to a SKILL.md or to a skill directory | That skill |
| A skill or plugin name | Find it, then verify it |
| `self` | Verify this verifier and refresh its guidance |
| "all skills in \<dir\>" or "all my skills" | Every SKILL.md below that root, one subagent and one report each. Dispatch up to the active host's available worker capacity in one message, queue the rest, and start the next one each time a worker finishes |
| Pasted skill content, no file | Verify the text, skip the file-layout checks |
| No target given | Ask which skill, with `AskUserQuestion` |

For a fan-out, select the Step 2 guidance once and give each subagent the same reference paths, dates and mode. If the batch includes this verifier or uses `--refresh`, prepare the refreshed guidance once before dispatch. Workers run Steps 1 and 3 to 7 and load only the references their targets need. Step 8 stays with you.

Determine capacity from the active host's limits, configuration, and already-running workers. On Claude Code, check `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` against the selected Claude reference; use its default only when no valid override is set. If capacity is unknown, use one worker at a time. If subagents are unavailable, verify the skills sequentially in the current session.

When every report is in, print one table (skill, Blocking, Should fix, Consider), then every finding grouped by severity and tagged with its skill, then the clean skills on one line. Number the findings F1, F2, and so on across the whole printout, so Step 8 can take them by code.

To find a skill by name, first use a matching target path supplied by the user
or the current session's skill listing. Otherwise search these repository
patterns in order and stop at the first hit. Use Glob when available, or an
equivalent shell file search when it is not:

```
plugins/*/skills/*/SKILL.md
skills/*/SKILL.md
```

Then search the active host's locations:

- Claude Code: `.claude/skills/*/SKILL.md`, `~/.claude/skills/*/SKILL.md`, then `~/.claude/plugins/cache/*/*/*/skills/**/SKILL.md`.
- Codex: `.agents/skills/*/SKILL.md` at each directory from the current directory up to the repository root, then `~/.agents/skills/*/SKILL.md` and `/etc/codex/skills/*/SKILL.md`. Use the session's supplied paths for bundled system and plugin skills.

If the target is still missing, check the active host's local reference from
Step 2 before reporting it as not found. Offer `--refresh` if the saved
discovery guidance cannot resolve it; do not fetch guidance automatically.

Read the SKILL.md, then read every file it names: `references/`, `scripts/`,
`assets/`, and any bundled companion. A reference the body names but that does
not exist is a Blocking finding, so resolve each path even when the file
turns out to be missing.

Also read `agents/openai.yaml` in the skill directory when it exists. Step 4
compares it with the frontmatter.

Also read `sources.json` in the skill directory when it exists. Keep its
`sources[]` for Step 6. No `sources.json`, or no source that carries
`repository`, `path`, `branch`, and `sha` (a pasted skill has none), means axis
D is skipped and reported as one line under Checks that passed.

Record the skill's last change date with `git log -1 --format=%cs -- <path>`
inside a repository, or the file mtime otherwise, for dated target claims.

## Step 2: Select the guidance

Resolve these files relative to this verifier's skill directory, not the
target skill or working directory. Read only the rows needed for the target:

| Condition | Reference |
|---|---|
| Every target, including descriptions, scripts and requested eval advice | [Agent Skills](references/agent-skills.md) |
| Claude Code skills, tools, plugins, CLI settings or parallel work | [Claude Code](references/claude-code.md) |
| Codex discovery or distribution, including `agents/openai.yaml` or a Codex plugin catalog | [Codex](references/codex.md) |
| A comparable source in `sources.json` | [GitHub comparisons](references/github.md) |
| A self-check or explicit `--refresh` | [Refresh procedure](references/refresh.md), plus all four guidance files above |

Treat a target as a self-check when it is this verifier, or another installed
or repository copy of the `verify-skill` skill. This includes a self-check
within a batch. Strip `--refresh` before resolving the target; it is a mode,
not part of the target name. It does not supply a missing target.

In normal mode, use the saved rules and dates as they stand. Source links in
the verifier's references are provenance, not instructions to fetch. If a
reference is missing, malformed, or lacks a rule needed for a check, mark that
check **Not checked** and suggest a self-check or `--refresh`. Do not substitute
remembered guidance or silently download a replacement.

In refresh mode, follow the refresh procedure and use its staged, freshly
verified guidance for this run. Keep stored files unchanged until Step 8's
approval. Track failed source groups separately from successful refreshes.

For both modes, exact upstream excerpts are labeled as quotes in the
references; the other rules are summaries. Cite the local rule and its source
URL and date. Never present a summarized rule as a verbatim upstream quote.

## Step 3: Axis A, conformance

Derive every threshold from the selected Agent Skills reference. Do not carry
numbers in your head, and do not accept numbers quoted by other skills.

Check these categories, and find the governing reference rule first:

- Frontmatter parses, and carries the required fields with non-empty values.
- `name` matches its directory, and follows the character rules in the spec.
- `description` is inside the length limit, and names the situations that
  should trigger it rather than restating the title. Take the voice and
  phrasing rules from the selected reference. Do not apply an unsupported rule.
  A user-invoked skill is the exception. Step 4 covers its description.
- Body size follows the reference recommendations, and what sits in the body earns its place
  there instead of belonging in a reference.
- Progressive disclosure: references are loaded at the branch that needs them,
  they are named where the reader is, and they do not chain into each other.
- The body and the bundled files agree with each other. A reference whose
  example does the thing a gotcha in the body forbids will make the reader do
  it too. This is the one axis A check with no upstream line behind it, and it
  is still a finding: quote the two conflicting lines from the skill itself.
- Bundled scripts are portable, are documented, and state whether they are run
  or read.
- Host-specific constraints the spec lists, for the hosts the skill claims.

Shortcut: if `oss-kit:oss-skill` is installed, its bundled validator mechanizes
the frontmatter subset. Locate it with the file search method from Step 1, never by a hardcoded version path,
and take the highest version when several are installed. Compare the numbers,
not the strings: `0.14.0` beats `0.9.0`.

```
~/.claude/plugins/cache/*/*/*/skills/oss-skill/scripts/validate.mjs
```

Run it against the **plugin or repository root**, not the skill directory.
Pointed at a skill directory it reports a missing top-level `skills/`, which is
a false alarm about the wrong argument. Treat its output as evidence, and still
confirm each rule it reports against the selected guidance. The validator is a
stored copy and can be behind.

## Step 4: Axis B, host features

Use the selected host references for frontmatter, discovery and capabilities.
Normal mode assesses compatibility with their dates, not today's latest host.

- **Deprecated fields.** Diff the skill's frontmatter keys against the field
  list in the selected reference. An absent field is **Not checked**, not
  deprecated: the saved list may be incomplete or older than the target.
- **Fields the skill should use but does not.** `allowed-tools` when the skill
  needs scoped tool pre-approval, `disable-model-invocation` when the skill is meant
  to be user-invoked only, `license` and `compatibility` when the skill ships
  to other people.
- **Hand-rolled mechanisms that are now native.** A skill that describes how to
  fan work out to parallel workers, gate on a plan, ask the user a
  multiple-choice question, react to a tool call, or locate its own bundled
  files, when Claude Code now does that through subagents, plan mode,
  `AskUserQuestion`, hooks, or `CLAUDE_PLUGIN_ROOT`. Name the native feature
  and cite the reference rule that supports it.
- **Native features that fit, where the skill hand-rolls nothing.** The check
  above needs the skill to have reinvented something. This one does not. Read
  the procedure and ask which step the host could now carry. Most skills match
  no row: one that edits a single document in one pass matches none of them,
  and an empty result here is a result.

  | The skill has | Consider |
  |---|---|
  | A step that reads or scans many files into one context | Subagents, so the reading happens outside the caller's window |
  | Phases with no data dependency between them | Parallel subagents, dispatched in one message |
  | A sweep, audit, or migration over an unknown number of items | A dynamic workflow, which scripts the fan-out and can be rerun |
  | A free-text question with a small set of real answers | `AskUserQuestion` |
  | A rule the reader must not break, written as a warning | A hook, which enforces it instead of asking |
  | Parallel edits that would collide | Worktree isolation |
  | A step that must not run before the user agrees | Plan mode |

- **Stale tool and command names.** Check every tool name, slash command, and
  CLI invocation against the selected references. Mark unlisted names
  **Not checked**; only refresh mode follows general host documentation.
- **Host parity, when the skill also ships to Codex.** Codex reads the same
  SKILL.md but takes only `name` and `description` from its frontmatter; the
  Claude Code fields `disable-model-invocation` and `allowed-tools` have no
  effect there. Codex keeps its own switch in `agents/openai.yaml`. Take the
  field names, default, file location and parity table from the selected Codex
  reference, then check the two sides agree. Cite its policy rule in each
  parity finding. `allowed-tools` has no
  Codex counterpart, so note it under Checks that passed rather than reporting
  it. When the fix adds or edits `agents/openai.yaml`, keep the file to the
  keys the selected reference lists.
- **Trigger text in a user-invoked skill.** This applies when no host can
  invoke the skill on its own. On Claude Code that is
  `disable-model-invocation: true`. On Codex, when the skill ships there, it is
  `allow_implicit_invocation: false`. Find the
  selected Claude rule on what `disable-model-invocation` does to the
  description in context. When the rule says the description is not in context,
  trigger phrases, "Use when" clauses, and exclusions in it do no work. Grade
  it **Consider** and cite that rule. The fix is a one-line summary of what
  the command does, for the person who reads it in the `/` menu.

A skill that predates a feature is not wrong for missing it, and an author may
have chosen the simpler shape on purpose. So grade every fit at **Consider**,
and raise it only when the hand-rolled version actually misbehaves. This is the
check where a verifier starts inventing work: name the step that would change
and cite the supporting reference rule, or drop it.

## Step 5: Axis C, freshness

These checks remain live in both modes. Fetch only official evidence for the
target's specific claim or URL; do not turn them into a general guidance
refresh. Reuse successful requests within this run. Failures leave dependent
checks **Not checked**. Live target evidence does not update saved references.

- **Model names and IDs.** Fetch official lifecycle and availability documentation
  for each ID's provider and intended platform. A retired or unavailable ID is
  Blocking when the skill tells the reader to call it, and Should fix when it
  is only an example. A deprecated but callable ID is Should fix. A newer
  replacement alone is not a finding; verify any claim that the ID is latest
  separately. If availability cannot be established, mark it Not checked.
- **Time-bound phrasing.** `currently`, `as of`, `the latest`, `new in`,
  `recently`, bare years, and pinned version numbers. Each one is a claim with
  an expiry date. Either verify it against the fetched docs or rewrite it so it
  does not need verifying. Match whole words: `concurrently` contains
  `currently` and is not a finding.

  Use the relevant provider's official evidence. If it cannot settle a claim,
  mark it **Not checked** rather than declaring the fact wrong because its
  wording is dated.
- **Dead links.** Collect every URL in the skill and its bundled files, then
  batch one check. Feed the list on stdin: a URL with `&` or `?` in it breaks
  an unquoted `for` loop.

  ```bash
  while IFS= read -r u; do printf "%-70s " "$u"; \
    curl -sS -o /dev/null -w "%{http_code}\n" -L --max-time 20 "$u"; done <<'EOF'
  https://example.com/one
  https://example.com/two?a=1&b=2
  EOF
  ```

  Report each non-2xx with its code. A 404 on a URL the procedure depends on is
  Blocking.
- **Expensive doc URLs.** An HTML doc URL where the site serves `llms.txt` or
  the same page with an `.md` suffix. The `.md` variant costs a fraction of the
  context. Check for it before reporting.
- **Contradicted claims.** Any statement about the spec, about Claude Code, or
  about a tool that live target-specific evidence contradicts. Quote both lines in the
  finding, the skill's and the upstream one.

## Step 6: Axis D, upstream drift

Skip this step when Step 1 found no comparable source.

Use the selected GitHub reference for API limits and failure handling. Fetch
the target's comparison and changed content live in both modes.

For each source that carries `repository`, `path`, `branch`, and `sha`, one
call, all sources in one parallel batch:

```bash
curl -sS "https://api.github.com/repos/{repository}/compare/{sha}...{branch}"
```

Read `ahead_by`, `commits[].sha`, `commits[].commit.message`,
`files[].filename`, and `files[].status`. Record the head SHA from the original
comparison and pin follow-up requests to it rather than the moving branch.
Check completeness before filtering using the limits in the GitHub reference.
Paginate the commits when `total_commits` exceeds the returned count. The file
list appears only on the first page; pagination does not remove its limit.
If the file list reaches the saved limit, obtain a complete comparison of the pinned revisions
from a local checkout before deciding which paths changed. If complete commit
or file evidence is unavailable, mark that source **Not checked** and exclude
it from Step 8's SHA advancement.

Keep only the files under `path` in the complete comparison:
`path` may be a directory, one file, or `.` for a whole-repository fork.
`ahead_by: 0`, or no kept file, means the source is in sync. Record that under
Checks that passed and stop.

A 404 means the comparison is unavailable, not that history was rewritten.
Check the repository URL, access/authentication, and both refs before stating
a cause. If repository access and the head ref work but the stored `sha`
cannot be resolved, fall back to
`https://api.github.com/repos/{repository}/commits?path={path}&sha={branch}&per_page=30`,
read the messages, and say in each finding that the diff could not be
anchored. If repository access or the head ref remains unresolved, mark the comparison
**Not checked**; do not infer a force-push or squash from the status alone.
A 403 whose body
names the rate limit is a fetch failure: report it as **Not checked** like any
other.

For each kept file, fetch the current upstream text and diff it against the
local counterpart, in one batch:

```bash
curl -sS "https://raw.githubusercontent.com/{repository}/{head_sha}/{filename}" | diff -u <local file> -
```

For `type: copy` the local counterpart is the same relative path under the
skill. For `fork` and `merge` do not diff line by line: the local copy was
rewritten on purpose. Read the upstream commit messages and the changed hunks
as a list of ideas, and check each idea against the local body.

Keep a hunk only when one of these holds, and drop it otherwise:

- It fixes an error the local copy still carries.
- It adds a case, a rule, or a reference the local body does not cover, and
  that fits the local skill's scope.
- It removes something the local copy still says.

A hunk that only restyles is not a finding. A hunk that touches a part the
local copy dropped or rewrote on purpose is not a finding either: `sources.json`
says so in `modifications` and in a per-source `note` when it did.

Grade every kept hunk at **Consider**. Borrowing is the author's call. Raise it
to **Should fix** only when the upstream commit fixes something the local copy
still says wrong, and quote both lines. Evidence is the short upstream commit
SHA and message plus the quoted hunk. Fix is the hunk adapted to the local
file, or "borrow nothing, advance the sha".

## Step 7: Report

| Level | Meaning |
|---|---|
| **Blocking** | The skill fails to load, fails to trigger, or tells the reader to do something that no longer works |
| **Should fix** | The skill works, but is less reliable than it should be, or omits something it should carry |
| **Consider** | A judgment call. The author may have had a reason |

Report skeleton:

````markdown
# Skill verification: <name>

Guidance: saved | refreshed for this run
Verified against guidance refreshed on <date, or dates per reference>:
- <local reference path, source URLs and date>
Live target checks performed <date>:
- <specific URLs and checks, or none required>
- <repository>@<short sha> compared to <branch>@<short head sha>

Blocking: N · Should fix: N · Consider: N
<Not checked: which checks, and which fetch failed>

## Blocking

### <one-line summary>
**Axis**: A conformance | B features | C freshness | D upstream
**Location**: `path/to/SKILL.md:LINE`
**Problem**: what is wrong
**Evidence**: the saved rule with reference date and source, a labeled exact
upstream excerpt, live HTTP result, or conflicting lines from the target
**Fix**:
```diff
- old
+ new
```

## Checks that passed

One line per check, with the number or the rule it met.
````

Repeat the findings section per severity, and omit a severity that has no
findings. Always keep **Checks that passed**: without it the reader cannot tell
a check that passed from one that never ran. Axis D always leaves a line there:
in sync, or skipped with the reason. Always retain the guidance mode and dates,
including in a clean report. Separate cached checks from failed refreshes.
In refresh mode, include the proposed reference diff even when the target is clean.

## Step 8: Offer to apply the fixes

Present the changes and wait for explicit confirmation. Do not apply anything
before that, and do not apply the **Consider** findings at all unless the user
names them. Group the offer by severity so the user can take the Blocking
findings alone.

In refresh mode, also offer the staged reference updates. They need approval
even when they only change dates. Preserve failed source groups and their old
dates. Approval already given for specific edits remains valid; do not ask
again for the same authorized work.

After the user has taken or declined the axis D findings, offer one more edit:
set each compared source's `sha` in `sources.json` to the head commit from its
compare response, and `fetched_at` to today. The next run then starts from
there, and a declined hunk is not reported again. Offer it only for sources
that were completely compared in Step 6, and only after the user has seen the findings.

After applying, re-run Steps 3 to 6 on the changed file, reusing the selected guidance and
the compare responses already fetched. Expect an empty report. If a fix introduced a new finding, say
so rather than closing out.

## Notes

- **A clean skill produces no findings.** Verifying a healthy skill and
  returning a list of near-findings is the main failure mode of this skill. A
  finding needs supporting evidence, and Step 6 defines which upstream changes
  qualify. Drop unsupported findings, and let **Checks
  that passed** carry the work you did.
- **Steps 3 to 5 are a checklist of where to look, not of what to report.** A
  category with nothing under it is a normal outcome, not a failed run.
- **Use the selected host guidance for host-specific behavior.** Other skill-authoring
  guidance disagrees with itself: some of it says a description should be
  written to over-trigger, some says it should carry triggers only and never
  summarize the workflow. Apply the relevant host rule from the selected
  references and identify its source and date.
- **Style is not a finding.** Report what the selected guidance calls wrong.
  A skill that reads differently from your preference is not defective.
- **Upstream is a source of ideas, not of authority.** The local copy may have
  dropped, renamed, or rewritten upstream text on purpose, and `sources.json`
  says so when it did. Do not report a deliberate divergence as drift.
- **Verifying this skill.** A self-check refreshes all guidance sources and
  audits the verifier against the fresh evidence before offering saved updates.
