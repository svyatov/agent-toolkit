# Agent Toolkit

Personal agent toolkit: individually installable skills for Claude Code and Codex.

Each skill is an **individually installable plugin**. Install only what you need for a given project.

## Structure

- **`plugins/<name>/`**: a self-contained plugin. Contains `.claude-plugin/plugin.json` and `skills/<name>/SKILL.md`, plus `references/` and `sources.json` where the skill has them.
- **`.claude-plugin/marketplace.json`**: Claude Code catalog that exposes every plugin in the repo.
- **`.agents/plugins/marketplace.json`**: Codex catalog with the same plugins.

## Claude Code Plugin Installation

Add the marketplace once:

```bash
claude plugin marketplace add svyatov/agent-toolkit
```

Then install any skill on its own:

```bash
claude plugin install astro@svyatov-agent-toolkit
claude plugin install prior-art@svyatov-agent-toolkit
claude plugin install generate-favicon@svyatov-agent-toolkit
```

## Codex Plugin Installation

Add the marketplace, then install plugins from the Plugins Directory in the ChatGPT desktop app or Codex:

```bash
codex plugin marketplace add svyatov/agent-toolkit
```

## Migrating from `leo-toolkit`

The marketplace was previously named `leo-toolkit`. If you added it under that name, nothing breaks: Claude Code keeps the marketplace registered under the name you added it with, so `claude plugin marketplace update leo-toolkit`, `<skill>@leo-toolkit` installs, and plugin updates keep working. To switch to the new name, re-add the marketplace and reinstall your skills:

```bash
claude plugin marketplace remove leo-toolkit
claude plugin marketplace add svyatov/agent-toolkit
claude plugin install <skill>@svyatov-agent-toolkit  # repeat for each skill you had
```

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
| `astro` | Build with the Astro web framework (v6 and v7): islands, content collections, actions, SSR, view transitions | `claude plugin install astro@svyatov-agent-toolkit` |
| `browser-bugs` | Audit frontend code for 50 cross-browser bugs and mobile compatibility pitfalls | `claude plugin install browser-bugs@svyatov-agent-toolkit` |
| `command-creator` | Create reusable slash commands | `claude plugin install command-creator@svyatov-agent-toolkit` |
| `generate-dockerfile` | Generate optimized, multi-stage Dockerfiles | `claude plugin install generate-dockerfile@svyatov-agent-toolkit` |
| `generate-favicon` | Generate a minimal favicon set from SVG: ICO, SVG with dark mode, Apple Touch Icon, PWA icons, manifest | `claude plugin install generate-favicon@svyatov-agent-toolkit` |
| `grill-me` | Stress-test any plan, design, or idea through relentless interviewing: domain-agnostic | `claude plugin install grill-me@svyatov-agent-toolkit` |
| `humanizer` | Remove signs of AI-generated writing from voiced prose: blog posts, essays, announcements | `claude plugin install humanizer@svyatov-agent-toolkit` |
| `import-skill` | Import skills from GitHub repos (copy or merge) | `claude plugin install import-skill@svyatov-agent-toolkit` |
| `improve-architecture` | Find architectural improvements with assessment gate, cohesion checks, and test writing | `claude plugin install improve-architecture@svyatov-agent-toolkit` |
| `llms-visibility` | Make websites, docs, and blogs readable to LLMs and AI agents: llms.txt, .md routes, Accept negotiation, Content-Signal | `claude plugin install llms-visibility@svyatov-agent-toolkit` |
| `prior-art` | Check arXiv prior art before designing non-trivial architecture, algorithms, or protocols | `claude plugin install prior-art@svyatov-agent-toolkit` |
| `refactor` | Refactor code at any scope (project/file/method) with idempotent assessment gate | `claude plugin install refactor@svyatov-agent-toolkit` |
| `shortcuts` | Short slash commands for the commit, push, pull request, CI, and merge loop: /c, /cp, /cb, /cbp, /cpr, /cprw, /wm, /ci, /fa | `claude plugin install shortcuts@svyatov-agent-toolkit` |
| `verify-skill` | Verify a skill against the current Agent Skills spec, Claude Code features, and upstream docs fetched live, and its own upstream repository for changes worth borrowing | `claude plugin install verify-skill@svyatov-agent-toolkit` |
| `verify-marketplace` | Verify a plugin marketplace repo against the current Claude Code and Codex docs fetched live: catalog, manifests, layout, README, versions | `claude plugin install verify-marketplace@svyatov-agent-toolkit` |

## License

MIT
