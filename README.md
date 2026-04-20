# Agent Toolkit

Personal agent toolkit — reusable skills and plugins for Claude Code, Cursor, Codex, and Gemini CLI.

Each skill is an **individually installable plugin**. Install only what you need for a given project.

## Structure

- **`skills/<name>/`** — a self-contained plugin (SKILL.md + `.claude-plugin/plugin.json`)
- **`.claude-plugin/marketplace.json`** — catalog that exposes every skill as a separate plugin

## Claude Code Plugin Installation

Add the marketplace once:

```bash
claude plugin marketplace add svyatov/agent-toolkit
```

Then install any skill on its own:

```bash
claude plugin install commit@leo-toolkit
claude plugin install astro@leo-toolkit
claude plugin install generate-favicon@leo-toolkit
```

## Migrating from the `leo` plugin

If you previously installed the bundled `leo` plugin, it no longer exists. Switch to per-skill installs:

```bash
claude plugin uninstall leo@leo-toolkit
claude plugin marketplace update leo-toolkit
claude plugin install <skill>@leo-toolkit  # repeat for each skill you want
```

Your existing `leo:` skill invocations (e.g., `leo:commit`) become `<skill>:<skill>` (e.g., `commit:commit`), or the bare `<skill>` name when unambiguous.

## Skills

| Skill | Description | Install |
|-------|-------------|---------|
| `astro` | Build with the Astro web framework (v6+) — islands, content collections, actions, SSR, view transitions | `claude plugin install astro@leo-toolkit` |
| `browser-bugs` | Audit frontend code for 50 cross-browser bugs and mobile compatibility pitfalls | `claude plugin install browser-bugs@leo-toolkit` |
| `command-creator` | Create reusable slash commands | `claude plugin install command-creator@leo-toolkit` |
| `commit` | Git commit workflow with conventional commits, branch/push/PR support | `claude plugin install commit@leo-toolkit` |
| `generate-cicd` | Generate CI/CD workflows (GitHub Actions) | `claude plugin install generate-cicd@leo-toolkit` |
| `generate-dockerfile` | Generate optimized, multi-stage Dockerfiles | `claude plugin install generate-dockerfile@leo-toolkit` |
| `generate-favicon` | Generate a minimal favicon set from SVG — ICO, SVG with dark mode, Apple Touch Icon, PWA icons, manifest | `claude plugin install generate-favicon@leo-toolkit` |
| `grill-me` | Stress-test a plan or design through relentless interviewing | `claude plugin install grill-me@leo-toolkit` |
| `humanizer` | Remove signs of AI-generated writing from text | `claude plugin install humanizer@leo-toolkit` |
| `import-skill` | Import skills from GitHub repos (copy or merge) | `claude plugin install import-skill@leo-toolkit` |
| `improve-architecture` | Find architectural improvements with assessment gate, cohesion checks, and test writing | `claude plugin install improve-architecture@leo-toolkit` |
| `refactor` | Refactor code at any scope (project/file/method) with idempotent assessment gate | `claude plugin install refactor@leo-toolkit` |
| `taskwarrior` | Taskwarrior CLI reference for managing tasks, bugs, and work items | `claude plugin install taskwarrior@leo-toolkit` |
| `writing-clearly-and-concisely` | Apply Strunk's rules for clearer, stronger prose | `claude plugin install writing-clearly-and-concisely@leo-toolkit` |

## License

MIT
