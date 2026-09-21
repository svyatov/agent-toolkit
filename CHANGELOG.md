# Changelog

Each plugin carries its own version in `plugins/<name>/.claude-plugin/plugin.json`. Entries below are grouped by plugin; repository-level changes sit under `Marketplace`. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## Unreleased

### Marketplace

- Add a native Codex catalog at `.agents/plugins/marketplace.json` and a Codex install section in the README.
- Add `renames` for the nine plugin names removed since the `leo` bundle was split, so old installs migrate instead of failing.
- Point the catalog `$schema` at SchemaStore and move `description` to the top level.
- Add a CI workflow that runs `claude plugin validate --strict` on the catalog and every plugin.
- Rename the marketplace from `leo-toolkit` to `svyatov-agent-toolkit` in both catalogs. Existing registrations keep working under the old name; the README documents how to switch.

### All plugins

- Add `$schema` to every `plugin.json` (patch bump on each).
- Every slash-only skill (all except astro) gains `agents/openai.yaml` with `allow_implicit_invocation: false`, so Codex also waits for an explicit `$skill` call instead of triggering on a matching prompt (patch bump on each).
- astro 1.2.1, generate-favicon, grill-me, llms-visibility: manifest description now matches the catalog and README wording.

### browser-qa

- 1.0.0: new skill that checks a page, or the pages this branch changed, in a real browser at 375, 768, and 1280 px, reads the console and network log, and fixes only when asked.

### contribute

- 1.0.0: new skill that takes a dependency bug upstream: repository from package metadata, existing-report search, reproduction on the default branch, CONTRIBUTING rules, and a drafted issue or PR that waits for confirmation before submission.

### cut-release

- 1.0.0: new skill that turns the Unreleased changelog section into a tagged release: semver bump, `chore/release-X.Y.Z` branch, PR, squash merge, tag, and GitHub release, publishing only through the repository's own workflow.

### shortcuts

- 1.1.0: nine more commands. `/p` push, `/m` squash merge now, `/fci` fix the failing CI run, `/prd` rewrite the PR title and body from the diff, `/cl` close the issues the PR resolved, `/deps` update outdated dependencies, `/docs` sync docs with the change, `/rule` add a rule to CLAUDE.md or AGENTS.md, `/lint` run every linter to zero.
- 1.0.0: new plugin bundling nine slash-only commands for the commit, push, pull request, CI, and merge loop: `/c`, `/cp`, `/cb`, `/cbp`, `/cpr`, `/cprw`, `/wm`, `/ci`, `/fa`.

### verify-skill

- 1.2.0: new host-parity check compares `disable-model-invocation` in the frontmatter with `allow_implicit_invocation` in `agents/openai.yaml`, fetching the rule from developers.openai.com. Catalog and README wording now match the manifest.
