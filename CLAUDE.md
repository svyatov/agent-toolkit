# Agent Toolkit

A collection of Claude Code skills and plugins.

## Structure

- `skills/<name>/` — skill source directories (SKILL.md + optional references/, sources.json)
- `plugins/leo/` — plugin package; skills are symlinked from `plugins/leo/skills/<name>` → `../../../skills/<name>`
- `plugins/leo/.claude-plugin/plugin.json` — plugin metadata and version

## Skill Import

- Use `/import-skill` to import skills from GitHub repos
- Every imported skill must have `sources.json` tracking: source repo, path, branch, commit SHA, license, and copyright
- Bump plugin version in `plugin.json` when adding or modifying skills

## Commands

- `gh search code "<query>"` — useful for finding skill origins and upstream changes
- Symlink a new skill: `ln -s ../../../skills/<name> plugins/leo/skills/<name>`
