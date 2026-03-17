# Agent Toolkit

A collection of Claude Code skills and plugins.

## Structure

- `skills/<name>/` — skill source directories (SKILL.md + optional references/, sources.json)
- `plugins/leo/` — plugin package; skills are symlinked from `plugins/leo/skills/<name>` → `../../../skills/<name>`
- `plugins/leo/.claude-plugin/plugin.json` — plugin metadata and version

## Skill Import

- Use `/import-skill` to import skills from GitHub repos
- Every imported skill must have `sources.json` tracking: source repo, path, branch, commit SHA, license, and copyright
- Only import skills with MIT-compatible licenses (see import-skill Step 3 for compatible list)

## Checklist — After Any Skill Change

- Bump version in `plugins/leo/.claude-plugin/plugin.json`

## Commands

- `gh search code "<query>"` — useful for finding skill origins and upstream changes
- Symlink a new skill: `ln -s ../../../skills/<name> plugins/leo/skills/<name>`

## Gotchas

- Use `curl` (not WebFetch) to fetch raw file content from GitHub — WebFetch summarizes/truncates instead of returning verbatim content
