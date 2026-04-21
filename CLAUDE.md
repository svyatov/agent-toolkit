# Agent Toolkit

A Claude Code marketplace of individually installable skill-plugins.

## Structure

- `skills/<name>/` — a self-contained plugin. Contains `SKILL.md`, optional `references/`, `sources.json` (for imported skills), and `.claude-plugin/plugin.json` (the plugin manifest).
- `.claude-plugin/marketplace.json` — lists every skill as a separate plugin with `source: "./skills/<name>"` (explicit path from marketplace root; schema requires the `./` prefix, so `pluginRoot` cannot be used with bare names).
- Each plugin sets `"skills": ["./"]` so `SKILL.md` at the plugin root is discovered. The skill's invocation name comes from the `name:` in `SKILL.md` frontmatter.

There is no wrapper plugin — each skill ships independently.

## Skill Import

- Use `/import-skill` to import skills from GitHub repos. It writes `SKILL.md`, `sources.json`, `.claude-plugin/plugin.json`, and a new entry in `marketplace.json` automatically.
- Every imported skill must have `sources.json` tracking: source repo, path, branch, commit SHA, license, and copyright.
- Only import skills with MIT-compatible licenses (see import-skill Step 3 for the compatible list).

## Checklist — After Any Skill Change

- Bump the `version` in that skill's own `skills/<name>/.claude-plugin/plugin.json` (not any shared file — there is no shared version).
- If a skill was added, renamed, or removed: update both the `Skills` table in `README.md` and the `plugins[]` array in `.claude-plugin/marketplace.json`.

## Commands

- `gh search code "<query>"` — useful for finding skill origins and upstream changes
- Add a new skill manually: create `skills/<name>/SKILL.md` + `skills/<name>/.claude-plugin/plugin.json`, then append a `plugins[]` entry to `.claude-plugin/marketplace.json`. (`/import-skill` does all of this automatically.)

## Gotchas

- Use `curl` (not WebFetch) to fetch raw file content from GitHub — WebFetch summarizes/truncates instead of returning verbatim content.
