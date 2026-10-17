# Cursor live verification map

Read when Cursor IDE or Cursor CLI is selected. This is a fetch procedure, not a dated normative snapshot. Fetch the sources below on every audit; derive findings from their current text and record access date and CLI release qualifications.

## Sources and package selection

Start with https://cursor.com/llms.txt, then fetch https://cursor.com/docs/plugins.md and https://cursor.com/docs/reference/plugins.md. Fetch https://cursor.com/docs/skills.md for skill discovery/identity. For CLI or command claims also fetch https://cursor.com/docs/cli/changelog.md, https://cursor.com/docs/cli/using.md and https://cursor.com/docs/cli/reference/parameters.md. Changelog-only behavior stays CLI-only with its minimum documented release/date.

Classify native `.cursor-plugin/marketplace.json`, native `.cursor-plugin/plugin.json`, or portable root `plugin.json` with Agent Plugins schema. A native catalog, portable package, explicit request or support claim selects Cursor; imported Claude-plugin support alone does not establish generic Claude marketplace acceptance. If both manifest forms exist and current evidence does not specify precedence, mark that precedence Not checked.

## Catalog and effective components

1. Check the fetched required fields: native catalog `name`, `owner.name`, `plugins`; native manifest `name`. Grade publication metadata at its documented recommendation level. Optional versions are not a loading requirement.
2. Accept documented string sources, including bare relative paths, and objects with `path`. Do not import Claude source-object forms or require `./`. If other object options are undocumented, mark only those options Not checked. Apply `metadata.pluginRoot`; manifest values override catalog-entry values where documented.
3. Resolve explicit component paths instead of default discovery for that component. The default folder is not also scanned. Root `SKILL.md` is a fallback only without `skills/` and without an explicit `skills` field. Use the plugin-specific discovery table, not conventional skill-root recursion as a substitute.
4. Check component paths stay within plugin bounds, including explicit escape attempts. Respect field-specific URL allowances such as `logo`. Check supported rules, agents, commands, hooks, skills and MCP by package format; portable support does not establish native-only component support.
5. Validate variable declarations and placeholder names without executing config. Fetch the current variable-schema keyword list. Check portable MCP reliance on `${PLUGIN_ROOT}` or `${PLUGIN_DATA}` against Cursor's documented expansion behavior; use `${CURSOR_PLUGIN_ROOT}` where supported. Schema conformance and runtime expansion are separate checks.

## Installation and inspection boundaries

Check IDE Customize/Git repository import separately from CLI marketplace commands. Git multi-plugin import requires the native Cursor catalog where documented. Claude plugin import is not evidence that arbitrary Claude catalogs are accepted. Local-import settings, administrator policy, reload, scope and installed-name precedence are runtime prerequisites, not proof from catalog inspection.

Available `agent plugin --help`, `agent plugin marketplace --help` and documented list commands can supply optional installed-state evidence only for their actual scope. Missing CLI access leaves those checks Not checked, not static checks. No universal `agent plugin validate` is established. Headless/print mode has write and shell access and is not a passive validator. During a passive audit do not add/install/update/remove, copy into active plugin roots, launch `--plugin-dir`, reload plugins, start MCP or execute hooks/scripts. Offer runtime checks only as a separately scoped user opt-in.
