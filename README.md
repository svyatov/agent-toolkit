# Agent Toolkit

Personal agent toolkit: individually installable skills for Claude Code.

Each skill is an **individually installable plugin**. Install only what you need for a given project.

## Structure

- **`plugins/<name>/`**: a self-contained plugin. Contains `.claude-plugin/plugin.json` and `skills/<name>/SKILL.md`, plus `references/` and `sources.json` where the skill has them.
- **`.claude-plugin/marketplace.json`**: catalog that exposes every plugin in the repo.

## Claude Code Plugin Installation

Add the marketplace once:

```bash
claude plugin marketplace add svyatov/agent-toolkit
```

Then install any skill on its own:

```bash
claude plugin install astro@leo-toolkit
claude plugin install prior-art@leo-toolkit
claude plugin install generate-favicon@leo-toolkit
```

## Migrating from the `leo` plugin

If you previously installed the bundled `leo` plugin, it no longer exists. Switch to per-skill installs:

```bash
claude plugin uninstall leo@leo-toolkit
claude plugin marketplace update leo-toolkit
claude plugin install <skill>@leo-toolkit  # repeat for each skill you want
```

Your existing `leo:` skill invocations (e.g., `leo:refactor`) become `<skill>:<skill>` (e.g., `refactor:refactor`), or the bare `<skill>` name when unambiguous.

## Skills

| Skill | Description | Install |
|-------|-------------|---------|
| `astro` | Build with the Astro web framework (v6+): islands, content collections, actions, SSR, view transitions | `claude plugin install astro@leo-toolkit` |
| `browser-bugs` | Audit frontend code for 50 cross-browser bugs and mobile compatibility pitfalls | `claude plugin install browser-bugs@leo-toolkit` |
| `command-creator` | Create reusable slash commands | `claude plugin install command-creator@leo-toolkit` |
| `generate-dockerfile` | Generate optimized, multi-stage Dockerfiles | `claude plugin install generate-dockerfile@leo-toolkit` |
| `generate-favicon` | Generate a minimal favicon set from SVG: ICO, SVG with dark mode, Apple Touch Icon, PWA icons, manifest | `claude plugin install generate-favicon@leo-toolkit` |
| `grill-me` | Stress-test any plan, design, or idea through relentless interviewing: domain-agnostic | `claude plugin install grill-me@leo-toolkit` |
| `humanizer` | Remove signs of AI-generated writing from voiced prose: blog posts, essays, announcements | `claude plugin install humanizer@leo-toolkit` |
| `import-skill` | Import skills from GitHub repos (copy or merge) | `claude plugin install import-skill@leo-toolkit` |
| `improve-architecture` | Find architectural improvements with assessment gate, cohesion checks, and test writing | `claude plugin install improve-architecture@leo-toolkit` |
| `llms-visibility` | Make websites, docs, and blogs readable to LLMs and AI agents: llms.txt, .md routes, Accept negotiation, Content-Signal | `claude plugin install llms-visibility@leo-toolkit` |
| `prior-art` | Check arXiv prior art before designing non-trivial architecture, algorithms, or protocols | `claude plugin install prior-art@leo-toolkit` |
| `refactor` | Refactor code at any scope (project/file/method) with idempotent assessment gate | `claude plugin install refactor@leo-toolkit` |

## License

MIT
