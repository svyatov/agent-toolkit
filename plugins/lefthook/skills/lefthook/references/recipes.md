# Recipes

## Secret scanning

The must-have. It scans the staged diff, so it has no `glob` and no file template.

| Scanner | Pick it when |
|---|---|
| **betterleaks** (default) | Always, unless a reason below applies. The gitleaks author maintains it and releases often; binaries are built in CI with cosign-signed checksums. It reads `.gitleaks.toml`, `.gitleaksignore`, and `gitleaks:allow` comments, so a gitleaks setup moves over as is. |
| **gitleaks** | Policy requires a verified GitHub org or a long track record, or the repository already runs gitleaks and the user keeps it. Its README says it is feature complete and gets security patches only (since 2026-05). |

Checked 2026-09-27 against betterleaks 1.8.1 and gitleaks 8.30.1.

```yaml
pre-commit:
  jobs:
    - name: secrets
      run: betterleaks git --pre-commit --staged --redact --verbose
```

For gitleaks, the same flags: `gitleaks git --pre-commit --staged --redact --verbose`.

- Leave betterleaks `--validation` off: it calls provider APIs over the network on every commit.
- betterleaks defaults to deeper decoding than gitleaks and finds more. When its generic rules are noisy on a repository, add `--confidence medium`.
- A false positive gets a `betterleaks:allow` (or `gitleaks:allow`) comment on its line, or a fingerprint in `.betterleaksignore`.
- One-time history scan for step 7. The plain command prints only a count, and `--report-path /dev/stdout` comes back empty, so write the report to a file. gitleaks takes the same flags. The scan exits 1 when it finds anything:

  ```sh
  d=$(mktemp -d); betterleaks git . --redact --no-banner --log-level error --report-format json --report-path "$d/r.json"; jq -r '.[] | "\(.RuleID) \(.File):\(.StartLine) \(.Commit[:7])"' "$d/r.json"; rm -r "$d"
  ```

  A secret found there is already exposed: it needs rotation, and rewriting history does not undo that.

Install commands published upstream:

- betterleaks: `brew install betterleaks` (homebrew-core), `go install github.com/betterleaks/betterleaks@latest`, `docker pull ghcr.io/betterleaks/betterleaks:latest`. The `betterleaks/tap` cask strips the macOS quarantine flag: use the homebrew-core formula.
- gitleaks: `brew install gitleaks`, `docker pull ghcr.io/gitleaks/gitleaks:latest`.
- A repository on mise pins either one for everyone: `mise use betterleaks` or `mise use gitleaks` (both resolve through aqua).

## Zero-dependency check

`git diff --cached --check` fails on trailing whitespace, a space before a tab, and leftover conflict markers, with no tool to install:

```yaml
    - name: whitespace
      run: git diff --cached --check
```

Propose it as Available when the repository has no formatter covering every file type it commits.

## Tool flags

Flags that the tool's own config does not show and that a staged-file job needs:

| Tool | Job command | Why |
|---|---|---|
| Biome | `biome check --write --no-errors-on-unmatched --files-ignore-unknown=true {staged_files}` with `stage_fixed` | No error when every staged file is ignored or unknown. |
| ESLint (flat config) | `eslint --fix --no-warn-ignored {staged_files}` with `stage_fixed` | An ignored file passed by name otherwise warns, and fails under `--max-warnings 0`. |
| Prettier | `prettier --write --ignore-unknown {staged_files}` with `stage_fixed` | Skips files it has no parser for. |
| RuboCop / Standard | `rubocop -a --force-exclusion {staged_files}` with `stage_fixed` | A file passed by name is otherwise checked even when `.rubocop.yml` excludes it. |
| Ruff | `ruff check --fix --force-exclude {staged_files}` and `ruff format --force-exclude {staged_files}`, with `stage_fixed` | Same reason as RuboCop. |
| gofmt / golangci-lint | `gofmt -l -w {staged_files}` with `stage_fixed`; `golangci-lint run --new-from-rev=HEAD` in pre-commit or `./...` in pre-push | golangci-lint works on packages, not files. |
| rustfmt / clippy | `rustfmt --edition <edition> {staged_files}` with `stage_fixed`; `cargo clippy -- -D warnings` in pre-push | clippy compiles the crate. |
| shellcheck | `shellcheck {staged_files}` with `file_types: [text/x-shellscript]` | Catches scripts with no `.sh` extension. |
| actionlint | `actionlint {staged_files}` with `glob: ".github/workflows/*.{yml,yaml}"` | Validates workflows before CI rejects them. |

Take the edition, target dirs, and similar values from the repository's own config.

Whole-project checks go in pre-push, or in pre-commit behind a `glob` only when the repository is small enough that the timed run stays tight: `tsc --noEmit`, `mypy`, `pyright`, `cargo clippy`, `go vet ./...`, and test suites. Run the same script CI runs (`bun run typecheck`, `bundle exec rake test`) so the local and CI checks cannot drift apart.

## Commit messages

Only where step 3 found a convention:

- The repository already has commitlint config: `run: <runner> commitlint --edit {1}`.
- Conventional Commits with no config: a one-line check needs no install.

  ```yaml
  commit-msg:
    jobs:
      - name: conventional
        run: |
          head -1 {1} | grep -qE '^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\(.+\))?!?: .+' || { echo "Use Conventional Commits: type(scope): description"; exit 1; }
  ```

  Take the type list from the types the history actually uses. A `run` that holds `: ` must be a block scalar (`|`), or the YAML does not parse.

## Lefthook for every clone

Hooks only reach teammates when installing the project installs lefthook. Propose the manifest entry that matches the repository:

- JS: `lefthook` as a devDependency (`bun add -d lefthook`, `npm i -D lefthook`); its postinstall runs `lefthook install`. With no config, that writes a `lefthook.yml` of commented examples: replace it in step 7.2. It also renames another manager's hooks to `<hook>.old`, so remove the other manager before you add lefthook. pnpm runs it only when `lefthook` is in `onlyBuiltDependencies` (`pnpm-workspace.yaml` or `package.json`).
- Ruby: `gem "lefthook", require: false` in the development group, plus `lefthook install` in `bin/setup`.
- Python: `uv add --dev lefthook`, plus `lefthook install` in the setup script.
- mise: `mise use lefthook@latest` (community plugin, per the lefthook docs), plus a setup task that runs `lefthook install`.
- Anything else: `brew install lefthook` and `lefthook install` in the README's setup section.
