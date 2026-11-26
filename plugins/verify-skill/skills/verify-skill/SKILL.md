---
name: verify-skill
description: Verify skills against saved Agent Skills and host guidance, with live link and upstream checks. Self-checks and --refresh update the guidance.
license: MIT
compatibility: >
  Requires file access. Live target checks and guidance refreshes require curl
  and network access to official Agent Skills, Claude Code, Codex, Cursor,
  OMP documentation and relevant repositories.
  OMP guidance refresh uses the available GitHub CLI (gh) for revision pinning;
  without it, dependent refresh checks are Not checked. No CLI installation.
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

Keep audits passive: inspect files and links, not target scripts, hooks,
extensions or MCP execution. Do not register/install/update/remove plugins,
copy them into active discovery roots or launch with `--plugin-dir`.
Headless mode and install dry-run do not establish read-only behavior.
Qualify CLI suggestions by actual host availability; Claude validation is
only for Claude-format targets, not a universal Cursor or OMP validator.

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
| No target given | Ask which skill using the active host's question tool, or chat |

For multiple targets, follow [batch verification](references/batch.md) for shared evidence, worker capacity, dependency checks and reporting.

When resolving a name, follow [skill discovery](references/discovery.md).

For file targets, read the SKILL.md, then read every file it names: `references/`, `scripts/`,
`assets/`, and any bundled companion. A reference the body names but that does
not exist is a Blocking finding, so resolve each path even when the file
turns out to be missing.

Also read `agents/openai.yaml` in the skill directory when it exists. Step 4
compares it with the frontmatter.

Also read `sources.json` in the skill directory when it exists. Keep its
`sources[]` for Step 6. No `sources.json`, or no source that carries
`repository`, `path`, `branch`, and `sha` (a pasted skill has none), means axis
D is skipped and reported as one line under Checks that passed.

For file targets, record the last change date from `git log -1 --format=%cs -- <path>` or the file mtime outside a repository. Key the audit object by absolute skill path. For pasted text, use `paste:sha256:<digest>` computed from the original UTF-8 bytes, including line endings. Use an empty `files` object and mark filesystem-only checks inapplicable. Cite pasted lines by number. Record claims requiring unavailable companion evidence as **Not checked**.

Keep `audit.json` beside the report outside the target tree, at the caller's output location or in a fresh temporary directory. Report its path, or return the record inline when writing is unavailable.

```json
{"<target-key>": {"files": {"<file-path>": "<sha256>"}, "checks": {"<case-or-rule>": {"status": "pending", "owner": "<coordinator-or-worker>", "evidence": []}}, "findings": {"<rule-and-location>": {"code": "F1", "disposition": "open"}}}}
```

Hash the inspected skill and its relevant resources/configuration, including uncommitted contents. Check statuses are `pending`, `passed`, `finding`, `not_checked`, or `not_applicable`; evidence names the source location, result, or unresolved prerequisite. Final reports have no pending checks: retain unresolved ones as **Not checked**, with the reason. Finding dispositions are `open`, `deferred`, or `resolved`; retain their rule/location identity when display codes change.

When a prior record is supplied or available from this session's report, compare identities and dispositions. Label findings as still open, previously missed on unchanged content, or associated with changed content. Missing prior evidence means the history is unknown. Changed content alone does not prove a regression, and an earlier clean verdict never suppresses a supported new finding.

## Step 2: Select the guidance

Resolve these files relative to this verifier's skill directory, not the
target skill or working directory. Read only the rows needed for the target:

Select hosts from the active host, explicit requests, target compatibility claims and enclosing manifests/catalogs. Plain "Cursor" selects separate Cursor IDE and Cursor CLI targets. Classify conventional skill/provider versus portable Agent Plugins (root `plugin.json` with an Agent Plugins schema) before applying host rules. Record the evidence for that classification; shared Agent Skills conformance always applies, but a conformance defect is not automatically a host load failure.

| Condition | Reference |
|---|---|
| Every target, including descriptions, scripts and requested eval advice | [Agent Skills](references/agent-skills.md) |
| Claude Code skills, tools, plugins, CLI settings or parallel work | [Claude Code](references/claude-code.md) |
| Codex discovery or distribution, including `agents/openai.yaml` or a Codex plugin catalog | [Codex](references/codex.md) |
| Cursor IDE or CLI discovery, invocation or package claims | [Cursor](references/cursor.md), with IDE/CLI qualifications retained |
| OMP discovery, visibility, resources or packages | [OMP](references/omp.md), with provider and pinned implementation identified |
| A comparable source in `sources.json` | [GitHub comparisons](references/github.md) |
| A self-check or explicit `--refresh` | [Refresh procedure](references/refresh.md), plus all six rule references: Agent Skills, Claude Code, Codex, Cursor, OMP and GitHub |

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

Before marking a procedure checked, enumerate its documented input forms, successful and failed outcomes, and safety invariants. Trace each applicable case through the body, examples, and bundled helpers, recording its evidence or **Not checked** gap. When one branch violates an invariant, inspect the other branches and analogous operations governed by it before reporting. Reading every file is not evidence that every applicable case was checked; this pass remains passive.

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
- **Fields the skill should use but does not.** Recommend Claude `allowed-tools`
  for documented pre-approval only on Claude, and Claude explicit-only metadata
  only under its invocation rules. Use Codex YAML policy only for Codex.
  Cursor explicit invocation follows the documented surface and release.
  OMP hiding controls advertising, not model authorization. Check shared
  `license` and `compatibility` authoring guidance for distributed skills.
- **Hand-rolled mechanisms that are now native, on Claude Code only.** Check
  available subagents, plan mode, `AskUserQuestion`, hooks and
  `CLAUDE_PLUGIN_ROOT` against the Claude reference. Do not prescribe these
  features on other hosts without an applicable selected rule.
- **Native Claude features that fit, where the skill hand-rolls nothing.** The check
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
- **Host parity, when the skill ships to both Claude Code and Codex.** Codex reads the same
  SKILL.md but takes only `name` and `description` from its frontmatter; the
  Claude Code fields `disable-model-invocation` and `allowed-tools` have no
  effect there. Codex keeps its own switch in `agents/openai.yaml`. Take the
  field names, default, file location and parity table from the selected Codex
  reference, then check the two sides agree. Cite its policy rule in each
  parity finding. `allowed-tools` has no
  Codex counterpart, so note it under Checks that passed rather than reporting
  it. When the fix adds or edits `agents/openai.yaml`, keep the file to the
  keys the selected reference lists.
- **Other host/provider boundaries.** Apply Cursor discovery, invocation and
  CLI-warning rules without requiring Codex YAML or Claude tool features.
  On OMP distinguish conventional fields from the portable closed schema;
  reject unsupported portable keys only with the pinned validator evidence.
  Hidden OMP skills remain readable and explicitly invocable. Neither
  Claude tool metadata nor Codex policy proves OMP authorization.
- **Catalog-summary descriptions.** Decide whether each selected host advertises
  the description from its governing rule, not whether the model can access the
  file. When a description is not advertised, trigger lists do no work there:
  recommend a useful one-line menu summary at **Consider**. Retain trigger
  guidance where another claimed host still advertises the description.
  Cite the host's advertising rule; do not equate hiding with access control.

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
- **Dead links.** Classify URLs by their use in the target and bundled files. Batch-check literal dependencies and provenance URLs once, preserving query strings. Record illustrations without requesting them. Expand templates only from known target inputs and check the resulting URL. If a required input is missing, mark that check **Not checked**. Record final HTTP status or transport failure for each request. A confirmed 404 on a required URL is Blocking.
- **Expensive doc URLs.** An HTML doc URL where the site serves `llms.txt` or
  the same page with an `.md` suffix. The `.md` variant costs a fraction of the
  context. Check for it before reporting.
- **Contradicted claims.** Any statement about the spec, about Claude Code, or
  about a tool that live target-specific evidence contradicts. Quote both lines in the
  finding, the skill's and the upstream one.

## Step 6: Axis D, upstream drift

For each comparable source, follow [upstream comparison](references/upstream.md) using the selected GitHub limits. Otherwise record why axis D was skipped.

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
Hosts/surfaces: <selected hosts, IDE/CLI separately, and selection evidence>
Package/provider: <conventional provider | portable Agent Plugins | host plugin, evidence>
Verified against guidance refreshed on <date, or dates per reference>:
- <local reference path, source URLs and date>
Live target checks performed <date>:
- <specific URLs and checks, or none required>
- <repository>@<short sha> compared to <branch>@<short head sha>

Blocking: N · Should fix: N · Consider: N
<Not checked: which checks, and which fetch failed>
Audit record: <path, or inline record if writing is unavailable>
Coverage: <checked cases and unresolved gaps; prior finding dispositions when available>

## Blocking

### <one-line summary>
**Axis**: A conformance | B features | C freshness | D upstream
**Hosts**: <applicable hosts/surfaces; shared conformance when host-neutral>
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
set each completely compared source's `sha` in `sources.json` to its verified pinned head and `fetched_at` to today. The next run then starts from
there, and a declined hunk is not reported again. Offer it only for sources
that were completely compared in Step 6, and only after the user has seen the findings.

For approved fixes, include the affected case/invariant checks in the implementation handoff, even when another skill applies them. After application, re-run Steps 3 to 6 on the repaired contract, its adjacent branches, relevant resources, and directly affected callers, reusing the selected guidance and valid fetched evidence. Update file identities, check evidence, and finding dispositions in the audit record.

Close an approved finding only when its acceptance case and affected invariants pass. Repository tests alone do not establish this semantic recheck. Report unresolved and deferred items rather than expecting an empty report. Fix regressions within the approved scope; present unrelated new findings for approval. If the recheck has not run, state that verification is pending instead of reporting closure.

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
