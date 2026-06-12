---
name: command-creator
description: Guides creation of Claude Code slash commands. Use when users ask to "create a command", "make a slash command", "add a command", want to automate a repetitive workflow ("I keep doing X, can we make a command for it?"), or want to document a consistent process as a reusable slash command — project-level or global.
---

# Command Creator

Create Claude Code slash commands — reusable workflows invoked with `/command-name`. A slash command is a markdown file in `.claude/commands/` (project-level) or `~/.claude/commands/` (global) that expands into a prompt when invoked. Good candidates: repetitive workflows (code review, PR submission, CI fixing), multi-step processes that need consistency, agent delegation patterns, and project-specific automation.

## Bundled Resources

Load these as needed during the workflow below:

- **references/patterns.md** — command patterns (workflow automation, iterative fixing, agent delegation, simple execution)
- **references/examples.md** — real command examples with full source (submit-stack, ensure-ci, create-implementation-plan)
- **references/best-practices.md** — template structure, writing guidelines, quality checklist, common pitfalls

## Workflow

### Step 1: Determine Location

Check `git rev-parse --is-inside-work-tree 2>/dev/null`: inside a git repo → project-level `.claude/commands/`; otherwise → global `~/.claude/commands/`. An explicit user request ("global", "user-level", "project") overrides the default. Report the chosen location before proceeding.

### Step 2: Identify Command Pattern

Load **references/patterns.md** to understand the available patterns:

- **Workflow Automation** — Analyze → Act → Report (e.g., submit-stack)
- **Iterative Fixing** — Run → Parse → Fix → Repeat (e.g., ensure-ci)
- **Agent Delegation** — Context → Delegate → Iterate (e.g., create-implementation-plan)
- **Simple Execution** — Run command with args (e.g., codex-review)

Infer the best pattern from the user's description. Only ask if genuinely ambiguous.

### Step 3: Gather Command Information

Interview the user for whatever isn't already clear from their request:

- **Name and purpose** — kebab-case filename, matching the invocation (`my-command.md` → `/my-command`); a concise, action-oriented description for `/help` output.
- **Arguments** — required or optional, and what they represent. If the command takes arguments, add `argument-hint:` to the frontmatter (`<angle-brackets>` for required, `[square-brackets]` for optional).
- **Workflow steps** — the order of actions, tools/commands to use, how to handle results, success criteria, and error handling.
- **Tool guidance** — specific agents/tools to use or avoid, files to read for context.

### Step 4: Generate the Command

Load **references/best-practices.md** for the template structure, writing style guidelines, and quality checklist. Key principles: imperative verb-first instructions, explicit and specific actions, stated expected outcomes, concrete examples, clear error handling.

### Step 5: Create the File

Ensure the target directory exists, write the command file, then confirm with the user: report the file location, summarize what the command does, and show how to invoke it (`/command-name [arguments]`).

### Step 6: Test and Iterate (Optional)

Suggest testing with `/command-name [arguments]` and iterate on feedback.
