# Agent Skills conformance and authoring

Refreshed: 2026-10-17

Use for axis A. Rules below summarize the linked sources; blockquotes are exact excerpts. Labeled audit policies are this verifier's decisions, not upstream requirements. These are dated guidance, not a claim about today's documentation.

## Format and limits

Source: https://agentskills.io/specification.md

> Must match the parent directory name

> Keep your main `SKILL.md` under 500 lines.

- Require YAML frontmatter and non-empty `name` and `description`.
- `name`: 1-64 characters, lowercase letters, digits and hyphens; no leading, trailing or consecutive hyphens; match the directory.
- `description`: 1-1024 characters. Describe the task and its use cases, subject to the host's explicit-invocation policy.
- Optional fields: `license`, `compatibility`, `metadata`, `allowed-tools`. Compatibility is 1-500 characters when present; metadata maps strings to strings. Allowed tools are experimental and host-dependent.
- The body has no mandatory format. Under 500 lines and 5,000 tokens are recommendations, not loader limits.
- Reference paths are relative to the skill root. Keep references one level deep; load supporting material only when needed. Document script dependencies and errors.

## Useful scope and progressive disclosure

Source: https://agentskills.io/skill-creation/best-practices.md

> The key is telling the agent *when* to load each file.

Teach domain-specific procedures, constraints and failure cases. Prefer a coherent task with clear steps over exhaustive background material. Put conditional detail behind a pointer that states when to read it. Choose a default approach, calibrate how prescriptive the steps are to the risk, and include a validation loop where errors matter. Evaluate whether the guidance improves actual runs before adding more instructions.

## Descriptions and Claude constraints

Source: https://agentskills.io/skill-creation/optimizing-descriptions.md

> **Focus on user intent, not implementation.**

For implicitly invoked skills, cover distinct user intents and boundaries. Test realistic positive prompts and near-miss negatives. This source favors imperative and broad trigger wording; use the host's guidance when it conflicts.

Source: https://docs.claude.com/en/docs/agents-and-tools/agent-skills/best-practices.md

> **Always write in third person**.

> Cannot contain reserved words: "anthropic", "claude"

Anthropic's authoring guidance forbids XML tags in `name` and `description`, and the reserved words `anthropic` and `claude` in `name`. Apply these constraints to Claude targets. It favors third-person descriptions.

Audit policy: apply description voice guidance to model-facing descriptions, not as a reason to reject an explicit-only command summary. Use the selected host's invocation policy to decide whether the description is model-facing. Explicit-only skills need a useful menu summary rather than a trigger list. Treat style alone as insufficient evidence of a defect.

## Bundled scripts

Source: https://agentskills.io/skill-creation/using-scripts.md

> **State prerequisites** in your `SKILL.md`

Check that the instructions say how to run each script, name required runtimes and dependencies, and use skill-relative paths. Prefer reproducible versions and self-contained execution. Complex fragile commands may belong in a tested script.

Audit policy: do not install dependencies just to perform a static audit.

## Evidence of behavior

Source: https://agentskills.io/skill-creation/evaluating-skills.md

> A test case has three parts:

When asked how to prove the skill works, use realistic prompts, expected outputs and optional input files. Compare runs with and without the skill, or against its previous version. Include boundary cases and isolate each run's context. Passing frontmatter validation does not establish behavioral quality.
