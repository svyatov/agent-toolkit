# Agent Toolkit

Personal agent toolkit — reusable skills and plugins for Claude Code, Cursor, Codex, and Gemini CLI.

## Structure

- **`skills/`** — Universal skills installable via `npx skills add`
- **`plugins/`** — Claude Code plugins
- **`.claude-plugin/marketplace.json`** — Claude plugin marketplace catalog

## Claude Code Plugin Installation

```bash
claude plugin marketplace add svyatov/agent-toolkit
claude plugin install leo@leo-toolkit
```

## Skills

| Skill | Description |
|-------|-------------|
| `astro` | Build with the Astro web framework (v6+) — islands, content collections, actions, SSR, view transitions |
| `browser-bugs` | Audit frontend code for 50 cross-browser bugs and mobile compatibility pitfalls |
| `command-creator` | Create reusable slash commands |
| `commit` | Git commit workflow with conventional commits, branch/push/PR support |
| `generate-cicd` | Generate CI/CD workflows (GitHub Actions) |
| `generate-favicon` | Generate a minimal favicon set from SVG — ICO, SVG with dark mode, Apple Touch Icon, PWA icons, manifest |
| `grill-me` | Stress-test a plan or design through relentless interviewing |
| `generate-dockerfile` | Generate optimized, multi-stage Dockerfiles |
| `humanizer` | Remove signs of AI-generated writing from text |
| `import-skill` | Import skills from GitHub repos (copy or merge) |
| `improve-architecture` | Find architectural improvements with assessment gate, cohesion checks, and test writing |
| `refactor` | Refactor code at any scope (project/file/method) with idempotent assessment gate |
| `taskwarrior` | Taskwarrior CLI reference for managing tasks, bugs, and work items |
| `writing-clearly-and-concisely` | Apply Strunk's rules for clearer, stronger prose |

## License

MIT
