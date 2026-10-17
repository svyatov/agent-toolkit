# Claude Code guidance

Refreshed: 2026-10-17

Use for axis B on Claude Code, discovery and fan-out. Rules summarize the linked sources; blockquotes are exact excerpts. An unlisted field or command is not proof of deprecation: mark it Not checked against this snapshot.

## Skill fields and invocation

Source: https://code.claude.com/docs/en/skills.md

> All fields are optional. Only `description` is recommended so Claude knows when to use the skill.

Supported fields: `name`, `description`, `when_to_use`, `argument-hint`, `arguments`, `disable-model-invocation`, `user-invocable`, `allowed-tools`, `disallowed-tools`, `model`, `effort`, `context`, `agent`, `background`, `hooks`, `paths`, `shell`, `metadata`, `license`, `compatibility`.

`disable-model-invocation: true` prevents automatic invocation and removes the description from model context. `user-invocable: false` hides and disables manual invocation. Both default to false and true respectively. `when_to_use` remains supported. In the skill listing, the combined description and `when_to_use` text is capped at 1,536 characters. The overall listing budget scales at 1% of the model context window; when it overflows, Claude drops descriptions starting with the least-used skills while retaining all skill names. Put the key use case first in model-facing descriptions. Allowed tools pre-approve access for the invoking turn; they do not restrict the available tool set. With `allowManagedPermissionRulesOnly` enabled, Claude Code ignores `allowed-tools` in project and personal skills. Disallowed tools remove tools for that turn, except that `EndConversation` cannot be removed while another tool remains. Hooks can persist for the session. `context: fork` delegates execution; `agent` selects its agent type. `${CLAUDE_SKILL_DIR}` resolves the skill directory; `${CLAUDE_PLUGIN_ROOT}` resolves a plugin installation.

Claude Code accepts its own extended fields; claude.ai uploads and Skills API packaging accept only the Agent Skills fields. Check the actual claimed host before rejecting a field. Personal skills live in `~/.claude/skills`, project skills in `.claude/skills`, and plugins bundle `skills/` directories.

## Tools and availability

Source: https://code.claude.com/docs/en/tools-reference.md

> On Windows, it's part of the default tool set.

Recognized tools relevant to verification include `Bash`, `Read`, `Edit`, `Write`, `Glob`, `Grep`, `Agent`, `AskUserQuestion`, `EnterPlanMode`, `ExitPlanMode`, `EnterWorktree`, and `ExitWorktree`. Glob and Grep are absent by default on macOS, Linux and WSL; use shell discovery when unavailable. A skill's allowed-tools declaration is not a guarantee that a tool exists. AskUserQuestion collects choices; plan tools support approval; worktree tools isolate edits. Verify availability in the running host before prescribing a tool.

## Parallel work

Source: https://code.claude.com/docs/en/agents.md

> Claude Code has five ways to work on several tasks at once:

Subagents delegate bounded work in separate contexts and return results to the caller. Agent view manages independent sessions; agent teams coordinate peers; projects sustain work across tasks; dynamic workflows script orchestration. Choose by who coordinates, communication needs and file conflicts. Worktree isolation is useful for parallel edits, not a prerequisite for read-only audits.

Source: https://code.claude.com/docs/en/env-vars.md

> the variable can adjust the cap but can't disable it

`CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS` defaults to 20 and accepts positive whole numbers in plain digits; invalid values are ignored. Respect the effective cap and occupied slots. Other hosts have their own limits.

Source: https://code.claude.com/docs/en/workflows.md

> Reach for a workflow when a task needs more agents than one conversation can coordinate

Dynamic workflows suit large, repeatable sweeps or cross-checked research. They run scripted orchestration in the background. Starting one requires the documented user opt-in or an enabled host setting; a skill mentioning the feature does not itself enable it. With ultracode enabled, the session's concurrent subagent limit is not enforced for Agent-tool subagents. Suggest workflows as Consider only when a concrete step would benefit.

## CLI and plugins

Source: https://code.claude.com/docs/en/cli-reference.md

> `--allowedTools`

Common tool configuration flags include `--tools`, `--allowedTools`, and `--disallowedTools`; `--agent` selects an agent. Confirm flags outside this saved subset with refresh mode instead of guessing their status.

Source: https://code.claude.com/docs/en/plugins-reference.md

> `claude plugin validate` is the authoritative check for a manifest.

Store the manifest under `.claude-plugin/plugin.json` and plugin components outside that metadata directory. Plugins normally discover skills under `skills/`. Validate the plugin root, not a nested skill directory. Follow a repository's stricter validation requirements.

Source: https://code.claude.com/docs/en/plugin-evals.md

> # Test plugins with evals

When behavioral proof is requested for a plugin, Claude Code supports plugin evals with fixtures, graders and a no-plugin baseline. A manifest validation alone is not an eval. Consult refresh mode for command options absent from this snapshot.
