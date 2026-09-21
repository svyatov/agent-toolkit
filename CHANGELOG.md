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

### All plugins

- Add `$schema` to every `plugin.json` (patch bump on each).
- Every slash-only skill (all except astro) gains `agents/openai.yaml` with `allow_implicit_invocation: false`, so Codex also waits for an explicit `$skill` call instead of triggering on a matching prompt (patch bump on each).
- astro 1.2.1, generate-favicon, grill-me, llms-visibility: manifest description now matches the catalog and README wording.

### atomic-commits

- 1.0.0: new skill imported from [thoughtbot/atomic-commits-plugin](https://github.com/thoughtbot/atomic-commits-plugin) (MIT). Guides work in atomic commits (pass CI, deployable, no dead code), one type of work per commit, PRs near 200 lines, and ships the upstream PostToolUse hook that nudges after Edit/Write when the uncommitted diff reaches 80 lines or the branch diff reaches 200. The hook also counts untracked files, and the staging step drops the interactive `git add --patch`.

### browser-bugs

- 1.0.6: the scope step no longer names the `Glob` tool, which is absent by default on macOS, Linux, and WSL, and the scan step now tells each subagent what to carry: the file list, its pass's patterns, and the catalog path. Dropped a time-bound "now recommends" claim from the catalog.

### browser-qa

- 1.0.0: new skill that checks a page, or the pages this branch changed, in a real browser at 375, 768, and 1280 px, reads the console and network log, and fixes only when asked.

### contribute

- 1.0.0: new skill that takes a dependency bug upstream: repository from package metadata, existing-report search, reproduction on the default branch, CONTRIBUTING rules, and a drafted issue or PR that waits for confirmation before submission.

### cut-release

- 1.0.0: new skill that turns the Unreleased changelog section into a tagged release: semver bump, `chore/release-X.Y.Z` branch, PR, squash merge, tag, and GitHub release, publishing only through the repository's own workflow.

### dep-review

- 1.0.0: new skill imported from [thoughtbot/dependabot-review-skill-thoughtbot](https://github.com/thoughtbot/dependabot-review-skill-thoughtbot) (MIT). Reviews one Dependabot PR by URL or audits every open one: bump type, changelog and breaking changes, codebase impact, a Merge/Verify/Investigate/Hold verdict, and an opt-in PR comment.
- 1.0.1: pre-approve `grep`, `find`, and `Write` so codebase searches and the comment temp file do not prompt on macOS and Linux, run each audited PR in its own subagent, and ask for posting consent through `AskUserQuestion` after the idempotency check.

### shortcuts

- 1.1.0: nine more commands. `/p` push, `/m` squash merge now, `/fci` fix the failing CI run, `/prd` rewrite the PR title and body from the diff, `/cl` close the issues the PR resolved, `/deps` update outdated dependencies, `/docs` sync docs with the change, `/rule` add a rule to CLAUDE.md or AGENTS.md, `/lint` run every linter to zero.
- 1.0.0: new plugin bundling nine slash-only commands for the commit, push, pull request, CI, and merge loop: `/c`, `/cp`, `/cb`, `/cbp`, `/cpr`, `/cprw`, `/wm`, `/ci`, `/fa`.

### verify-skill

- 1.2.0: new host-parity check compares `disable-model-invocation` in the frontmatter with `allow_implicit_invocation` in `agents/openai.yaml`, fetching the rule from developers.openai.com. Catalog and README wording now match the manifest.
