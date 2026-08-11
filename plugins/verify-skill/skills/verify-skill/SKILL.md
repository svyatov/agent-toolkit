---
name: verify-skill
description: >
  Verify that a skill follows the current Agent Skills specification and
  Anthropic authoring guidance, uses current Claude Code features, and states
  current information. Fetches the rules from agentskills.io and
  code.claude.com at run time instead of checking against a stored copy, so the
  verdict tracks upstream. Use when the user asks to verify, audit, review,
  check, lint, or grade a skill or a SKILL.md, asks whether a skill is
  up to date or still correct, asks why a skill never triggers, or asks to
  bring an old or imported skill up to current practice. Also use after
  writing or importing a skill, before publishing one, and when a skill
  mentions a model name, a version number, or a URL that may have moved.
  Do not use to write a new skill from scratch, or to check anything that is
  not a skill.
license: MIT
compatibility: >
  Requires curl and network access to agentskills.io, code.claude.com, and
  docs.claude.com. Read-only until the user approves a fix. No install and no
  dependencies.
allowed-tools: Bash Read Grep Glob Edit
---

# Verify Skill

Skill-authoring guidance changes faster than any skill that copies it. So this
skill copies none of it. Every rule applied here is fetched from the upstream
docs on each run, and every finding quotes the fetched line it came from.

Three axes:

- **A. Conformance** to the current spec and authoring guidance.
- **B. Currency** of the Claude Code features the skill uses.
- **C. Freshness** of the information the skill states.

## Step 1: Resolve the target

| Trigger | Scope |
|---|---|
| A path to a SKILL.md or to a skill directory | That skill |
| A skill or plugin name | Find it, then verify it |
| "all skills in \<dir\>" or "all my skills" | Every SKILL.md below that root, one report each |
| Pasted skill content, no file | Verify the text, skip the file-layout checks |
| No target given | Ask which skill, with `AskUserQuestion` |

To find a skill by name, Glob these roots in order and stop at the first hit:

```
plugins/*/skills/*/SKILL.md
skills/*/SKILL.md
~/.claude/skills/*/SKILL.md
~/.claude/plugins/cache/*/*/*/skills/**/SKILL.md
```

Read the SKILL.md, then read every file it names: `references/`, `scripts/`,
`assets/`, and any bundled companion. A reference the body names but that does
not exist is a Blocking finding, so resolve each path even when the file
turns out to be missing.

Record the skill's last change date. `git log -1 --format=%cs -- <path>` inside
a repository, the file mtime otherwise. Step 2 needs it.

## Step 2: Fetch the current guidance

Always fetch these three, in **one turn with parallel calls**:

```bash
curl -sSL https://agentskills.io/specification.md
curl -sSL https://agentskills.io/skill-creation/best-practices.md
curl -sSL https://code.claude.com/docs/en/skills.md
```

Use the `.md` URLs. The HTML pages carry the same text at ten times the size.

Then fetch by condition, again in one parallel batch:

| Condition | Also fetch |
|---|---|
| The skill's description is vague, or the user reports it never triggers | `https://agentskills.io/skill-creation/optimizing-descriptions.md` |
| The skill bundles `scripts/` | `https://agentskills.io/skill-creation/using-scripts.md` |
| The user asks how to prove the skill works | `https://agentskills.io/skill-creation/evaluating-skills.md` |
| The skill names a Claude Code tool, or spells out a procedure that one named tool now performs | `https://code.claude.com/docs/en/tools-reference.md` |
| The skill scans many files, sweeps an unknown number of items, or has phases that could run at once | `https://code.claude.com/docs/en/agents.md`, which compares subagents, agent teams, and dynamic workflows in 9 KB |
| That comparison points at a scripted fan-out | `https://code.claude.com/docs/en/workflows.md` |
| A tool or command name appears in neither `skills.md` nor `tools-reference.md` | `https://code.claude.com/docs/en/changelog.md` |
| The skill uses `${CLAUDE_PLUGIN_ROOT}` or a plugin-only frontmatter field | `https://code.claude.com/docs/en/plugins-reference.md` |
| The skill is more than a month older than today | `https://code.claude.com/docs/en/whats-new/index.md` |

`changelog.md` is around 500 KB. Fetch it only to settle a name that the two
smaller docs do not carry, never as a background read.

From `whats-new/index.md`, take the weeks dated after the skill's last change.
Read the index one-line summaries first, and open only the weeks whose summary
touches skills, subagents, plugins, or a capability the skill actually uses.
Match on what the skill does, not on the words it contains: a skill about
browsers does not need the week that gave Claude Code a browser. Cap it at
eight pages: for an older skill, read the newest eight and say in the report
header that the window was capped. A missing week is an upstream gap, not a
broken URL. Skip it.

If a fetch fails, say so in the report header and mark every check that
depended on it as **Not checked**. Never fall back to remembered rules: a
remembered rule is the failure this skill exists to prevent.

For the deeper authoring rationale, when a judgment call needs it:
`https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices.md`

## Step 3: Axis A, conformance

Derive every threshold from the fetched spec and best-practices. Do not carry
numbers in your head, and do not accept numbers quoted by other skills.

Check these categories, and for each one find the governing rule in the fetched
text first:

- Frontmatter parses, and carries the required fields with non-empty values.
- `name` matches its directory, and follows the character rules in the spec.
- `description` is inside the length limit, and names the situations that
  should trigger it rather than restating the title. Take the voice and
  phrasing rules from the fetched text. Do not apply one you cannot quote.
- Body size is inside the limit, and what sits in the body earns its place
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
the frontmatter subset. Locate it by Glob, never by a hardcoded version path,
and take the highest version when several are installed. Compare the numbers,
not the strings: `0.14.0` beats `0.9.0`.

```
~/.claude/plugins/cache/*/*/*/skills/oss-skill/scripts/validate.mjs
```

Run it against the **plugin or repository root**, not the skill directory.
Pointed at a skill directory it reports a missing top-level `skills/`, which is
a false alarm about the wrong argument. Treat its output as evidence, and still
confirm each rule it reports against the fetched spec. The validator is a
stored copy and can be behind.

## Step 4: Axis B, current Claude Code features

Confirm the current frontmatter field list against the fetched `skills.md`
before applying any of this. The list moves.

- **Deprecated fields.** Diff the skill's frontmatter keys against the field
  table in the fetched docs. Name no field as deprecated from memory, and
  accept none on another skill's say-so: `when_to_use` is widely repeated as
  deprecated, and the fetched `skills.md` still lists it as supported. The
  table you just fetched is the only authority here.
- **Fields the skill should use but does not.** `allowed-tools` when the skill
  needs a narrow tool set, `disable-model-invocation` when the skill is meant
  to be user-invoked only, `license` and `compatibility` when the skill ships
  to other people.
- **Hand-rolled mechanisms that are now native.** A skill that describes how to
  fan work out to parallel workers, gate on a plan, ask the user a
  multiple-choice question, react to a tool call, or locate its own bundled
  files, when Claude Code now does that through subagents, plan mode,
  `AskUserQuestion`, hooks, or `${CLAUDE_PLUGIN_ROOT}`. Name the native feature
  and quote the doc line that introduces it.
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
  CLI invocation the skill names against the fetched docs and changelog.

A skill that predates a feature is not wrong for missing it, and an author may
have chosen the simpler shape on purpose. So grade every fit at **Consider**,
and raise it only when the hand-rolled version actually misbehaves. This is the
check where a verifier starts inventing work: name the step that would change
and quote the doc line, or drop it.

## Step 5: Axis C, freshness

- **Model names and IDs.** Compare each against the current family in the
  fetched docs. A superseded model ID is Blocking when the skill tells the
  reader to call it, and Should fix when it is only an example.
- **Time-bound phrasing.** `currently`, `as of`, `the latest`, `new in`,
  `recently`, bare years, and pinned version numbers. Each one is a claim with
  an expiry date. Either verify it against the fetched docs or rewrite it so it
  does not need verifying. Match whole words: `concurrently` contains
  `currently` and is not a finding.

  When the skill's subject is not Claude Code, for example a skill about
  browsers or about a third-party API, the fetched docs cannot settle the fact.
  Say so in the finding, and report the expired phrasing rather than the fact.
  The evidence is then the phrase itself.
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
  about a tool that the fetched docs now contradict. Quote both lines in the
  finding, the skill's and the upstream one.

## Step 6: Report

| Level | Meaning |
|---|---|
| **Blocking** | The skill fails to load, fails to trigger, or tells the reader to do something that no longer works |
| **Should fix** | The skill works, but is less reliable than it should be, or omits something it should carry |
| **Consider** | A judgment call. The author may have had a reason |

Report skeleton:

````markdown
# Skill verification: <name>

Verified against docs fetched <date>:
- https://agentskills.io/specification.md
- https://agentskills.io/skill-creation/best-practices.md
- https://code.claude.com/docs/en/skills.md
- <any conditional source>

Blocking: N · Should fix: N · Consider: N
<Not checked: which checks, and which fetch failed>

## Blocking

### <one-line summary>
**Axis**: A conformance | B features | C freshness
**Location**: `path/to/SKILL.md:LINE`
**Problem**: what is wrong
**Evidence**: the fetched doc line, the HTTP code, the two conflicting lines
inside the skill, or the expired phrase itself. Quoted
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
a check that passed from one that never ran. When nothing at all is found, that
section plus one line is the whole report.

## Step 7: Offer to apply the fixes

Present the changes and wait for explicit confirmation. Do not apply anything
before that, and do not apply the **Consider** findings at all unless the user
names them. Group the offer by severity so the user can take the Blocking
findings alone.

After applying, re-run Steps 3 to 5 on the changed file, reusing the docs
already fetched. Expect an empty report. If a fix introduced a new finding, say
so rather than closing out.

## Notes

- **A clean skill produces no findings.** Verifying a healthy skill and
  returning a list of near-findings is the main failure mode of this skill. A
  finding needs the quote that makes it a finding, and Step 6 names the four
  things that count as one. No quote, no finding: drop it, and let **Checks
  that passed** carry the work you did.
- **Steps 3 to 5 are a checklist of where to look, not of what to report.** A
  category with nothing under it is a normal outcome, not a failed run.
- **The fetched Anthropic docs win any conflict.** Other skill-authoring
  guidance disagrees with itself: some of it says a description should be
  written to over-trigger, some says it should carry triggers only and never
  summarize the workflow. Do not arbitrate. Apply what the fetched docs say and
  quote it.
- **Style is not a finding.** Report what the fetched guidance calls wrong.
  A skill that reads differently from your preference is not defective.
- **Verifying this skill.** It has the same expiry as any other. Run it on
  itself.
