# Changelog

Each plugin carries its own version in `plugins/<name>/.claude-plugin/plugin.json`. Entries below are grouped by plugin; repository-level changes sit under `Marketplace`. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## Unreleased

### Marketplace

- Add a native Codex catalog at `.agents/plugins/marketplace.json` and a Codex install section in the README.
- Add `renames` for the ten plugin names removed since the `leo` bundle was split, so old installs migrate instead of failing.
- Point the catalog `$schema` at SchemaStore and move `description` to the top level.
- Add a CI workflow that runs `claude plugin validate --strict` on the catalog and every plugin.
- Rename the marketplace from `leo-toolkit` to `svyatov-agent-toolkit` in both catalogs. Existing registrations keep working under the old name; the README documents how to switch.
- Remove `command-creator`. Claude Code merged custom commands into skills and its docs now call `.claude/commands/` the older format, so the skill taught a superseded layout and referenced tools that no longer exist under those names. The name is mapped to `null` in `renames`.
- Group the README skills table into five sections (Delivery, Code and design, Web, Skills and marketplace, Writing) and set each catalog entry's `category` to the matching slug (`delivery`, `code-design`, `web`, `skill-tooling`, `writing`) in both catalogs.
- Rename `dep-review` to `dependabot-review`, `contribute` to `report-upstream`, and `browser-bugs` to `browser-compat`. Each old name maps to its new name in `renames`, so Claude Code moves existing installs over.

### All plugins

- Add `$schema` to every `plugin.json` (patch bump on each).
- Every slash-only skill (all except astro) gains `agents/openai.yaml` with `allow_implicit_invocation: false`, so Codex also waits for an explicit `$skill` call instead of triggering on a matching prompt (patch bump on each).
- astro 1.2.1, generate-favicon, grill-me, llms-visibility: manifest description now matches the catalog and README wording.
- browser-compat 2.0.1, generate-favicon 1.0.7, grill-me 1.0.7, humanizer 2.1.4, improve-architecture 1.1.4, llms-visibility 1.0.6, prior-art 1.0.4, verify-marketplace 1.0.3, verify-skill 1.2.1: the `SKILL.md` description is now the one-line catalog summary. These skills are slash-only, so Claude Code keeps the description out of context and Codex never matches on it, and the trigger lists they carried did nothing.

### adopt-release

- 1.0.0: new skill for adopting a new release of a library, runtime, or tool. It pins the version range, maps where the project touches the tool (pin sites, config, API, workarounds), reads upstream's release notes for every version in the range, sorts each change into Must, Adopt, Watch, or Skip, proves each kept item against a `path:line`, and applies the items the user picks.
- 1.0.1: an item that fails the `path:line` check goes to a new Checked section of the report with the reason it needs no change, so a "nothing to change" verdict shows what was checked. Each version's entry count is taken once from the fetched notes with `grep -c '^- '`, instead of estimated and recounted.

### atomic-commits

- 1.0.0: new skill imported from [thoughtbot/atomic-commits-plugin](https://github.com/thoughtbot/atomic-commits-plugin) (MIT). Guides work in atomic commits (pass CI, deployable, no dead code), one type of work per commit, PRs near 200 lines, and ships the upstream PostToolUse hook that nudges after Edit/Write when the uncommitted diff reaches 80 lines or the branch diff reaches 200. The hook also counts untracked files, and the staging step drops the interactive `git add --patch`.
- 1.0.1: the hook command quotes `${CLAUDE_PLUGIN_ROOT}`, so a plugin path with a space no longer splits the command. `claude plugin validate --strict` fails on the unquoted form.
- 1.0.2: the hook nudges once per 100-line step instead of after every Edit/Write past the threshold: the uncommitted diff at 80, 180, 280 lines, and the branch diff at 200, 300, 400 once the branch has commits. The last step is stored in `.git/atomic-commits-step` and follows the diff down, so a commit resets it and the next crossing nudges again. One session had drawn 156 nudges.

### browser-compat

- 1.0.6: the scope step no longer names the `Glob` tool, which is absent by default on macOS, Linux, and WSL, and the scan step now tells each subagent what to carry: the file list, its pass's patterns, and the catalog path. Dropped a time-bound "now recommends" claim from the catalog.
- 2.0.0: renamed from `browser-bugs` to `browser-compat`, so the name says it reads code for compatibility pitfalls and does not read like a second `browser-qa`. Invoke it as `/browser-compat`.

### browser-qa

- 1.0.0: new skill that checks a page, or the pages this branch changed, in a real browser at 375, 768, and 1280 px, reads the console and network log, and fixes only when asked.

### cut-release

- 1.1.1: a bot release PR opened with `GITHUB_TOKEN` starts no required checks, so the merge is refused. The run now closes and reopens the PR to start them, never merges with `--admin`, and names the problem in the report.
- 1.1.0: a repository that a release bot (release-please, changesets) releases now goes through the bot's open release PR: watch its checks, squash-merge it, and watch the publish. The publish watch finds the run by workflow file, and stops at a job waiting on environment approval to report the run URL.
- 1.0.0: new skill that turns the Unreleased changelog section into a tagged release: semver bump, `chore/release-X.Y.Z` branch, PR, squash merge, tag, and GitHub release, publishing only through the repository's own workflow.

### debrief-skill

- 1.0.0: new skill for debriefing a skill's runs from the Claude Code and Codex session transcripts. A bundled Node.js script lists the runs and prints each one as a timeline of user messages, tool calls, errors, denials, interrupts, and oversized results, with one summary line per subagent and its friction lines on request. The skill reads that timeline for friction, traces each item to a skill line, and proposes edits to the skill's source, not to the installed copy. `/debrief-skill` checks the newest run in this session; `/debrief-skill <name>` and `/debrief-skill all` read the runs of the last 30 days, and `/debrief-skill self` debriefs the previous debrief.
- 1.0.1: `compatibility` now asks for Node.js 18.17, the first 18.x release where `readdirSync` reads Codex session folders recursively. `allowed-tools` drops `Edit`, which pre-approved edits in the read-only turn, and `Grep` and `Glob`, which Claude Code leaves out by default on macOS and Linux. The arguments table header no longer contains `$ARGUMENTS`, which Claude Code replaced with the typed arguments. `self` now falls back to the last 30 days when the current run is the only one in the session.
- 1.0.2: `/debrief-skill` with no argument takes the newest run the user invoked, and a skill that another run loaded counts as part of that run. The skill now says a slice ends only at the next command the user types, which is what the script does.
- 1.0.3: a skill that loads straight from its source, a user skill or a symlink into a checkout, gets `(loads from source)` in the report header instead of a version, and the run checks `git status` there, because uncommitted edits in the source are what ran.
- 1.0.4: `/debrief-skill all in this session` reads every skill in the current session, and a skill that another run loaded is debriefed as its own skill, with the loading run's subagent told to attribute friction only to its own text. The combined `all` report renumbers findings and Watch items across skills, so every code is unique, and keeps each report's header and Smooth lines.
- 1.0.5: a run reads a transcript line in full with `limit: 1`, one line per call, since one line can hold a whole tool result and a Read over a range of them passes the Read token limit.
- 1.0.6: the bundled script gains `lines FILE LINE... [--max N]`, which prints several transcript lines in full in one call: each line's text, tool input, and tool result, capped at 4,000 characters each. The skill points there instead of one Read per line, so a subagent no longer writes its own reader.
- 1.0.7: a finding whose fix belongs in a file the skill follows, such as the repository's `AGENTS.md` or `CLAUDE.md`, cites that file's line and gets a code like any other, so the apply step can offer it by code.
- 1.0.8: `show` no longer ends a run at a built-in command such as `/reload-plugins`, only at the next skill the user invokes, and it takes `FILE:LINE-END` to print a long run in windows under the host's output limit. `lines` prints each line's timestamp, and an `all` dispatch passes each run's timestamp, so subagents stop digging for dates. Step 2 finds a GitHub marketplace's clone with `find` before asking the user, reads the plugin root from `marketplace.json`, and resolves a symlinked skill with `readlink`. An invocation with no calls is left out as empty. The report quotes the transcript line that shows the friction, lists the unrelated lines under `Unrelated:`, and an `all` merge keeps each subagent report whole apart from its codes.
- 1.0.9: for a skill that loads from its source, an uncommitted edit counts as what ran only when the file changed before the run started. A file changed after it, as when an earlier fix in the same session edited the skill, is debriefed against `git show HEAD:<path>`.

### dependabot-review

- 1.0.0: new skill imported from [thoughtbot/dependabot-review-skill-thoughtbot](https://github.com/thoughtbot/dependabot-review-skill-thoughtbot) (MIT). Reviews one Dependabot PR by URL or audits every open one: bump type, changelog and breaking changes, codebase impact, a Merge/Verify/Investigate/Hold verdict, and an opt-in PR comment.
- 1.0.1: pre-approve `grep`, `find`, and `Write` so codebase searches and the comment temp file do not prompt on macOS and Linux, run each audited PR in its own subagent, and ask for posting consent through `AskUserQuestion` after the idempotency check.
- 2.0.0: renamed from `dep-review` to `dependabot-review`, because it reviews Dependabot PRs only, not dependency changes in general. Invoke it as `/dependabot-review`.

### dependency-vetting

- 1.0.0: new skill, moved here from a personal dotfiles setup. Before a package or tool is installed, added, or recommended, it follows the upstream project's own docs to the published install command, uses the registry's own signals (`npm audit signatures`, PyPI attestations, `gh attestation verify`), and stops on any mismatch between the artifact and upstream.
- 1.0.1: the rule names the published import path next to the install command, so vetting a library dependency looks for the import line in the upstream README. `/debrief-skill` found this in a recent run.

### import-skill

- 1.0.6: the catalog entry template picks `category` from the five README groups instead of defaulting to `productivity`, and the README row goes under the matching group heading.
- 1.1.0: finalizing also writes the Codex catalog entry and the `CHANGELOG.md` line, and validates with `claude plugin validate --strict` in place of a JSON parse check. It accepts a `blob/.../SKILL.md` URL, reads the upstream SKILL.md frontmatter for the recommended name and a per-file `license:` that overrides the repo license, and asks before copying plugin-level files such as `hooks/` from outside the skill directory. The `plugin.json` template carries `$schema`. `/debrief-skill` found all of these in three recent runs.

### improve-architecture

- 1.1.5: the structural map counts callers with a symbol-aware search (LSP find references, CodeGraph) where one is available, and marks grep-based counts `grep-only`. A grep count misses a method used as a value and counts matches inside comments, so a symbol it reports as unused may still have callers.
- 1.1.6: the friction step reads the scoped hot spots in the main context, one file per call, since the verdict and the Step 5 briefs rest on code the run has seen. An Explore subagent handles only sweeps outside the hot spots.

### improve-tests

- 1.0.0: new skill that cuts a test suite to the tests that catch real bugs and its run time to the minimum. It takes a timed baseline, maps each test file's claims, names the break each claim catches, and moves each one: delete, demote to the cheapest level, merge, rewrite, or fix the flake. Where code hands work to a library (PDF, email, images, HTTP), the tests move to the data we hand it plus one adapter smoke test. Speed levers (factory cascades, per-test setup, hashing cost, sleeps, isolation, parallelism) count only when the profile shows the time they recover. Every deletion names where its claim stays covered, and every batch is re-timed against the baseline.
- 1.0.1: timing happens on a quiet machine with the load average recorded and no other suite running, and the final report times the base commit and the branch back to back, because numbers taken under different loads do not compare. The speed levers gain a way to time a suspect without a profiler (a one-line runner override, or a prepended timer), a warning that a backtrace-sampling thread over-reports IO, a lever for side effects that fixture setup fires (callbacks, event subscribers, broadcasts), and a default fake at the rendering library's entry point for tests that render only as setup.
- 1.0.2: the baseline step defines a quiet machine as no other test suite running, not a load threshold, and asks the user once when another suite is running. The speed levers say how to find waits a CPU profile cannot show, write timing sums from an after-all hook because `bun test` drops output printed at exit, and count a fixed poll interval in production code as a sleep.

### jury

- 1.0.0: new skill that puts a question or decision to a jury of 3 or 5 subagents. Jurors vote blind with distinct lenses that steer where they look but not how they vote, fresh reviewers critique the anonymized positions in shuffled order for one round, the foreman checks the disputed facts, and a vote change counts only when it names its reason. One seat runs on the Codex CLI when it is installed. The verdict always commits and carries the vote, the dissent, the riskiest assumption with a test, and the first action.
- 1.0.1: the Codex seat's terminal output goes to a log file, and the run reads the reason for a failure from its last lines instead of taking the whole echo into context. The foreman waits for every seat without a message per arrival, and the report no longer repeats the brief shown in Step 2.

### lefthook

- 1.0.0: new skill that proposes lefthook git hooks for a repository. It reads the configured linters and every check CI runs, mines git history and failed CI runs for what a hook would have caught, and audits an existing lefthook config against a checklist. Each proposal cites its evidence, uses the repository's own tools and runner, and sits at the right stage: staged-file fixers in pre-commit, whole-project checks in pre-push, a message check only where history shows a convention. Secret scanning is the one must-have, with betterleaks as the default and gitleaks where a verified org or a frozen config matters. Nothing lands without approval, and every approved job is run and timed before `lefthook install`.
- 1.0.1: the proposal table is sent as text before the approval questions, with a row for each covered or dropped item. Each question holds two to four options, so a grade with one proposal no longer makes a question the tool rejects. The job proof runs with `--no-stage-fixed` and checks each `glob` with `--file`. The history scan writes its report to a file and lists each finding's file. The JS install notes say the postinstall writes an example `lefthook.yml` and renames another manager's hooks to `.old`.

### llms-visibility

- 1.0.7: a new Step 0 maps which response headers the host lets the run set, confirms each conclusion with `curl -sI`, and asks the user about control panel or proxy access before calling a header step blocked.

### orchestrate

- 1.0.0: new skill that works through a repository's GitHub issues one at a time, unattended. It drives worker Claude Code sessions in a herdr pane: it verifies a spec once its last ticket closes, triages untriaged bugs, then implements, refactors, and merges each issue, and merges the lessons of each run into the repo. It answers worker dialogs and questions itself, stops on any unsafe action, and prints a friction log when it stops. The bundled `scripts/next-issue.mjs` picks the next issue: specs first, then bugs, then the rest, with blocked and assigned issues dropped.
- 1.1.0: each worker session starts with its own model and effort: Sonnet at `xhigh` implements and fixes, Opus at `xhigh` verifies a spec, and Opus at `high` triages, refactors and ships, and runs the retro. A different model from the implementer refactors the branch.
- 1.1.1: session A, which implements and fixes, runs Sonnet at `medium` effort instead of `xhigh`.

### refactor

- 1.2.6: a Minor verdict recommends applying the findings or leaving the code as is, with the deciding reason, before it asks.
- 1.2.5: a project under about 1,000 source lines is read directly, a few files per call, instead of through subagents. A Clean verdict ends the run without offering optional items; an item worth offering makes the verdict Minor.

### report-upstream

- 1.0.0: new skill that takes a dependency bug upstream: repository from package metadata, existing-report search, reproduction on the default branch, CONTRIBUTING rules, and a drafted issue or PR that waits for confirmation before submission.
- 2.0.0: renamed from `contribute` to `report-upstream`, because `contribute` read as contributing to the current repository. Invoke it as `/report-upstream`.
- 2.0.1: for Homebrew, take the repository from the formula's `urls.stable.url` or `urls.head.url`. The `homepage` can be a product website.
- 2.0.2: for a Go module on a vanity import path, take the repository from the `go-import` meta tag of `https://<module>?go-get=1`. The module path names the repository only when it starts with a forge host. `/debrief-skill` found this in a recent run.

### shortcuts

- 1.2.4: `/cprw` and `/wm` read whether the repository has GitHub Actions turned on, and skip the checks watch when it is off, instead of waiting 20 seconds for checks that never register.
- 1.2.3: `/cprw` and `/wm` wait 20 seconds and watch again when a pull request reports no checks, and treat it as green only if the second watch finds none too. CI registers a new pull request a few seconds late, so 1.2.2 could merge before CI started.
- 1.2.2: `/cprw` and `/wm` treat a pull request with no checks as green. Before, a repository without CI left the merge decision undefined.
- 1.2.1: `/c` adds an untracked local-tool directory such as `.codegraph/` to the root `.gitignore` and says so, instead of committing part of it or leaving it out. `/cprw` resets the local default branch to its remote after moving its commits to the new branch, and gives the push a 600000 ms timeout for long pre-push hooks. `/p` reads unpushed commits with `git log HEAD --not --remotes`, which the host injects where `@{upstream}` was refused, and reports the remote's reason for a rejected push instead of assuming the remote moved. `/fa` reports a finding fixed at only some of its sites as partly fixed. `/fci` drops the `Recent runs` line the host never ran and takes run IDs from the PR checks links. `/debrief-skill` found all of these in recent runs.
- 1.2.0: `/ww` ("what would you suggest?") answers the question the agent just asked: it explains the problem in plain words, weighs each option for and against, recommends one, and for a close, costly-to-reverse choice hands over a ready-to-run `/jury` line.
- 1.1.6: `/fa` counts an option as recommended only when the report says so in words. An option listed first or labelled "proposed" leaves the finding waiting on the user's choice.
- 1.1.5: `/fa` applies a proposed fix together with any change the fix cannot work without, and names that change on the finding's report line, instead of choosing between skipping the finding and guessing.
- 1.1.4: `/cprw` runs in the worktree that holds the session's work when the preamble's directory does not, and removes a clean worktree before `--delete-branch`. `/fa` applies the recommended option of a finding left as a choice, applies the fix a finding proposes rather than its own, and reports one line per finding.
- 1.1.3: `/cp` on the default branch reads the branch's rulesets first. When they require a pull request, it stops before committing and names `/cprw`, so no commit is left stranded on a local `main` that cannot be pushed.
- 1.1.2: `/cpr` and `/cprw` read every commit already on the branch, and title the pull request for the whole branch, since the squash merge makes that title the one commit on the default branch.
- 1.1.1: `/fa` reads `AGENTS.md`, `CLAUDE.md` and `CONTRIBUTING.md` in every repository it edited, this one or another, and runs their checks and required edits (a version bump, a changelog entry), so a fix in a sibling repository no longer ships unreleased.
- 1.1.0: nine more commands. `/p` push, `/m` squash merge now, `/fci` fix the failing CI run, `/prd` rewrite the PR title and body from the diff, `/cl` close the issues the PR resolved, `/deps` update outdated dependencies, `/docs` sync docs with the change, `/rule` add a rule to CLAUDE.md or AGENTS.md, `/lint` run every linter to zero.
- 1.0.0: new plugin bundling nine slash-only commands for the commit, push, pull request, CI, and merge loop: `/c`, `/cp`, `/cb`, `/cbp`, `/cpr`, `/cprw`, `/wm`, `/ci`, `/fa`.

### verify-marketplace

- 1.1.0: a cwd with a plugin manifest and no catalog is verified as that plugin instead of prompting for a repo. A plugin whose `source` is the marketplace root gets its component directories validated, since the validator opens no skill file on that root, and the CI check reports a workflow that skips them. Version drift uses `git log -G`, because `-S` returned the commit that added the `version` key rather than the last bump. The SchemaStore lookup gets a `curl -sSL` command on the `www` host the old URL redirects to, and doc sections are located with one anchored grep per file. `/debrief-skill` found all of these in four recent runs.

### verify-skill

- 1.2.0: new host-parity check compares `disable-model-invocation` in the frontmatter with `allow_implicit_invocation` in `agents/openai.yaml`, fetching the rule from developers.openai.com. Catalog and README wording now match the manifest.
- 1.3.0: new check for trigger text in the description of a user-invoked skill. The fetched `skills.md` says Claude Code keeps that description out of context, so the check grades it Consider and proposes a one-line summary. The Step 3 description check no longer asks such a skill for trigger situations.
- 1.4.0: a fan-out over many skills dispatches at most 20 subagents at once, the limit Claude Code enforces, and starts the next as one finishes. It fetches the three core docs once into a fresh `mktemp -d` directory that every subagent reads, where runs used to improvise a shared directory and collide with a previous run's files. A new fetch row covers `claude` CLI flags and environment variables through `cli-reference.md` and `env-vars.md`, so a run no longer falls back to the changelog for them. `/debrief-skill` found all three in five recent runs.
- 1.4.1: a fan-out merges the per-skill reports into one printout: a count table, every finding grouped by severity and tagged with its skill, then the clean skills, with findings numbered F1, F2 across the whole printout so Step 8 can take them by code. Runs used to invent their own merged format and codes. `/debrief-skill` found this in three recent runs.
