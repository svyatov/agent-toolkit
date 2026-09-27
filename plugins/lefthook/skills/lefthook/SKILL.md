---
name: lefthook
description: 'Propose lefthook git hooks for a repository from its linters, CI checks, and git history: secret scanning, staged-file fixers, pre-push checks, and commit message rules, each approved and proven before it lands'
license: MIT
compatibility: Requires git and AskUserQuestion. Uses the gh CLI for CI history when it is installed and authenticated.
disable-model-invocation: true
argument-hint: '[package path in a monorepo]'
---

# Lefthook

Propose lefthook jobs for this repository, and write only the ones the user approves. Every proposal stands on **evidence**: a tool the repository already configures, a check its CI already runs, or a commit in its history that a hook would have caught. Secret scanning is the one proposal that needs no evidence. A repository whose hooks already cover what the evidence shows gets that answer, and the run stops there.

Lefthook facts and the audit checklist are in [references/config.md](references/config.md). Job recipes, the secret scanner choice, and per-tool flags are in [references/recipes.md](references/recipes.md). With an argument, scope steps 2 to 7 to that package path and give its jobs `root:`.

## 1. Read the hook state

```sh
lefthook version
gh api repos/evilmartians/lefthook/releases/latest --jq '.tag_name + " " + .published_at'
git config --get core.hooksPath; git config --global --get core.hooksPath
ls .git/hooks | grep -v '\.sample$'
```

`config.md` records the lefthook version it was checked against. When the latest release is newer, read the CHANGELOG entries since that version (`curl -sL https://raw.githubusercontent.com/evilmartians/lefthook/master/CHANGELOG.md`) and apply any renamed or removed key to what you write.

List every lefthook config file by the names in `config.md`, and run `lefthook dump` when one exists. List every other hook source: `.husky/`, `.pre-commit-config.yaml`, `.overcommit.yml`, `simple-git-hooks` or `lint-staged` in `package.json`, a hook file in `.git/hooks` that lefthook did not write.

Done when every hook source in the repository is named, with the checks each one runs.

## 2. Read the repository facts

Collect:

- the manifests and the tool runner the repository uses: `mise.toml` or `.tool-versions`, the JS package manager from its lockfile, `Gemfile`, `pyproject.toml` with uv or poetry, `Cargo.toml`, `go.mod`;
- each linter, formatter, and type checker that has a config file or a manifest entry;
- task scripts: `package.json` scripts, `Makefile`, `justfile`, `Rakefile`, mise tasks;
- every check the CI workflows run, step by step;
- monorepo package roots.

Done when each CI check is matched to the local command that runs it, or marked as having none.

## 3. Mine the evidence

This is the analyze half: find what hooks would have caught.

```sh
git log -300 --format='%h %ad %s' --date=short
gh run list --status failure --limit 50 --json databaseId,workflowName,displayTitle,createdAt
```

Look for:

- **fix-up commits**: subjects about lint, format, style, typo, whitespace, "fix ci", "fix build", or a tool name (rubocop, prettier, eslint, ruff);
- **secret removals**: subjects about removing or rotating a key, token, password, or `.env`;
- **message convention**: the share of subjects in one format (Conventional Commits, a ticket prefix). A clear majority is evidence for a commit-msg job; a mix is not;
- **CI failures**: for the most recent failures of each workflow, the failed step (`gh run view <id> --json jobs --jq '.jobs[] | select(.conclusion=="failure") | .name, (.steps[] | select(.conclusion=="failure") | .name)'`). Read `--log-failed` only when the step name does not say which check failed.

Without `gh`, or with no remote, say so once and continue on git history alone.

Done when each piece of evidence is tied to the check that would have caught it, or noted as one no hook catches.

## 4. Audit the existing config

When lefthook config exists, walk every item of the audit checklist in `config.md` against the `lefthook dump` output. Each hit becomes a proposal in step 5 with the checklist item as its evidence.

When another hook manager is active, its checks become proposals to port, and removing it becomes one proposal of its own. Two managers fighting over `.git/hooks` is the first thing to settle.

Done when every checklist item is marked hit or clear.

## 5. Build the proposals

Code each one `H1`, `H2`, and so on. A proposal clears this bar:

1. **Evidence.** It cites a config file, a CI step, a commit, a checklist hit, or the must-have.
2. **The repository's own tools.** It runs a tool the repository already has, through the repository's runner (`bun run`, `bundle exec`, `uv run`, `mise exec`), with the flags `recipes.md` gives for that tool. The secret scanner is the one new tool.
3. **The right stage.**
   - pre-commit stays **tight**: staged files only through `{staged_files}` and a `glob`, fixers with `stage_fixed: true`, `parallel: true`, a few seconds in total.
   - pre-push takes whole-project checks that CI runs: type checks, tests, builds. It uses `{push_files}` where the tool takes a file list.
   - commit-msg takes a message check only where step 3 found a convention.
4. **Not covered.** A job already in the config or another manager that runs the same check covers it: list it as covered and move on.

Grade each proposal:

- **Must**: the secret scan (see `recipes.md`), and making lefthook install itself for every clone when it is not in the repository's manifests yet.
- **Evidence**: CI runs the check, or history shows it failing, or the audit hit it.
- **Available**: the tool is configured, and nothing shows the check failing.

Done when every tool from step 2 and every piece of evidence from steps 3 and 4 is a proposal, covered, or dropped with a one-line reason.

## 6. Propose

Write one table as message text: code, hook, job name, command, evidence, grade, and one row for each item covered or dropped in step 5, with its reason. Send the table in the same message, before the `AskUserQuestion` call. The option descriptions do not replace it: the user approves from the table. Then ask:

1. The secret scanner, once: betterleaks (recommended) or gitleaks, with the one-line reason `recipes.md` gives for each. Skip the question when the repository already runs one and the user has not asked to switch.
2. Per grade, a multiSelect of its proposals, Must first. Each question holds two to four options: split a grade over several questions when it has more than four, and put a grade with one proposal in the question of the next grade. Do not add a "None" option. With only one proposal in total, ask a single-select: Add or Skip.

Nothing is written without its own approval. Zero proposals is a valid result: say what already covers the repository, and stop.

## 7. Write, then prove

1. **Install the tools.** Lefthook itself and the secret scanner go through the `dependency-vetting` skill when it is installed, and through the upstream install command `recipes.md` names when it is not. Ask before running an install.
2. **Write.** Edit the existing config in its own format and file. With no config, create `lefthook.yml` whose first line is `# yaml-language-server: $schema=https://json.schemastore.org/lefthook.json`. A setting only this user wants (a PATH fix, a skipped job) goes in `lefthook-local.yml`, and `lefthook-local.yml` goes in `.gitignore`.
3. **Validate.** `lefthook validate` passes.
4. **Prove each job.** Start from a clean working tree: stash or commit first, with the user's consent. Run each new job and time it:

   ```sh
   time lefthook run pre-commit --all-files --no-stage-fixed --job <name>
   ```

   A job that fails on the current code shows real findings: report them, and ask whether the job lands as is or waits for a fix. A pre-commit job over a few seconds on `--all-files` is a candidate for pre-push; say so with its time. Any file a fixer changed is shown with `git diff --stat` and left for the user.

   For a job with a `glob` or `file_types`, prove the filter with `lefthook run <hook> --job <name> --file <path>`, once on a file that must match and once on a file that must not. `-v` does not list the matched files.
5. **Scan the history once** with the chosen scanner (`recipes.md` gives the command), redacted. Report the count and the files; a secret in history needs rotation, which the hook cannot do.
6. **Install.** `lefthook install`, then `lefthook check-install`. On a `core.hooksPath` or `.old` error, show it and ask before passing `--reset-hooks-path` or `--force`.

Done when `lefthook check-install` exits 0 and every approved job has run once.

## 8. Report

Lead with what now runs on each hook, with each job's time. Then what the user declined, what was already covered and by what, the history scan result, and any finding a job reported on the current code.
