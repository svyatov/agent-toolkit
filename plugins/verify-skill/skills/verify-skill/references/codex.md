# Codex guidance

Refreshed: 2026-10-17

Use for Codex discovery and axis B host parity. Rules summarize the linked source; the blockquote is an exact excerpt.

Source: https://learn.chatgpt.com/docs/build-skills.md

> When `false`, Codex won't implicitly invoke the skill based on user prompt; explicit `$skill` invocation still works.

Codex uses skill names and descriptions for discovery. The initial list includes file paths and by default is limited to 2% of the model context window, or 8,000 characters when that window is unknown. Codex shortens descriptions first and can omit skills with a warning when the list is too large. Put key use cases first in model-facing descriptions; the full selected skill still loads when invoked. `agents/openai.yaml` sets optional interface metadata, invocation policy and tool dependencies. `policy.allow_implicit_invocation` defaults to `true`. Use this policy for Codex rather than relying on Claude-specific frontmatter. The documented schema has no `allowed-tools` equivalent.

| Claude `disable-model-invocation` | Codex `policy.allow_implicit_invocation` | Result |
|---|---|---|
| `true` | `false` | In sync |
| `true` | absent or `true` | Should fix |
| absent or `false` | `false` | Should fix |
| absent or `false` | absent or `true` | In sync |

Documented interface keys: `display_name`, `short_description`, `icon_small`, `icon_large`, `brand_color`, `default_prompt`. Tool dependencies use `dependencies.tools` entries with `type`, `value`, `description`, `transport`, and `url`. Keep edits within the documented schema.

Search `.agents/skills` from the working directory through the repository root, then `~/.agents/skills` and `/etc/codex/skills`. Bundled system skills and plugin skills can be located through session-provided paths. Symlinked skill directories are supported. Explicit CLI invocation uses `$skill` or the `/skills` selector.
