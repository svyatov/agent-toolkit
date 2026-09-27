# Lefthook config facts

Checked against lefthook 2.1.14 (released 2026-09-14) on 2026-09-27. Docs: `https://lefthook.dev/llms-full.txt`. Schema: `https://json.schemastore.org/lefthook.json`.

## Files

- Main config names, in lookup order: `lefthook`, `.lefthook`, `.config/lefthook`, each with `.yml`, `.yaml`, `.json`, `.jsonc`, `.toml`. The first found wins; a second file is silently ignored.
- Local config: `lefthook-local.*`, with the same dot and `.config/` variants. A dotted main config pairs with a dotted local one.
- Merge order: main, then `extends` (globs allowed), then `remotes`, then local. Later wins. Named jobs merge across files; unnamed jobs append. A group merges only when it has a `name`.
- `LEFTHOOK_CONFIG=<path>` replaces the main config.

## Hooks and jobs

- `jobs` is a list and the current form. `commands` (a map) and `scripts` (files under `.lefthook/<hook>/`) still work. Write `jobs` in a new config; in an existing config, match the form already there.
- Job keys: `name`, `run` or `script` + `runner`, `args`, `group` (`parallel`, `piped`, `jobs`), `root`, `glob`, `exclude`, `file_types`, `files`, `env`, `tags`, `skip`, `only`, `fail_text`, `timeout` (e.g. `"30s"`), `interactive`, `use_stdin`, `stage_fixed`.
- Hook keys: `parallel`, `piped`, `follow`, `fail_on_changes` (`never`, `always`, `ci`, `non-ci`), `files`, `exclude`, `exclude_tags`, `skip`, `only`, `setup`, `jobs`.
- Jobs run one after another unless the hook sets `parallel: true`. `parallel` with `piped` is an error. `follow` streams output, which interleaves under `parallel`.
- File templates: `{staged_files}`, `{push_files}`, `{all_files}`, `{files}` (from the `files` command). `{1}` is the commit message file in commit-msg. Long lists are split across several runs.
- A job with `glob` or `exclude` and no file template runs only when a staged (pre-commit) or pushed (pre-push) file matches. A job whose file template comes out empty is skipped. pre-commit does nothing when nothing is staged.
- `glob` matches from the repository root, even under `root`. The default matcher is gobwas, compiled with no path separator and case-insensitive: `*` crosses `/`, so `*.js` matches at any depth and `src/*.js` matches `src/a/b.js` too (the docs say otherwise; `internal/run/controller/filter/filter.go` decides). `**/*.js` needs a `/` and misses `app.js` at the root. Write `*.js` for any depth, or set `glob_matcher: doublestar` at the top level for bash-style globs.
- `root: "web/"` runs the job in that directory and rewrites file paths relative to it.
- `stage_fixed: true` re-adds the files a fixer changed. It works in pre-commit only.
- pre-commit hides unstaged hunks of partially staged files before jobs run and restores them after, so tools see the staged content.
- `skip` and `only` take `true`, `merge`, `rebase`, `merge-commit`, `ref: <glob>`, or `run: <sh command>`. lefthook does not skip anything in CI by itself: `skip: [{run: test -n "$CI"}]` does.
- `use_stdin: true` for a pre-push job that reads git's stdin; without it the job hangs.
- On Windows, `run` executes under Git's `sh`.

## Removed in 2.0

- `skip_output`: use `output` (a list of `meta`, `summary`, `empty_summary`, `success`, `failure`, `execution`, `execution_out`, `execution_info`, `skips`, or `false`).
- Regular expressions in `exclude`: globs only.
- npm packages `@evilmartians/lefthook` and `@evilmartians/lefthook-installer`: the package is `lefthook`.

## Install and CLI

- `lefthook install` writes `.git/hooks/<hook>` scripts. A hook it did not write is renamed to `<hook>.old`, and an existing `.old` stops it without `--force`. A `core.hooksPath` set to anything but `.git/hooks` stops it without `--reset-hooks-path` or `--force`.
- The hook script finds lefthook through `LEFTHOOK_BIN`, the config's `lefthook:` key, `PATH`, `node_modules`, `bundle exec`, `uv run`, `mise exec`, and others.
- After an install, `lefthook run` re-syncs hooks when the config changes. No reinstall is needed.
- `lefthook validate` checks the config against the schema. `lefthook dump` prints the merged config. `lefthook check-install` exits 0 when hooks are installed and in sync.
- `lefthook run <hook>` flags: `--all-files`, `--file <f>` (repeatable), `--job <name>`, `--tag <tag>`, `--no-stage-fixed`, `-v`.
- `LEFTHOOK=0` disables hooks for one git command. `LEFTHOOK_EXCLUDE=<tag,name>` skips jobs.
- GUI git clients often run hooks without the shell's `PATH`. The fix is `rc: ~/.lefthookrc` (a file that sets PATH) in `lefthook-local.yml`. `assert_lefthook_installed: true` fails the hook when lefthook cannot be found.

## Audit checklist

Mark each item hit or clear against `lefthook dump`:

1. More than one main config file.
2. A key removed in 2.0.
3. A pre-commit job with no `glob`, no `file_types`, and no file template: it runs a whole-project check on every commit.
4. A pre-commit job that runs a whole-project command (a type checker, a test suite, a build): it belongs in pre-push.
5. A fixer (`--fix`, `--write`, `format`, `-a`) in pre-commit without `stage_fixed: true`: the fix stays unstaged and the commit holds the unfixed file.
6. A pre-commit hook with more than one job and no `parallel: true`.
7. A `**/` glob under the default gobwas matcher that should also match root-level files.
8. No secret scan in pre-commit.
9. A pre-push job that reads stdin without `use_stdin: true`.
10. Another hook manager active beside lefthook, or `core.hooksPath` pointing elsewhere.
11. lefthook missing from the repository's manifests, so a fresh clone gets no hooks.
