# Agent Toolkit

A Claude Code marketplace of individually installable skill-plugins.

## Structure

- `plugins/<name>/` — a self-contained plugin. Contains `.claude-plugin/plugin.json` (the plugin manifest) and `skills/<name>/` (the skill directory with `SKILL.md`, optional `references/`, and `sources.json` for imported skills).
- `.claude-plugin/marketplace.json` — Claude Code catalog. Lists every plugin with `source: "./plugins/<name>"` (explicit path from marketplace root). Removed plugin names go into `renames` mapped to `null`, never deleted.
- `.agents/plugins/marketplace.json` — Codex catalog. Same plugin set and order, with the `source`/`policy`/`category` shape Codex requires. Codex reads plugin versions and descriptions from each `plugin.json`.
- No `skills` override in `plugin.json` — Claude Code auto-discovers `plugins/<name>/skills/<name>/SKILL.md` via default discovery. The skill's invocation name comes from the `name:` in `SKILL.md` frontmatter.

There is no wrapper plugin — each skill ships independently.

Note: Claude Code ≥ 2.1.116 rejects `"skills": ["./"]` with `path escapes plugin directory: ./` — the validator requires a non-empty relative path, so `SKILL.md` must live inside a subdirectory of the plugin root.

## Skill Import

- Use `/import-skill` to import skills from GitHub repos. It writes `SKILL.md`, `sources.json`, `.claude-plugin/plugin.json`, and a new entry in `marketplace.json` automatically.
- Every imported skill must have `sources.json` tracking: source repo, path, branch, commit SHA, license, and copyright.
- Only import skills with MIT-compatible licenses (see import-skill Step 3 for the compatible list).

## Checklist — After Any Skill Change

- Bump the `version` in that skill's own `plugins/<name>/.claude-plugin/plugin.json` (not any shared file — there is no shared version).
- Keep `description` identical in `plugin.json`, the `marketplace.json` entry, and the `README.md` table row. The entry text is what Claude Code shows; the manifest text is what Codex shows.
- If a skill was added, renamed, or removed: update the `Skills` table in `README.md` and the `plugins[]` array in both `.claude-plugin/marketplace.json` and `.agents/plugins/marketplace.json`. A removed or renamed name also gets a `renames` entry in `.claude-plugin/marketplace.json`.
- Add a line under `Unreleased` in `CHANGELOG.md`.
- Run `claude plugin validate --strict .` and the same for the changed `plugins/<name>`; CI runs both.

## Commands

- `gh search code "<query>"` — useful for finding skill origins and upstream changes
- Add a new skill manually: create `plugins/<name>/skills/<name>/SKILL.md` + `plugins/<name>/.claude-plugin/plugin.json`, then append a `plugins[]` entry to both catalogs. (`/import-skill` does all of this except the Codex catalog entry.)

## Gotchas

- Use `curl` (not WebFetch) to fetch raw file content from GitHub — WebFetch summarizes/truncates instead of returning verbatim content.
