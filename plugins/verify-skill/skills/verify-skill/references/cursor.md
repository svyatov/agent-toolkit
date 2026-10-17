# Cursor guidance

Refreshed: 2026-10-17

Use for Cursor IDE and Cursor CLI discovery and axis B host parity. Rules summarize the linked sources; blockquotes are exact excerpts. General skills documentation applies to Cursor; release-specific evidence below is CLI-only. Audit policies are labeled separately from documented behavior. Discovery index checked: https://cursor.com/llms.txt.

## Discovery and identity

Source: https://cursor.com/docs/skills.md

> Cursor walks the skills root recursively and picks up any `SKILL.md` it finds:

> The skill's identity comes from the folder containing `SKILL.md`

> Skills in nested project directories are automatically scoped to files inside that directory.

Search project `.agents/skills/` and `.cursor/skills/`, and user `~/.agents/skills/` and `~/.cursor/skills/` recursively. Documented compatibility roots are `.claude/skills/`, `.codex/skills/`, `~/.claude/skills/`, and `~/.codex/skills/`. Organizational folders do not change skill identity. Nested project `.agents/skills/` and `.cursor/skills/` roots are discovered within the repository and scope surfacing to that subtree; repo-root skills are available throughout it. Prefer session-resolved or user-supplied paths when available. Same-name collision precedence is not established by these sources: Not checked, not inferred from directory order.

Local roots do not prove remote availability: the source says Cursor does not copy `~/.agents/skills/` or unsynced local skills to Cloud Agents, remote SSH sessions, or self-hosted workers. Only `~/.cursor/skills/` participates in the documented personal-skill sync.

Source: https://cursor.com/docs/cli/changelog.md — March 2026; May 14, 2026; v2026.08.11

> Skills are also discovered in `.claude/skills`, `.agents/skills`, and `.codex/skills`.

> `.cursor/rules` and `.cursor/skills` in subdirectories are discovered everywhere, matching the IDE.

> Skill and subagent scans no longer descend into hidden dot-directories, avoiding slow loads from large nested folders.

CLI release qualifications: compatibility discovery is documented in March 2026; nested project discovery on May 14, 2026; hidden-directory scan exclusion in v2026.08.11. The hidden-directory note qualifies recursive scanning within roots; it does not remove the explicitly documented dot-prefixed roots. Do not project the CLI exclusion onto the IDE without IDE evidence.

## Frontmatter and invocation

Source: https://cursor.com/docs/skills.md

> Skill identifier. Lowercase letters, numbers, and hyphens only. Must match the parent folder name.

> Accepts a comma-separated string or a list.

> When `true`, the skill is only included when explicitly invoked via `/skill-name`.

> The legacy `globs` field is still accepted as a fallback for older skills, but new skills should use `paths`.

`name` and `description` are required. Match `name` to the directory directly containing `SKILL.md`, not a category folder. Descriptions explain both purpose and when to use the skill. Optional `paths` scopes surfacing to matching files and accepts the documented string/list forms; unset means no file-pattern scope. `globs` remains accepted, so recommending `paths` for new skills is not a load-failure finding against old skills. `disable-model-invocation: true` suppresses contextual automatic inclusion and retains explicit `/skill-name` invocation; it is not a general tool-permission or file-access policy.

Optional badge fields are `icon` and `color` for Custom Modes; unknown icons/colors fall back to the default badge. Optional `metadata` is an arbitrary key-value mapping. Do not require badge styling or metadata.

Source: https://cursor.com/docs/cli/using.md

> Pick a [skill](https://cursor.com/docs/skills.md) from the `/` menu and press Enter to attach it to one message.

Source: https://cursor.com/docs/cli/changelog.md — May 7, 2026; v2026.07.06; v2026.08.11

> Skills load in interactive, headless, and editor-integration modes; `/skill-name` invocations work in `-p` print mode.

> Set `user-invocable: false` in a skill's `SKILL.md` frontmatter to hide it from `/` autocomplete and typed `/skill-name` resolution while keeping it available to the model.

> A skill slash entry attaches once when you press Enter, and Option+Enter invokes a mode-backed skill as a sticky custom mode that stays active until you exit it.

CLI-only: `/skill-name` in print mode is documented May 7, 2026; `user-invocable: false` is documented from v2026.07.06; sticky Custom Mode behavior from v2026.08.11. The general skills frontmatter table omits `user-invocable`, but that omission does not invalidate the affirmative CLI release evidence. Do not apply this CLI field to the IDE as a documented guarantee. Interactions between both invocation flags are not explained: Not checked. Current CLI usage documents the one-message versus Custom Mode distinction too.

## Focused instructions and resources

Source: https://cursor.com/docs/skills.md

> Keep your main `SKILL.md` focused and move detailed reference material to separate files.

> Reference scripts in your `SKILL.md` using relative paths from the skill root.

> Scripts should be self-contained, include helpful error messages, and handle edge cases gracefully.

Keep the main body focused; disclose detailed references conditionally so agents load them when needed. Use skill-relative bundled resource paths. Audit policy: script instructions should explain dependencies, failure handling and important edge cases; this makes the documented self-contained/error-handling guidance actionable, not an extra Cursor loader requirement. Apply shared Agent Skills structure and size checks once rather than reporting duplicate Cursor findings.

## CLI warnings are not loader failures

Source: https://cursor.com/docs/cli/changelog.md — v2026.10.08

> Skills that load but exceed the spec's limits now show a yellow warning count in `/skills`

The documented warnings cover names over 64 characters or outside lowercase-hyphen form, directory/name mismatch, descriptions over 1,024 characters, and bodies over about 5,000 tokens. Their documented minimum release is v2026.10.08. Report the shared Agent Skills conformance problem and, if applicable, the CLI warning; do not describe these warnings as proof the skill cannot load. Do not infer equivalent IDE diagnostics.

## Package scope and unsupported assumptions

Source: https://cursor.com/docs/plugins.md

> **Agent Plugins**: spec-conformant plugins with a `plugin.json` manifest at the plugin root, packaging skills and MCP servers

> **Cursor Plugins**: plugins with a `.cursor-plugin/plugin.json` manifest, which add rules, agents, commands, hooks, and [variables](https://cursor.com/docs/reference/plugins.md#variables)

Source: https://cursor.com/docs/reference/plugins.md

> If a manifest field **is** specified (e.g., `"skills": "./my-skills/"`), it **replaces** folder discovery for that component.

> Treated as a single-skill plugin (only if no `skills/` dir and no manifest `skills` field)

Classify portable Agent Plugins separately from Cursor Plugins and conventional skill roots. In a Cursor Plugin, explicit skill paths replace default `skills/` discovery; root `SKILL.md` is a fallback only without a skills directory or explicit skills field. The plugin reference summarizes only `name` and `description` in its skill-field table and describes default skills as subdirectories; use the fuller skills page for conventional recursive discovery and optional fields, not the abbreviated table as an exhaustive schema. Portable package conformance remains a separate check against the applicable Agent Plugins specification.

Audit policy: an unlisted field, Codex `agents/openai.yaml` behavior, Claude `allowed-tools` semantics, or any undocumented authorization behavior is Not checked on Cursor unless affirmative applicable evidence establishes it. Do not reject or deprecate a field merely because a summary table omits it. Missing Codex YAML or Claude tool declarations is not a Cursor requirement. Static discovery and schema evidence do not prove installation, invocation in a particular runtime, or authorization.
