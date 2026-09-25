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

### atomic-commits

- 1.0.0: new skill imported from [thoughtbot/atomic-commits-plugin](https://github.com/thoughtbot/atomic-commits-plugin) (MIT). Guides work in atomic commits (pass CI, deployable, no dead code), one type of work per commit, PRs near 200 lines, and ships the upstream PostToolUse hook that nudges after Edit/Write when the uncommitted diff reaches 80 lines or the branch diff reaches 200. The hook also counts untracked files, and the staging step drops the interactive `git add --patch`.
- 1.0.1: the hook command quotes `${CLAUDE_PLUGIN_ROOT}`, so a plugin path with a space no longer splits the command. `claude plugin validate --strict` fails on the unquoted form.

### browser-compat

- 1.0.6: the scope step no longer names the `Glob` tool, which is absent by default on macOS, Linux, and WSL, and the scan step now tells each subagent what to carry: the file list, its pass's patterns, and the catalog path. Dropped a time-bound "now recommends" claim from the catalog.
- 2.0.0: renamed from `browser-bugs` to `browser-compat`, so the name says it reads code for compatibility pitfalls and does not read like a second `browser-qa`. Invoke it as `/browser-compat`.

### browser-qa

- 1.0.0: new skill that checks a page, or the pages this branch changed, in a real browser at 375, 768, and 1280 px, reads the console and network log, and fixes only when asked.

### cut-release

- 1.1.0: a repository that a release bot (release-please, changesets) releases now goes through the bot's open release PR: watch its checks, squash-merge it, and watch the publish. The publish watch finds the run by workflow file, and stops at a job waiting on environment approval to report the run URL.
- 1.0.0: new skill that turns the Unreleased changelog section into a tagged release: semver bump, `chore/release-X.Y.Z` branch, PR, squash merge, tag, and GitHub release, publishing only through the repository's own workflow.

### debrief-skill

- 1.0.0: new skill for debriefing a skill's runs from the Claude Code and Codex session transcripts. A bundled Node.js script lists the runs and prints each one as a timeline of user messages, tool calls, errors, denials, interrupts, and oversized results, with one summary line per subagent and its friction lines on request. The skill reads that timeline for friction, traces each item to a skill line, and proposes edits to the skill's source, not to the installed copy. `/debrief-skill` checks the newest run in this session; `/debrief-skill <name>` and `/debrief-skill all` read the runs of the last 30 days, and `/debrief-skill self` debriefs the previous debrief.
- 1.0.1: `compatibility` now asks for Node.js 18.17, the first 18.x release where `readdirSync` reads Codex session folders recursively. `allowed-tools` drops `Edit`, which pre-approved edits in the read-only turn, and `Grep` and `Glob`, which Claude Code leaves out by default on macOS and Linux. The arguments table header no longer contains `$ARGUMENTS`, which Claude Code replaced with the typed arguments. `self` now falls back to the last 30 days when the current run is the only one in the session.
- 1.0.2: `/debrief-skill` with no argument takes the newest run the user invoked, and a skill that another run loaded counts as part of that run. The skill now says a slice ends only at the next command the user types, which is what the script does.
- 1.0.3: a skill that loads straight from its source, a user skill or a symlink into a checkout, gets `(loads from source)` in the report header instead of a version, and the run checks `git status` there, because uncommitted edits in the source are what ran.
- 1.0.4: `/debrief-skill all in this session` reads every skill in the current session, and a skill that another run loaded is debriefed as its own skill, with the loading run's subagent told to attribute friction only to its own text. The combined `all` report renumbers findings and Watch items across skills, so every code is unique, and keeps each report's header and Smooth lines.
- 1.0.5: a run reads a transcript line in full with `limit: 1`, one line per call, since one line can hold a whole tool result and a Read over a range of them passes the Read token limit.

### dependabot-review

- 1.0.0: new skill imported from [thoughtbot/dependabot-review-skill-thoughtbot](https://github.com/thoughtbot/dependabot-review-skill-thoughtbot) (MIT). Reviews one Dependabot PR by URL or audits every open one: bump type, changelog and breaking changes, codebase impact, a Merge/Verify/Investigate/Hold verdict, and an opt-in PR comment.
- 1.0.1: pre-approve `grep`, `find`, and `Write` so codebase searches and the comment temp file do not prompt on macOS and Linux, run each audited PR in its own subagent, and ask for posting consent through `AskUserQuestion` after the idempotency check.
- 2.0.0: renamed from `dep-review` to `dependabot-review`, because it reviews Dependabot PRs only, not dependency changes in general. Invoke it as `/dependabot-review`.

### dependency-vetting

- 1.0.0: new skill, moved here from a personal dotfiles setup. Before a package or tool is installed, added, or recommended, it follows the upstream project's own docs to the published install command, uses the registry's own signals (`npm audit signatures`, PyPI attestations, `gh attestation verify`), and stops on any mismatch between the artifact and upstream.

### import-skill

- 1.0.6: the catalog entry template picks `category` from the five README groups instead of defaulting to `productivity`, and the README row goes under the matching group heading.

### jury

- 1.0.0: new skill that puts a question or decision to a jury of 3 or 5 subagents. Jurors vote blind with distinct lenses that steer where they look but not how they vote, fresh reviewers critique the anonymized positions in shuffled order for one round, the foreman checks the disputed facts, and a vote change counts only when it names its reason. One seat runs on the Codex CLI when it is installed. The verdict always commits and carries the vote, the dissent, the riskiest assumption with a test, and the first action.

### report-upstream

- 1.0.0: new skill that takes a dependency bug upstream: repository from package metadata, existing-report search, reproduction on the default branch, CONTRIBUTING rules, and a drafted issue or PR that waits for confirmation before submission.
- 2.0.0: renamed from `contribute` to `report-upstream`, because `contribute` read as contributing to the current repository. Invoke it as `/report-upstream`.

### shortcuts

- 1.1.3: `/cp` on the default branch reads the branch's rulesets first. When they require a pull request, it stops before committing and names `/cprw`, so no commit is left stranded on a local `main` that cannot be pushed.
- 1.1.2: `/cpr` and `/cprw` read every commit already on the branch, and title the pull request for the whole branch, since the squash merge makes that title the one commit on the default branch.
- 1.1.1: `/fa` reads `AGENTS.md`, `CLAUDE.md` and `CONTRIBUTING.md` in every repository it edited, this one or another, and runs their checks and required edits (a version bump, a changelog entry), so a fix in a sibling repository no longer ships unreleased.
- 1.1.0: nine more commands. `/p` push, `/m` squash merge now, `/fci` fix the failing CI run, `/prd` rewrite the PR title and body from the diff, `/cl` close the issues the PR resolved, `/deps` update outdated dependencies, `/docs` sync docs with the change, `/rule` add a rule to CLAUDE.md or AGENTS.md, `/lint` run every linter to zero.
- 1.0.0: new plugin bundling nine slash-only commands for the commit, push, pull request, CI, and merge loop: `/c`, `/cp`, `/cb`, `/cbp`, `/cpr`, `/cprw`, `/wm`, `/ci`, `/fa`.

### verify-skill

- 1.2.0: new host-parity check compares `disable-model-invocation` in the frontmatter with `allow_implicit_invocation` in `agents/openai.yaml`, fetching the rule from developers.openai.com. Catalog and README wording now match the manifest.
- 1.3.0: new check for trigger text in the description of a user-invoked skill. The fetched `skills.md` says Claude Code keeps that description out of context, so the check grades it Consider and proposes a one-line summary. The Step 3 description check no longer asks such a skill for trigger situations.
- 1.4.0: a fan-out over many skills dispatches at most 20 subagents at once, the limit Claude Code enforces, and starts the next as one finishes. It fetches the three core docs once into a fresh `mktemp -d` directory that every subagent reads, where runs used to improvise a shared directory and collide with a previous run's files. A new fetch row covers `claude` CLI flags and environment variables through `cli-reference.md` and `env-vars.md`, so a run no longer falls back to the changelog for them. `/debrief-skill` found all three in five recent runs.
